"""Teacher routes."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from middleware.role_middleware import teacher_required

teacher_bp = Blueprint('teacher', __name__)


def _get_teacher_assigned_classes(db, user_id, teacher_doc=None):
    """Resolve teacher assigned classes from user profile and classes collection."""
    if not teacher_doc:
        teacher_doc = db.users.find_one({'_id': ObjectId(user_id)}) or {}

    role = teacher_doc.get('role', '')

    # If admin is viewing the teacher portal, show all active classes in the system
    if role == 'admin':
        all_classes = list(db.classes.find({'status': 'active'}).sort([('grade', 1), ('division', 1)]))
        parsed = []
        for c in all_classes:
            parsed.append({
                'grade': str(c.get('grade', '')),
                'division': str(c.get('division', 'A')).upper(),
                'subject': c.get('subject', 'All STEM Subjects')
            })
        if parsed:
            return parsed

    assigned = teacher_doc.get('assigned_classes', [])
    parsed_classes = []

    for c in assigned:
        if isinstance(c, dict) and c.get('grade'):
            parsed_classes.append({
                'grade': str(c.get('grade', '')),
                'division': str(c.get('division', 'A')).upper(),
                'subject': c.get('subject', teacher_doc.get('subject', 'STEM'))
            })
        elif isinstance(c, str) and c.strip():
            # Format could be "7-A", "Grade 7-A", etc.
            parts = c.replace('Grade', '').strip().split('-')
            grade = parts[0].strip()
            division = parts[1].strip() if len(parts) > 1 else 'A'
            parsed_classes.append({
                'grade': grade,
                'division': division,
                'subject': teacher_doc.get('subject', 'STEM')
            })

    # Also check direct assigned_grade & assigned_division on teacher_doc
    if teacher_doc.get('assigned_grade') and teacher_doc.get('assigned_division'):
        g = str(teacher_doc.get('assigned_grade', '')).strip()
        d = str(teacher_doc.get('assigned_division', 'A')).strip().upper()
        if g and not any(p['grade'] == g and p['division'] == d for p in parsed_classes):
            parsed_classes.append({
                'grade': g,
                'division': d,
                'subject': teacher_doc.get('subject', 'STEM')
            })

    # Also check classes collection where teacher_id matches user_id, teacher_ids contains user_id, or teacher_name matches
    uid_str = str(user_id)
    t_name = teacher_doc.get('full_name') or teacher_doc.get('name') or ''
    class_filter = {
        '$or': [
            {'teacher_id': uid_str},
            {'teacher_ids': uid_str},
            {'teacher_ids': ObjectId(user_id) if ObjectId.is_valid(uid_str) else uid_str}
        ],
        'status': 'active'
    }
    if t_name:
        class_filter['$or'].append({'teacher_name': t_name})

    db_classes = list(db.classes.find(class_filter))
    for dbc in db_classes:
        g = str(dbc.get('grade', ''))
        d = str(dbc.get('division', 'A')).upper()
        if g and not any(p['grade'] == g and p['division'] == d for p in parsed_classes):
            parsed_classes.append({
                'grade': g,
                'division': d,
                'subject': dbc.get('subject', teacher_doc.get('subject', 'STEM'))
            })

    return parsed_classes


@teacher_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@teacher_required
def teacher_dashboard():
    db = current_app.config['db']
    user_id = get_jwt_identity()
    teacher = db.users.find_one({'_id': ObjectId(user_id)})
    if not teacher:
        return jsonify({'success': False, 'message': 'User profile not found'}), 404

    is_admin = teacher.get('role') == 'admin'
    assigned = _get_teacher_assigned_classes(db, user_id, teacher)

    # Count students in assigned classes
    student_query = {'role': 'student', 'status': 'active'}
    if assigned and not is_admin:
        student_query['$or'] = [{'grade': c['grade'], 'division': c['division']} for c in assigned]
        total_students = db.users.count_documents(student_query)
    else:
        # If admin or no classes assigned yet, count total active students
        total_students = db.users.count_documents({'role': 'student', 'status': 'active'})

    quiz_filter = {} if is_admin else {'created_by': user_id}
    active_quiz_filter = {'status': 'published'} if is_admin else {'created_by': user_id, 'status': 'published'}
    attempts_filter = {} if is_admin else {'teacher_id': user_id}

    stats = {
        'assigned_classes': len(assigned),
        'total_students': total_students,
        'active_quizzes': db.quizzes.count_documents(active_quiz_filter),
        'total_quizzes': db.quizzes.count_documents(quiz_filter),
        'total_attempts': db.quiz_attempts.count_documents(attempts_filter),
        'classes_list': assigned
    }

    return jsonify({'success': True, 'data': stats})


@teacher_bp.route('/classes', methods=['GET'])
@jwt_required()
@teacher_required
def get_teacher_classes():
    db = current_app.config['db']
    user_id = get_jwt_identity()
    teacher = db.users.find_one({'_id': ObjectId(user_id)})
    assigned = _get_teacher_assigned_classes(db, user_id, teacher)

    # Populate student count, team count, and class details for each assigned class
    enriched = []
    teacher_name = teacher.get('full_name') or teacher.get('name') or 'Assigned Faculty'
    for cls in assigned:
        g = str(cls['grade'])
        d = str(cls['division']).upper()
        cdoc = db.classes.find_one({'$or': [
            {'grade': g, 'division': d},
            {'grade': int(g) if g.isdigit() else g, 'division': d}
        ]})
        s_count = db.users.count_documents({
            'role': 'student',
            'status': 'active',
            'grade': g,
            'division': d
        })
        t_count = db.teams.count_documents({
            'grade': int(g) if g.isdigit() else g,
            'division': d,
            'status': 'active'
        })
        enriched.append({
            '_id': str(cdoc['_id']) if cdoc else f'{g}-{d}',
            'name': (cdoc.get('name') if cdoc else None) or f'Grade {g}-{d}',
            'grade': g,
            'division': d,
            'subject': cls.get('subject') or (cdoc.get('subject') if cdoc else '') or teacher.get('assigned_subject') or teacher.get('subject') or 'STEM',
            'mode': (cdoc.get('mode') if cdoc else None) or (cdoc.get('pedagogy_mode') if cdoc else None) or 'Collaborative',
            'mode_locked': cdoc.get('mode_locked', False) if cdoc else False,
            'teacher_name': teacher_name,
            'students_count': s_count,
            'teams_count': t_count
        })

    return jsonify({'success': True, 'data': enriched})


@teacher_bp.route('/students', methods=['GET'])
@jwt_required()
@teacher_required
def get_teacher_students():
    db = current_app.config['db']
    user_id = get_jwt_identity()
    teacher = db.users.find_one({'_id': ObjectId(user_id)})
    assigned = _get_teacher_assigned_classes(db, user_id, teacher)

    grade = request.args.get('grade', '').strip()
    division = request.args.get('division', '').strip().upper()
    class_id = request.args.get('class_id', '').strip()
    search = request.args.get('search', '').strip()

    # If class_id provided, attempt to resolve grade and division
    if class_id:
        if ObjectId.is_valid(class_id):
            cdoc = db.classes.find_one({'_id': ObjectId(class_id)})
            if cdoc:
                grade = str(cdoc.get('grade', ''))
                division = str(cdoc.get('division', 'A')).upper()
        elif '-' in class_id:
            parts = class_id.replace('Grade', '').strip().split('-')
            grade = parts[0].strip()
            division = parts[1].strip().upper() if len(parts) > 1 else 'A'

    query = {'role': 'student'}

    if grade:
        g_val = int(grade) if grade.isdigit() else grade
        query['grade'] = {'$in': [str(grade), g_val]}
    if division:
        query['division'] = division

    # If teacher has assigned classes and no specific filter passed, default to all assigned classes
    if not grade and not division:
        if assigned:
            cohort_conditions = []
            for c in assigned:
                cg = str(c['grade'])
                cd = str(c['division']).upper()
                cg_int = int(cg) if cg.isdigit() else cg
                cohort_conditions.append({
                    'grade': {'$in': [cg, cg_int]},
                    'division': cd
                })
            if cohort_conditions:
                query['$or'] = cohort_conditions
        elif teacher.get('role') != 'admin':
            return jsonify({'success': True, 'data': []})

    if search:
        search_filter = [
            {'full_name': {'$regex': search, '$options': 'i'}},
            {'student_id': {'$regex': search, '$options': 'i'}},
            {'email': {'$regex': search, '$options': 'i'}},
            {'username': {'$regex': search, '$options': 'i'}}
        ]
        if '$or' in query:
            query = {'$and': [{'$or': query.pop('$or')}, {'$or': search_filter}]}
        else:
            query['$or'] = search_filter

    students = list(db.users.find(query, {'password_hash': 0, 'otp_hash': 0}))

    # Calculate real-time ranks based on points & accuracy
    all_school_students = list(db.users.find({'role': 'student'}, {'points': 1, 'accuracy': 1, 'grade': 1, 'division': 1}))
    all_school_students.sort(key=lambda x: (int(x.get('points', 0)), float(x.get('accuracy', 0))), reverse=True)
    rank_map = {str(st['_id']): idx + 1 for idx, st in enumerate(all_school_students)}

    # Class-wise ranks
    class_groups = {}
    for st in all_school_students:
        c_key = f"{st.get('grade')}-{st.get('division', 'A')}".upper()
        class_groups.setdefault(c_key, []).append(st)
    class_rank_map = {}
    for c_key, c_students in class_groups.items():
        c_students.sort(key=lambda x: (int(x.get('points', 0)), float(x.get('accuracy', 0))), reverse=True)
        for idx, st in enumerate(c_students):
            class_rank_map[str(st['_id'])] = idx + 1

    for s in students:
        sid_str = str(s['_id'])
        sid_oid = s['_id']
        s['_id'] = sid_str
        s['rank'] = rank_map.get(sid_str, 1)
        s['class_rank'] = class_rank_map.get(sid_str, 1)
        s['points'] = int(s.get('points', 0))
        if s.get('team_id'):
            s['team_id'] = str(s['team_id'])

        # Enrich with quiz attempts stats
        st_attempts = list(db.quiz_attempts.find({
            '$or': [
                {'student_id': sid_str},
                {'student_id': sid_oid},
                {'user_id': sid_oid},
                {'user_id': sid_str}
            ],
            'status': 'submitted'
        }))
        s['tests_taken'] = len(st_attempts)
        s['tests_passed'] = sum(1 for a in st_attempts if a.get('passed', False))
        s['avg_score'] = round(sum(float(a.get('score_percentage', 0)) for a in st_attempts) / len(st_attempts), 1) if st_attempts else 0
        s['pass_rate'] = round((s['tests_passed'] / s['tests_taken'] * 100), 1) if s['tests_taken'] > 0 else 0

    # Sort students by class_rank ascending (Rank 1 first)
    students.sort(key=lambda x: (x.get('class_rank', 9999), x.get('rank', 9999), str(x.get('roll_number', ''))))

    return jsonify({'success': True, 'data': students})


@teacher_bp.route('/performance', methods=['GET'])
@jwt_required()
@teacher_required
def get_teacher_performance_overview():
    """Get overall academic performance metrics and solo students for assigned class."""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    teacher = db.users.find_one({'_id': ObjectId(user_id)})
    assigned = _get_teacher_assigned_classes(db, user_id, teacher)

    # Fetch assigned students
    query = {'role': 'student'}
    if assigned:
        cohort_conditions = []
        for c in assigned:
            cg = str(c['grade'])
            cd = str(c['division']).upper()
            cg_int = int(cg) if cg.isdigit() else cg
            cohort_conditions.append({
                'grade': {'$in': [cg, cg_int]},
                'division': cd
            })
        if cohort_conditions:
            query['$or'] = cohort_conditions
    elif teacher.get('role') != 'admin':
        return jsonify({'success': True, 'data': {'summary': {}, 'students': []}})

    students = list(db.users.find(query, {'password_hash': 0, 'otp_hash': 0}))

    # Class-wise & overall rank map
    all_school_students = list(db.users.find({'role': 'student'}, {'points': 1, 'accuracy': 1, 'grade': 1, 'division': 1}))
    all_school_students.sort(key=lambda x: (int(x.get('points', 0)), float(x.get('accuracy', 0))), reverse=True)
    rank_map = {str(st['_id']): idx + 1 for idx, st in enumerate(all_school_students)}

    class_groups = {}
    for st in all_school_students:
        c_key = f"{st.get('grade')}-{st.get('division', 'A')}".upper()
        class_groups.setdefault(c_key, []).append(st)
    class_rank_map = {}
    for c_key, c_students in class_groups.items():
        c_students.sort(key=lambda x: (int(x.get('points', 0)), float(x.get('accuracy', 0))), reverse=True)
        for idx, st in enumerate(c_students):
            class_rank_map[str(st['_id'])] = idx + 1

    total_attempts_all = 0
    total_passed_all = 0
    total_scores_sum = 0
    total_points_all = 0

    for s in students:
        sid_str = str(s['_id'])
        sid_oid = s['_id']
        s['_id'] = sid_str
        s['rank'] = rank_map.get(sid_str, 1)
        s['class_rank'] = class_rank_map.get(sid_str, 1)
        s['points'] = int(s.get('points', 0))
        total_points_all += s['points']

        st_attempts = list(db.quiz_attempts.find({
            '$or': [
                {'student_id': sid_str},
                {'student_id': sid_oid},
                {'user_id': sid_oid},
                {'user_id': sid_str}
            ],
            'status': 'submitted'
        }))

        t_taken = len(st_attempts)
        t_passed = sum(1 for a in st_attempts if a.get('passed', False))
        avg_sc = round(sum(float(a.get('score_percentage', 0)) for a in st_attempts) / t_taken, 1) if t_taken else 0

        s['tests_taken'] = t_taken
        s['tests_passed'] = t_passed
        s['avg_score'] = avg_sc
        s['pass_rate'] = round((t_passed / t_taken * 100), 1) if t_taken > 0 else 0

        total_attempts_all += t_taken
        total_passed_all += t_passed
        if t_taken > 0:
            total_scores_sum += avg_sc

    # Sort students by class_rank ascending (Rank 1 first)
    students.sort(key=lambda x: (x.get('class_rank', 9999), x.get('rank', 9999), str(x.get('roll_number', ''))))

    class_avg = round(total_scores_sum / len(students), 1) if students else 0
    class_pass_rate = round((total_passed_all / total_attempts_all * 100), 1) if total_attempts_all > 0 else 0

    class_names = [f"Grade {c['grade']}-{c['division']}" for c in assigned]
    assigned_name = ", ".join(class_names) if class_names else "Assigned Class"

    summary = {
        'assigned_class_name': assigned_name,
        'total_students': len(students),
        'class_avg_score': class_avg,
        'total_tests_taken': total_attempts_all,
        'total_tests_passed': total_passed_all,
        'class_pass_rate': class_pass_rate,
        'total_class_points': total_points_all
    }

    return jsonify({
        'success': True,
        'data': {
            'summary': summary,
            'students': students
        }
    })


@teacher_bp.route('/students/<student_id>/performance', methods=['GET'])
@jwt_required()
@teacher_required
def get_student_detailed_performance(student_id):
    """Get full individual student academic performance with subject & test-wise breakdown."""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    teacher = db.users.find_one({'_id': ObjectId(user_id)})

    # Find target student
    try:
        s_oid = ObjectId(student_id) if ObjectId.is_valid(student_id) else None
        student_query = {'_id': s_oid} if s_oid else {'student_id': student_id}
        student = db.users.find_one(student_query, {'password_hash': 0, 'otp_hash': 0})
    except Exception:
        student = None

    if not student:
        return jsonify({'success': False, 'message': 'Student not found'}), 404

    sid_str = str(student['_id'])
    sid_oid = student['_id']

    # Calculate student rank
    all_school_students = list(db.users.find({'role': 'student'}, {'points': 1, 'accuracy': 1, 'grade': 1, 'division': 1}))
    all_school_students.sort(key=lambda x: (int(x.get('points', 0)), float(x.get('accuracy', 0))), reverse=True)
    overall_rank = 1
    for idx, st in enumerate(all_school_students):
        if str(st['_id']) == sid_str:
            overall_rank = idx + 1
            break

    c_key = f"{student.get('grade')}-{student.get('division', 'A')}".upper()
    c_students = [st for st in all_school_students if f"{st.get('grade')}-{st.get('division', 'A')}".upper() == c_key]
    class_rank = 1
    for idx, st in enumerate(c_students):
        if str(st['_id']) == sid_str:
            class_rank = idx + 1
            break

    # Fetch attempts
    attempts = list(db.quiz_attempts.find({
        '$or': [
            {'student_id': sid_str},
            {'student_id': sid_oid},
            {'user_id': sid_oid},
            {'user_id': sid_str}
        ],
        'status': 'submitted'
    }).sort('submitted_at', 1))

    # Preload reference lookup maps
    subjects_map = {str(s['_id']): s for s in db.subjects.find()}
    chapters_map = {str(c['_id']): c for c in db.chapters.find()}
    categories_map = {str(cat['_id']): cat for cat in db.categories.find()}
    quizzes_map = {str(q['_id']): q for q in db.quizzes.find()}

    # Subject colors palette
    subject_palette = {
        'Science': {'color': '#10b981', 'bg': '#ecfdf5', 'border': '#a7f3d0'},
        'Technology': {'color': '#3b82f6', 'bg': '#eff6ff', 'border': '#bfdbfe'},
        'Mathematics': {'color': '#8b5cf6', 'bg': '#f5f3ff', 'border': '#ddd6fe'},
        'Engineering': {'color': '#f59e0b', 'bg': '#fffbeb', 'border': '#fde68a'},
        'English': {'color': '#ec4899', 'bg': '#fdf2f8', 'border': '#fbcfe8'}
    }

    subject_stats = {}
    timeline = []
    test_history = []
    total_time_seconds = 0

    for a in attempts:
        qid = str(a.get('quiz_id', ''))
        quiz = quizzes_map.get(qid, {})

        sub_id = str(a.get('subject_id') or quiz.get('subject_id', ''))
        cat_id = str(a.get('category_id') or quiz.get('category_id', ''))
        ch_id = str(a.get('chapter_id') or quiz.get('chapter_id', ''))

        sub = subjects_map.get(sub_id, {})
        cat = categories_map.get(cat_id, {})
        ch = chapters_map.get(ch_id, {})

        sub_name = sub.get('name') or 'STEM'
        cat_name = cat.get('name') or 'General'
        ch_name = ch.get('name') or 'Chapter'

        score_pct = float(a.get('score_percentage', 0))
        passing_threshold = float(quiz.get('passing_percentage', 70))
        passed = bool(a.get('passed', score_pct >= passing_threshold))
        points = int(a.get('points_earned', 0))
        time_taken = int(a.get('time_taken_seconds', 0))
        total_time_seconds += time_taken

        # Aggregate subject performance
        if sub_name not in subject_stats:
            pal = subject_palette.get(sub_name, {'color': '#6366f1', 'bg': '#eef2ff', 'border': '#c7d2fe'})
            subject_stats[sub_name] = {
                'subject_id': sub_id,
                'subject_name': sub_name,
                'code': sub.get('code', 'STEM'),
                'tests_taken': 0,
                'tests_passed': 0,
                'scores': [],
                'points': 0,
                'color': pal['color'],
                'bg': pal['bg'],
                'border': pal['border']
            }
        subject_stats[sub_name]['tests_taken'] += 1
        if passed:
            subject_stats[sub_name]['tests_passed'] += 1
        subject_stats[sub_name]['scores'].append(score_pct)
        subject_stats[sub_name]['points'] += points

        test_num = a.get('sequence_number') or quiz.get('sequence_number', 1)
        test_label = f"Test {test_num}"

        submitted_dt = a.get('submitted_at')
        submitted_iso = submitted_dt.isoformat() if hasattr(submitted_dt, 'isoformat') else str(submitted_dt) if submitted_dt else None
        formatted_date = submitted_dt.strftime('%b %d, %Y') if hasattr(submitted_dt, 'strftime') else 'Recent'

        test_item = {
            'attempt_id': str(a['_id']),
            'quiz_id': qid,
            'quiz_title': a.get('quiz_title') or quiz.get('title', 'Quiz Test'),
            'test_label': test_label,
            'sequence_number': test_num,
            'subject_id': sub_id,
            'subject_name': sub_name,
            'category_name': cat_name,
            'chapter_name': ch_name,
            'chapter_order': ch.get('order_index') or ch.get('order', 1),
            'score': a.get('score', 0),
            'total_marks': a.get('total_marks', 10),
            'score_percentage': score_pct,
            'passing_percentage': passing_threshold,
            'passed': passed,
            'points_earned': points,
            'time_taken_seconds': time_taken,
            'submitted_at': submitted_iso,
            'formatted_date': formatted_date,
            'mode': a.get('mode', 'solo')
        }
        test_history.append(test_item)

        # Timeline point for visual graph
        timeline.append({
            'label': f"{sub_name[:4]}. {test_label}",
            'quiz_title': test_item['quiz_title'],
            'subject_name': sub_name,
            'score_percentage': score_pct,
            'passing_threshold': passing_threshold,
            'passed': passed,
            'points_earned': points,
            'date': formatted_date
        })

    # Finalize subject mastery list
    subject_mastery_list = []
    for sname, sinfo in subject_stats.items():
        avg_s = round(sum(sinfo['scores']) / len(sinfo['scores']), 1) if sinfo['scores'] else 0
        pass_ratio = round((sinfo['tests_passed'] / sinfo['tests_taken'] * 100), 1) if sinfo['tests_taken'] > 0 else 0
        if avg_s >= 80:
            mastery_badge = 'Mastered'
        elif avg_s >= 70:
            mastery_badge = 'Proficient'
        else:
            mastery_badge = 'Needs Attention'

        subject_mastery_list.append({
            'subject_id': sinfo['subject_id'],
            'subject_name': sname,
            'code': sinfo['code'],
            'tests_taken': sinfo['tests_taken'],
            'tests_passed': sinfo['tests_passed'],
            'average_score': avg_s,
            'pass_ratio': pass_ratio,
            'total_points': sinfo['points'],
            'mastery_level': mastery_badge,
            'color': sinfo['color'],
            'bg': sinfo['bg'],
            'border': sinfo['border']
        })

    total_attempts_count = len(test_history)
    total_passed_count = sum(1 for t in test_history if t['passed'])
    total_failed_count = total_attempts_count - total_passed_count
    overall_avg_score = round(sum(t['score_percentage'] for t in test_history) / total_attempts_count, 1) if total_attempts_count > 0 else 0
    overall_pass_rate = round((total_passed_count / total_attempts_count * 100), 1) if total_attempts_count > 0 else 0

    minutes = total_time_seconds // 60
    seconds = total_time_seconds % 60
    formatted_total_time = f"{minutes}m {seconds}s" if minutes > 0 else f"{seconds}s"

    summary = {
        'total_tests_taken': total_attempts_count,
        'tests_passed': total_passed_count,
        'tests_failed': total_failed_count,
        'pass_rate_percentage': overall_pass_rate,
        'average_score_percentage': overall_avg_score,
        'total_points_earned': int(student.get('points', 0)),
        'accuracy_percentage': float(student.get('accuracy', overall_avg_score)),
        'total_time_seconds': total_time_seconds,
        'formatted_total_time': formatted_total_time
    }

    # Group tests by Subject -> Chapter for hierarchical viewing
    grouped_by_subject = {}
    for t in test_history:
        sname = t['subject_name']
        cname = t['chapter_name']
        grouped_by_subject.setdefault(sname, {}).setdefault(cname, []).append(t)

    formatted_student_profile = {
        '_id': sid_str,
        'full_name': student.get('full_name', 'Student'),
        'student_id': student.get('student_id', ''),
        'roll_number': student.get('roll_number', ''),
        'email': student.get('email', ''),
        'grade': student.get('grade', ''),
        'division': student.get('division', ''),
        'class_name': f"Grade {student.get('grade', '')}-{student.get('division', 'A')}",
        'class_rank': class_rank,
        'overall_rank': overall_rank,
        'points': int(student.get('points', 0)),
        'status': student.get('status', 'active')
    }

    return jsonify({
        'success': True,
        'data': {
            'student': formatted_student_profile,
            'summary': summary,
            'subject_mastery': subject_mastery_list,
            'timeline': timeline,
            'test_history': list(reversed(test_history)),  # newest first for table
            'grouped_hierarchy': grouped_by_subject
        }
    })


@teacher_bp.route('/teams', methods=['GET'])
@jwt_required()
@teacher_required
def get_teacher_teams_overview():
    """Get collaborative teams and performance metrics for teacher's assigned classes."""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    teacher = db.users.find_one({'_id': ObjectId(user_id)})
    assigned = _get_teacher_assigned_classes(db, user_id, teacher)

    team_query = {'status': 'active'}
    if assigned:
        team_conditions = []
        for c in assigned:
            cg = str(c['grade'])
            cd = str(c['division']).upper()
            cg_int = int(cg) if cg.isdigit() else cg
            team_conditions.append({
                'grade': {'$in': [cg, cg_int]},
                'division': cd
            })
        if team_conditions:
            team_query['$or'] = team_conditions
    elif teacher.get('role') != 'admin':
        return jsonify({'success': True, 'data': {'summary': {}, 'teams': []}})

    raw_teams = list(db.teams.find(team_query))

    teams_data = []
    total_class_team_points = 0
    total_class_team_attempts = 0
    total_class_team_passed = 0
    total_class_members_count = 0
    total_score_pct_sum = 0

    for t in raw_teams:
        tid_str = str(t['_id'])
        # Find members
        members = list(db.users.find({'team_id': tid_str, 'role': 'student'}, {'password_hash': 0, 'otp_hash': 0}))
        member_ids_str = [str(m['_id']) for m in members]
        member_ids_oid = [m['_id'] for m in members]

        # Attempts for this team
        team_attempts = list(db.quiz_attempts.find({
            '$or': [
                {'team_id': tid_str},
                {'student_id': {'$in': member_ids_str}},
                {'user_id': {'$in': member_ids_oid}}
            ],
            'status': 'submitted'
        }))

        team_pts = sum(int(m.get('points', 0)) for m in members)
        t_taken = len(team_attempts)
        t_passed = sum(1 for a in team_attempts if a.get('passed', False))
        t_avg_score = round(sum(float(a.get('score_percentage', 0)) for a in team_attempts) / t_taken, 1) if t_taken else 0
        t_pass_rate = round((t_passed / t_taken * 100), 1) if t_taken > 0 else 0

        # Formatted members list
        formatted_members = []
        for m in members:
            formatted_members.append({
                '_id': str(m['_id']),
                'full_name': m.get('full_name', 'Student'),
                'roll_number': m.get('roll_number', ''),
                'email': m.get('email', ''),
                'points': int(m.get('points', 0))
            })

        teams_data.append({
            '_id': tid_str,
            'name': t.get('name', 'Squad'),
            'code': t.get('code', ''),
            'grade': str(t.get('grade', '')),
            'division': str(t.get('division', 'A')),
            'class_name': f"Grade {t.get('grade', '')}-{t.get('division', 'A')}",
            'members_count': len(members),
            'members': formatted_members,
            'points': team_pts,
            'tests_taken': t_taken,
            'tests_passed': t_passed,
            'pass_rate': t_pass_rate,
            'avg_score': t_avg_score
        })

        total_class_team_points += team_pts
        total_class_team_attempts += t_taken
        total_class_team_passed += t_passed
        total_class_members_count += len(members)
        if t_taken > 0:
            total_score_pct_sum += t_avg_score

    # Sort teams by points descending, then avg_score descending
    teams_data.sort(key=lambda x: (x['points'], x['avg_score']), reverse=True)
    for idx, t in enumerate(teams_data):
        t['rank'] = idx + 1

    overall_avg = round(total_score_pct_sum / len(teams_data), 1) if teams_data else 0
    overall_pass_rate = round((total_class_team_passed / total_class_team_attempts * 100), 1) if total_class_team_attempts > 0 else 0

    class_names = [f"Grade {c['grade']}-{c['division']}" for c in assigned]
    assigned_name = ", ".join(class_names) if class_names else "Assigned Class"

    summary = {
        'assigned_class_name': assigned_name,
        'total_teams': len(teams_data),
        'total_team_members': total_class_members_count,
        'total_team_points': total_class_team_points,
        'class_team_avg_score': overall_avg,
        'total_tests_taken': total_class_team_attempts,
        'total_tests_passed': total_class_team_passed,
        'class_pass_rate': overall_pass_rate
    }

    return jsonify({
        'success': True,
        'data': {
            'summary': summary,
            'teams': teams_data
        }
    })


@teacher_bp.route('/teams/<team_id>/performance', methods=['GET'])
@jwt_required()
@teacher_required
def get_team_detailed_performance(team_id):
    """Get full collaborative team performance with member contributions, subject mastery & test breakdown."""
    db = current_app.config['db']
    user_id = get_jwt_identity()

    try:
        t_oid = ObjectId(team_id) if ObjectId.is_valid(team_id) else None
        team_query = {'_id': t_oid} if t_oid else {'_id': team_id}
        team = db.teams.find_one(team_query)
    except Exception:
        team = None

    if not team:
        return jsonify({'success': False, 'message': 'Team not found'}), 404

    tid_str = str(team['_id'])

    # Team members
    members = list(db.users.find({'team_id': tid_str, 'role': 'student'}, {'password_hash': 0, 'otp_hash': 0}))
    member_ids_str = [str(m['_id']) for m in members]
    member_ids_oid = [m['_id'] for m in members]
    member_map = {str(m['_id']): m for m in members}

    # Fetch attempts
    attempts = list(db.quiz_attempts.find({
        '$or': [
            {'team_id': tid_str},
            {'student_id': {'$in': member_ids_str}},
            {'user_id': {'$in': member_ids_oid}}
        ],
        'status': 'submitted'
    }).sort('submitted_at', 1))

    # Preload reference lookup maps
    subjects_map = {str(s['_id']): s for s in db.subjects.find()}
    chapters_map = {str(c['_id']): c for c in db.chapters.find()}
    categories_map = {str(cat['_id']): cat for cat in db.categories.find()}
    quizzes_map = {str(q['_id']): q for q in db.quizzes.find()}

    subject_palette = {
        'Science': {'color': '#10b981', 'bg': '#ecfdf5', 'border': '#a7f3d0'},
        'Technology': {'color': '#3b82f6', 'bg': '#eff6ff', 'border': '#bfdbfe'},
        'Mathematics': {'color': '#8b5cf6', 'bg': '#f5f3ff', 'border': '#ddd6fe'},
        'Engineering': {'color': '#f59e0b', 'bg': '#fffbeb', 'border': '#fde68a'},
        'English': {'color': '#ec4899', 'bg': '#fdf2f8', 'border': '#fbcfe8'}
    }

    subject_stats = {}
    timeline = []
    test_history = []
    total_time_seconds = 0
    member_stats = {str(m['_id']): {'tests_taken': 0, 'tests_passed': 0, 'scores': []} for m in members}

    for a in attempts:
        qid = str(a.get('quiz_id', ''))
        quiz = quizzes_map.get(qid, {})

        sub_id = str(a.get('subject_id') or quiz.get('subject_id', ''))
        cat_id = str(a.get('category_id') or quiz.get('category_id', ''))
        ch_id = str(a.get('chapter_id') or quiz.get('chapter_id', ''))

        sub = subjects_map.get(sub_id, {})
        cat = categories_map.get(cat_id, {})
        ch = chapters_map.get(ch_id, {})

        sub_name = sub.get('name') or 'STEM'
        cat_name = cat.get('name') or 'General'
        ch_name = ch.get('name') or 'Chapter'

        score_pct = float(a.get('score_percentage', 0))
        passing_threshold = float(quiz.get('passing_percentage', 70))
        passed = bool(a.get('passed', score_pct >= passing_threshold))
        points = int(a.get('points_earned', 0))
        time_taken = int(a.get('time_taken_seconds', 0))
        total_time_seconds += time_taken

        # Who took it
        sid = str(a.get('student_id') or a.get('user_id') or '')
        st_doc = member_map.get(sid, {})
        student_name = st_doc.get('full_name') or 'Team Member'
        student_roll = st_doc.get('roll_number', '')

        if sid in member_stats:
            member_stats[sid]['tests_taken'] += 1
            if passed: member_stats[sid]['tests_passed'] += 1
            member_stats[sid]['scores'].append(score_pct)

        # Aggregate subject performance
        if sub_name not in subject_stats:
            pal = subject_palette.get(sub_name, {'color': '#6366f1', 'bg': '#eef2ff', 'border': '#c7d2fe'})
            subject_stats[sub_name] = {
                'subject_id': sub_id,
                'subject_name': sub_name,
                'code': sub.get('code', 'STEM'),
                'tests_taken': 0,
                'tests_passed': 0,
                'scores': [],
                'points': 0,
                'color': pal['color'],
                'bg': pal['bg'],
                'border': pal['border']
            }
        subject_stats[sub_name]['tests_taken'] += 1
        if passed:
            subject_stats[sub_name]['tests_passed'] += 1
        subject_stats[sub_name]['scores'].append(score_pct)
        subject_stats[sub_name]['points'] += points

        test_num = a.get('sequence_number') or quiz.get('sequence_number', 1)
        test_label = f"Test {test_num}"

        submitted_dt = a.get('submitted_at')
        submitted_iso = submitted_dt.isoformat() if hasattr(submitted_dt, 'isoformat') else str(submitted_dt) if submitted_dt else None
        formatted_date = submitted_dt.strftime('%b %d, %Y') if hasattr(submitted_dt, 'strftime') else 'Recent'

        test_item = {
            'attempt_id': str(a['_id']),
            'quiz_id': qid,
            'quiz_title': a.get('quiz_title') or quiz.get('title', 'Quiz Test'),
            'test_label': test_label,
            'sequence_number': test_num,
            'student_name': student_name,
            'student_roll': student_roll,
            'subject_id': sub_id,
            'subject_name': sub_name,
            'category_name': cat_name,
            'chapter_name': ch_name,
            'score': a.get('score', 0),
            'total_marks': a.get('total_marks', 10),
            'score_percentage': score_pct,
            'passing_percentage': passing_threshold,
            'passed': passed,
            'points_earned': points,
            'time_taken_seconds': time_taken,
            'submitted_at': submitted_iso,
            'formatted_date': formatted_date
        }
        test_history.append(test_item)

        timeline.append({
            'label': f"{sub_name[:4]}. {test_label}",
            'quiz_title': test_item['quiz_title'],
            'student_name': student_name,
            'subject_name': sub_name,
            'score_percentage': score_pct,
            'passing_threshold': passing_threshold,
            'passed': passed,
            'points_earned': points,
            'date': formatted_date
        })

    # Finalize subject mastery list
    subject_mastery_list = []
    for sname, sinfo in subject_stats.items():
        avg_s = round(sum(sinfo['scores']) / len(sinfo['scores']), 1) if sinfo['scores'] else 0
        pass_ratio = round((sinfo['tests_passed'] / sinfo['tests_taken'] * 100), 1) if sinfo['tests_taken'] > 0 else 0
        if avg_s >= 80: mastery_badge = 'Mastered'
        elif avg_s >= 70: mastery_badge = 'Proficient'
        else: mastery_badge = 'Needs Attention'

        subject_mastery_list.append({
            'subject_id': sinfo['subject_id'],
            'subject_name': sname,
            'code': sinfo['code'],
            'tests_taken': sinfo['tests_taken'],
            'tests_passed': sinfo['tests_passed'],
            'average_score': avg_s,
            'pass_ratio': pass_ratio,
            'total_points': sinfo['points'],
            'mastery_level': mastery_badge,
            'color': sinfo['color'],
            'bg': sinfo['bg'],
            'border': sinfo['border']
        })

    total_pts = sum(int(m.get('points', 0)) for m in members)

    # Member contributions list
    member_contributions = []
    for m in members:
        mid_str = str(m['_id'])
        m_pts = int(m.get('points', 0))
        m_stat = member_stats.get(mid_str, {'tests_taken': 0, 'tests_passed': 0, 'scores': []})
        m_avg = round(sum(m_stat['scores']) / len(m_stat['scores']), 1) if m_stat['scores'] else 0
        contrib_pct = round((m_pts / total_pts * 100), 1) if total_pts > 0 else 0
        member_contributions.append({
            'student_id': mid_str,
            'full_name': m.get('full_name', 'Student'),
            'roll_number': m.get('roll_number', ''),
            'email': m.get('email', ''),
            'points': m_pts,
            'tests_taken': m_stat['tests_taken'],
            'tests_passed': m_stat['tests_passed'],
            'average_score': m_avg,
            'contribution_pct': contrib_pct
        })
    member_contributions.sort(key=lambda x: x['points'], reverse=True)

    total_attempts_count = len(test_history)
    total_passed_count = sum(1 for t in test_history if t['passed'])
    total_failed_count = total_attempts_count - total_passed_count
    overall_avg_score = round(sum(t['score_percentage'] for t in test_history) / total_attempts_count, 1) if total_attempts_count > 0 else 0
    overall_pass_rate = round((total_passed_count / total_attempts_count * 100), 1) if total_attempts_count > 0 else 0

    minutes = total_time_seconds // 60
    seconds = total_time_seconds % 60
    formatted_total_time = f"{minutes}m {seconds}s" if minutes > 0 else f"{seconds}s"

    summary = {
        'total_tests_taken': total_attempts_count,
        'tests_passed': total_passed_count,
        'tests_failed': total_failed_count,
        'pass_rate_percentage': overall_pass_rate,
        'average_score_percentage': overall_avg_score,
        'total_points_earned': total_pts,
        'total_members': len(members),
        'total_time_seconds': total_time_seconds,
        'formatted_total_time': formatted_total_time
    }

    formatted_team = {
        '_id': tid_str,
        'name': team.get('name', 'Squad'),
        'code': team.get('code', ''),
        'grade': str(team.get('grade', '')),
        'division': str(team.get('division', 'A')),
        'class_name': f"Grade {team.get('grade', '')}-{team.get('division', 'A')}",
        'members_count': len(members),
        'total_points': total_pts,
        'status': team.get('status', 'active')
    }

    return jsonify({
        'success': True,
        'data': {
            'team': formatted_team,
            'summary': summary,
            'member_contributions': member_contributions,
            'subject_mastery': subject_mastery_list,
            'timeline': timeline,
            'test_history': list(reversed(test_history))
        }
    })




