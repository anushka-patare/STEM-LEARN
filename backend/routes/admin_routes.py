"""Admin routes for managing all platform resources."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from bson import ObjectId
from datetime import datetime
from utils.password import hash_password
from utils.validators import validate_email, validate_mobile, sanitize_string, validate_file_upload
from utils.generators import generate_student_id, generate_teacher_id, generate_safe_filename
from middleware.role_middleware import admin_required
import os

admin_bp = Blueprint('admin', __name__)


# ─── ADMIN DASHBOARD ─────────────────────────────────────────────
@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@admin_required
def admin_dashboard():
    db = current_app.config['db']
    try:
        total_attempts = db.quiz_attempts.count_documents({})
        flagged_attempts = db.quiz_attempts.count_documents({
            '$or': [{'status': 'auto_submitted'}, {'security_violations': {'$gt': 0}}]
        })

        stats = {
            'total_students': db.users.count_documents({'role': 'student'}),
            'total_teachers': db.users.count_documents({'role': 'teacher'}),
            'pending_teachers': db.users.count_documents({'role': 'teacher', 'approval_status': 'pending'}),
            'total_classes': db.classes.count_documents({}),
            'total_subjects': db.subjects.count_documents({}),
            'total_categories': db.categories.count_documents({}),
            'total_chapters': db.chapters.count_documents({}),
            'total_quizzes': db.quizzes.count_documents({}),
            'total_teams': db.teams.count_documents({}),
            'total_quiz_attempts': total_attempts,
            'flagged_attempts': flagged_attempts,
            'active_learning_paths': db.learning_paths.count_documents({'status': 'published'}),
            'active_students': db.users.count_documents({'role': 'student', 'status': 'active'}),
            'active_teachers': db.users.count_documents({'role': 'teacher', 'status': 'active'}),
        }

        # 1. Grade-wise Student and Class Distribution
        grade_distribution = []
        for g in ['6', '7', '8', '9']:
            st_count = db.users.count_documents({'role': 'student', 'grade': str(g)})
            cl_count = db.classes.count_documents({'grade': int(g)}) + db.classes.count_documents({'grade': str(g)})
            grade_distribution.append({
                'grade': f'Grade {g}',
                'grade_num': g,
                'students': st_count,
                'classes': cl_count
            })

        # 2. Subject Chapters Curriculum
        subject_curriculum = []
        for s in db.subjects.find({}):
            sid = str(s['_id'])
            ch_count = db.chapters.count_documents({
                '$or': [
                    {'subject_id': sid},
                    {'subject_id': str(s.get('_id'))},
                    {'subject': sid},
                    {'subject': s.get('name')}
                ]
            })
            subject_curriculum.append({
                'name': s.get('name', 'Subject'),
                'code': s.get('code', 'STEM'),
                'chapters': ch_count
            })

        # 3. Pedagogy & Mode Performance Metrics
        attempts = list(db.quiz_attempts.find({}))
        comp_att = [a for a in attempts if a.get('mode') == 'competitive']
        collab_att = [a for a in attempts if a.get('mode') == 'collaborative']

        def calc_avg(alist):
            if not alist: return 0.0
            accs = [float(a.get('accuracy_pct') or ((a.get('score', 0) / max(1, a.get('total_marks', 10))) * 100)) for a in alist]
            return round(sum(accs) / len(accs), 1)

        total_points = sum(int(a.get('points_awarded', 0)) for a in attempts)
        avg_time = round(sum(int(a.get('time_spent_seconds', 0)) for a in attempts) / max(1, len(attempts)), 0)

        pedagogy_metrics = {
            'competitive': {
                'count': len(comp_att),
                'avg_accuracy': calc_avg(comp_att)
            },
            'collaborative': {
                'count': len(collab_att),
                'avg_accuracy': calc_avg(collab_att)
            },
            'overall_accuracy': calc_avg(attempts),
            'total_points_awarded': total_points,
            'avg_time_spent_seconds': int(avg_time),
            'integrity_rate': round(((total_attempts - flagged_attempts) / max(1, total_attempts)) * 100, 1) if total_attempts > 0 else 100.0
        }

        # 4. Recent Platform Login & Audit Stream
        recent_activity = []
        recent_logins = list(db.login_logs.find({}).sort('timestamp', -1).limit(6))
        for log in recent_logins:
            recent_activity.append({
                'id': str(log.get('_id')),
                'username': log.get('username') or log.get('email') or 'User',
                'role': log.get('role', 'user'),
                'action': log.get('action') or 'Login',
                'status': log.get('status', 'success'),
                'ip': log.get('ip') or '127.0.0.1',
                'timestamp': str(log.get('timestamp') or log.get('created_at') or '')
            })

        return jsonify({
            'success': True,
            'data': {
                **stats,
                'grade_distribution': grade_distribution,
                'subject_curriculum': subject_curriculum,
                'pedagogy_metrics': pedagogy_metrics,
                'recent_activity': recent_activity
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error fetching dashboard data: {str(e)}', 'error_code': 'FETCH_ERROR'}), 500


# ─── STUDENT MANAGEMENT ──────────────────────────────────────────
@admin_bp.route('/students', methods=['GET'])
@jwt_required()
@admin_required
def get_students():
    db = current_app.config['db']
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    search = request.args.get('search', '')
    grade = request.args.get('grade', '')
    division = request.args.get('division', '')
    status = request.args.get('status', '')

    query = {'role': 'student'}
    if search:
        query['$or'] = [
            {'full_name': {'$regex': search, '$options': 'i'}},
            {'name': {'$regex': search, '$options': 'i'}},
            {'username': {'$regex': search, '$options': 'i'}},
            {'email': {'$regex': search, '$options': 'i'}},
            {'student_id': {'$regex': search, '$options': 'i'}}
        ]
    if grade:
        query['grade'] = str(grade)
    if division:
        query['division'] = division
    if status:
        query['status'] = status

    total = db.users.count_documents(query)
    students = list(db.users.find(query, {'password_hash': 0, 'otp_hash': 0})
                    .sort('created_at', -1)
                    .skip((page - 1) * limit)
                    .limit(limit))

    # Pre-fetch teams map
    team_ids = [s['team_id'] for s in students if s.get('team_id')]
    team_map = {}
    if team_ids:
        for t in db.teams.find({'_id': {'$in': [ObjectId(tid) if ObjectId.is_valid(tid) else tid for tid in team_ids]}}):
            team_map[str(t['_id'])] = t.get('name', 'Squad')

    for s in students:
        s['_id'] = str(s['_id'])
        if s.get('team_id'):
            tid_str = str(s['team_id'])
            s['team_id'] = tid_str
            s['team_name'] = team_map.get(tid_str, 'Squad Member')
        else:
            s['team_name'] = 'N/A (Solo)'

        if 'full_name' not in s or not s['full_name']:
            s['full_name'] = s.get('name', 'Student')
        if not s.get('username'):
            s['username'] = s.get('email', s.get('student_id', 'student'))
        if 'points' not in s:
            s['points'] = 0

    return jsonify({
        'success': True,
        'data': {
            'students': students,
            'total': total,
            'page': page,
            'pages': (total + limit - 1) // limit if limit > 0 else 1
        }
    })


@admin_bp.route('/students', methods=['POST'])
@jwt_required()
@admin_required
def create_student():
    db = current_app.config['db']

    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
        photo = request.files.get('photo')
    else:
        data = request.get_json(silent=True) or {}
        photo = None

    required = ['full_name', 'grade', 'division', 'password']
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({'success': False, 'message': f'Missing: {", ".join(missing)}', 'error_code': 'MISSING_FIELDS'}), 400

    grade_val = str(data['grade']).strip()
    if grade_val not in ['6', '7', '8', '9']:
        return jsonify({'success': False, 'message': 'Grade must be 6, 7, 8, or 9', 'error_code': 'INVALID_GRADE'}), 400

    # Username handling
    raw_username = sanitize_string(data.get('username', '')).strip().lower()
    email = sanitize_string(data.get('email', '')).strip().lower()

    if not raw_username:
        if email:
            raw_username = email.split('@')[0]
        else:
            raw_username = sanitize_string(data['full_name']).lower().replace(' ', '')

    # Ensure unique username
    base_username = raw_username
    counter = 1
    while db.users.find_one({'username': raw_username}):
        raw_username = f"{base_username}{counter}"
        counter += 1

    # Check email uniqueness if email provided
    if email and db.users.find_one({'email': email}):
        return jsonify({'success': False, 'message': 'Email already exists', 'error_code': 'EMAIL_EXISTS'}), 409

    photo_path = ''
    if photo:
        valid, msg = validate_file_upload(photo)
        if valid:
            filename = generate_safe_filename(photo.filename)
            photo_dir = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), 'students')
            os.makedirs(photo_dir, exist_ok=True)
            photo.save(os.path.join(photo_dir, filename))
            photo_path = f'students/{filename}'

    student_id = data.get('student_id') or generate_student_id()

    student = {
        'student_id': student_id,
        'full_name': sanitize_string(data['full_name']),
        'name': sanitize_string(data['full_name']),
        'username': raw_username,
        'email': email,
        'password_hash': hash_password(data['password']),
        'role': 'student',
        'grade': grade_val,
        'division': sanitize_string(data['division']).upper(),
        'roll_number': sanitize_string(data.get('roll_number', '')),
        'mobile': sanitize_string(data.get('mobile', '')),
        'photo': photo_path,
        'status': data.get('status', 'active'),
        'team_id': None,
        'points': 0,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }

    result = db.users.insert_one(student)
    student['_id'] = str(result.inserted_id)
    del student['password_hash']

    return jsonify({'success': True, 'message': f'Student {student["full_name"]} created successfully', 'data': student}), 201


@admin_bp.route('/students/bulk-import', methods=['POST'])
@jwt_required()
@admin_required
def bulk_import_students():
    """Bulk import students from CSV data."""
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    students_list = data.get('students', [])

    if not students_list or not isinstance(students_list, list):
        return jsonify({'success': False, 'message': 'Students list is required'}), 400

    imported = []
    skipped = []
    errors = []

    for idx, raw in enumerate(students_list):
        full_name = sanitize_string(raw.get('full_name') or raw.get('name', '')).strip()
        grade = str(raw.get('grade', '')).strip()
        division = sanitize_string(raw.get('division', 'A')).strip().upper()
        email = sanitize_string(raw.get('email', '')).strip().lower()
        roll_number = sanitize_string(raw.get('roll_number') or raw.get('roll_no', '')).strip()
        raw_user = sanitize_string(raw.get('username', '')).strip().lower()
        raw_pass = str(raw.get('password') or 'STEMLearn@123').strip()

        if not full_name:
            skipped.append({'row': idx + 1, 'reason': 'Missing full_name'})
            continue

        if grade not in ['6', '7', '8', '9']:
            errors.append({'row': idx + 1, 'name': full_name, 'reason': f'Invalid grade "{grade}" (must be 6-9)'})
            continue

        # Generate unique username
        if not raw_user:
            base = email.split('@')[0] if email else full_name.lower().replace(' ', '')
            raw_user = base
        
        counter = 1
        candidate_user = raw_user
        while db.users.find_one({'username': candidate_user}):
            candidate_user = f"{raw_user}{counter}"
            counter += 1
        raw_user = candidate_user

        # If email given, check uniqueness
        if email and db.users.find_one({'email': email}):
            errors.append({'row': idx + 1, 'name': full_name, 'reason': f'Email {email} already registered'})
            continue

        new_student = {
            'student_id': generate_student_id(),
            'full_name': full_name,
            'name': full_name,
            'username': raw_user,
            'email': email,
            'password_hash': hash_password(raw_pass),
            'role': 'student',
            'grade': grade,
            'division': division,
            'roll_number': roll_number,
            'mobile': sanitize_string(raw.get('mobile', '')),
            'photo': '',
            'status': raw.get('status', 'active'),
            'team_id': None,
            'points': 0,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        res = db.users.insert_one(new_student)
        new_student['_id'] = str(res.inserted_id)
        del new_student['password_hash']
        imported.append(new_student)

    return jsonify({
        'success': True,
        'message': f'Processed {len(students_list)} records: {len(imported)} imported, {len(skipped)} skipped, {len(errors)} errors.',
        'data': {
            'total': len(students_list),
            'imported_count': len(imported),
            'skipped_count': len(skipped),
            'error_count': len(errors),
            'imported': imported,
            'errors': errors,
            'skipped': skipped
        }
    }), 201


@admin_bp.route('/students/<id>', methods=['GET'])
@jwt_required()
@admin_required
def get_student(id):
    db = current_app.config['db']
    try:
        student = db.users.find_one({'_id': ObjectId(id), 'role': 'student'}, {'password_hash': 0})
        if not student:
            return jsonify({'success': False, 'message': 'Student not found', 'error_code': 'NOT_FOUND'}), 404
        student['_id'] = str(student['_id'])
        if student.get('team_id'):
            student['team_id'] = str(student['team_id'])
        return jsonify({'success': True, 'data': student})
    except Exception:
        return jsonify({'success': False, 'message': 'Invalid ID', 'error_code': 'INVALID_ID'}), 400


@admin_bp.route('/students/<id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_student(id):
    db = current_app.config['db']

    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
        photo = request.files.get('photo')
    else:
        data = request.get_json(silent=True) or {}
        photo = None

    try:
        student = db.users.find_one({'_id': ObjectId(id), 'role': 'student'})
        if not student:
            return jsonify({'success': False, 'message': 'Student not found', 'error_code': 'NOT_FOUND'}), 404

        update = {'updated_at': datetime.utcnow()}
        allowed = ['full_name', 'grade', 'division', 'roll_number', 'mobile', 'status']
        for field in allowed:
            if field in data:
                val = sanitize_string(data[field])
                if field == 'grade' and val not in ['6', '7', '8', '9']:
                    continue
                if field == 'division':
                    val = val.upper()
                update[field] = val

        if 'full_name' in update:
            update['name'] = update['full_name']

        if 'username' in data and data['username']:
            new_user = sanitize_string(data['username']).lower().strip()
            existing = db.users.find_one({'username': new_user, '_id': {'$ne': ObjectId(id)}})
            if existing:
                return jsonify({'success': False, 'message': 'Username already taken', 'error_code': 'USERNAME_EXISTS'}), 409
            update['username'] = new_user

        if 'email' in data:
            new_email = sanitize_string(data['email']).lower().strip()
            if new_email:
                existing = db.users.find_one({'email': new_email, '_id': {'$ne': ObjectId(id)}})
                if existing:
                    return jsonify({'success': False, 'message': 'Email already in use', 'error_code': 'EMAIL_EXISTS'}), 409
                update['email'] = new_email
            else:
                update['email'] = ''

        if 'password' in data and data['password']:
            update['password_hash'] = hash_password(data['password'])

        if photo:
            valid, msg = validate_file_upload(photo)
            if valid:
                filename = generate_safe_filename(photo.filename)
                photo_dir = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), 'students')
                os.makedirs(photo_dir, exist_ok=True)
                photo.save(os.path.join(photo_dir, filename))
                update['photo'] = f'students/{filename}'

        db.users.update_one({'_id': ObjectId(id)}, {'$set': update})
        return jsonify({'success': True, 'message': 'Student updated'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error updating student: {str(e)}', 'error_code': 'UPDATE_ERROR'}), 500


@admin_bp.route('/students/<id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_student(id):
    db = current_app.config['db']
    try:
        result = db.users.delete_one({'_id': ObjectId(id), 'role': 'student'})
        if result.deleted_count == 0:
            return jsonify({'success': False, 'message': 'Student not found', 'error_code': 'NOT_FOUND'}), 404
        return jsonify({'success': True, 'message': 'Student deleted'})
    except Exception:
        return jsonify({'success': False, 'message': 'Error deleting student', 'error_code': 'DELETE_ERROR'}), 500


@admin_bp.route('/students/<id>/reset-password', methods=['POST'])
@jwt_required()
@admin_required
def reset_student_password(id):
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    new_password = data.get('new_password', '')
    if not new_password:
        return jsonify({'success': False, 'message': 'New password required', 'error_code': 'MISSING_FIELDS'}), 400
    try:
        result = db.users.update_one(
            {'_id': ObjectId(id), 'role': 'student'},
            {'$set': {'password_hash': hash_password(new_password), 'updated_at': datetime.utcnow()}}
        )
        if result.matched_count == 0:
            return jsonify({'success': False, 'message': 'Student not found', 'error_code': 'NOT_FOUND'}), 404
        return jsonify({'success': True, 'message': 'Password reset successful'})
    except Exception:
        return jsonify({'success': False, 'message': 'Error resetting password', 'error_code': 'UPDATE_ERROR'}), 500


# ─── TEACHER MANAGEMENT ──────────────────────────────────────────


@admin_bp.route('/teachers', methods=['GET'])
@jwt_required()
@admin_required
def get_teachers():
    db = current_app.config['db']
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 100))
    search = request.args.get('search', '')
    status = request.args.get('status', '')

    query = {'role': 'teacher'}
    if search:
        query['$or'] = [
            {'full_name': {'$regex': search, '$options': 'i'}},
            {'name': {'$regex': search, '$options': 'i'}},
            {'username': {'$regex': search, '$options': 'i'}},
            {'email': {'$regex': search, '$options': 'i'}},
            {'teacher_id': {'$regex': search, '$options': 'i'}},
            {'subject': {'$regex': search, '$options': 'i'}},
            {'subject_specialization': {'$regex': search, '$options': 'i'}}
        ]
    if status:
        query['status'] = status

    total = db.users.count_documents(query)
    teachers = list(db.users.find(query, {'password_hash': 0, 'otp_hash': 0})
                    .sort('created_at', -1)
                    .skip((page - 1) * limit)
                    .limit(limit))

    for t in teachers:
        t['_id'] = str(t['_id'])
        if 'full_name' not in t or not t['full_name']:
            t['full_name'] = t.get('name', 'Teacher')
        if 'name' not in t or not t['name']:
            t['name'] = t.get('full_name', 'Teacher')
        if not t.get('username'):
            t['username'] = t.get('email', t.get('teacher_id', 'teacher'))
        if 'teacher_id' not in t or not t['teacher_id']:
            t['teacher_id'] = f"TCH-{str(t['_id'])[-4:].upper()}"
        if 'status' not in t or not t['status']:
            t['status'] = 'active'
        if 'subject' not in t or not t['subject']:
            t['subject'] = t.get('subject_specialization', 'General Science')
        if 'subject_specialization' not in t or not t['subject_specialization']:
            t['subject_specialization'] = t.get('subject', 'General Science')

        # Normalize assigned_classes
        raw_classes = t.get('assigned_classes') or []
        norm_classes = []
        for c in raw_classes:
            if isinstance(c, dict):
                g = c.get('grade', '')
                d = c.get('division', '')
                if g and d:
                    norm_classes.append(f"Grade {g}-{d}")
                elif g:
                    norm_classes.append(f"Grade {g}")
            elif isinstance(c, str):
                norm_classes.append(c)
        t['assigned_classes'] = norm_classes
        if not t.get('assigned_grade') and norm_classes:
            first_cls = norm_classes[0]
            if 'Grade ' in first_cls and '-' in first_cls:
                parts = first_cls.replace('Grade ', '').split('-')
                t['assigned_grade'] = parts[0]
                t['assigned_division'] = parts[1]

    return jsonify({
        'success': True,
        'data': {
            'teachers': teachers,
            'total': total,
            'page': page,
            'pages': (total + limit - 1) // limit if limit > 0 else 1
        }
    })


@admin_bp.route('/teachers', methods=['POST'])
@jwt_required()
@admin_required
def create_teacher():
    db = current_app.config['db']

    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
        photo = request.files.get('photo')
    else:
        data = request.get_json(silent=True) or {}
        photo = None

    required = ['full_name', 'email', 'password']
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({'success': False, 'message': f'Missing: {", ".join(missing)}', 'error_code': 'MISSING_FIELDS'}), 400

    email = sanitize_string(data['email']).lower()
    if db.users.find_one({'email': email}):
        return jsonify({'success': False, 'message': 'Email already exists', 'error_code': 'EMAIL_EXISTS'}), 409

    # Generate unique username if not provided
    raw_user = sanitize_string(data.get('username', '')).strip().lower()
    if not raw_user:
        raw_user = email.split('@')[0]
    
    base_user = raw_user
    counter = 1
    while db.users.find_one({'username': raw_user}):
        raw_user = f"{base_user}{counter}"
        counter += 1

    photo_path = ''
    if photo:
        valid, msg = validate_file_upload(photo)
        if valid:
            filename = generate_safe_filename(photo.filename)
            photo_dir = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), 'teachers')
            os.makedirs(photo_dir, exist_ok=True)
            photo.save(os.path.join(photo_dir, filename))
            photo_path = f'teachers/{filename}'

    # Parse assigned_classes
    assigned_classes = data.get('assigned_classes', [])
    if isinstance(assigned_classes, str):
        import json
        try:
            assigned_classes = json.loads(assigned_classes)
        except Exception:
            assigned_classes = [assigned_classes] if assigned_classes else []

    full_name_val = sanitize_string(data['full_name'])
    subject_val = sanitize_string(data.get('subject') or data.get('assigned_subject') or data.get('subject_specialization') or 'General Science')
    specialization_val = sanitize_string(data.get('subject_specialization') or data.get('specialization') or subject_val)

    teacher = {
        'teacher_id': sanitize_string(data.get('teacher_id')) or generate_teacher_id(),
        'full_name': full_name_val,
        'name': full_name_val,
        'email': email,
        'username': raw_user,
        'password_hash': hash_password(data['password']),
        'role': 'teacher',
        'education': sanitize_string(data.get('education', '')),
        'mobile': sanitize_string(data.get('mobile', '')),
        'photo': photo_path,
        'subject': subject_val,
        'subject_specialization': specialization_val,
        'assigned_classes': assigned_classes,
        'assigned_grade': sanitize_string(data.get('assigned_grade', '')),
        'assigned_division': sanitize_string(data.get('assigned_division', '')),
        'assigned_subject': sanitize_string(data.get('assigned_subject', subject_val)),
        'status': data.get('status', 'active'),
        'approval_status': 'active',
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }

    result = db.users.insert_one(teacher)
    teacher['_id'] = str(result.inserted_id)
    del teacher['password_hash']

    return jsonify({'success': True, 'message': 'Teacher created', 'data': teacher}), 201


@admin_bp.route('/teachers/<id>', methods=['GET'])
@jwt_required()
@admin_required
def get_teacher(id):
    db = current_app.config['db']
    try:
        teacher = db.users.find_one({'_id': ObjectId(id), 'role': 'teacher'}, {'password_hash': 0, 'otp_hash': 0})
        if not teacher:
            return jsonify({'success': False, 'message': 'Teacher not found', 'error_code': 'NOT_FOUND'}), 404
        teacher['_id'] = str(teacher['_id'])
        if 'full_name' not in teacher or not teacher['full_name']:
            teacher['full_name'] = teacher.get('name', 'Teacher')
        if 'teacher_id' not in teacher or not teacher['teacher_id']:
            teacher['teacher_id'] = f"TCH-{str(teacher['_id'])[-4:].upper()}"
        if not teacher.get('username'):
            teacher['username'] = teacher.get('email', teacher.get('teacher_id', 'teacher'))
        if 'status' not in teacher or not teacher['status']:
            teacher['status'] = 'active'
        return jsonify({'success': True, 'data': teacher})
    except Exception:
        return jsonify({'success': False, 'message': 'Invalid ID', 'error_code': 'INVALID_ID'}), 400


@admin_bp.route('/teachers/<id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_teacher(id):
    db = current_app.config['db']

    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
        photo = request.files.get('photo')
    else:
        data = request.get_json(silent=True) or {}
        photo = None

    try:
        teacher = db.users.find_one({'_id': ObjectId(id), 'role': 'teacher'})
        if not teacher:
            return jsonify({'success': False, 'message': 'Teacher not found', 'error_code': 'NOT_FOUND'}), 404

        update = {'updated_at': datetime.utcnow()}
        allowed = [
            'full_name', 'teacher_id', 'education', 'mobile', 'subject',
            'subject_specialization', 'assigned_grade', 'assigned_division',
            'assigned_subject', 'status'
        ]
        for field in allowed:
            if field in data:
                update[field] = sanitize_string(data[field])

        if 'full_name' in update:
            update['name'] = update['full_name']

        if 'education' in update:
            update['qualification'] = update['education']
        elif 'qualification' in update:
            update['education'] = update['qualification']

        if 'username' in data and data['username']:
            new_user = sanitize_string(data['username']).lower().strip()
            existing = db.users.find_one({'username': new_user, '_id': {'$ne': ObjectId(id)}})
            if existing:
                return jsonify({'success': False, 'message': 'Username already taken', 'error_code': 'USERNAME_EXISTS'}), 409
            update['username'] = new_user

        if 'assigned_classes' in data:
            ac = data['assigned_classes']
            if isinstance(ac, str):
                import json
                try:
                    ac = json.loads(ac)
                except Exception:
                    ac = [ac] if ac else []
            update['assigned_classes'] = ac

        if 'email' in data:
            new_email = sanitize_string(data['email']).lower().strip()
            if new_email:
                existing = db.users.find_one({'email': new_email, '_id': {'$ne': ObjectId(id)}})
                if existing:
                    return jsonify({'success': False, 'message': 'Email already in use', 'error_code': 'EMAIL_EXISTS'}), 409
                update['email'] = new_email

        if 'password' in data and data['password']:
            update['password_hash'] = hash_password(data['password'])

        if photo:
            valid, msg = validate_file_upload(photo)
            if valid:
                filename = generate_safe_filename(photo.filename)
                photo_dir = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), 'teachers')
                os.makedirs(photo_dir, exist_ok=True)
                photo.save(os.path.join(photo_dir, filename))
                update['photo'] = f'teachers/{filename}'

        db.users.update_one({'_id': ObjectId(id)}, {'$set': update})

        # Sync with db.classes
        if 'assigned_grade' in update and 'assigned_division' in update:
            g = str(update['assigned_grade'])
            d = str(update['assigned_division']).upper()
            t_name = update.get('full_name') or teacher.get('full_name') or teacher.get('name') or 'Teacher'

            # 1. Unassign this teacher from any other class
            db.classes.update_many(
                {'_id': {'$ne': None}, 'teacher_id': str(id)},
                {'$set': {'teacher_id': '', 'teacher_name': 'Unassigned'}}
            )
            # 2. Assign this teacher to target class if it exists
            target_cls = db.classes.find_one({'grade': g, 'division': d})
            if target_cls:
                db.classes.update_one(
                    {'_id': target_cls['_id']},
                    {'$set': {'teacher_id': str(id), 'teacher_name': t_name}}
                )

        return jsonify({'success': True, 'message': 'Teacher updated'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error updating teacher: {str(e)}', 'error_code': 'UPDATE_ERROR'}), 500


@admin_bp.route('/teachers/<id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_teacher(id):
    db = current_app.config['db']
    try:
        # Free up any class this teacher was supervising
        db.classes.update_many(
            {'teacher_id': str(id)},
            {'$set': {'teacher_id': '', 'teacher_name': 'Unassigned'}}
        )

        result = db.users.delete_one({'_id': ObjectId(id), 'role': 'teacher'})
        if result.deleted_count == 0:
            return jsonify({'success': False, 'message': 'Teacher not found', 'error_code': 'NOT_FOUND'}), 404
        return jsonify({'success': True, 'message': 'Teacher deleted'})
    except Exception:
        return jsonify({'success': False, 'message': 'Error deleting teacher', 'error_code': 'DELETE_ERROR'}), 500


@admin_bp.route('/teachers/<id>/reset-password', methods=['POST'])
@jwt_required()
@admin_required
def reset_teacher_password(id):
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    new_password = data.get('new_password', '')
    if not new_password:
        return jsonify({'success': False, 'message': 'New password required', 'error_code': 'MISSING_FIELDS'}), 400
    try:
        result = db.users.update_one(
            {'_id': ObjectId(id), 'role': 'teacher'},
            {'$set': {'password_hash': hash_password(new_password), 'updated_at': datetime.utcnow()}}
        )
        if result.matched_count == 0:
            return jsonify({'success': False, 'message': 'Teacher not found', 'error_code': 'NOT_FOUND'}), 404
        return jsonify({'success': True, 'message': 'Password reset successful'})
    except Exception:
        return jsonify({'success': False, 'message': 'Error resetting password', 'error_code': 'UPDATE_ERROR'}), 500


# ─── TEACHER APPROVALS WORKFLOW ──────────────────────────────────
@admin_bp.route('/teachers/pending', methods=['GET'])
@jwt_required()
@admin_required
def get_pending_teachers():
    """List all teachers with status = 'pending'."""
    db = current_app.config['db']
    try:
        teachers = list(db.users.find(
            {'role': 'teacher', '$or': [{'approval_status': 'pending'}, {'status': 'pending'}]},
            {'password_hash': 0, 'otp_hash': 0}
        ).sort('created_at', -1))

        for t in teachers:
            t['_id'] = str(t['_id'])
            if 'full_name' not in t or not t['full_name']:
                t['full_name'] = t.get('name', 'Teacher Applicant')

        return jsonify({'success': True, 'data': teachers})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error fetching pending teachers: {str(e)}'}), 500


@admin_bp.route('/teachers/<id>/approve', methods=['POST'])
@jwt_required()
@admin_required
def approve_teacher(id):
    """Approve a pending teacher and optionally assign initial classes/subjects."""
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    try:
        teacher = db.users.find_one({'_id': ObjectId(id), 'role': 'teacher'})
        if not teacher:
            return jsonify({'success': False, 'message': 'Teacher not found'}), 404

        update = {
            'approval_status': 'active',
            'status': 'active',
            'rejection_reason': '',
            'approved_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        if 'assigned_classes' in data:
            update['assigned_classes'] = data['assigned_classes']
        if 'subject_specialization' in data:
            update['subject_specialization'] = data['subject_specialization']

        db.users.update_one({'_id': ObjectId(id)}, {'$set': update})

        from services.email_service import send_teacher_approval_notification
        teacher_name = teacher.get('full_name') or teacher.get('name', 'Teacher')
        send_teacher_approval_notification(db, teacher.get('email'), teacher_name, approved=True)

        return jsonify({'success': True, 'message': f'Teacher {teacher_name} has been approved successfully.'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error approving teacher: {str(e)}'}), 500


@admin_bp.route('/teachers/<id>/reject', methods=['POST'])
@jwt_required()
@admin_required
def reject_teacher(id):
    """Reject a pending teacher with mandatory reason."""
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    reason = data.get('reason', '').strip() or 'Application does not meet current departmental criteria.'

    try:
        teacher = db.users.find_one({'_id': ObjectId(id), 'role': 'teacher'})
        if not teacher:
            return jsonify({'success': False, 'message': 'Teacher not found'}), 404

        db.users.update_one(
            {'_id': ObjectId(id)},
            {'$set': {
                'approval_status': 'rejected',
                'status': 'rejected',
                'rejection_reason': reason,
                'rejected_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }}
        )

        from services.email_service import send_teacher_approval_notification
        teacher_name = teacher.get('full_name') or teacher.get('name', 'Teacher')
        send_teacher_approval_notification(db, teacher.get('email'), teacher_name, approved=False, reason=reason)

        return jsonify({'success': True, 'message': f'Teacher application for {teacher_name} rejected.'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error rejecting teacher: {str(e)}'}), 500


# ─── SMTP CONFIGURATION (ADMIN ONLY) ─────────────────────────────
@admin_bp.route('/settings/smtp', methods=['GET'])
@jwt_required()
@admin_required
def get_smtp_settings():
    """Fetch current SMTP settings with masked password."""
    db = current_app.config['db']
    from services.email_service import get_smtp_config
    cfg = get_smtp_config(db)
    
    return jsonify({
        'success': True,
        'data': {
            'host': cfg['host'],
            'port': cfg['port'],
            'user': cfg['user'],
            'from_email': cfg['from_email'],
            'from_name': cfg['from_name'],
            'use_tls': cfg['use_tls'],
            'is_configured': cfg['is_configured'],
            'has_password': bool(cfg['password'])
        }
    })


@admin_bp.route('/settings/smtp', methods=['PUT'])
@jwt_required()
@admin_required
def update_smtp_settings():
    """Update SMTP settings and encrypt app-password with Fernet."""
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    from utils.crypto_helper import encrypt_secret
    from services.email_service import get_smtp_config

    current_cfg = get_smtp_config(db)
    
    host = data.get('host', current_cfg['host']).strip()
    port = int(data.get('port', current_cfg['port']))
    user = data.get('user', current_cfg['user']).strip()
    from_email = data.get('from_email', current_cfg['from_email']).strip()
    from_name = data.get('from_name', current_cfg['from_name']).strip()
    use_tls = bool(data.get('use_tls', current_cfg['use_tls']))
    
    password = data.get('password', '')
    
    smtp_update = {
        'host': host,
        'port': port,
        'user': user,
        'from_email': from_email,
        'from_name': from_name,
        'use_tls': use_tls,
        'updated_at': datetime.utcnow()
    }
    
    # If a new password is provided, encrypt it; otherwise keep existing
    if password and password != '********':
        smtp_update['password'] = encrypt_secret(password)
    
    db.system_settings.update_one(
        {'type': 'global'},
        {'$set': {'smtp_settings': smtp_update, 'updated_at': datetime.utcnow()}},
        upsert=True
    )
    
    return jsonify({
        'success': True,
        'message': 'SMTP configuration updated successfully.'
    })


@admin_bp.route('/settings/smtp/test', methods=['POST'])
@jwt_required()
@admin_required
def test_smtp_connection():
    """Send test email to verify SMTP credentials."""
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    recipient = data.get('test_email') or data.get('email')
    
    if not recipient:
        # Default to current admin's email
        admin = db.users.find_one({'_id': ObjectId(get_jwt_identity())})
        recipient = admin.get('email') if admin else ''
        
    if not recipient:
        return jsonify({'success': False, 'message': 'Please provide a recipient email for testing.'}), 400

    from services.email_service import send_test_email
    success, message = send_test_email(db, recipient)
    
    if not success:
        return jsonify({'success': False, 'message': message}), 400
    return jsonify({'success': True, 'message': f'Test email dispatched to {recipient}. {message}'})


# ─── LOGIN LOGS ───────────────────────────────────────────────────
@admin_bp.route('/login-logs', methods=['GET'])
@jwt_required()
@admin_required
def get_login_logs():
    db = current_app.config['db']
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 50))
    role = request.args.get('role', '')
    status = request.args.get('status', '')

    query = {}
    if role:
        query['role'] = role
    if status:
        query['login_status'] = status

    total = db.login_logs.count_documents(query)
    logs = list(db.login_logs.find(query)
                .sort('created_at', -1)
                .skip((page - 1) * limit)
                .limit(limit))

    # Pre-resolve user accounts in bulk
    user_ids = []
    for log in logs:
        uid = log.get('user_id')
        if uid and ObjectId.is_valid(uid):
            user_ids.append(ObjectId(uid))

    users_map = {}
    if user_ids:
        users = list(db.users.find({'_id': {'$in': user_ids}}, {'email': 1, 'name': 1, 'username': 1, 'role': 1}))
        users_map = {str(u['_id']): u for u in users}

    for log in logs:
        log['_id'] = str(log['_id'])
        uid = str(log.get('user_id', ''))
        user_doc = users_map.get(uid)

        if user_doc:
            log['email'] = user_doc.get('email') or user_doc.get('username') or ''
            log['user_name'] = user_doc.get('name') or user_doc.get('username') or ''
            log['username'] = user_doc.get('username') or ''
            log['user'] = user_doc.get('email') or user_doc.get('username') or ''
        elif log.get('role') == 'admin':
            log['email'] = log.get('email') or 'admin@stemlearn.com'
            log['user_name'] = log.get('name') or 'Super Admin'
            log['username'] = log.get('username') or 'admin'
            log['user'] = log['email']
        else:
            log['email'] = log.get('email') or log.get('username') or 'User Account'
            log['user_name'] = log.get('name') or 'Registered User'
            log['username'] = log.get('username') or ''
            log['user'] = log['email']

        if log.get('login_time'):
            log['login_time'] = log['login_time'].isoformat()
        if log.get('logout_time'):
            log['logout_time'] = log['logout_time'].isoformat()
        if log.get('created_at'):
            log['created_at'] = log['created_at'].isoformat()

    return jsonify({
        'success': True,
        'data': {
            'logs': logs,
            'total': total,
            'page': page,
            'pages': (total + limit - 1) // limit
        }
    })


@admin_bp.route('/login-logs', methods=['DELETE'])
@jwt_required()
@admin_required
def clear_login_logs():
    db = current_app.config['db']
    try:
        deleted_count = db.login_logs.delete_many({}).deleted_count
        db.login_audit.delete_many({})
        return jsonify({
            'success': True,
            'message': f'Successfully cleared all {deleted_count} login audit records.',
            'deleted_count': deleted_count
        })
    except Exception as e:
        return jsonify({'success': False, 'message': 'Failed to clear login logs', 'error': str(e)}), 500


@admin_bp.route('/login-logs/<id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_single_login_log(id):
    db = current_app.config['db']
    try:
        if not ObjectId.is_valid(id):
            return jsonify({'success': False, 'message': 'Invalid log ID'}), 400
        res = db.login_logs.delete_one({'_id': ObjectId(id)})
        if res.deleted_count == 0:
            return jsonify({'success': False, 'message': 'Log entry not found'}), 404
        return jsonify({'success': True, 'message': 'Log entry deleted successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': 'Failed to delete log entry', 'error': str(e)}), 500


# ─── SYSTEM SETTINGS ─────────────────────────────────────────────
@admin_bp.route('/settings', methods=['GET'])
@jwt_required()
@admin_required
def get_settings():
    db = current_app.config['db']
    settings = db.system_settings.find_one({'type': 'global'})
    if settings:
        settings['_id'] = str(settings['_id'])
        # Mask API keys if present
        if settings.get('gemini_api_key'):
            settings['gemini_api_key'] = '********'
        if settings.get('groq_api_key'):
            settings['groq_api_key'] = '********'
    else:
        settings = {
            'type': 'global',
            'student_ai_enabled': True,
            'daily_student_request_limit': 30,
            'max_message_length': 500,
            'max_response_tokens': 1000,
            'primary_ai_provider': 'gemini',
            'fallback_ai_provider': 'groq',
            'groq_model': 'llama-3.3-70b-versatile',
            'gemini_model': 'gemini-2.5-flash',
            'anti_cheat_limit': 3,
            'passing_percentage': 70,
            'enforce_fullscreen': True,
            'detect_tab_switch': True,
            'disable_copy_paste': True,
            'disable_right_click': True,
            'block_devtools': True,
            'single_session_lock': True,
            'inactivity_timeout_mins': 30,
            'shuffle_questions': True,
            'allow_student_registration': True,
            'allow_teacher_api_keys': False,
            'jwt_expiry_hours': 24,
            'team_scoring_method': 'average'
        }

    return jsonify({'success': True, 'data': settings})


@admin_bp.route('/settings', methods=['PUT'])
@jwt_required()
@admin_required
def update_settings():
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}

    allowed_fields = [
        'student_ai_enabled', 'daily_student_request_limit', 'max_message_length',
        'max_response_tokens', 'primary_ai_provider', 'fallback_ai_provider',
        'groq_model', 'gemini_model', 'anti_cheat_limit', 'passing_percentage',
        'enforce_fullscreen', 'detect_tab_switch', 'disable_copy_paste',
        'disable_right_click', 'block_devtools', 'single_session_lock',
        'inactivity_timeout_mins', 'shuffle_questions',
        'allow_student_registration', 'allow_teacher_api_keys',
        'jwt_expiry_hours', 'team_scoring_method', 'gemini_api_key', 'groq_api_key'
    ]

    update = {'type': 'global', 'updated_at': datetime.utcnow()}
    for field in allowed_fields:
        if field in data:
            # Don't overwrite key if placeholder mask sent
            if field in ['gemini_api_key', 'groq_api_key'] and data[field] == '********':
                continue
            update[field] = data[field]

    db.system_settings.update_one(
        {'type': 'global'},
        {'$set': update},
        upsert=True
    )

    saved = db.system_settings.find_one({'type': 'global'})
    if saved:
        saved['_id'] = str(saved['_id'])
        if saved.get('gemini_api_key'):
            saved['gemini_api_key'] = '********'
        if saved.get('groq_api_key'):
            saved['groq_api_key'] = '********'

    return jsonify({'success': True, 'message': 'System settings updated successfully', 'data': saved})

