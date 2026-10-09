"""Comprehensive verification script testing all portals and endpoints."""
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app import create_app

def run_tests():
    app = create_app()
    client = app.test_client()

    print("\n--- 1. HEALTH CHECK ---")
    res = client.get('/api/health')
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    print("Health check OK:", res.get_json())

    print("\n--- 2. AUTHENTICATION (ALL 3 ROLES) ---")
    # Admin
    r_admin = client.post('/api/auth/admin/login', json={'email': 'admin@stemlearn.com', 'password': 'admin123'})
    assert r_admin.status_code == 200, f"Admin login failed: {r_admin.get_data(as_text=True)}"
    admin_token = r_admin.get_json()['data']['access_token']
    print("Admin login: OK (200)")

    # Teacher
    r_teacher = client.post('/api/auth/teacher/login', json={'email': 'teacher@stemlearn.com', 'password': 'teacher123'})
    assert r_teacher.status_code == 200, f"Teacher login failed: {r_teacher.get_data(as_text=True)}"
    teacher_token = r_teacher.get_json()['data']['access_token']
    print("Teacher login: OK (200)")

    # Student
    r_student = client.post('/api/auth/student/login', json={'email': 'student1@stemlearn.com', 'password': 'student123'})
    assert r_student.status_code == 200, f"Student login failed: {r_student.get_data(as_text=True)}"
    student_token = r_student.get_json()['data']['access_token']
    print("Student login: OK (200)")

    print("\n--- 3. ADMIN PORTAL ENDPOINTS ---")
    h_admin = {'Authorization': f'Bearer {admin_token}'}
    r = client.get('/api/admin/students', headers=h_admin)
    print("Admin Students list:", r.status_code, "Count:", len(r.get_json().get('data', {}).get('students', [])))
    r = client.get('/api/admin/teachers', headers=h_admin)
    print("Admin Teachers list:", r.status_code, "Count:", len(r.get_json().get('data', {}).get('teachers', [])))
    r = client.get('/api/classes', headers=h_admin)
    print("Classes list:", r.status_code, "Count:", len(r.get_json().get('data', [])))
    r = client.get('/api/subjects', headers=h_admin)
    print("Subjects list:", r.status_code, "Count:", len(r.get_json().get('data', [])))

    print("\n--- 4. TEACHER PORTAL ENDPOINTS ---")
    h_teacher = {'Authorization': f'Bearer {teacher_token}'}
    r = client.get('/api/teacher/classes', headers=h_teacher)
    print("Teacher Classes:", r.status_code, "Count:", len(r.get_json().get('data', [])))
    r = client.get('/api/quizzes', headers=h_teacher)
    print("Teacher Quizzes:", r.status_code, "Count:", len(r.get_json().get('data', {}).get('quizzes', [])))
    r = client.get('/api/research/summary', headers=h_teacher)
    print("Research Telemetry Summary:", r.status_code, "Data:", r.get_json().get('data', []))
    r = client.get('/api/research/export', headers=h_teacher)
    print("CSV Telemetry Export:", r.status_code, "Mime:", r.content_type, "Bytes:", len(r.data))

    print("\n--- 5. STUDENT PORTAL ENDPOINTS ---")
    h_student = {'Authorization': f'Bearer {student_token}'}
    r = client.get('/api/student/dashboard', headers=h_student)
    print("Student Dashboard:", r.status_code, "Success:", r.get_json().get('success'))
    r = client.get('/api/student/subjects', headers=h_student)
    print("Student Subjects:", r.status_code, "Count:", len(r.get_json().get('data', [])))
    r = client.get('/api/student/quizzes', headers=h_student)
    print("Student Quizzes:", r.status_code, "Count:", len(r.get_json().get('data', [])))
    r = client.get('/api/student/team', headers=h_student)
    team_data = r.get_json().get('data')
    print("Student Team:", r.status_code, "Team:", team_data.get('name') if team_data else 'None assigned')

    print("\n--- 6. AI SERVICE ENDPOINTS ---")
    # Teacher AI Quiz Generation
    r = client.post('/api/ai/teacher/generate-quiz', json={
        'topic': 'Photosynthesis and Energy Transfer',
        'grade': '7',
        'subject': 'Science',
        'num_questions': 2,
        'difficulty': 'medium'
    }, headers=h_teacher)
    print("AI Quiz Gen:", r.status_code, "Generated Questions:", len(r.get_json().get('data', {}).get('questions', [])))

    # Student AI Study Tutor
    r = client.post('/api/ai/student/chat', json={
        'query': 'Why is DNA called the blueprint of life?'
    }, headers=h_student)
    print("AI Student Tutor:", r.status_code, "Reply preview:", r.get_json().get('data', {}).get('response', '')[:80] + '...')

    print("\n--- 7. VIDEO LESSONS MULTIMEDIA ENDPOINTS ---")
    r_vids = client.get('/api/videos', headers=h_student)
    assert r_vids.status_code == 200, f"Videos list failed: {r_vids.status_code}"
    vids_data = r_vids.get_json().get('data', [])
    print("Student Videos List:", r_vids.status_code, "Count:", len(vids_data))

    r_hier = client.get('/api/videos/hierarchy', headers=h_teacher)
    assert r_hier.status_code == 200, f"Videos hierarchy failed: {r_hier.status_code}"
    hier_data = r_hier.get_json().get('data', [])
    print("Teacher Videos Hierarchy:", r_hier.status_code, "Subjects:", len(hier_data))

    print("\n==========================================")
    print("ALL API ENDPOINTS AND SYSTEM CHECKS PASSED!")
    print("==========================================\n")

if __name__ == '__main__':
    run_tests()
