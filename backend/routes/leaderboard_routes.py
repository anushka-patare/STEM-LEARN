"""Leaderboard routes - Strictly real-time competitive individual & collaborative squad rankings."""
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt
from bson import ObjectId
from middleware.role_middleware import admin_required

leaderboard_bp = Blueprint('leaderboard', __name__)


def _get_leaderboard_settings(db):
    """Retrieve saved leaderboard admin settings or defaults."""
    default_settings = {
        'spotlight_enabled': True,
        'spotlight_badge': '★ Top Academic Honor',
        'spotlight_title': 'Middle School STEM Excellence Showcase',
        'spotlight_text': 'Live leaderboards updated with verified assessment metrics, anti-cheat accuracy, and collaborative squad scores directly from student quiz activity.',
        'min_points_cutoff': 0,
        'show_squads': True,
        'show_classwise': True,
        'spotlight_student_id': '',
        'spotlight_team_id': ''
    }
    saved = db.leaderboard_settings.find_one({'key': 'general'})
    if saved:
        default_settings.update(saved.get('settings', {}))
    return default_settings


@leaderboard_bp.route('/public-overview', methods=['GET'])
def public_overview():
    """Comprehensive real-time public leaderboard data directly from database."""
    db = current_app.config['db']

    # 1. Fetch real students from DB (support class/grade filtering)
    grade = request.args.get('grade')
    query = {'role': 'student'}
    if grade and str(grade).lower() != 'all':
        g_clean = str(grade).strip()
        g_int = int(g_clean) if g_clean.isdigit() else g_clean
        query['grade'] = {'$in': [g_clean, g_int]}

    db_students = list(db.users.find(query, {'password_hash': 0}))

    all_students = []

    for s in db_students:
        sid = s.get('student_id') or str(s['_id'])
        pts = int(s.get('points', 0))
        
        # Check actual quiz submissions in DB
        submissions = list(db.quiz_submissions.find({
            '$or': [
                {'student_id': sid},
                {'student_id': str(s['_id'])},
                {'user_id': str(s['_id'])},
                {'student_username': s.get('username')}
            ]
        }))

        if submissions:
            quizzes_completed = len(submissions)
            total_pct = sum(float(sub.get('percentage') or sub.get('score') or 0) for sub in submissions)
            accuracy = round(total_pct / quizzes_completed, 1)
        else:
            quizzes_completed = int(s.get('quizzes_completed', 0))
            accuracy = float(s.get('accuracy', 0.0))

        streak = int(s.get('streak', 0))
        badges = s.get('badges', [])
        if not badges and pts > 0:
            badges = ['Active Scholar']

        # Subject breakdown from student record or default zeroes
        breakdown = s.get('subject_breakdown', {
            'science': int(s.get('points_science', 0)),
            'mathematics': int(s.get('points_math', 0)),
            'technology': int(s.get('points_tech', 0))
        })

        all_students.append({
            'student_id': sid,
            'full_name': s.get('full_name') or s.get('name') or s.get('username') or 'Student',
            'username': s.get('username', ''),
            'grade': str(s.get('grade') or ''),
            'division': s.get('division') or '',
            'points': pts,
            'quizzes_completed': quizzes_completed,
            'accuracy': accuracy,
            'streak': streak,
            'badges': badges,
            'photo': s.get('photo', ''),
            'status': s.get('status', 'active'),
            'subject_breakdown': breakdown
        })

    # Sort students descending strictly by points, then accuracy
    all_students.sort(key=lambda x: (x['points'], x['accuracy']), reverse=True)

    # Assign overall ranks
    for idx, st in enumerate(all_students):
        st['rank'] = idx + 1

    # Top 10 are the top up to 10 real students
    top10 = all_students[:10]

    # Class-wise grouping
    class_wise = {'6': [], '7': [], '8': []}
    for st in all_students:
        g = str(st.get('grade') or '').strip()
        if g in class_wise:
            class_wise[g].append(st)

    # For each class, sort and assign class rank
    for g, slist in class_wise.items():
        slist.sort(key=lambda x: (x['points'], x['accuracy']), reverse=True)
        for i, item in enumerate(slist):
            item['class_rank'] = i + 1

    # 2. Collaborative Squads Leaderboard strictly from DB teams
    grade_param = request.args.get('grade')
    teams_query = {}
    if grade_param and str(grade_param).lower() != 'all':
        g_clean = str(grade_param).replace('Grade', '').strip()
        g_int = int(g_clean) if g_clean.isdigit() else g_clean
        teams_query['grade'] = {'$in': [g_clean, f'Grade {g_clean}', g_int]}

    teams_cursor = list(db.teams.find(teams_query))
    team_wise = []

    for t in teams_cursor:
        tid = str(t['_id'])
        tname = t.get('name') or t.get('team_name') or 'STEM Squad'
        tcode = t.get('code') or t.get('team_code') or f'SQUAD-{tid[-4:].upper()}'
        tgrade = str(t.get('grade') or '')
        tdivision = str(t.get('division') or '')

        # Query members strictly from db.users by team_id
        t_oid = ObjectId(tid) if ObjectId.is_valid(tid) else None
        member_query = {
            'role': 'student',
            '$or': [{'team_id': tid}, {'team_id': t_oid}] if t_oid else [{'team_id': tid}]
        }
        db_members = list(db.users.find(member_query, {'password_hash': 0, 'otp_hash': 0}))

        member_ids_str = [str(m['_id']) for m in db_members]
        member_count = len(db_members)

        # Calculate total score strictly from real member points (no mock or fixed dummy data)
        total_points = sum(int(m.get('points', 0)) for m in db_members)

        # Real quiz attempts by squad members or team_id
        team_attempts = list(db.quiz_attempts.find({
            '$or': [
                {'team_id': tid},
                {'student_id': {'$in': member_ids_str}}
            ],
            'status': {'$in': ['submitted', 'completed']}
        }))

        quizzes_completed = len(team_attempts)
        if team_attempts:
            avg_accuracy = round(sum(float(a.get('score_percentage') or a.get('accuracy') or 0) for a in team_attempts) / len(team_attempts), 1)
        else:
            avg_accuracy = 0.0

        team_wise.append({
            'team_id': tid,
            'name': tname,
            'code': tcode,
            'grade': tgrade,
            'division': tdivision,
            'slogan': t.get('slogan', ''),
            'member_count': member_count,
            'members': [
                {
                    'name': m.get('full_name') or m.get('name') or 'Member',
                    'role': 'Squad Member',
                    'email': m.get('email', ''),
                    'points': int(m.get('points', 0))
                } for m in db_members
            ],
            'total_score': total_points,
            'avg_accuracy': avg_accuracy,
            'quizzes_completed': quizzes_completed,
            'scoring_method': t.get('scoring_method', 'collaborative_aggregate')
        })

    # Sort teams by total_score descending, then accuracy, quizzes completed, and member count
    team_wise.sort(key=lambda x: (x['total_score'], x['avg_accuracy'], x['quizzes_completed'], x['member_count']), reverse=True)
    for i, t in enumerate(team_wise):
        t['rank'] = i + 1

    # 3. Overall Statistics & Metrics directly from real data
    total_scholars = len(all_students)
    total_squads = len(team_wise)
    total_quizzes = sum(st.get('quizzes_completed', 0) for st in all_students)
    avg_accuracy = round(sum(st.get('accuracy', 0) for st in all_students) / max(1, total_scholars), 1) if total_scholars > 0 else 0.0

    settings = _get_leaderboard_settings(db)

    return jsonify({
        'success': True,
        'data': {
            'top10': top10,
            'class_wise': class_wise,
            'team_wise': team_wise,
            'metrics': {
                'total_scholars': total_scholars,
                'total_squads': total_squads,
                'total_quizzes_completed': total_quizzes,
                'average_accuracy': avg_accuracy,
                'top_student': top10[0] if top10 else None,
                'top_squad': team_wise[0] if team_wise else None,
            },
            'settings': settings
        }
    })


@leaderboard_bp.route('/student/<student_id>', methods=['GET'])
def get_student_details(student_id):
    """Detailed breakdown for a specific real student in the database."""
    db = current_app.config['db']
    clean_id = student_id.strip()

    # Search in DB users
    student = None
    if ObjectId.is_valid(clean_id):
        student = db.users.find_one({'_id': ObjectId(clean_id), 'role': 'student'}, {'password_hash': 0})
    if not student:
        student = db.users.find_one({'student_id': clean_id, 'role': 'student'}, {'password_hash': 0})
    if not student:
        student = db.users.find_one({'username': clean_id, 'role': 'student'}, {'password_hash': 0})

    if not student:
        return jsonify({'success': False, 'message': 'Student record not found in database'}), 404

    # Real quiz submissions in DB
    sid = student.get('student_id') or str(student['_id'])
    submissions = list(db.quiz_submissions.find({
        '$or': [
            {'student_id': sid},
            {'student_id': str(student['_id'])},
            {'user_id': str(student['_id'])},
            {'student_username': student.get('username')}
        ]
    }))

    if submissions:
        quizzes_completed = len(submissions)
        total_pct = sum(float(sub.get('percentage') or sub.get('score') or 0) for sub in submissions)
        accuracy = round(total_pct / quizzes_completed, 1)
    else:
        quizzes_completed = int(student.get('quizzes_completed', 0))
        accuracy = float(student.get('accuracy', 0.0))

    # Format real detail record
    record = {
        'student_id': sid,
        'full_name': student.get('full_name') or student.get('name') or student.get('username'),
        'username': student.get('username', ''),
        'grade': str(student.get('grade') or ''),
        'division': student.get('division') or '',
        'points': int(student.get('points', 0)),
        'quizzes_completed': quizzes_completed,
        'accuracy': accuracy,
        'streak': int(student.get('streak', 0)),
        'badges': student.get('badges', ['Registered Scholar']),
        'photo': student.get('photo', ''),
        'subject_breakdown': student.get('subject_breakdown', {
            'science': int(student.get('points_science', 0)),
            'mathematics': int(student.get('points_math', 0)),
            'technology': int(student.get('points_tech', 0))
        }),
        'recent_submissions': [
            {
                'quiz_id': str(sub.get('quiz_id', '')),
                'score': sub.get('score', 0),
                'percentage': sub.get('percentage', 0),
                'completed_at': str(sub.get('submitted_at') or sub.get('created_at') or 'Recent')
            } for sub in submissions[:5]
        ]
    }
    return jsonify({'success': True, 'data': record})


@leaderboard_bp.route('/admin-settings', methods=['GET', 'PUT'])
@jwt_required()
@admin_required
def admin_settings():
    """Get or update administrative settings for the leaderboard."""
    db = current_app.config['db']
    if request.method == 'GET':
        settings = _get_leaderboard_settings(db)
        return jsonify({'success': True, 'data': settings})

    data = request.get_json(silent=True) or {}
    now = datetime.utcnow()
    current_settings = _get_leaderboard_settings(db)
    current_settings.update(data)

    db.leaderboard_settings.update_one(
        {'key': 'general'},
        {'$set': {'key': 'general', 'settings': current_settings, 'updated_at': now}},
        upsert=True
    )
    return jsonify({'success': True, 'message': 'Leaderboard settings updated successfully', 'data': current_settings})


@leaderboard_bp.route('/admin-adjust-points', methods=['POST'])
@jwt_required()
@admin_required
def admin_adjust_points():
    """Admin tool to update or award points to a student in real-time."""
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    student_id = data.get('student_id', '').strip()
    points = data.get('points')

    if not student_id or points is None:
        return jsonify({'success': False, 'message': 'student_id and points are required'}), 400

    try:
        points_val = int(points)
    except ValueError:
        return jsonify({'success': False, 'message': 'Points must be an integer'}), 400

    query = {'$or': [{'student_id': student_id}, {'username': student_id}]}
    if ObjectId.is_valid(student_id):
        query['$or'].append({'_id': ObjectId(student_id)})

    result = db.users.update_one(
        query,
        {'$set': {'points': points_val, 'updated_at': datetime.utcnow()}}
    )

    if result.matched_count == 0:
        return jsonify({'success': False, 'message': 'Student not found in user database'}), 404

    return jsonify({'success': True, 'message': f'Updated points to {points_val} successfully'})


@leaderboard_bp.route('/competitive', methods=['GET'])
def competitive_leaderboard():
    """Legacy endpoint returning real data."""
    return public_overview()


@leaderboard_bp.route('/collaborative', methods=['GET'])
def collaborative_leaderboard():
    """Legacy endpoint returning real data."""
    return public_overview()
