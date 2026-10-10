"""Team management routes."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from bson import ObjectId
from datetime import datetime
from middleware.role_middleware import role_required
from utils.generators import generate_team_code
from utils.validators import sanitize_string

team_bp = Blueprint('teams', __name__)

@team_bp.route('', methods=['GET'])
@jwt_required()
def get_teams():
    db = current_app.config['db']
    grade = request.args.get('grade', '')
    division = request.args.get('division', '')
    query = {}
    if grade:
        g_clean = str(grade).replace('Grade', '').strip()
        g_int = int(g_clean) if g_clean.isdigit() else g_clean
        query['grade'] = {'$in': [g_clean, f'Grade {g_clean}', g_int]}
    if division:
        query['division'] = division.upper()

    teams = list(db.teams.find(query).sort('name', 1))
    for t in teams:
        t_id = str(t['_id'])
        t['_id'] = t_id
        members = list(db.users.find({'team_id': t_id, 'role': 'student'}, {'password_hash': 0, 'otp_hash': 0}))
        formatted_members = []
        for m in members:
            formatted_members.append({
                '_id': str(m['_id']),
                'full_name': m.get('full_name') or m.get('name', 'Student'),
                'roll_number': m.get('roll_number', ''),
                'email': m.get('email', ''),
                'points': int(m.get('points', 0))
            })
        t['members'] = formatted_members
        t['member_count'] = len(members)

    return jsonify({'success': True, 'data': teams})



@team_bp.route('', methods=['POST'])
@jwt_required()
@role_required('teacher', 'admin')
def create_team():
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    name = sanitize_string(data.get('name', '')).strip()
    if not name:
        return jsonify({'success': False, 'message': 'Team name is required'}), 400

    grade = str(data.get('grade', '7')).strip()
    division = str(data.get('division', 'A')).strip().upper()
    slogan = sanitize_string(data.get('slogan', '')).strip()
    description = sanitize_string(data.get('description', '')).strip()
    max_members = int(data.get('max_members', 6))

    # Generate unique code
    code = generate_team_code()
    while db.teams.find_one({'code': code}):
        code = generate_team_code()

    team = {
        'name': name,
        'code': code,
        'slogan': slogan,
        'description': description,
        'grade': grade,
        'division': division,
        'max_members': max_members,
        'scoring_method': data.get('scoring_method', 'average'),
        'status': 'active',
        'created_by': get_jwt_identity(),
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    result = db.teams.insert_one(team)
    new_team_id = str(result.inserted_id)
    team['_id'] = new_team_id

    # Add initial members if provided
    member_ids = data.get('member_ids') or data.get('initial_member_ids') or []
    if isinstance(member_ids, list) and member_ids:
        added_count = 0
        for sid in member_ids:
            try:
                s_oid = ObjectId(sid)
                db.users.update_one({'_id': s_oid}, {'$set': {'team_id': new_team_id}})
                db.team_members.insert_one({
                    'team_id': new_team_id,
                    'student_id': str(sid),
                    'joined_at': datetime.utcnow()
                })
                added_count += 1
            except Exception:
                pass
        team['member_count'] = added_count
    else:
        team['member_count'] = 0

    return jsonify({'success': True, 'message': f'Team "{name}" created successfully', 'data': team}), 201


@team_bp.route('/<id>', methods=['PUT'])
@jwt_required()
@role_required('teacher', 'admin')
def update_team(id):
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}

    try:
        t_oid = ObjectId(id)
    except Exception:
        return jsonify({'success': False, 'message': 'Invalid team ID'}), 400

    team = db.teams.find_one({'_id': t_oid})
    if not team:
        return jsonify({'success': False, 'message': 'Team not found'}), 404

    update = {'updated_at': datetime.utcnow()}
    if 'name' in data:
        update['name'] = sanitize_string(data['name']).strip()
    if 'slogan' in data:
        update['slogan'] = sanitize_string(data['slogan']).strip()
    if 'description' in data:
        update['description'] = sanitize_string(data['description']).strip()
    if 'grade' in data:
        update['grade'] = str(data['grade']).strip()
    if 'division' in data:
        update['division'] = str(data['division']).strip().upper()
    if 'max_members' in data:
        update['max_members'] = int(data['max_members'])
    if 'status' in data:
        update['status'] = data['status']
    if 'scoring_method' in data:
        update['scoring_method'] = data['scoring_method']

    db.teams.update_one({'_id': t_oid}, {'$set': update})
    updated_team = db.teams.find_one({'_id': t_oid})
    updated_team['_id'] = str(updated_team['_id'])

    return jsonify({'success': True, 'message': 'Team updated successfully', 'data': updated_team})


@team_bp.route('/<id>', methods=['DELETE'])
@jwt_required()
@role_required('teacher', 'admin')
def delete_team(id):
    db = current_app.config['db']
    try:
        t_oid = ObjectId(id)
    except Exception:
        return jsonify({'success': False, 'message': 'Invalid team ID'}), 400

    team = db.teams.find_one({'_id': t_oid})
    if not team:
        return jsonify({'success': False, 'message': 'Team not found'}), 404

    team_id_str = str(id)
    db.teams.delete_one({'_id': t_oid})
    db.users.update_many({'team_id': team_id_str}, {'$unset': {'team_id': ''}})
    db.team_members.delete_many({'team_id': team_id_str})

    return jsonify({'success': True, 'message': f'Team "{team.get("name")}" deleted successfully'})


@team_bp.route('/<id>/members', methods=['POST'])
@jwt_required()
@role_required('teacher', 'admin')
def add_team_member(id):
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    student_id = data.get('student_id')
    student_ids = data.get('student_ids')

    if not student_id and not student_ids:
        return jsonify({'success': False, 'message': 'Student ID is required'}), 400

    targets = student_ids if isinstance(student_ids, list) else [student_id]
    team_id_str = str(id)

    team = db.teams.find_one({'_id': ObjectId(id)}) if ObjectId.is_valid(id) else None
    if not team:
        return jsonify({'success': False, 'message': 'Team not found'}), 404

    max_members = team.get('max_members', 6)
    current_count = db.users.count_documents({'team_id': team_id_str, 'role': 'student'})

    if current_count + len(targets) > max_members:
        return jsonify({
            'success': False,
            'message': f'Cannot add member. Team has reached maximum capacity of {max_members} members.'
        }), 400

    added = 0
    for sid in targets:
        try:
            s_oid = ObjectId(sid)
            student = db.users.find_one({'_id': s_oid, 'role': 'student'})
            if student:
                db.users.update_one({'_id': s_oid}, {'$set': {'team_id': team_id_str}})
                db.team_members.delete_many({'student_id': str(sid)})
                db.team_members.insert_one({
                    'team_id': team_id_str,
                    'student_id': str(sid),
                    'joined_at': datetime.utcnow()
                })
                added += 1
        except Exception:
            pass

    return jsonify({'success': True, 'message': f'{added} student(s) added to team'})


@team_bp.route('/<id>/members/<student_id>', methods=['DELETE'])
@jwt_required()
@role_required('teacher', 'admin')
def remove_team_member(id, student_id):
    db = current_app.config['db']
    try:
        s_oid = ObjectId(student_id)
        db.users.update_one({'_id': s_oid, 'team_id': str(id)}, {'$unset': {'team_id': ''}})
        db.team_members.delete_many({'team_id': str(id), 'student_id': str(student_id)})
        return jsonify({'success': True, 'message': 'Member removed from team'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@team_bp.route('/available-students', methods=['GET'])
@jwt_required()
@role_required('teacher', 'admin')
def get_available_students():
    db = current_app.config['db']
    grade = request.args.get('grade', '')
    division = request.args.get('division', '')

    query = {'role': 'student', 'status': 'active'}
    if grade:
        g_int = int(grade) if grade.isdigit() else grade
        query['grade'] = {'$in': [grade, g_int]}
    if division:
        query['division'] = division.upper()

    students = list(db.users.find(query, {'password_hash': 0, 'otp_hash': 0}).sort('roll_number', 1))

    all_teams = {str(t['_id']): t.get('name') for t in db.teams.find({}, {'name': 1})}

    result = []
    for s in students:
        s_id = str(s['_id'])
        t_id = s.get('team_id')
        result.append({
            '_id': s_id,
            'full_name': s.get('full_name') or s.get('name', 'Student'),
            'roll_number': s.get('roll_number', ''),
            'email': s.get('email', ''),
            'grade': str(s.get('grade', '')),
            'division': str(s.get('division', '')),
            'points': int(s.get('points', 0)),
            'team_id': str(t_id) if t_id else None,
            'team_name': all_teams.get(str(t_id)) if t_id else None,
            'has_team': bool(t_id)
        })

    return jsonify({'success': True, 'data': result})


@team_bp.route('/join', methods=['POST'])
@jwt_required()
def join_team():
    db = current_app.config['db']
    user_id = get_jwt_identity()
    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    data = request.get_json(silent=True) or {}
    code = (data.get('code') or '').strip().upper()
    team_id = (data.get('team_id') or '').strip()

    team = None
    if code:
        team = db.teams.find_one({'code': code, 'status': 'active'})
    elif team_id and ObjectId.is_valid(team_id):
        team = db.teams.find_one({'_id': ObjectId(team_id), 'status': 'active'})

    if not team:
        return jsonify({'success': False, 'message': 'Invalid team code or team is inactive'}), 404

    tid_str = str(team['_id'])

    # Check if student is already in a squad
    current_team_id = user.get('team_id')
    switch = bool(data.get('switch', False))
    if current_team_id:
        if str(current_team_id) == tid_str:
            team['_id'] = tid_str
            return jsonify({
                'success': True,
                'message': f'You are already a member of "{team.get("name")}"',
                'data': team
            })
        elif not switch:
            current_team = db.teams.find_one({'_id': ObjectId(current_team_id) if ObjectId.is_valid(str(current_team_id)) else current_team_id})
            c_name = current_team.get('name') if current_team else 'another squad'
            return jsonify({
                'success': False,
                'can_switch': True,
                'current_team_name': c_name,
                'message': f'You are already enrolled in "{c_name}". Each student can belong to 1 squad at a time. Do you want to switch to "{team.get("name")}"?'
            }), 400
        else:
            # User confirmed switch: remove from previous squad first
            db.team_members.delete_many({'student_id': str(user_id)})
            db.users.update_one({'_id': ObjectId(user_id)}, {'$unset': {'team_id': ''}})

    # Optional grade verification (normalized)
    student_grade = str(user.get('grade', '')).replace('Grade', '').strip()
    team_grade = str(team.get('grade', '')).replace('Grade', '').strip()
    if student_grade and team_grade and student_grade != team_grade:
        return jsonify({
            'success': False,
            'message': f'This squad belongs to Grade {team_grade}. You are enrolled in Grade {student_grade}.'
        }), 400

    # Capacity check
    max_members = team.get('max_members', 6)
    current_count = db.users.count_documents({'team_id': tid_str, 'role': 'student'})
    if current_count >= max_members:
        return jsonify({'success': False, 'message': f'Squad is already full (max {max_members} members)'}), 400

    # Assign team
    db.users.update_one({'_id': ObjectId(user_id)}, {'$set': {'team_id': tid_str}})
    db.team_members.delete_many({'student_id': str(user_id)})
    db.team_members.insert_one({
        'team_id': tid_str,
        'student_id': str(user_id),
        'joined_at': datetime.utcnow()
    })

    team['_id'] = tid_str
    return jsonify({
        'success': True,
        'message': f'Welcome! You have successfully joined "{team.get("name")}"',
        'data': team
    })


@team_bp.route('/leave', methods=['POST'])
@jwt_required()
def leave_team():
    db = current_app.config['db']
    user_id = get_jwt_identity()
    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    if not user.get('team_id'):
        return jsonify({'success': False, 'message': 'You are not a member of any squad team'}), 400

    tid = str(user['team_id'])
    db.users.update_one({'_id': ObjectId(user_id)}, {'$unset': {'team_id': ''}})
    db.team_members.delete_many({'student_id': str(user_id)})
    return jsonify({'success': True, 'message': 'Successfully left the squad'})
