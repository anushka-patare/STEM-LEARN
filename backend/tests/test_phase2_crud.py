"""Comprehensive test suite for Phase 2: Admin & Teacher Core CRUD, Bulk Import, Grades 6-9, Academic & Item Repositories."""
import pytest
import json
from bson import ObjectId


def test_student_crud_and_username_search(client, admin_token):
    headers = {'Authorization': f'Bearer {admin_token}'}

    # 1. Create a student with unique username and grade 9
    student_payload = {
        'full_name': 'Rohan Test Student',
        'username': 'rohan.phase2',
        'email': 'rohan.phase2@school.edu',
        'password': 'Password@123',
        'grade': '9',
        'division': 'A',
        'roll_number': '42',
        'mobile': '9876543210',
        'status': 'active'
    }
    create_res = client.post('/api/admin/students', json=student_payload, headers=headers)
    assert create_res.status_code == 201
    created_data = create_res.get_json()['data']
    student_id = created_data['_id']
    assert created_data['username'] == 'rohan.phase2'
    assert created_data['grade'] == '9'

    # 2. Search by username
    search_res = client.get('/api/admin/students?search=rohan.phase2', headers=headers)
    assert search_res.status_code == 200
    search_data = search_res.get_json()['data']['students']
    assert any(s['_id'] == student_id for s in search_data)

    # 3. Update student
    update_res = client.put(f'/api/admin/students/{student_id}', json={
        'roll_number': '43',
        'division': 'B'
    }, headers=headers)
    assert update_res.status_code == 200

    # 4. Admin Reset password
    reset_res = client.post(f'/api/admin/students/{student_id}/reset-password', json={
        'new_password': 'NewPassword@456'
    }, headers=headers)
    assert reset_res.status_code == 200

    # 5. Delete student
    del_res = client.delete(f'/api/admin/students/{student_id}', headers=headers)
    assert del_res.status_code == 200


def test_student_bulk_import(client, admin_token):
    headers = {'Authorization': f'Bearer {admin_token}'}

    bulk_payload = {
        'students': [
            {
                'full_name': 'Bulk Student Alpha',
                'username': 'bulk.alpha',
                'grade': '6',
                'division': 'A',
                'roll_number': '101',
                'email': 'bulk.alpha@school.edu'
            },
            {
                'full_name': 'Bulk Student Beta',
                'username': 'bulk.beta',
                'grade': '8',
                'division': 'C',
                'roll_number': '102',
                'email': 'bulk.beta@school.edu'
            }
        ]
    }
    res = client.post('/api/admin/students/bulk-import', json=bulk_payload, headers=headers)
    assert res.status_code == 201
    data = res.get_json()['data']
    assert data['imported_count'] == 2
    assert len(data['imported']) == 2

    # Cleanup
    for s in data['imported']:
        client.delete(f'/api/admin/students/{s["_id"]}', headers=headers)


def test_class_crud_and_grade_validation(client, admin_token):
    headers = {'Authorization': f'Bearer {admin_token}'}

    # 1. Invalid grade check
    bad_res = client.post('/api/classes', json={
        'grade': '12',
        'division': 'Z'
    }, headers=headers)
    assert bad_res.status_code == 400

    # 2. Valid Grade 9 class creation
    cls_payload = {
        'grade': '9',
        'division': 'X',
        'teacher_name': 'Dr. Ramanujan',
        'mode': 'Collaborative'
    }
    create_res = client.post('/api/classes', json=cls_payload, headers=headers)
    assert create_res.status_code == 201
    class_id = create_res.get_json()['data']['_id']

    # 3. Duplicate rejection
    dup_res = client.post('/api/classes', json=cls_payload, headers=headers)
    assert dup_res.status_code == 409

    # 4. Get classes
    get_res = client.get('/api/classes?grade=9', headers=headers)
    assert get_res.status_code == 200
    classes = get_res.get_json()['data']
    assert any(c['_id'] == class_id for c in classes)

    # 5. Delete class
    del_res = client.delete(f'/api/classes/{class_id}', headers=headers)
    assert del_res.status_code == 200


def test_curriculum_crud_hierarchy(client, admin_token):
    headers = {'Authorization': f'Bearer {admin_token}'}

    # 1. Subject creation
    sub_res = client.post('/api/subjects', json={
        'name': 'Robotics & Automation',
        'description': 'Intro to mechanical joints and microcontrollers',
        'grade': '8',
        'icon': '🤖'
    }, headers=headers)
    assert sub_res.status_code == 201
    subject_id = sub_res.get_json()['data']['_id']

    # 2. Category creation
    cat_res = client.post('/api/categories', json={
        'name': 'Sensor Interfacing',
        'subject_id': subject_id,
        'description': 'Ultrasonic and IR sensors'
    }, headers=headers)
    assert cat_res.status_code == 201
    category_id = cat_res.get_json()['data']['_id']

    # 3. Chapter with passing criteria
    ch_res = client.post('/api/chapters', json={
        'name': 'Ultrasonic Distance Detection',
        'category_id': category_id,
        'subject_id': subject_id,
        'grade': '8',
        'description': 'Calculate distance using sound pulse velocity',
        'passing_score_pct': 75,
        'order': 1
    }, headers=headers)
    assert ch_res.status_code == 201
    chapter_id = ch_res.get_json()['data']['_id']

    # 4. Cleanup
    client.delete(f'/api/chapters/{chapter_id}', headers=headers)
    client.delete(f'/api/categories/{category_id}', headers=headers)
    client.delete(f'/api/subjects/{subject_id}', headers=headers)


def test_question_bank_and_quiz_lifecycle(client, teacher_token):
    headers = {'Authorization': f'Bearer {teacher_token}'}

    # 1. Create Question with Bloom taxonomy level
    q_payload = {
        'question': 'What is the speed of sound in dry air at 20°C?',
        'option_a': '343 m/s',
        'option_b': '300,000 km/s',
        'option_c': '1500 m/s',
        'option_d': '100 m/s',
        'correct_answer': 'A',
        'explanation': 'Sound travels at approximately 343 meters per second in air at standard room temperature.',
        'bloom_level': 'Remembering',
        'grade': '8',
        'difficulty': 'medium',
        'marks': 1
    }
    q_res = client.post('/api/questions', json=q_payload, headers=headers)
    assert q_res.status_code == 201
    question_id = q_res.get_json()['data']['_id']

    # 2. Bulk question import
    bulk_q_res = client.post('/api/questions/bulk', json={
        'questions': [
            {
                'question': 'Which wave type is a sound wave?',
                'option_a': 'Longitudinal',
                'option_b': 'Transverse',
                'correct_answer': 'A',
                'bloom_level': 'Understanding',
                'grade': '8'
            }
        ]
    }, headers=headers)
    assert bulk_q_res.status_code == 201

    # 3. Create Quiz
    quiz_payload = {
        'title': 'Acoustics & Sound Mechanics Quiz',
        'description': 'Master assessment on sound wave physics',
        'chapter_id': '507f1f77bcf86cd799439011',
        'grade': '8',
        'duration_minutes': 15,
        'total_marks': 10,
        'passing_percentage': 70,
        'security_settings': {
            'require_fullscreen': True,
            'tab_switch_detection': True,
            'max_violations': 3
        }
    }
    quiz_res = client.post('/api/quizzes', json=quiz_payload, headers=headers)
    assert quiz_res.status_code == 201
    quiz_id = quiz_res.get_json()['data']['_id']

    # Attach question to quiz
    client.put(f'/api/questions/{question_id}', json={'quiz_id': quiz_id}, headers=headers)

    # 4. Duplicate quiz
    dup_res = client.post(f'/api/quizzes/{quiz_id}/duplicate', headers=headers)
    assert dup_res.status_code == 201
    dup_id = dup_res.get_json()['data']['_id']

    # 5. Publish quiz
    pub_res = client.post(f'/api/quizzes/{quiz_id}/publish', headers=headers)
    assert pub_res.status_code == 200

    # 6. Unpublish quiz
    unpub_res = client.post(f'/api/quizzes/{quiz_id}/unpublish', headers=headers)
    assert unpub_res.status_code == 200

    # Cleanup
    client.delete(f'/api/quizzes/{quiz_id}', headers=headers)
    client.delete(f'/api/quizzes/{dup_id}', headers=headers)
    client.delete(f'/api/questions/{question_id}', headers=headers)
