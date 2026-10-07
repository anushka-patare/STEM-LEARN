"""Password Reset Service for STEMLearn.

Handles secure, single-use, 30-minute expiration password resets via email.
Only SHA-256 hashes of tokens are stored in the database.
"""
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from bson import ObjectId
from utils.password import hash_password, validate_password, verify_password
from services.email_service import send_password_reset_email, send_password_changed_confirmation


def hash_token(raw_token: str) -> str:
    """Compute SHA-256 hex digest of raw token."""
    return hashlib.sha256(raw_token.encode('utf-8')).hexdigest()


def request_password_reset(db, identifier: str, ip_address: str, app_url: str) -> tuple[bool, str]:
    """
    Request password reset for a username or registered email.
    Always returns a generic success message to prevent user enumeration.
    """
    clean_id = (identifier or '').strip().lower()
    if not clean_id:
        return True, "If an account matches, a reset link has been sent to the registered email."

    user = db.users.find_one({
        '$or': [
            {'username': clean_id},
            {'email': clean_id}
        ]
    })

    if not user or not user.get('email'):
        # Generic response to prevent enumeration
        return True, "If an account matches, a reset link has been sent to the registered email."

    user_id = str(user['_id'])
    user_email = user['email']
    user_name = user.get('full_name') or user.get('name') or user.get('username', 'User')

    # Invalidate any existing unused reset tokens for this user
    db.password_reset_tokens.update_many(
        {'user_id': user_id, 'used': False},
        {'$set': {'used': True, 'invalidated_reason': 'superseded_by_new_request'}}
    )

    # Generate random token and hash
    raw_token = secrets.token_urlsafe(32)
    token_h = hash_token(raw_token)
    expires_at = datetime.utcnow() + timedelta(minutes=30)

    db.password_reset_tokens.insert_one({
        'user_id': user_id,
        'token_hash': token_h,
        'expires_at': expires_at,
        'used': False,
        'requested_ip': ip_address,
        'created_at': datetime.utcnow()
    })

    # Build reset link
    base_url = (app_url or 'http://localhost:5173').rstrip('/')
    reset_link = f"{base_url}/reset-password?token={raw_token}"

    # Send reset email
    send_password_reset_email(db, user_email, user_name, reset_link)

    # Log in audit
    db.login_audit.insert_one({
        'user_id': user_id,
        'username': user.get('username'),
        'ip': ip_address,
        'result': 'password_reset_requested',
        'reason': 'Token generated and sent to email',
        'at': datetime.utcnow()
    })

    return True, "If an account matches, a reset link has been sent to the registered email."


def verify_reset_token(db, raw_token: str) -> tuple[bool, str, dict | None]:
    """Verify if raw token exists, is unused, and not expired."""
    if not raw_token or len(raw_token) < 16:
        return False, "Invalid or malformed reset token.", None

    token_h = hash_token(raw_token)
    now = datetime.utcnow()

    token_doc = db.password_reset_tokens.find_one({'token_hash': token_h})
    if not token_doc:
        return False, "Reset link is invalid or does not exist.", None

    if token_doc.get('used'):
        return False, "This password reset link has already been used.", None

    if token_doc.get('expires_at') < now:
        return False, "This password reset link has expired (30-minute limit). Please request a new one.", None

    user = db.users.find_one({'_id': ObjectId(token_doc['user_id'])})
    if not user:
        return False, "Account associated with this token was not found.", None

    return True, "Token is valid.", {'user': user, 'token_doc': token_doc}


def reset_password_with_token(db, raw_token: str, new_password: str, ip_address: str) -> tuple[bool, str]:
    """Execute password reset using verified token."""
    # Validate password strength
    is_valid, msg = validate_password(new_password)
    if not is_valid:
        return False, msg

    valid, err_msg, data = verify_reset_token(db, raw_token)
    if not valid:
        return False, err_msg

    user = data['user']
    token_doc = data['token_doc']

    new_hash = hash_password(new_password)
    now = datetime.utcnow()

    # Update user password & reset lockouts
    db.users.update_one(
        {'_id': user['_id']},
        {
            '$set': {
                'password_hash': new_hash,
                'must_change_password': False,
                'failed_login_count': 0,
                'locked_until': None,
                'updated_at': now,
                'token_version': user.get('token_version', 0) + 1  # Session revocation
            }
        }
    )

    # Mark token as used
    db.password_reset_tokens.update_one(
        {'_id': token_doc['_id']},
        {'$set': {'used': True, 'used_at': now, 'used_ip': ip_address}}
    )

    # Log in audit
    db.login_audit.insert_one({
        'user_id': str(user['_id']),
        'username': user.get('username'),
        'ip': ip_address,
        'result': 'password_reset_success',
        'reason': 'Password reset completed via token',
        'at': now
    })

    # Send confirmation email
    if user.get('email'):
        send_password_changed_confirmation(
            db,
            user['email'],
            user.get('full_name') or user.get('name') or user.get('username', 'User')
        )

    return True, "Password has been successfully updated. You can now log in."


def reset_password_direct(db, identifier: str, current_password: str, new_password: str, ip_address: str) -> tuple[bool, str, int]:
    """
    Direct password reset for students and teachers verifying current credentials.
    Requires: identifier (username or email), current_password, and new_password.
    Admin accounts are strictly prohibited from resetting through this self-service flow.
    """
    clean_id = (identifier or '').strip().lower()
    if not clean_id:
        return False, "Please enter your username or registered email address.", 400

    if not current_password:
        return False, "Current password is required.", 400

    if not new_password:
        return False, "New password is required.", 400

    if len(new_password) < 6:
        return False, "New password must be at least 6 characters long.", 400

    if current_password == new_password:
        return False, "New password cannot be identical to your current password.", 400

    user = db.users.find_one({
        '$or': [
            {'username': clean_id},
            {'email': clean_id}
        ]
    })

    if not user:
        return False, "Account with this username or email does not exist.", 404

    role = user.get('role', '')
    if role == 'admin':
        return False, "Administrator passwords cannot be changed from this portal.", 403

    if user.get('status') in ['blocked', 'rejected']:
        return False, "Your account is currently suspended or blocked. Please contact the administrator.", 403

    # Verify current password
    stored_hash = user.get('password_hash', '')
    if not verify_password(current_password, stored_hash):
        db.login_audit.insert_one({
            'user_id': str(user['_id']),
            'username': user.get('username'),
            'role': role,
            'ip': ip_address,
            'result': 'failed',
            'reason': 'Direct password reset failed: incorrect current password',
            'at': datetime.utcnow()
        })
        return False, "Current password is incorrect.", 400

    now = datetime.utcnow()
    new_hash = hash_password(new_password)

    db.users.update_one(
        {'_id': user['_id']},
        {
            '$set': {
                'password_hash': new_hash,
                'must_change_password': False,
                'failed_login_count': 0,
                'locked_until': None,
                'updated_at': now,
                'token_version': user.get('token_version', 0) + 1
            }
        }
    )

    db.login_audit.insert_one({
        'user_id': str(user['_id']),
        'username': user.get('username'),
        'role': role,
        'ip': ip_address,
        'result': 'password_reset_success',
        'reason': f"Password changed directly by {role} with verified current credentials",
        'at': now
    })

    return True, "Password has been successfully updated! You can now log in with your new password.", 200

