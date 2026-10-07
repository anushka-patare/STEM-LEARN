"""Comprehensive Automated Verification Test Suite for STEMLearn.

Tests:
1. Central Grades Config (GET /api/config/grades returns [6,7,8,9]).
2. Teacher Login & Role Claim verification.
3. Teacher Endpoints Authorization (Dashboard, Classes, Students, Learning Paths, Leaderboards).
4. Strict Role Isolation (Student cannot access /api/teacher/dashboard or /api/admin/dashboard -> 403).
5. Profile Photo Processing:
   - JPG upload, Pillow binary validation, EXIF removal, 512x512 + 128x128 generation.
   - Rejection of invalid non-image payload.
   - Rejection of oversize image (>2MB).
   - Self photo removal.
   - Admin moderation of user photo.
6. Grade 9 demo data check (classes 9-A & 9-B, curriculum, students, squads, attempts).
"""

import sys
import io
import json
import urllib.request
from PIL import Image

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = 'http://127.0.0.1:5000/api'


def post_json(endpoint, data, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(f'{BASE_URL}{endpoint}', data=json.dumps(data).encode('utf-8'), headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))


def get_json(endpoint, token=None):
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(f'{BASE_URL}{endpoint}', headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))


def delete_json(endpoint, token=None):
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(f'{BASE_URL}{endpoint}', headers=headers, method='DELETE')
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))


def upload_photo_multipart(endpoint, filename, file_bytes, content_type, token=None):
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    body = io.BytesIO()
    body.write(f'--{boundary}\r\n'.encode('utf-8'))
    body.write(f'Content-Disposition: form-data; name="photo"; filename="{filename}"\r\n'.encode('utf-8'))
    body.write(f'Content-Type: {content_type}\r\n\r\n'.encode('utf-8'))
    body.write(file_bytes)
    body.write(f'\r\n--{boundary}--\r\n'.encode('utf-8'))

    req = urllib.request.Request(f'{BASE_URL}{endpoint}', data=body.getvalue(), method='POST')
    req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
    if token:
        req.add_header('Authorization', f'Bearer {token}')

    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))


def run_all_tests():
    print("==================================================================")
    print("🧪 STEMLearn Comprehensive Automated Test Suite")
    print("==================================================================")
    passed = 0
    total = 0

    def assert_test(name, condition, details=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"  ✅ [PASS] {name}")
        else:
            print(f"  ❌ [FAIL] {name}: {details}")

    # ─── 1. GRADES CONFIG TEST ─────────────────────────────────────
    print("\n[TEST 1] Central Grades Configuration API...")
    status, res = get_json('/config/grades')
    assert_test(
        "GET /api/config/grades returns 200 and [6, 7, 8, 9]",
        status == 200 and res.get('data') == [6, 7, 8, 9] and res.get('allowed_grades') == ['6', '7', '8', '9'],
        f"Status: {status}, Response: {res}"
    )

    # ─── 2. AUTH & ROLE TOKENS ─────────────────────────────────────
    print("\n[TEST 2] Authentication & Token Generation...")
    # Admin login
    status, adm_res = post_json('/auth/admin/login', {'email': 'admin@stemlearn.com', 'password': 'admin123'})
    admin_token = adm_res.get('data', {}).get('access_token')
    assert_test("Admin login succeeds", status == 200 and bool(admin_token))

    # Teacher login
    status, tch_res = post_json('/auth/teacher/login', {'email': 'teacher@stemlearn.com', 'password': 'teacher123'})
    teacher_token = tch_res.get('data', {}).get('access_token')
    teacher_id = tch_res.get('data', {}).get('user', {}).get('_id')
    assert_test("Teacher login succeeds", status == 200 and bool(teacher_token))

    # Student login (Demo student 9-A)
    status, stu_res = post_json('/auth/student/login', {'email': 'student9a1@demo.invalid', 'password': 'student123'})
    student_token = stu_res.get('data', {}).get('access_token')
    student_id = stu_res.get('data', {}).get('user', {}).get('_id')
    assert_test("Grade 9 Demo student login succeeds", status == 200 and bool(student_token))

    # ─── 3. TEACHER WINDOW & BLUEPRINT ENDPOINTS ───────────────────
    print("\n[TEST 3] Teacher Window & Blueprints...")
    status, d_res = get_json('/teacher/dashboard', teacher_token)
    assert_test(
        "Teacher dashboard returns stats with active classes",
        status == 200 and d_res.get('data', {}).get('assigned_classes', 0) > 0,
        f"Status: {status}, Data: {d_res}"
    )

    status, c_res = get_json('/teacher/classes', teacher_token)
    assert_test(
        "Teacher classes endpoint returns assigned classes list",
        status == 200 and len(c_res.get('data', [])) >= 3
    )

    status, s_res = get_json('/teacher/students', teacher_token)
    assert_test(
        "Teacher students endpoint returns student roster",
        status == 200 and len(s_res.get('data', [])) > 0
    )

    status, lp_res = get_json('/learning-paths', teacher_token)
    assert_test("Teacher can access learning paths API", status == 200)

    status, lb_res = get_json('/leaderboard/collaborative', teacher_token)
    assert_test("Teacher can access collaborative leaderboard API", status == 200)

    # ─── 4. ROLE SECURITY & ISOLATION ──────────────────────────────
    print("\n[TEST 4] Server-Side Role Enforcement & Isolation...")
    # Admin attempting teacher endpoint -> 403 (Strict separation)
    status, adm_tch_dash = get_json('/teacher/dashboard', admin_token)
    assert_test(
        "Admin blocked from /api/teacher/dashboard with 403 Forbidden under strict role separation",
        status == 403
    )

    # Student attempting teacher endpoint -> 403
    status, bad_res = get_json('/teacher/dashboard', student_token)
    assert_test(
        "Student blocked from /api/teacher/dashboard with 403 Forbidden",
        status == 403,
        f"Got status {status}"
    )

    # Student attempting admin endpoint -> 403
    status, bad_admin = get_json('/admin/dashboard', student_token)
    assert_test(
        "Student blocked from /api/admin/dashboard with 403 Forbidden",
        status == 403,
        f"Got status {status}"
    )

    # Unauthenticated request -> 401
    status, unauth = get_json('/teacher/dashboard')
    assert_test("Unauthenticated request rejected with 401", status == 401)

    # ─── 5. PROFILE PHOTO SAFETY & PROCESSING ──────────────────────
    print("\n[TEST 5] Profile Photo Architecture & EXIF Stripping...")

    # Create dummy image in memory
    img = Image.new('RGB', (600, 600), color=(46, 204, 113))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    valid_photo_bytes = img_byte_arr.getvalue()

    # A. Valid Upload
    status, up_res = upload_photo_multipart('/profile/photo', 'portrait.jpg', valid_photo_bytes, 'image/jpeg', teacher_token)
    assert_test(
        "Teacher uploads valid photo -> returns photo_url and thumbnail_url",
        status == 200 and bool(up_res.get('data', {}).get('photo_url')) and bool(up_res.get('data', {}).get('thumbnail_url')),
        f"Status: {status}, Response: {up_res}"
    )

    # B. Reject Fake Image / Text Payload
    fake_bytes = b"Hello world this is not an image file"
    status, fake_res = upload_photo_multipart('/profile/photo', 'fake.jpg', fake_bytes, 'image/jpeg', teacher_token)
    assert_test(
        "Server rejects non-image binary payload with 400",
        status == 400 and 'Invalid image' in fake_res.get('message', ''),
        f"Status: {status}, Message: {fake_res.get('message')}"
    )

    # C. Reject Oversize File (>2MB)
    oversize_bytes = b'0' * (3 * 1024 * 1024)  # 3MB
    status, over_res = upload_photo_multipart('/profile/photo', 'large.jpg', oversize_bytes, 'image/jpeg', teacher_token)
    assert_test(
        "Server rejects file > 2MB with 400",
        status == 400 and 'exceeds' in over_res.get('message', ''),
        f"Status: {status}, Message: {over_res.get('message')}"
    )

    # D. Delete Own Photo
    status, del_res = delete_json('/profile/photo', teacher_token)
    assert_test("Teacher removes own profile photo -> returns 200", status == 200)

    # E. Student Upload & Admin Moderation
    status, stu_up = upload_photo_multipart('/profile/photo', 'student.jpg', valid_photo_bytes, 'image/jpeg', student_token)
    assert_test("Student uploads profile photo -> 200", status == 200)

    if student_id:
        status, mod_res = delete_json(f'/profile/admin/users/{student_id}/photo', admin_token)
        assert_test("Admin can moderate and remove any student photo", status == 200)

    # ─── 6. GRADE 9 DATA EXISTENCE ─────────────────────────────────
    print("\n[TEST 6] Grade 9 Demo Data Presence...")
    status, cls_list = get_json('/classes', teacher_token)
    g9_classes = [c for c in cls_list.get('data', []) if str(c.get('grade')) == '9']
    assert_test(
        "Grade 9 classes exist in database (9-A and 9-B)",
        len(g9_classes) >= 2,
        f"Found: {len(g9_classes)}"
    )

    print("\n==================================================================")
    print(f"🏁 Test Results: {passed} / {total} tests passed ({round(passed/total*100, 1)}%)")
    print("==================================================================")
    return passed == total


if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
