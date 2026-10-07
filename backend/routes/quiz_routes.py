"""Quiz routes - Full implementation."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from bson import ObjectId
from datetime import datetime, timedelta
from middleware.role_middleware import role_required, teacher_required, student_required

quiz_bp = Blueprint('quizzes', __name__)


@quiz_bp.route('', methods=['GET'])
@jwt_required()
def get_quizzes():
    try:
        db = current_app.config['db']
        claims = get_jwt()
        role = claims.get('role', '')
        user_id = get_jwt_identity()

        chapter_id = request.args.get('chapter_id', '').strip()
        status = request.args.get('status', '').strip()
        grade = request.args.get('grade', '').strip()
        subject_id = request.args.get('subject_id', '').strip()
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 100))

        query = {}
        if chapter_id and chapter_id != 'all':
            query['chapter_id'] = chapter_id
        if status and status != 'all':
            query['status'] = status
        if grade and grade != 'all':
            query['grade'] = str(grade)
        if subject_id and subject_id != 'all':
            query['subject_id'] = subject_id

        # Teachers can see quizzes strictly for their assigned grades (or school curriculum)
        if role == 'teacher':
            teacher_filter = [
                {'created_by': user_id},
                {'created_by': {'$in': [None, '', '6ab3b6a5e3e32aa7ac3aa1d6']}},
                {'created_by': {'$exists': False}}
            ]
            if '$or' in query:
                query['$and'] = query.get('$and', []) + [{'$or': teacher_filter}]
            else:
                query['$or'] = teacher_filter

            # Enforce teacher assigned classes / grades
            teacher_doc = db.users.find_one({'_id': ObjectId(user_id)}) if ObjectId.is_valid(user_id) else None
            assigned_grades = set()
            if teacher_doc:
                if teacher_doc.get('assigned_grade'):
                    assigned_grades.add(str(teacher_doc['assigned_grade']))
                for ac in (teacher_doc.get('assigned_classes') or []):
                    if isinstance(ac, dict) and ac.get('grade'):
                        assigned_grades.add(str(ac['grade']))
                    elif isinstance(ac, str) and ac.strip():
                        clean = ac.replace('Grade', '').strip().split('-')[0].strip()
                        if clean:
                            assigned_grades.add(clean)

            for cl in db.classes.find({
                '$or': [
                    {'teacher_id': str(user_id)},
                    {'teacher_ids': str(user_id)},
                    {'teacher_ids': ObjectId(user_id) if ObjectId.is_valid(user_id) else str(user_id)}
                ],
                'status': 'active'
            }):
                if cl.get('grade'):
                    assigned_grades.add(str(cl['grade']))

            if assigned_grades:
                if grade and grade != 'all':
                    if str(grade) in assigned_grades:
                        query['grade'] = str(grade)
                    else:
                        query['grade'] = {'$in': list(assigned_grades)}
                else:
                    query['grade'] = {'$in': list(assigned_grades)}
        # Students only see published quizzes
        elif role == 'student':
            query['status'] = 'published'

        total = db.quizzes.count_documents(query)
        quizzes = list(db.quizzes.find(query)
                       .sort([('sequence_number', 1), ('created_at', -1)])
                       .skip((page - 1) * limit)
                       .limit(limit))
        for q in quizzes:
            q['_id'] = str(q['_id'])
            if q.get('chapter_id'):
                q['chapter_id'] = str(q['chapter_id'])
            if q.get('subject_id'):
                q['subject_id'] = str(q['subject_id'])
            if q.get('category_id'):
                q['category_id'] = str(q['category_id'])
            if q.get('class_id'):
                q['class_id'] = str(q['class_id'])
            if q.get('created_by'):
                q['created_by'] = str(q['created_by'])
            if q.get('grade') is not None:
                q['grade'] = str(q['grade'])

            qid_str = str(q['_id'])
            q['question_count'] = db.questions.count_documents({
                '$or': [
                    {'quiz_id': qid_str},
                    {'quiz_id': ObjectId(qid_str) if ObjectId.is_valid(qid_str) else None}
                ]
            })

        pages = (total + limit - 1) // limit if total > 0 else 0
        return jsonify({
            'success': True,
            'data': {'quizzes': quizzes, 'total': total, 'page': page, 'pages': pages}
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e), 'error_code': 'FETCH_ERROR'}), 500


@quiz_bp.route('/<id>', methods=['GET'])
@jwt_required()
def get_quiz(id):
    db = current_app.config['db']
    try:
        quiz = db.quizzes.find_one({'_id': ObjectId(id)})
        if not quiz:
            return jsonify({'success': False, 'message': 'Quiz not found', 'error_code': 'NOT_FOUND'}), 404
        quiz['_id'] = str(quiz['_id'])
        if quiz.get('chapter_id'):
            quiz['chapter_id'] = str(quiz['chapter_id'])
        if quiz.get('subject_id'):
            quiz['subject_id'] = str(quiz['subject_id'])
        if quiz.get('category_id'):
            quiz['category_id'] = str(quiz['category_id'])
        if quiz.get('class_id'):
            quiz['class_id'] = str(quiz['class_id'])
        if quiz.get('created_by'):
            quiz['created_by'] = str(quiz['created_by'])
        if quiz.get('grade') is not None:
            quiz['grade'] = str(quiz['grade'])

        qid_str = str(quiz['_id'])
        quiz['question_count'] = db.questions.count_documents({
            '$or': [
                {'quiz_id': qid_str},
                {'quiz_id': ObjectId(qid_str) if ObjectId.is_valid(qid_str) else None}
            ]
        })
        return jsonify({'success': True, 'data': quiz})
    except Exception:
        return jsonify({'success': False, 'message': 'Invalid ID', 'error_code': 'INVALID_ID'}), 400


@quiz_bp.route('', methods=['POST'])
@jwt_required()
@role_required('teacher', 'admin')
def create_quiz():
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    title = data.get('title', '').strip()
    if not title:
        return jsonify({'success': False, 'message': 'Quiz title is required', 'error_code': 'MISSING_FIELDS'}), 400

    question_ids = data.get('question_ids') or data.get('selected_questions') or []

    # Auto-resolve chapter, grade, and subject
    grade = str(data.get('grade') or '7')
    subject_id = str(data.get('subject_id') or '')
    category_id = str(data.get('category_id') or '')
    chapter_id = str(data.get('chapter_id') or '')

    if not chapter_id and question_ids:
        sample_q = db.questions.find_one({'_id': ObjectId(question_ids[0])}) if ObjectId.is_valid(question_ids[0]) else None
        if sample_q and sample_q.get('chapter_id'):
            chapter_id = str(sample_q['chapter_id'])
            if not subject_id and sample_q.get('subject_id'):
                subject_id = str(sample_q['subject_id'])
    
    if not chapter_id:
        f_chap = db.chapters.find_one({'grade': grade, 'subject_id': subject_id}) or db.chapters.find_one({'grade': grade})
        if f_chap:
            chapter_id = str(f_chap['_id'])
            if not subject_id:
                subject_id = str(f_chap.get('subject_id', ''))

    # If chapter was passed, sync subject and grade if missing
    if chapter_id and ObjectId.is_valid(chapter_id):
        ch_doc = db.chapters.find_one({'_id': ObjectId(chapter_id)})
        if ch_doc:
            if not subject_id and ch_doc.get('subject_id'):
                subject_id = str(ch_doc['subject_id'])
            if not grade and ch_doc.get('grade'):
                grade = str(ch_doc['grade'])

    duration_minutes = int(data.get('duration_minutes', 15))
    total_marks = int(data.get('total_marks', 0))

    # Auto-resolve sequence number under this chapter (Test 1, Test 2, etc.)
    existing_ch_count = 0
    if chapter_id:
        existing_ch_count = db.quizzes.count_documents({
            '$or': [{'chapter_id': chapter_id}, {'chapter_id': ObjectId(chapter_id) if ObjectId.is_valid(chapter_id) else None}]
        })
    user_seq = int(data.get('sequence_number', 0))
    sequence_number = user_seq if user_seq > 0 else (existing_ch_count + 1)

    quiz = {
        'title': title,
        'description': data.get('description', '').strip(),
        'class_id': str(data.get('class_id', '')),
        'grade': grade,
        'subject_id': subject_id,
        'category_id': category_id,
        'chapter_id': chapter_id,
        'difficulty': data.get('difficulty', 'medium'),
        'duration_minutes': duration_minutes,
        'total_marks': total_marks or (len(question_ids) if question_ids else 10),
        'passing_percentage': int(data.get('passing_percentage', 70)),
        'sequence_number': sequence_number,
        'is_final_exam': bool(data.get('is_final_exam', False)),
        'allow_retry': bool(data.get('allow_retry', True)),
        'max_attempts': int(data.get('max_attempts', 3)),
        'retry_delay_hours': int(data.get('retry_delay_hours', 0)),
        'require_teacher_unlock': bool(data.get('require_teacher_unlock', False)),
        'randomize_questions': bool(data.get('randomize_questions', False)),
        'show_result': bool(data.get('show_result', True)),
        'security_settings': data.get('security_settings', {
            'require_fullscreen': True,
            'tab_switch_detection': True,
            'window_focus_detection': True,
            'refresh_protection': True,
            'copy_protection': True,
            'paste_protection': True,
            'right_click_disabled': True,
            'max_violations': 3,
            'violation_action': 'auto_submit'
        }),
        'mode': data.get('mode', 'both'),
        'status': data.get('status', 'published'),
        'created_by': user_id,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }

    result = db.quizzes.insert_one(quiz)
    new_quiz_id = str(result.inserted_id)
    quiz['_id'] = new_quiz_id

    # If questions were selected from Question Bank, link/duplicate them to this quiz!
    calc_marks = 0
    if question_ids:
        for q_id in question_ids:
            if ObjectId.is_valid(str(q_id)):
                src_q = db.questions.find_one({'_id': ObjectId(q_id)})
                if src_q:
                    q_copy = dict(src_q)
                    del q_copy['_id']
                    q_copy['quiz_id'] = new_quiz_id
                    q_copy['created_by'] = user_id
                    q_copy['created_at'] = datetime.utcnow()
                    q_copy['updated_at'] = datetime.utcnow()
                    db.questions.insert_one(q_copy)
                    calc_marks += int(src_q.get('marks', 1))

        if total_marks == 0 and calc_marks > 0:
            db.quizzes.update_one({'_id': ObjectId(new_quiz_id)}, {'$set': {'total_marks': calc_marks}})
            quiz['total_marks'] = calc_marks

    quiz['question_count'] = len(question_ids)
    return jsonify({'success': True, 'message': 'Quiz created successfully', 'data': quiz}), 201


@quiz_bp.route('/<id>/toggle-status', methods=['POST'])
@jwt_required()
@role_required('teacher', 'admin')
def toggle_quiz_status(id):
    db = current_app.config['db']
    try:
        quiz = db.quizzes.find_one({'_id': ObjectId(id)})
        if not quiz:
            return jsonify({'success': False, 'message': 'Quiz not found'}), 404
        
        current_status = quiz.get('status', 'draft')
        new_status = 'draft' if current_status == 'published' else 'published'

        db.quizzes.update_one(
            {'_id': ObjectId(id)},
            {'$set': {'status': new_status, 'updated_at': datetime.utcnow()}}
        )
        msg = 'Quiz activated (Published)' if new_status == 'published' else 'Quiz deactivated (Draft)'
        return jsonify({'success': True, 'message': msg, 'status': new_status})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@quiz_bp.route('/<id>', methods=['PUT'])
@jwt_required()
@role_required('teacher', 'admin')
def update_quiz(id):
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    try:
        update = {'updated_at': datetime.utcnow()}
        allowed = ['title', 'description', 'difficulty', 'duration_minutes', 'total_marks',
                   'passing_percentage', 'sequence_number', 'is_final_exam', 'allow_retry',
                   'max_attempts', 'retry_delay_hours', 'require_teacher_unlock',
                   'randomize_questions', 'show_result', 'security_settings', 'mode', 'status',
                   'class_id', 'grade', 'subject_id', 'category_id', 'chapter_id']
        for f in allowed:
            if f in data:
                update[f] = data[f]

        result = db.quizzes.update_one({'_id': ObjectId(id)}, {'$set': update})
        if result.matched_count == 0:
            return jsonify({'success': False, 'message': 'Quiz not found'}), 404
        return jsonify({'success': True, 'message': 'Quiz updated'})
    except Exception:
        return jsonify({'success': False, 'message': 'Error', 'error_code': 'UPDATE_ERROR'}), 500



@quiz_bp.route('/<id>', methods=['DELETE'])
@jwt_required()
@role_required('teacher', 'admin')
def delete_quiz(id):
    db = current_app.config['db']
    try:
        result = db.quizzes.delete_one({'_id': ObjectId(id)})
        if result.deleted_count == 0:
            return jsonify({'success': False, 'message': 'Quiz not found'}), 404
        # Also delete questions
        db.questions.delete_many({'quiz_id': id})
        return jsonify({'success': True, 'message': 'Quiz deleted'})
    except Exception:
        return jsonify({'success': False, 'message': 'Error', 'error_code': 'DELETE_ERROR'}), 500


@quiz_bp.route('/<id>/publish', methods=['POST'])
@jwt_required()
@role_required('teacher', 'admin')
def publish_quiz(id):
    db = current_app.config['db']
    try:
        q_count = db.questions.count_documents({
            '$or': [
                {'quiz_id': str(id)},
                {'quiz_id': ObjectId(id) if ObjectId.is_valid(str(id)) else None}
            ]
        })

        result = db.quizzes.update_one(
            {'_id': ObjectId(id)},
            {'$set': {'status': 'published', 'updated_at': datetime.utcnow()}}
        )
        if result.matched_count == 0:
            return jsonify({'success': False, 'message': 'Quiz not found'}), 404
        return jsonify({'success': True, 'message': 'Quiz published'})
    except Exception:
        return jsonify({'success': False, 'message': 'Error'}), 500


@quiz_bp.route('/<id>/unpublish', methods=['POST'])
@jwt_required()
@role_required('teacher', 'admin')
def unpublish_quiz(id):
    db = current_app.config['db']
    try:
        result = db.quizzes.update_one(
            {'_id': ObjectId(id)},
            {'$set': {'status': 'draft', 'updated_at': datetime.utcnow()}}
        )
        if result.matched_count == 0:
            return jsonify({'success': False, 'message': 'Quiz not found'}), 404
        return jsonify({'success': True, 'message': 'Quiz unpublished'})
    except Exception:
        return jsonify({'success': False, 'message': 'Error'}), 500


@quiz_bp.route('/<id>/duplicate', methods=['POST'])
@jwt_required()
@role_required('teacher', 'admin')
def duplicate_quiz(id):
    db = current_app.config['db']
    user_id = get_jwt_identity()
    try:
        quiz = db.quizzes.find_one({'_id': ObjectId(id)})
        if not quiz:
            return jsonify({'success': False, 'message': 'Quiz not found'}), 404

        del quiz['_id']
        quiz['title'] = f"{quiz['title']} (Copy)"
        quiz['status'] = 'draft'
        quiz['created_by'] = user_id
        quiz['created_at'] = datetime.utcnow()
        quiz['updated_at'] = datetime.utcnow()

        result = db.quizzes.insert_one(quiz)
        new_quiz_id = str(result.inserted_id)

        # Duplicate questions
        questions = list(db.questions.find({'quiz_id': id}))
        for q in questions:
            del q['_id']
            q['quiz_id'] = new_quiz_id
            q['created_at'] = datetime.utcnow()
            db.questions.insert_one(q)

        quiz['_id'] = new_quiz_id
        return jsonify({'success': True, 'message': 'Quiz duplicated', 'data': quiz}), 201
    except Exception:
        return jsonify({'success': False, 'message': 'Error'}), 500


# ─── QUIZ ATTEMPTS ────────────────────────────────────────────────
@quiz_bp.route('/attempts/start', methods=['POST'])
@jwt_required()
@student_required
def start_quiz_attempt():
    """Start a quiz attempt with full backend validation."""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    quiz_id = data.get('quiz_id', '')

    if not quiz_id:
        return jsonify({'success': False, 'message': 'quiz_id required', 'error_code': 'MISSING_FIELDS'}), 400

    # Get student
    student = db.users.find_one({'_id': ObjectId(user_id), 'role': 'student'})
    if not student:
        return jsonify({'success': False, 'message': 'Student not found', 'error_code': 'NOT_FOUND'}), 404
    if student.get('status') != 'active':
        return jsonify({'success': False, 'message': 'Account suspended', 'error_code': 'ACCOUNT_SUSPENDED'}), 403

    # Get quiz
    try:
        quiz = db.quizzes.find_one({'_id': ObjectId(quiz_id)})
    except Exception:
        return jsonify({'success': False, 'message': 'Invalid quiz ID', 'error_code': 'INVALID_ID'}), 400

    if not quiz:
        return jsonify({'success': False, 'message': 'Quiz not found', 'error_code': 'NOT_FOUND'}), 404
    if quiz.get('status') != 'published':
        return jsonify({'success': False, 'message': 'Quiz not available', 'error_code': 'QUIZ_NOT_PUBLISHED'}), 400

    # Unlimited attempts allowed (no attempt limit)
    attempt_count = db.quiz_attempts.count_documents({'student_id': user_id, 'quiz_id': quiz_id})

    # Check existing in-progress attempt
    now = datetime.utcnow()
    active = db.quiz_attempts.find_one({
        'student_id': user_id, 'quiz_id': quiz_id, 'status': 'in_progress'
    })
    if active:
        # Check if the active attempt has expired or has less than 15s remaining
        is_expired = False
        if active.get('expires_at'):
            if now >= active['expires_at'] or (active['expires_at'] - now).total_seconds() < 15:
                is_expired = True

        if is_expired:
            db.quiz_attempts.update_one(
                {'_id': active['_id']},
                {'$set': {'status': 'expired', 'submitted_at': now}}
            )
            active = None
        else:
            active['_id'] = str(active['_id'])
            if active.get('started_at'):
                active['started_at'] = active['started_at'].isoformat()
            if active.get('expires_at'):
                active['expires_at'] = active['expires_at'].isoformat()

            q_filter = {'$or': [{'quiz_id': quiz_id}, {'quiz_id': ObjectId(quiz_id) if ObjectId.is_valid(quiz_id) else None}]}
            questions = list(db.questions.find(q_filter, {'correct_answer': 0, 'explanation': 0}))
            for q in questions:
                q['_id'] = str(q['_id'])
            active['questions'] = questions
            active['security_settings'] = quiz.get('security_settings', {})
            active['duration_minutes'] = quiz.get('duration_minutes', 15)
            active['quiz_title'] = quiz.get('title', '')
            active['total_marks'] = quiz.get('total_marks', len(questions))
            return jsonify({'success': True, 'message': 'Resuming existing attempt', 'data': active})

    # Check quiz locking - sequential progression enforcement
    seq = quiz.get('sequence_number', 1)
    chapter_id = str(quiz.get('chapter_id') or '')

    # 1. Within the same chapter: if sequence_number > 1, previous test in this chapter must be passed
    if seq > 1:
        prev_quiz = db.quizzes.find_one({
            '$or': [{'chapter_id': chapter_id}, {'chapter_id': ObjectId(chapter_id) if ObjectId.is_valid(chapter_id) else None}],
            'sequence_number': seq - 1,
            'status': 'published'
        })
        if prev_quiz:
            prev_passed = db.quiz_attempts.find_one({
                'student_id': user_id,
                'quiz_id': str(prev_quiz['_id']),
                'passed': True
            })
            if not prev_passed:
                return jsonify({
                    'success': False,
                    'message': f"Previous test ({prev_quiz.get('title', 'Test ' + str(seq-1))}) must be passed first!",
                    'error_code': 'QUIZ_LOCKED'
                }), 403

    # 2. Between chapters: if it's the first test of Chapter K (K > 1), previous chapter's tests must be passed
    if seq <= 1 and chapter_id:
        current_chap = db.chapters.find_one({'_id': ObjectId(chapter_id)}) if ObjectId.is_valid(chapter_id) else db.chapters.find_one({'_id': chapter_id})
        if current_chap:
            ch_order = current_chap.get('order', 1)
            ch_subject = str(current_chap.get('subject_id') or '')
            ch_grade = str(current_chap.get('grade') or '')
            if ch_order > 1:
                prev_chap = db.chapters.find_one({
                    'subject_id': ch_subject,
                    'grade': ch_grade,
                    'order': ch_order - 1
                })
                if prev_chap:
                    prev_c_id = str(prev_chap['_id'])
                    prev_c_quizzes = list(db.quizzes.find({
                        '$or': [{'chapter_id': prev_c_id}, {'chapter_id': ObjectId(prev_c_id) if ObjectId.is_valid(prev_c_id) else None}],
                        'status': 'published'
                    }))
                    for pq in prev_c_quizzes:
                        pq_passed = db.quiz_attempts.find_one({
                            'student_id': user_id,
                            'quiz_id': str(pq['_id']),
                            'passed': True
                        })
                        if not pq_passed:
                            return jsonify({
                                'success': False,
                                'message': f"You must pass Chapter {ch_order - 1} ({prev_chap.get('name', '')}) tests first!",
                                'error_code': 'CHAPTER_LOCKED'
                            }), 403

    # Get questions (support both string and ObjectId quiz_id)
    q_filter = {'$or': [{'quiz_id': quiz_id}, {'quiz_id': ObjectId(quiz_id) if ObjectId.is_valid(quiz_id) else None}]}
    questions = list(db.questions.find(q_filter, {'correct_answer': 0, 'explanation': 0}))
    for q in questions:
        q['_id'] = str(q['_id'])

    # Create attempt
    now = datetime.utcnow()
    duration = quiz.get('duration_minutes', 10)
    attempt = {
        'student_id': user_id,
        'quiz_id': quiz_id,
        'quiz_title': quiz.get('title', ''),
        'teacher_id': quiz.get('created_by', ''),
        'grade': student.get('grade', ''),
        'subject_id': quiz.get('subject_id', ''),
        'category_id': quiz.get('category_id', ''),
        'chapter_id': quiz.get('chapter_id', ''),
        'mode': quiz.get('mode', 'competitive'),
        'team_id': str(student.get('team_id', '')) if student.get('team_id') else None,
        'started_at': now,
        'expires_at': now + timedelta(minutes=duration),
        'submitted_at': None,
        'status': 'in_progress',
        'answers': {},
        'score': 0,
        'total_marks': quiz.get('total_marks', 10),
        'score_percentage': 0,
        'accuracy': 0,
        'points_earned': 0,
        'passed': False,
        'attempt_number': attempt_count + 1,
        'security_violations': 0,
        'time_taken_seconds': 0,
        'created_at': now
    }

    result = db.quiz_attempts.insert_one(attempt)
    attempt['_id'] = str(result.inserted_id)
    attempt['started_at'] = now.isoformat()
    attempt['expires_at'] = (now + timedelta(minutes=duration)).isoformat()
    attempt['questions'] = questions

    return jsonify({'success': True, 'message': 'Quiz started', 'data': attempt}), 201


@quiz_bp.route('/attempts/submit', methods=['POST'])
@jwt_required()
@student_required
def submit_quiz_attempt():
    """Submit a quiz attempt."""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    attempt_id = data.get('attempt_id', '')
    raw_answers = data.get('answers', {})

    if not attempt_id:
        return jsonify({'success': False, 'message': 'attempt_id required'}), 400

    try:
        attempt = db.quiz_attempts.find_one({'_id': ObjectId(attempt_id), 'student_id': user_id})
    except Exception:
        return jsonify({'success': False, 'message': 'Invalid attempt ID'}), 400

    if not attempt:
        return jsonify({'success': False, 'message': 'Attempt not found'}), 404
    if attempt.get('status') == 'submitted':
        return jsonify({'success': False, 'message': 'Already submitted', 'error_code': 'ALREADY_SUBMITTED'}), 400

    # Normalize answers map and merge with existing autosaved answers
    answers = {}
    if isinstance(attempt.get('answers'), dict):
        answers.update(attempt.get('answers', {}))

    if isinstance(raw_answers, dict):
        answers.update(raw_answers)
    elif isinstance(raw_answers, list):
        for item in raw_answers:
            if isinstance(item, dict):
                qid = str(item.get('question_id') or item.get('q_id') or '')
                ans = item.get('selected_option') or item.get('answer') or ''
                if qid:
                    answers[qid] = ans

    now = datetime.utcnow()
    quiz_id = attempt['quiz_id']

    # Get quiz and questions for grading (support string and ObjectId quiz_id)
    quiz = db.quizzes.find_one({'_id': ObjectId(quiz_id)})
    q_filter = {'$or': [{'quiz_id': quiz_id}, {'quiz_id': ObjectId(quiz_id) if ObjectId.is_valid(quiz_id) else None}]}
    questions = list(db.questions.find(q_filter))

    # Grade the quiz
    correct = 0
    total_questions = len(questions)
    total_marks = quiz.get('total_marks', total_questions) if quiz else total_questions
    marks_per_question = total_marks / total_questions if total_questions > 0 else 0

    for q in questions:
        q_id = str(q['_id'])
        student_answer = answers.get(q_id, '')
        if student_answer and str(student_answer).strip().lower() == str(q.get('correct_answer', '')).strip().lower():
            correct += 1

    score = round(correct * marks_per_question, 2)
    score_percentage = round((correct / total_questions * 100), 1) if total_questions > 0 else 0
    accuracy = score_percentage
    passing = quiz.get('passing_percentage', 70) if quiz else 70
    passed = score_percentage >= passing
    points_earned = int(score_percentage * 10) if passed else 0

    time_taken = int((now - attempt['started_at']).total_seconds()) if attempt.get('started_at') else 0

    # Update attempt
    db.quiz_attempts.update_one(
        {'_id': ObjectId(attempt_id)},
        {'$set': {
            'answers': answers,
            'submitted_at': now,
            'status': 'submitted',
            'score': score,
            'score_percentage': score_percentage,
            'accuracy': accuracy,
            'points_earned': points_earned,
            'passed': passed,
            'time_taken_seconds': time_taken,
            'correct_answers': correct,
            'wrong_answers': total_questions - correct,
            'total_questions': total_questions
        }}
    )

    # Update student points
    if passed:
        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$inc': {'points': points_earned}}
        )

    # Store research data
    student = db.users.find_one({'_id': ObjectId(user_id)})
    db.research_data.insert_one({
        'student_id': user_id,
        'grade': student.get('grade', '') if student else '',
        'subject_id': attempt.get('subject_id', ''),
        'category_id': attempt.get('category_id', ''),
        'chapter_id': attempt.get('chapter_id', ''),
        'quiz_id': quiz_id,
        'mode': attempt.get('mode', 'competitive'),
        'team_id': attempt.get('team_id'),
        'score': score,
        'total_marks': total_marks,
        'score_percentage': score_percentage,
        'accuracy': accuracy,
        'points': points_earned,
        'time_taken_seconds': time_taken,
        'attempt_number': attempt.get('attempt_number', 1),
        'passed': passed,
        'security_violations': attempt.get('security_violations', 0),
        'started_at': attempt.get('started_at'),
        'submitted_at': now,
        'created_at': now
    })

    # Create notification
    notification_msg = f"Quiz '{attempt.get('quiz_title', 'Quiz')}' - {'PASSED ✅' if passed else 'FAILED ❌'} - Score: {score_percentage}%"
    db.notifications.insert_one({
        'user_id': user_id,
        'type': 'quiz_passed' if passed else 'quiz_failed',
        'message': notification_msg,
        'read': False,
        'created_at': now
    })

    result_data = {
        'attempt_id': attempt_id,
        'quiz_id': quiz_id,
        'quiz_title': attempt.get('quiz_title', ''),
        'score': score,
        'total_marks': total_marks,
        'score_percentage': score_percentage,
        'correct_answers': correct,
        'wrong_answers': total_questions - correct,
        'accuracy': accuracy,
        'points_earned': points_earned,
        'passed': passed,
        'passing_percentage': passing,
        'time_taken_seconds': time_taken
    }

    # If passed, return full solutions & explanations.
    # Always return question breakdown review.
    # If passed: return full solutions, correct answers & explanations.
    # If failed: show student answers and correctness, but hide correct answer key and explanations so student must try again.
    solutions = []
    for q in questions:
        qid = str(q['_id'])
        stu_ans = str(answers.get(qid, '')).strip().upper()
        correct_ans = str(q.get('correct_answer', '')).strip().upper()
        is_correct = bool(stu_ans and stu_ans == correct_ans)
        sol_item = {
            'question_id': qid,
            'question': q.get('question') or q.get('question_text', ''),
            'option_a': q.get('option_a', ''),
            'option_b': q.get('option_b', ''),
            'option_c': q.get('option_c', ''),
            'option_d': q.get('option_d', ''),
            'student_answer': stu_ans,
            'is_correct': is_correct,
            'correct_answer': correct_ans if passed else None,
            'explanation': q.get('explanation', '') if passed else None
        }
        solutions.append(sol_item)
    result_data['question_solutions'] = solutions

    # Find next quiz for "Next" button (only when passed)
    if passed:
        seq = quiz.get('sequence_number', 1) if quiz else 1
        chap_id = str(quiz.get('chapter_id') or '') if quiz else ''
        if chap_id:
            next_q = db.quizzes.find_one({
                '$or': [{'chapter_id': chap_id}, {'chapter_id': ObjectId(chap_id) if ObjectId.is_valid(chap_id) else None}],
                'sequence_number': seq + 1,
                'status': 'published'
            })
            if next_q:
                result_data['next_quiz_id'] = str(next_q['_id'])
                result_data['next_quiz_title'] = next_q.get('title', 'Next Assessment')

    return jsonify({'success': True, 'message': 'Quiz submitted', 'data': result_data})


@quiz_bp.route('/attempts/<id>', methods=['GET'])
@jwt_required()
def get_attempt(id):
    db = current_app.config['db']
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', '')

    if not ObjectId.is_valid(id):
        return jsonify({'success': False, 'message': 'Invalid Attempt ID'}), 400

    try:
        query = {'_id': ObjectId(id)}
        if role == 'student':
            query['student_id'] = user_id

        attempt = db.quiz_attempts.find_one(query)
        if not attempt:
            return jsonify({'success': False, 'message': 'Attempt not found'}), 404

        attempt['_id'] = str(attempt['_id'])
        for key in ['started_at', 'submitted_at', 'expires_at', 'created_at', 'reviewed_at']:
            if attempt.get(key):
                attempt[key] = attempt[key].isoformat()

        # Include questions with review details if submitted or role is teacher/admin
        if attempt.get('status') in ['submitted', 'flagged'] or role in ['teacher', 'admin']:
            qid_str = str(attempt.get('quiz_id') or '')
            q_filter = {'$or': [{'quiz_id': qid_str}, {'quiz_id': ObjectId(qid_str) if ObjectId.is_valid(qid_str) else None}]}
            questions = list(db.questions.find(q_filter))
            stu_answers = attempt.get('answers') or {}
            is_passed = bool(attempt.get('passed', False))

            for q in questions:
                q['_id'] = str(q['_id'])
                q_id = q['_id']
                stu_ans = str(stu_answers.get(q_id, '')).strip().upper()
                correct_ans = str(q.get('correct_answer', '')).strip().upper()
                q['student_answer'] = stu_ans
                q['is_correct'] = bool(stu_ans and stu_ans == correct_ans)
                if role == 'student' and not is_passed:
                    q.pop('correct_answer', None)
                    q.pop('explanation', None)
            attempt['questions'] = questions

        # Include violation history if teacher/admin
        if role in ['teacher', 'admin']:
            violations = list(db.quiz_security_events.find({'attempt_id': id}).sort('timestamp', 1))
            for v in violations:
                v['_id'] = str(v['_id'])
                if v.get('timestamp'):
                    v['timestamp'] = v['timestamp'].isoformat()
            attempt['violations_log'] = violations

        return jsonify({'success': True, 'data': attempt})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error fetching attempt: {str(e)}'}), 500


@quiz_bp.route('/attempts/heartbeat', methods=['POST'])
@jwt_required()
@student_required
def quiz_heartbeat():
    """5-second heartbeat endpoint for live monitoring, timer validation, and auto-submission."""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    attempt_id = data.get('attempt_id', '')

    if not attempt_id or not ObjectId.is_valid(attempt_id):
        return jsonify({'success': False, 'message': 'Valid attempt_id required'}), 400

    try:
        attempt = db.quiz_attempts.find_one({'_id': ObjectId(attempt_id), 'student_id': user_id})
        if not attempt:
            return jsonify({'success': False, 'message': 'Attempt not found'}), 404

        now = datetime.utcnow()
        if attempt.get('status') == 'submitted':
            return jsonify({'success': True, 'status': 'submitted', 'time_remaining_seconds': 0, 'message': 'Quiz already submitted'})

        expires_at = attempt.get('expires_at')
        time_remaining = 0
        if expires_at:
            time_remaining = int((expires_at - now).total_seconds())

        # Check if quiz has expired past grace window (15s)
        if time_remaining <= -15:
            # Auto-submit attempt
            return auto_submit_internal(attempt, db, reason='timer_expired')

        # Update last heartbeat
        db.quiz_attempts.update_one(
            {'_id': ObjectId(attempt_id)},
            {'$set': {'last_heartbeat_at': now}}
        )

        return jsonify({
            'success': True,
            'status': attempt.get('status', 'in_progress'),
            'time_remaining_seconds': max(0, time_remaining)
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Heartbeat error: {str(e)}'}), 500


@quiz_bp.route('/attempts/save-answer', methods=['POST'])
@jwt_required()
@student_required
def save_answer():
    """Incremental atomic auto-save for question responses."""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    attempt_id = data.get('attempt_id', '')
    question_id = str(data.get('question_id', '')).strip()
    answer = str(data.get('answer', '')).strip()

    if not attempt_id or not question_id:
        return jsonify({'success': False, 'message': 'attempt_id and question_id required'}), 400

    try:
        attempt = db.quiz_attempts.find_one({'_id': ObjectId(attempt_id), 'student_id': user_id})
        if not attempt:
            return jsonify({'success': False, 'message': 'Attempt not found'}), 404

        if attempt.get('status') == 'submitted':
            return jsonify({'success': False, 'message': 'Cannot modify submitted attempt'}), 400

        # Update answer atomically
        db.quiz_attempts.update_one(
            {'_id': ObjectId(attempt_id)},
            {'$set': {f'answers.{question_id}': answer, 'updated_at': datetime.utcnow()}}
        )

        return jsonify({'success': True, 'question_id': question_id, 'saved_answer': answer})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Save error: {str(e)}'}), 500


@quiz_bp.route('/attempts/log-violation', methods=['POST'])
@jwt_required()
@student_required
def report_security_event():
    """Report and record an anti-cheat security violation during quiz."""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    attempt_id = data.get('attempt_id', '')
    event_type = data.get('event_type', data.get('violation_type', ''))
    details = data.get('details', '')

    if not attempt_id or not event_type:
        return jsonify({'success': False, 'message': 'attempt_id and event_type required'}), 400

    try:
        attempt = db.quiz_attempts.find_one({'_id': ObjectId(attempt_id), 'student_id': user_id})
        if not attempt:
            return jsonify({'success': False, 'message': 'Attempt not found'}), 404

        if attempt.get('status') == 'submitted':
            return jsonify({'success': True, 'message': 'Attempt already completed'})

        violation_count = attempt.get('security_violations', 0) + 1

        # Get quiz security settings
        quiz = db.quizzes.find_one({'_id': ObjectId(attempt['quiz_id'])})
        security = quiz.get('security_settings', {}) if quiz else {}
        max_violations = security.get('max_violations', 3)
        violation_action = security.get('violation_action', 'auto_submit')

        action_taken = 'warning'
        if violation_count >= max_violations:
            action_taken = violation_action

        # Log security event in DB
        db.quiz_security_events.insert_one({
            'student_id': user_id,
            'quiz_id': attempt['quiz_id'],
            'attempt_id': attempt_id,
            'event_type': event_type,
            'details': details,
            'violation_number': violation_count,
            'action_taken': action_taken,
            'timestamp': datetime.utcnow()
        })

        # Update attempt violation count
        db.quiz_attempts.update_one(
            {'_id': ObjectId(attempt_id)},
            {'$set': {'security_violations': violation_count, 'flagged': True}}
        )

        # Trigger auto-submit if maximum violations reached
        if violation_count >= max_violations and action_taken == 'auto_submit':
            return auto_submit_internal(attempt, db, reason='max_violations_exceeded')

        return jsonify({
            'success': True,
            'data': {
                'violation_count': violation_count,
                'max_violations': max_violations,
                'action': action_taken,
                'message': f'Warning {violation_count}/{max_violations}: {event_type}'
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Violation reporting error: {str(e)}'}), 500


@quiz_bp.route('/attempts/<id>/review', methods=['POST'])
@jwt_required()
@role_required('teacher', 'admin')
def review_attempt(id):
    """Teacher / Admin review of flagged or submitted attempt."""
    db = current_app.config['db']
    reviewer_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    action = data.get('action', '')  # 'accept', 'invalidate', 'allow_retake'
    comment = data.get('comment', '')

    if action not in ['accept', 'invalidate', 'allow_retake']:
        return jsonify({'success': False, 'message': 'Action must be accept, invalidate, or allow_retake'}), 400

    try:
        attempt = db.quiz_attempts.find_one({'_id': ObjectId(id)})
        if not attempt:
            return jsonify({'success': False, 'message': 'Attempt not found'}), 404

        update = {
            'review_status': action,
            'reviewer_id': reviewer_id,
            'review_comment': comment,
            'reviewed_at': datetime.utcnow()
        }

        if action == 'allow_retake':
            update['status'] = 'retake_granted'
        elif action == 'invalidate':
            update['status'] = 'invalidated'
            update['points_earned'] = 0
            update['passed'] = False

        db.quiz_attempts.update_one({'_id': ObjectId(id)}, {'$set': update})
        return jsonify({'success': True, 'message': f'Attempt marked as {action}'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Review error: {str(e)}'}), 500


def auto_submit_internal(attempt, db, reason='timer_expired'):
    """Helper function to cleanly auto-submit an attempt and calculate score."""
    attempt_id = str(attempt['_id'])
    user_id = attempt['student_id']
    quiz_id = attempt['quiz_id']
    now = datetime.utcnow()

    quiz = db.quizzes.find_one({'_id': ObjectId(quiz_id)})
    questions = list(db.questions.find({'quiz_id': quiz_id}))
    answers = attempt.get('answers', {})

    correct = 0
    total_questions = len(questions)
    total_marks = quiz.get('total_marks', total_questions) if quiz else total_questions
    marks_per_question = total_marks / total_questions if total_questions > 0 else 0

    for q in questions:
        q_id = str(q['_id'])
        student_answer = answers.get(q_id, '')
        if student_answer and student_answer == q.get('correct_answer', ''):
            correct += 1

    score = round(correct * marks_per_question, 2)
    score_percentage = round((correct / total_questions * 100), 1) if total_questions > 0 else 0
    passing = quiz.get('passing_percentage', 70) if quiz else 70
    passed = score_percentage >= passing
    points_earned = int(score_percentage * 10) if passed else int(score_percentage * 5)
    time_taken = int((now - attempt['started_at']).total_seconds()) if attempt.get('started_at') else 0

    db.quiz_attempts.update_one(
        {'_id': ObjectId(attempt_id)},
        {'$set': {
            'submitted_at': now,
            'status': 'submitted',
            'auto_submitted': True,
            'auto_submit_reason': reason,
            'score': score,
            'score_percentage': score_percentage,
            'accuracy': score_percentage,
            'points_earned': points_earned,
            'passed': passed,
            'time_taken_seconds': time_taken,
            'correct_answers': correct,
            'wrong_answers': total_questions - correct,
            'total_questions': total_questions
        }}
    )

    if passed:
        db.users.update_one({'_id': ObjectId(user_id)}, {'$inc': {'points': points_earned}})

    return jsonify({
        'success': True,
        'status': 'submitted',
        'auto_submitted': True,
        'message': f'Quiz auto-submitted due to: {reason}',
        'data': {
            'attempt_id': attempt_id,
            'score': score,
            'total_marks': total_marks,
            'score_percentage': score_percentage,
            'passed': passed,
            'points_earned': points_earned
        }
    })

