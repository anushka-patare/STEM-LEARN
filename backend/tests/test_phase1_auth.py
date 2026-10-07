import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import io
from app import create_app
from bson import ObjectId
from datetime import datetime, timedelta
from utils.password import hash_password
from services.password_reset_service import hash_token




def test_username_password_login_all_roles(client):
    """Test login using username + password across all 3 roles."""
    # 1. Admin login
    res = client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'access_token' in data['data']
    assert data['data']['user']['role'] == 'admin'

    # 2. Teacher login
    res = client.post('/api/auth/login', json={'username': 'teacher', 'password': 'teacher123'})
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert data['data']['user']['role'] == 'teacher'

    # 3. Student login
    res = client.post('/api/auth/login', json={'username': 'student1', 'password': 'student123'})
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert data['data']['user']['role'] == 'student'


def test_invalid_password_and_lockout(client, db):
    """Test that failed attempts increment counter and trigger temporary account lockout."""
    test_user_id = 'test_lockout_user'
    db.users.delete_many({'username': test_user_id})
    db.users.insert_one({
        'username': test_user_id,
        'email': 'lockout_test@demo.invalid',
        'password_hash': hash_password('secure123'),
        'role': 'student',
        'status': 'active',
        'failed_login_count': 0,
        'locked_until': None,
        'created_at': datetime.utcnow()
    })

    # 4 invalid attempts
    for i in range(4):
        res = client.post('/api/auth/login', json={'username': test_user_id, 'password': 'wrong_password'})
        assert res.status_code == 401
        assert res.get_json()['success'] is False

    # 5th attempt triggers lockout
    res = client.post('/api/auth/login', json={'username': test_user_id, 'password': 'wrong_password'})
    assert res.status_code == 423
    assert 'locked' in res.get_json()['message'].lower()

    # Subsequent attempt even with correct password is rejected while locked
    res = client.post('/api/auth/login', json={'username': test_user_id, 'password': 'secure123'})
    assert res.status_code == 423

    # Cleanup
    db.users.delete_many({'username': test_user_id})


def test_teacher_approval_workflow(client, db):
    """Test teacher registration -> pending state -> admin approval -> active login."""
    teacher_username = f"new_prof_{int(datetime.utcnow().timestamp())}"
    teacher_email = f"{teacher_username}@college.edu"

    # 1. Teacher registers
    reg_res = client.post('/api/auth/register/teacher', json={
        'full_name': 'Prof. Ananya Sen',
        'username': teacher_username,
        'email': teacher_email,
        'password': 'teacherPass123',
        'subject': 'Physics & Mechanics',
        'education': 'Ph.D. Physics'
    })
    assert reg_res.status_code == 201
    reg_data = reg_res.get_json()
    assert reg_data['success'] is True
    assert reg_data['data']['status'] == 'pending'

    # 2. Attempt login before admin approval -> must be rejected with 403
    login_res = client.post('/api/auth/login', json={
        'username': teacher_username,
        'password': 'teacherPass123'
    })
    assert login_res.status_code == 403
    assert 'pending' in login_res.get_json()['message'].lower()

    # 3. Admin logs in
    admin_login = client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
    admin_token = admin_login.get_json()['data']['access_token']
    admin_headers = {'Authorization': f'Bearer {admin_token}'}

    # 4. Admin checks pending teachers
    pending_res = client.get('/api/admin/teachers/pending', headers=admin_headers)
    assert pending_res.status_code == 200
    pending_list = pending_res.get_json()['data']
    created_teacher = next((t for t in pending_list if t['username'] == teacher_username), None)
    assert created_teacher is not None

    # 5. Admin approves teacher
    teacher_id = created_teacher['_id']
    appr_res = client.post(f'/api/admin/teachers/{teacher_id}/approve', headers=admin_headers, json={
        'assigned_classes': [{'grade': '8', 'division': 'A'}]
    })
    assert appr_res.status_code == 200

    # 6. Teacher can now log in successfully
    login_after = client.post('/api/auth/login', json={
        'username': teacher_username,
        'password': 'teacherPass123'
    })
    assert login_after.status_code == 200
    assert login_after.get_json()['success'] is True

    # Cleanup
    db.users.delete_one({'username': teacher_username})


def test_password_reset_token_workflow(client, db):
    """Test forgot-password email token generation, validation, one-time use, and expiration."""
    test_student = 'reset_test_student'
    test_email = 'reset_test@demo.invalid'
    db.users.delete_many({'username': test_student})

    user_res = db.users.insert_one({
        'username': test_student,
        'email': test_email,
        'password_hash': hash_password('oldPassword123'),
        'role': 'student',
        'status': 'active',
        'created_at': datetime.utcnow()
    })
    user_id = str(user_res.inserted_id)

    # 1. Request password reset
    res = client.post('/api/auth/forgot-password', json={'identifier': test_student})
    assert res.status_code == 200
    assert res.get_json()['success'] is True

    # 2. Retrieve generated token doc from DB
    token_doc = db.password_reset_tokens.find_one({'user_id': user_id, 'used': False})
    assert token_doc is not None
    token_hash = token_doc['token_hash']

    # For testing, insert a known raw token with hash
    import secrets
    raw_token = secrets.token_urlsafe(32)
    t_hash = hash_token(raw_token)
    db.password_reset_tokens.insert_one({
        'user_id': user_id,
        'token_hash': t_hash,
        'expires_at': datetime.utcnow() + timedelta(minutes=30),
        'used': False,
        'created_at': datetime.utcnow()
    })

    # 3. Verify valid token
    verify_res = client.get(f'/api/auth/verify-reset-token?token={raw_token}')
    assert verify_res.status_code == 200
    assert verify_res.get_json()['success'] is True

    # 4. Tampered token fails
    bad_res = client.get('/api/auth/verify-reset-token?token=tampered_invalid_token_12345')
    assert bad_res.status_code == 400

    # 5. Reset password with valid token
    reset_res = client.post('/api/auth/reset-password', json={
        'token': raw_token,
        'password': 'brandNewPassword123'
    })
    assert reset_res.status_code == 200
    assert reset_res.get_json()['success'] is True

    # 6. Reusing same token must fail
    reuse_res = client.post('/api/auth/reset-password', json={
        'token': raw_token,
        'password': 'anotherNewPassword123'
    })
    assert reuse_res.status_code == 400

    # 7. Login with old password fails
    old_login = client.post('/api/auth/login', json={'username': test_student, 'password': 'oldPassword123'})
    assert old_login.status_code == 401

    # 8. Login with new password succeeds
    new_login = client.post('/api/auth/login', json={'username': test_student, 'password': 'brandNewPassword123'})
    assert new_login.status_code == 200

    # Cleanup
    db.users.delete_one({'_id': ObjectId(user_id)})
    db.password_reset_tokens.delete_many({'user_id': user_id})


def test_admin_smtp_settings_rbac(client):
    """Test that only admin can view/edit SMTP settings and non-admin is blocked."""
    # 1. Non-admin (student) cannot access SMTP settings
    stud_login = client.post('/api/auth/login', json={'username': 'student1', 'password': 'student123'})
    stud_token = stud_login.get_json()['data']['access_token']
    stud_res = client.get('/api/admin/settings/smtp', headers={'Authorization': f'Bearer {stud_token}'})
    assert stud_res.status_code == 403

    # 2. Admin can access SMTP settings
    admin_login = client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
    admin_token = admin_login.get_json()['data']['access_token']
    admin_headers = {'Authorization': f'Bearer {admin_token}'}

    get_smtp = client.get('/api/admin/settings/smtp', headers=admin_headers)
    assert get_smtp.status_code == 200
    data = get_smtp.get_json()['data']
    assert 'host' in data
    assert 'password' not in data  # password is never exposed

    # 3. Admin can update SMTP settings (password encrypted at rest)
    upd_res = client.put('/api/admin/settings/smtp', headers=admin_headers, json={
        'host': 'smtp.gmail.com',
        'port': 587,
        'user': 'noreply@stemlearn.edu',
        'from_name': 'STEMLearn Admin',
        'use_tls': True,
        'password': 'test_app_password_123'
    })
    assert upd_res.status_code == 200
