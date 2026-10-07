"""Student routes - Phase 2 implementation."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from bson import ObjectId
from datetime import datetime
from middleware.role_middleware import student_required

student_bp = Blueprint('student', __name__)


@student_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@student_required
def student_dashboard():
    db = current_app.config['db']
    user_id = get_jwt_identity()
    try:
        user = db.users.find_one({'_id': ObjectId(user_id)}, {'password_hash': 0})
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        # Get stats (only for completed/submitted tests)
        grade_raw = str(user.get('grade', '7')).replace('Grade', '').strip()
        grade_match = [grade_raw, f'Grade {grade_raw}']
        if grade_raw.isdigit():
            grade_match.append(int(grade_raw))

        eval_filter = {'student_id': user_id, 'status': {'$in': ['submitted', 'completed']}}
        attempts = db.quiz_attempts.count_documents(eval_filter)
        passed = db.quiz_attempts.count_documents({**eval_filter, 'passed': True})

        # Get rank
        students_above = db.users.count_documents({
            'role': 'student',
            'grade': {'$in': grade_match},
            'points': {'$gt': user.get('points', 0)}
        })
        rank = students_above + 1

        # Average score
        pipeline = [
            {'$match': eval_filter},
            {'$group': {'_id': None, 'avg_score': {'$avg': '$score_percentage'}, 'avg_accuracy': {'$avg': '$accuracy'}}}
        ]
        avg_result = list(db.quiz_attempts.aggregate(pipeline))
        avg_score = round(avg_result[0]['avg_score'], 1) if avg_result else 0
        avg_accuracy = round(avg_result[0]['avg_accuracy'], 1) if avg_result else 0

        # Team info
        team = None
        if user.get('team_id'):
            team = db.teams.find_one({'_id': ObjectId(user['team_id'])})
            if team:
                team['_id'] = str(team['_id'])

        dashboard = {
            'student': {
                'id': str(user['_id']),
                'full_name': user.get('full_name', ''),
                'grade': user.get('grade', ''),
                'division': user.get('division', ''),
                'photo': user.get('photo', ''),
                'points': user.get('points', 0),
            },
            'stats': {
                'quizzes_attempted': attempts,
                'quizzes_passed': passed,
                'average_score': avg_score,
                'average_accuracy': avg_accuracy,
                'rank': rank,
                'points': user.get('points', 0),
            },
            'team': team
        }
        return jsonify({'success': True, 'data': dashboard})
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error fetching dashboard', 'error_code': 'FETCH_ERROR'}), 500


@student_bp.route('/learning-path', methods=['GET'])
@jwt_required()
@student_required
def get_learning_path():
    db = current_app.config['db']
    user_id = get_jwt_identity()
    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    grade = user.get('grade', '')
    subject_id = request.args.get('subject_id', '')

    query = {'grade': grade, 'status': 'published'}
    if subject_id:
        query['subject_id'] = subject_id

    paths = list(db.learning_paths.find(query))
    for p in paths:
        p['_id'] = str(p['_id'])
        # Get quiz progress for each quiz in path
        if p.get('quizzes'):
            for q in p['quizzes']:
                attempt = db.quiz_attempts.find_one(
                    {'student_id': user_id, 'quiz_id': q.get('quiz_id'), 'passed': True}
                )
                q['completed'] = bool(attempt)

    return jsonify({'success': True, 'data': paths})


@student_bp.route('/subjects', methods=['GET'])
@jwt_required()
@student_required
def get_student_subjects():
    db = current_app.config['db']
    user_id = get_jwt_identity()
    user = db.users.find_one({'_id': ObjectId(user_id)})
    grade = user.get('grade', '') if user else ''

    subjects = list(db.subjects.find({'status': 'active'}).sort('name', 1))
    for s in subjects:
        s['_id'] = str(s['_id'])
    return jsonify({'success': True, 'data': subjects})


@student_bp.route('/quizzes', methods=['GET'])
@jwt_required()
@student_required
def get_student_quizzes():
    try:
        db = current_app.config['db']
        user_id = get_jwt_identity()
        student = db.users.find_one({'_id': ObjectId(user_id)})
        if not student:
            return jsonify({'success': False, 'message': 'Student profile not found'}), 404

        grade_raw = str(student.get('grade', '7')).replace('Grade', '').strip()
        subject_filter = request.args.get('subject_id', '').strip()
        chapter_filter = request.args.get('chapter_id', '').strip()

        # Grade matching list
        grade_match = [grade_raw, f'Grade {grade_raw}']
        if grade_raw.isdigit():
            grade_match.append(int(grade_raw))

        # Query published quizzes for student's grade
        query = {
            'status': 'published',
            'grade': {'$in': grade_match}
        }
        if chapter_filter:
            query['chapter_id'] = chapter_filter
        if subject_filter and subject_filter != 'all':
            query['subject_id'] = subject_filter

        # Fetch subjects, categories, and chapters maps
        subjects_map = {str(s['_id']): s for s in db.subjects.find()}
        categories_map = {str(c['_id']): c for c in db.categories.find()}
        
        # Load all chapters for this grade
        ch_query = {'grade': {'$in': grade_match}}
        grade_chapters = list(db.chapters.find(ch_query).sort([('subject_id', 1), ('order', 1)]))
        chapters_map = {str(ch['_id']): ch for ch in grade_chapters}

        # Also get any chapters referenced in quizzes that might be outside chapters_map
        all_quizzes_raw = list(db.quizzes.find(query).sort([('sequence_number', 1), ('created_at', 1)]))
        for q in all_quizzes_raw:
            cid = str(q.get('chapter_id') or '')
            if cid and cid not in chapters_map:
                ch_doc = db.chapters.find_one({'_id': ObjectId(cid)}) if ObjectId.is_valid(cid) else None
                if ch_doc:
                    chapters_map[cid] = ch_doc

        # Fetch all passed attempts for this student once
        passed_attempts_cursor = db.quiz_attempts.find({'student_id': user_id, 'passed': True})
        passed_quiz_ids = {str(a.get('quiz_id')) for a in passed_attempts_cursor}

        # Fetch latest attempt and attempt counts per quiz
        attempt_stats = {}
        all_attempts = list(db.quiz_attempts.find({'student_id': user_id}).sort('submitted_at', -1))
        for att in all_attempts:
            qid = str(att.get('quiz_id'))
            if qid not in attempt_stats:
                attempt_stats[qid] = {
                    'count': 0,
                    'highest_score': 0,
                    'passed': False,
                    'points_earned': 0
                }
            attempt_stats[qid]['count'] += 1
            if att.get('passed'):
                attempt_stats[qid]['passed'] = True
            if (att.get('score_percentage') or 0) > attempt_stats[qid]['highest_score']:
                attempt_stats[qid]['highest_score'] = att.get('score_percentage', 0)
                attempt_stats[qid]['points_earned'] = att.get('points_earned', 0)

        # Organize by Subject -> Category -> Chapter -> Tests to evaluate locks sequentially
        # Group grade chapters by subject
        chapters_by_subject = {}
        for ch in grade_chapters:
            sub_id = str(ch.get('subject_id') or '')
            if sub_id not in chapters_by_subject:
                chapters_by_subject[sub_id] = []
            chapters_by_subject[sub_id].append(ch)

        # Group quizzes by chapter_id
        quizzes_by_chapter = {}
        for q in all_quizzes_raw:
            cid = str(q.get('chapter_id') or '')
            if cid not in quizzes_by_chapter:
                quizzes_by_chapter[cid] = []
            quizzes_by_chapter[cid].append(q)

        enriched_quizzes = []
        hierarchy_data = []

        # Process each subject
        subject_ids_to_process = list(subjects_map.keys())
        if subject_filter and subject_filter != 'all':
            subject_ids_to_process = [s for s in subject_ids_to_process if s == subject_filter]

        for sub_id in subject_ids_to_process:
            sub_doc = subjects_map.get(sub_id) or {}
            sub_name = sub_doc.get('name', 'General Science')
            sub_code = sub_doc.get('code', 'STEM')

            sub_chapters = chapters_by_subject.get(sub_id, [])
            sub_chapters.sort(key=lambda x: int(x.get('order', 1)))

            # Track sequential unlock across chapters within this subject
            # First chapter (order 1) is always unlocked
            prev_chapter_all_passed = True

            cat_groups = {}

            for ch in sub_chapters:
                ch_id = str(ch['_id'])
                ch_name = ch.get('name', 'Unit Chapter')
                ch_order = int(ch.get('order', 1))
                ch_cat_id = str(ch.get('category_id') or '')
                cat_doc = categories_map.get(ch_cat_id) or {}
                cat_name = cat_doc.get('name', 'Core Curriculum')

                ch_quizzes = quizzes_by_chapter.get(ch_id, [])
                ch_quizzes.sort(key=lambda x: int(x.get('sequence_number', 1)))

                # Determine if chapter itself is unlocked
                is_chapter_locked = False
                chapter_lock_reason = None
                if ch_order > 1 and not prev_chapter_all_passed:
                    is_chapter_locked = True
                    chapter_lock_reason = f"Complete all tests in Chapter {ch_order - 1} to unlock this chapter"

                # Sequential evaluation for tests inside this chapter
                # Test 1 of an unlocked chapter is ALWAYS UNLOCKED!
                prev_test_passed = True
                chapter_all_quizzes_passed = True if ch_quizzes else False

                chapter_quiz_items = []

                for q in ch_quizzes:
                    qid = str(q['_id'])
                    seq = int(q.get('sequence_number', 1))
                    q_passed = qid in passed_quiz_ids
                    stats = attempt_stats.get(qid, {'count': 0, 'highest_score': None, 'passed': False, 'points_earned': 0})

                    # Calculate lock status
                    if is_chapter_locked:
                        is_locked = True
                        lock_reason = chapter_lock_reason
                    elif seq <= 1:
                        # Chapter 1 Test 1 (or any chapter's Test 1 once chapter is unlocked) is UNLOCKED
                        is_locked = False
                        lock_reason = None
                    else:
                        # Test 2, 3, etc. require previous test in this chapter to be passed
                        if prev_test_passed:
                            is_locked = False
                            lock_reason = None
                        else:
                            is_locked = True
                            lock_reason = f"Pass Test {seq - 1} first with passing score to unlock"

                    # Count questions
                    q_count = db.questions.count_documents({
                        '$or': [{'quiz_id': qid}, {'quiz_id': ObjectId(qid) if ObjectId.is_valid(qid) else None}]
                    })

                    enriched = {
                        '_id': qid,
                        'title': q.get('title', f"Assessment Test {seq}"),
                        'description': q.get('description', ''),
                        'grade': q.get('grade', grade_raw),
                        'subject_id': sub_id,
                        'subject_name': sub_name,
                        'subject_code': sub_code,
                        'category_id': ch_cat_id,
                        'category_name': cat_name,
                        'chapter_id': ch_id,
                        'chapter_name': ch_name,
                        'chapter_order': ch_order,
                        'sequence_number': seq,
                        'test_label': f"Test {seq}",
                        'duration_minutes': q.get('duration_minutes', 15),
                        'total_marks': q.get('total_marks', 10),
                        'passing_percentage': q.get('passing_percentage', 70),
                        'mode': q.get('mode', 'both'),
                        'question_count': q_count,
                        'is_locked': is_locked,
                        'lock_reason': lock_reason,
                        'passed': q_passed,
                        'completed': q_passed,
                        'attempt_count': stats['count'],
                        'highest_score': stats['highest_score'],
                        'points_earned': stats['points_earned']
                    }

                    enriched_quizzes.append(enriched)
                    chapter_quiz_items.append(enriched)

                    # Update trackers for next test
                    if not q_passed:
                        chapter_all_quizzes_passed = False
                    prev_test_passed = q_passed

                if not chapter_all_quizzes_passed:
                    prev_chapter_all_passed = False

                # Add to cat_groups
                if ch_cat_id not in cat_groups:
                    cat_groups[ch_cat_id] = {
                        'category_id': ch_cat_id,
                        'category_name': cat_name,
                        'chapters': []
                    }

                cat_groups[ch_cat_id]['chapters'].append({
                    'chapter_id': ch_id,
                    'chapter_name': ch_name,
                    'order': ch_order,
                    'is_locked': is_chapter_locked,
                    'lock_reason': chapter_lock_reason,
                    'quizzes': chapter_quiz_items
                })

            if cat_groups:
                hierarchy_data.append({
                    'subject_id': sub_id,
                    'subject_name': sub_name,
                    'subject_code': sub_code,
                    'categories': list(cat_groups.values())
                })

        return jsonify({
            'success': True,
            'data': {
                'quizzes': enriched_quizzes,
                'hierarchy': hierarchy_data,
                'total': len(enriched_quizzes)
            }
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e), 'error_code': 'FETCH_ERROR'}), 500


@student_bp.route('/progress', methods=['GET'])
@jwt_required()
@student_required
def get_progress():
    db = current_app.config['db']
    user_id = get_jwt_identity()

    attempts = list(db.quiz_attempts.find({
        'student_id': user_id,
        'status': {'$in': ['submitted', 'completed']}
    }).sort('submitted_at', -1))
    
    subjects_map = {str(s['_id']): s.get('name', 'Science') for s in db.subjects.find()}
    chapters_map = {str(c['_id']): c.get('name', '') for c in db.chapters.find()}
    all_quizzes_map = {str(q['_id']): q for q in db.quizzes.find()}

    for a in attempts:
        a['_id'] = str(a['_id'])
        if a.get('started_at'):
            a['started_at'] = a['started_at'].isoformat()
        if a.get('submitted_at'):
            a['submitted_at'] = a['submitted_at'].isoformat()

        qid = str(a.get('quiz_id') or '')
        quiz_doc = all_quizzes_map.get(qid)
        if quiz_doc:
            if not a.get('quiz_title'):
                a['quiz_title'] = quiz_doc.get('title', 'STEM Assessment')
            if not a.get('subject_id') and quiz_doc.get('subject_id'):
                a['subject_id'] = str(quiz_doc.get('subject_id'))
            if not a.get('chapter_id') and quiz_doc.get('chapter_id'):
                a['chapter_id'] = str(quiz_doc.get('chapter_id'))
            if not a.get('grade') and quiz_doc.get('grade'):
                a['grade'] = str(quiz_doc.get('grade'))
            if not a.get('total_marks'):
                a['total_marks'] = quiz_doc.get('total_marks', 10)
            if not a.get('passing_percentage'):
                a['passing_percentage'] = quiz_doc.get('passing_percentage', 70)

        if a.get('subject_id'):
            a['subject_name'] = subjects_map.get(str(a['subject_id']), 'Science')
        else:
            a['subject_name'] = 'Science'

        if a.get('chapter_id'):
            a['chapter_name'] = chapters_map.get(str(a['chapter_id']), '')

    return jsonify({'success': True, 'data': attempts})


@student_bp.route('/team', methods=['GET'])
@jwt_required()
@student_required
def get_team():
    db = current_app.config['db']
    user_id = get_jwt_identity()
    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user or not user.get('team_id'):
        return jsonify({'success': True, 'data': None})

    team = db.teams.find_one({'_id': ObjectId(user['team_id'])})
    if team:
        team['_id'] = str(team['_id'])
        members = list(db.users.find(
            {'team_id': user['team_id'], 'role': 'student'},
            {'password_hash': 0, 'full_name': 1, 'photo': 1, 'points': 1, 'student_id': 1}
        ))
        for m in members:
            m['_id'] = str(m['_id'])
        team['members'] = members

    return jsonify({'success': True, 'data': team})


@student_bp.route('/profile', methods=['GET'])
@jwt_required()
@student_required
def get_student_profile():
    db = current_app.config['db']
    user_id = get_jwt_identity()
    user = db.users.find_one({'_id': ObjectId(user_id)}, {'password_hash': 0})
    if not user:
        return jsonify({'success': False, 'message': 'Not found'}), 404
    user['_id'] = str(user['_id'])
    return jsonify({'success': True, 'data': user})
