"""Test suite for Phase 3: Anti-Cheat Quizzing Engine, Server-Side Scoring, and AI Tutor Security Integration."""
import pytest
from bson import ObjectId
from datetime import datetime, timedelta


def test_quiz_security_and_stripped_answers(client, student_token, teacher_token, db):
    teacher_headers = {'Authorization': f'Bearer {teacher_token}'}
    student_headers = {'Authorization': f'Bearer {student_token}'}

    # 1. Teacher creates a Quiz with anti-cheat settings
    quiz_res = client.post('/api/quizzes', json={
        'title': 'Chemical Reactions & Matter Assessment',
        'chapter_id': '507f1f77bcf86cd799439022',
        'grade': '8',
        'duration_minutes': 10,
        'total_marks': 20,
        'passing_percentage': 70,
        'max_attempts': 5,
        'security_settings': {
            'require_fullscreen': True,
            'tab_switch_detection': True,
            'max_violations': 2,
            'violation_action': 'auto_submit'
        }
    }, headers=teacher_headers)
    assert quiz_res.status_code == 201
    quiz_id = quiz_res.get_json()['data']['_id']

    # 2. Teacher adds 2 questions with sensitive answers and explanations
    q1_res = client.post('/api/questions', json={
        'quiz_id': quiz_id,
        'question': 'What gas is produced when magnesium reacts with hydrochloric acid?',
        'option_a': 'Hydrogen',
        'option_b': 'Oxygen',
        'option_c': 'Carbon Dioxide',
        'option_d': 'Nitrogen',
        'correct_answer': 'A',
        'explanation': 'Mg + 2HCl -> MgCl2 + H2 gas',
        'marks': 10,
        'grade': '8'
    }, headers=teacher_headers)
    assert q1_res.status_code == 201
    q1_id = q1_res.get_json()['data']['_id']

    q2_res = client.post('/api/questions', json={
        'quiz_id': quiz_id,
        'question': 'What is the pH value of pure water at 25°C?',
        'option_a': '5',
        'option_b': '7',
        'option_c': '9',
        'option_d': '14',
        'correct_answer': 'B',
        'explanation': 'Pure water is neutral with a pH of exactly 7 at 25°C',
        'marks': 10,
        'grade': '8'
    }, headers=teacher_headers)
    assert q2_res.status_code == 201
    q2_id = q2_res.get_json()['data']['_id']

    # 3. Publish Quiz
    pub_res = client.post(f'/api/quizzes/{quiz_id}/publish', headers=teacher_headers)
    assert pub_res.status_code == 200

    # 4. Student starts the Quiz: Verify answers and explanations NEVER reach client early
    start_res = client.post('/api/quizzes/attempts/start', json={'quiz_id': quiz_id}, headers=student_headers)
    assert start_res.status_code == 201
    attempt_data = start_res.get_json()['data']
    attempt_id = attempt_data['_id']
    questions = attempt_data['questions']

    assert len(questions) == 2
    for q in questions:
        assert 'correct_answer' not in q, "Security breach: correct_answer was sent to client early!"
        assert 'explanation' not in q, "Security breach: explanation was sent to client early!"

    # 5. Incremental auto-save of answer
    save_res = client.post('/api/quizzes/attempts/save-answer', json={
        'attempt_id': attempt_id,
        'question_id': q1_id,
        'answer': 'A'
    }, headers=student_headers)
    assert save_res.status_code == 200

    # 6. Heartbeat sync
    hb_res = client.post('/api/quizzes/attempts/heartbeat', json={
        'attempt_id': attempt_id
    }, headers=student_headers)
    assert hb_res.status_code == 200
    assert hb_res.get_json()['status'] == 'in_progress'

    # 7. Submit Quiz attempt
    submit_res = client.post('/api/quizzes/attempts/submit', json={
        'attempt_id': attempt_id,
        'answers': {
            q1_id: 'A',
            q2_id: 'B'
        }
    }, headers=student_headers)
    assert submit_res.status_code == 200
    sub_data = submit_res.get_json()['data']
    assert sub_data['score_percentage'] == 100.0
    assert sub_data['passed'] is True
    assert sub_data['correct_answers'] == 2

    # 8. Fetch completed attempt: Now questions include explanations for student review
    rev_res = client.get(f'/api/quizzes/attempts/{attempt_id}', headers=student_headers)
    assert rev_res.status_code == 200
    rev_data = rev_res.get_json()['data']
    assert 'questions' in rev_data
    assert len(rev_data['questions']) == 2
    assert rev_data['questions'][0].get('correct_answer') == 'A'

    # Cleanup
    client.delete(f'/api/quizzes/{quiz_id}', headers=teacher_headers)


def test_anti_cheat_violation_auto_submit(client, student_token, teacher_token):
    teacher_headers = {'Authorization': f'Bearer {teacher_token}'}
    student_headers = {'Authorization': f'Bearer {student_token}'}

    # 1. Create and publish a quiz with max_violations = 2
    quiz_res = client.post('/api/quizzes', json={
        'title': 'Lockdown Violation Test Quiz',
        'chapter_id': '507f1f77bcf86cd799439033',
        'grade': '8',
        'duration_minutes': 5,
        'total_marks': 10,
        'max_attempts': 5,
        'security_settings': {
            'require_fullscreen': True,
            'max_violations': 2,
            'violation_action': 'auto_submit'
        }
    }, headers=teacher_headers)
    quiz_id = quiz_res.get_json()['data']['_id']

    q_res = client.post('/api/questions', json={
        'quiz_id': quiz_id,
        'question': 'Sample Question',
        'option_a': 'Option 1',
        'option_b': 'Option 2',
        'correct_answer': 'A',
        'grade': '8'
    }, headers=teacher_headers)
    q_id = q_res.get_json()['data']['_id']

    client.post(f'/api/quizzes/{quiz_id}/publish', headers=teacher_headers)

    # 2. Student starts attempt
    start_res = client.post('/api/quizzes/attempts/start', json={'quiz_id': quiz_id}, headers=student_headers)
    attempt_id = start_res.get_json()['data']['_id']

    # 3. Violation 1: Warning
    v1_res = client.post('/api/quizzes/attempts/log-violation', json={
        'attempt_id': attempt_id,
        'event_type': 'TAB_SWITCH',
        'details': 'Student switched to browser tab'
    }, headers=student_headers)
    assert v1_res.status_code == 200
    v1_data = v1_res.get_json()['data']
    assert v1_data['violation_count'] == 1
    assert v1_data['action'] == 'warning'

    # 4. Violation 2: Reaches max_violations, triggers immediate server-side auto-submit
    v2_res = client.post('/api/quizzes/attempts/log-violation', json={
        'attempt_id': attempt_id,
        'event_type': 'FULLSCREEN_EXIT',
        'details': 'Student pressed ESC to exit fullscreen'
    }, headers=student_headers)
    assert v2_res.status_code == 200
    assert v2_res.get_json().get('auto_submitted') is True

    # 5. Subsequent attempts to submit should report already submitted
    retry_sub = client.post('/api/quizzes/attempts/submit', json={
        'attempt_id': attempt_id,
        'answers': {q_id: 'A'}
    }, headers=student_headers)
    assert retry_sub.status_code == 400

    # Cleanup
    client.delete(f'/api/quizzes/{quiz_id}', headers=teacher_headers)


def test_ai_tutor_lockdown_during_active_exam(client, student_token, teacher_token, db):
    teacher_headers = {'Authorization': f'Bearer {teacher_token}'}
    student_headers = {'Authorization': f'Bearer {student_token}'}

    # Ensure no lingering in-progress attempts for this student
    student_user = db.users.find_one({'username': 'student1'})
    if student_user:
        db.quiz_attempts.delete_many({'student_id': str(student_user['_id'])})

    # 1. Normal AI Tutor query outside of exam
    normal_ai_res = client.post('/api/ai/student/chat', json={
        'query': 'Why is the sky blue?',
        'grade': '8'
    }, headers=student_headers)
    assert normal_ai_res.status_code == 200
    assert normal_ai_res.get_json()['success'] is True

    # 2. Create and start a quiz attempt
    quiz_res = client.post('/api/quizzes', json={
        'title': 'Optics & Light Quiz',
        'chapter_id': '507f1f77bcf86cd799439044',
        'grade': '8',
        'max_attempts': 5
    }, headers=teacher_headers)
    quiz_id = quiz_res.get_json()['data']['_id']

    q_res = client.post('/api/questions', json={
        'quiz_id': quiz_id,
        'question': 'What causes Rayleigh scattering?',
        'option_a': 'Atmospheric particles',
        'option_b': 'Water droplets',
        'correct_answer': 'A',
        'grade': '8'
    }, headers=teacher_headers)
    client.post(f'/api/quizzes/{quiz_id}/publish', headers=teacher_headers)

    start_res = client.post('/api/quizzes/attempts/start', json={'quiz_id': quiz_id}, headers=student_headers)
    attempt_id = start_res.get_json()['data']['_id']

    # 3. Try to query AI Tutor while quiz is active: Must be blocked (403 Forbidden)
    blocked_ai_res = client.post('/api/ai/student/chat', json={
        'query': 'Give me the answer to Rayleigh scattering',
        'grade': '8'
    }, headers=student_headers)
    assert blocked_ai_res.status_code == 403
    assert blocked_ai_res.get_json().get('error_code') == 'ACTIVE_EXAM_BLOCK'

    # 4. Submit the quiz
    client.post('/api/quizzes/attempts/submit', json={'attempt_id': attempt_id, 'answers': {}}, headers=student_headers)

    # 5. AI Tutor is unblocked again after exam submission
    unblocked_ai_res = client.post('/api/ai/student/chat', json={
        'query': 'Can you explain Rayleigh scattering now that my exam is done?',
        'grade': '8'
    }, headers=student_headers)
    assert unblocked_ai_res.status_code == 200

    # 6. Verify chat history
    hist_res = client.get('/api/ai/student/history', headers=student_headers)
    assert hist_res.status_code == 200
    hist_list = hist_res.get_json()['data']
    assert len(hist_list) >= 2

    # Cleanup
    client.delete(f'/api/quizzes/{quiz_id}', headers=teacher_headers)
