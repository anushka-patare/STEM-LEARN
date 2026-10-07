"""Class management routes."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from middleware.role_middleware import admin_required, role_required
from utils.validators import sanitize_string

class_bp = Blueprint('classes', __name__)


@class_bp.route('', methods=['GET'])
@jwt_required()
def get_classes():
    db = current_app.config['db']
    user_id = get_jwt_identity()
    user = db.users.find_one({'_id': ObjectId(user_id)}) if user_id and ObjectId.is_valid(user_id) else None
    role = user.get('role', '') if user else ''

    grade = request.args.get('grade', '')
    query = {}
    if grade:
        query['grade'] = str(grade)

    classes = list(db.classes.find(query).sort([('grade', 1), ('division', 1)]))

    # Pre-fetch all teachers with their subjects and assignments
    all_teachers = list(db.users.find(
        {'role': 'teacher'},
        {
            '_id': 1, 'name': 1, 'full_name': 1, 'email': 1,
            'subject': 1, 'assigned_subject': 1, 'subject_specialization': 1,
            'assigned_grade': 1, 'assigned_division': 1, 'assigned_classes': 1
        }
    ))

    teacher_map = {}
    for t in all_teachers:
        tid = str(t['_id'])
        tname = t.get('full_name') or t.get('name') or t.get('email') or 'Teacher'
        tsubject = t.get('assigned_subject') or t.get('subject') or t.get('subject_specialization') or 'General STEM'
        teacher_map[tid] = {
            'id': tid,
            'name': tname,
            'email': t.get('email', ''),
            'subject': tsubject,
            'assigned_grade': str(t.get('assigned_grade', '')),
            'assigned_division': str(t.get('assigned_division', '')).upper(),
            'assigned_classes': t.get('assigned_classes') or []
        }

    for c in classes:
        c['_id'] = str(c['_id'])
        g = str(c.get('grade', ''))
        d = str(c.get('division', '')).upper()
        c_label = f"Grade {g}-{d}"

        # 1. Count enrolled students in this class
        c['students_count'] = db.users.count_documents({
            'role': 'student',
            'grade': g,
            'division': d
        })

        # 2. Resolve all supervising/subject teachers for this class
        assigned_teachers = []
        assigned_tids = set()

        # From class's teacher_ids list
        raw_tids = c.get('teacher_ids') or []
        if isinstance(raw_tids, list):
            for tid in raw_tids:
                if str(tid):
                    assigned_tids.add(str(tid))

        # From class's single teacher_id
        if c.get('teacher_id'):
            assigned_tids.add(str(c['teacher_id']))

        # Also match teachers assigned to this grade & division or having class in assigned_classes
        for tid, tinfo in teacher_map.items():
            if (tinfo['assigned_grade'] == g and tinfo['assigned_division'] == d) or (c_label in tinfo['assigned_classes']):
                assigned_tids.add(tid)

        for tid in assigned_tids:
            if tid in teacher_map:
                assigned_teachers.append(teacher_map[tid])

        c['teachers'] = assigned_teachers
        c['teachers_count'] = len(assigned_teachers)
        c['teacher_ids'] = [t['id'] for t in assigned_teachers]
        c['teacher_name'] = ', '.join([t['name'] for t in assigned_teachers]) if assigned_teachers else 'Unassigned'

        if 'mode' not in c:
            c['mode'] = 'Collaborative'
        if 'name' not in c:
            c['name'] = c_label

    # If the user is a teacher, filter ONLY to classes assigned to this teacher!
    if role == 'teacher':
        classes = [c for c in classes if str(user_id) in c.get('teacher_ids', [])]

    return jsonify({'success': True, 'data': classes})


@class_bp.route('', methods=['POST'])
@jwt_required()
@admin_required
def create_class():
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}

    grade = sanitize_string(str(data.get('grade', ''))).strip()
    division = sanitize_string(str(data.get('division', ''))).strip().upper()
    mode = data.get('mode', 'Collaborative')
    mode_locked = bool(data.get('mode_locked', False))

    if not grade or not division:
        return jsonify({'success': False, 'message': 'Grade and division required', 'error_code': 'MISSING_FIELDS'}), 400

    if grade not in ['6', '7', '8', '9']:
        return jsonify({'success': False, 'message': 'Grade must be 6, 7, 8, or 9', 'error_code': 'INVALID_GRADE'}), 400

    # Check duplicate
    if db.classes.find_one({'grade': grade, 'division': division}):
        return jsonify({'success': False, 'message': f'Class Grade {grade}-{division} already exists', 'error_code': 'DUPLICATE'}), 409

    # Handle multiple teacher assignments
    raw_teacher_ids = data.get('teacher_ids') or []
    if isinstance(raw_teacher_ids, str):
        raw_teacher_ids = [t.strip() for t in raw_teacher_ids.split(',') if t.strip()]
    if not raw_teacher_ids and data.get('teacher_id'):
        raw_teacher_ids = [str(data['teacher_id']).strip()]

    valid_oids = [ObjectId(tid) for tid in raw_teacher_ids if ObjectId.is_valid(tid)]
    teacher_docs = list(db.users.find({'_id': {'$in': valid_oids}, 'role': 'teacher'}))
    assigned_tids = [str(t['_id']) for t in teacher_docs]
    teacher_names = [t.get('full_name') or t.get('name') or 'Teacher' for t in teacher_docs]

    class_label = f"Grade {grade}-{division}"

    # Sync assigned_classes on each teacher
    for t_doc in teacher_docs:
        db.users.update_one(
            {'_id': t_doc['_id']},
            {
                '$addToSet': {'assigned_classes': class_label},
                '$set': {
                    'assigned_grade': str(grade),
                    'assigned_division': str(division)
                }
            }
        )

    cls = {
        'name': class_label,
        'grade': grade,
        'division': division,
        'teacher_ids': assigned_tids,
        'teacher_id': assigned_tids[0] if assigned_tids else '',
        'teacher_name': ', '.join(teacher_names) if teacher_names else 'Unassigned',
        'mode': mode,
        'mode_locked': mode_locked,
        'status': 'active',
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    result = db.classes.insert_one(cls)
    cls['_id'] = str(result.inserted_id)
    cls['students_count'] = 0
    cls['teachers_count'] = len(assigned_tids)
    cls['teachers'] = [
        {
            'id': str(t['_id']),
            'name': t.get('full_name') or t.get('name') or 'Teacher',
            'email': t.get('email', ''),
            'subject': t.get('assigned_subject') or t.get('subject') or t.get('subject_specialization') or 'General STEM'
        }
        for t in teacher_docs
    ]

    return jsonify({'success': True, 'message': f'Class {cls["name"]} created successfully', 'data': cls}), 201


@class_bp.route('/<id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_class(id):
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}

    if not ObjectId.is_valid(id):
        return jsonify({'success': False, 'message': 'Invalid Class ID', 'error_code': 'INVALID_ID'}), 400

    try:
        existing_cls = db.classes.find_one({'_id': ObjectId(id)})
        if not existing_cls:
            return jsonify({'success': False, 'message': 'Class not found', 'error_code': 'NOT_FOUND'}), 404

        old_tids = set()
        if existing_cls.get('teacher_ids'):
            for tid in existing_cls['teacher_ids']:
                if tid:
                    old_tids.add(str(tid))
        if existing_cls.get('teacher_id'):
            old_tids.add(str(existing_cls['teacher_id']))

        update = {'updated_at': datetime.utcnow()}
        if 'grade' in data:
            g = sanitize_string(str(data['grade'])).strip()
            if g in ['6', '7', '8', '9']:
                update['grade'] = g
        if 'division' in data:
            update['division'] = sanitize_string(str(data['division'])).strip().upper()

        g = update.get('grade', existing_cls.get('grade', '7'))
        d = update.get('division', existing_cls.get('division', 'A'))
        class_label = f"Grade {g}-{d}"
        update['name'] = class_label

        # Handle teachers update (array of teacher_ids or single teacher_id)
        if 'teacher_ids' in data or 'teacher_id' in data:
            raw_tids = data.get('teacher_ids')
            if raw_tids is None and 'teacher_id' in data:
                single_tid = str(data['teacher_id']).strip()
                raw_tids = [single_tid] if single_tid else []
            elif isinstance(raw_tids, str):
                raw_tids = [t.strip() for t in raw_tids.split(',') if t.strip()]

            valid_oids = [ObjectId(tid) for tid in raw_tids if ObjectId.is_valid(tid)]
            new_teacher_docs = list(db.users.find({'_id': {'$in': valid_oids}, 'role': 'teacher'}))
            new_tids = [str(t['_id']) for t in new_teacher_docs]
            teacher_names = [t.get('full_name') or t.get('name') or 'Teacher' for t in new_teacher_docs]

            update['teacher_ids'] = new_tids
            update['teacher_id'] = new_tids[0] if new_tids else ''
            update['teacher_name'] = ', '.join(teacher_names) if teacher_names else 'Unassigned'

            # 1. Add this class to newly assigned teachers
            for t_doc in new_teacher_docs:
                db.users.update_one(
                    {'_id': t_doc['_id']},
                    {
                        '$addToSet': {'assigned_classes': class_label},
                        '$set': {
                            'assigned_grade': str(g),
                            'assigned_division': str(d)
                        }
                    }
                )

            # 2. Remove this class from unassigned teachers
            removed_tids = old_tids - set(new_tids)
            for r_tid in removed_tids:
                if ObjectId.is_valid(r_tid):
                    db.users.update_one(
                        {'_id': ObjectId(r_tid)},
                        {'$pull': {'assigned_classes': class_label}}
                    )
        elif 'teacher_name' in data:
            update['teacher_name'] = sanitize_string(str(data['teacher_name'])).strip() or 'Unassigned'

        if 'mode' in data:
            update['mode'] = data['mode']
        if 'mode_locked' in data:
            update['mode_locked'] = bool(data['mode_locked'])
        if 'status' in data:
            update['status'] = data['status']

        result = db.classes.update_one({'_id': ObjectId(id)}, {'$set': update})
        if result.matched_count == 0:
            return jsonify({'success': False, 'message': 'Class not found', 'error_code': 'NOT_FOUND'}), 404

        updated_doc = db.classes.find_one({'_id': ObjectId(id)})
        if updated_doc:
            updated_doc['_id'] = str(updated_doc['_id'])
            updated_doc['students_count'] = db.users.count_documents({
                'role': 'student',
                'grade': str(updated_doc.get('grade')),
                'division': str(updated_doc.get('division')).upper()
            })

            # Fetch fresh teacher objects
            current_tids = [ObjectId(tid) for tid in updated_doc.get('teacher_ids', []) if ObjectId.is_valid(tid)]
            t_docs = list(db.users.find({'_id': {'$in': current_tids}}))
            updated_doc['teachers'] = [
                {
                    'id': str(t['_id']),
                    'name': t.get('full_name') or t.get('name') or 'Teacher',
                    'email': t.get('email', ''),
                    'subject': t.get('assigned_subject') or t.get('subject') or t.get('subject_specialization') or 'General STEM'
                }
                for t in t_docs
            ]
            updated_doc['teachers_count'] = len(updated_doc['teachers'])

        return jsonify({'success': True, 'message': 'Class updated successfully', 'data': updated_doc})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error updating class: {str(e)}', 'error_code': 'UPDATE_ERROR'}), 500


@class_bp.route('/<id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_class(id):
    db = current_app.config['db']
    if not ObjectId.is_valid(id):
        return jsonify({'success': False, 'message': 'Invalid Class ID', 'error_code': 'INVALID_ID'}), 400

    try:
        cls_to_delete = db.classes.find_one({'_id': ObjectId(id)})
        if cls_to_delete:
            class_label = f"Grade {cls_to_delete.get('grade')}-{cls_to_delete.get('division')}"
            # Remove class from teachers' assigned_classes
            db.users.update_many(
                {'role': 'teacher'},
                {'$pull': {'assigned_classes': class_label}}
            )

        result = db.classes.delete_one({'_id': ObjectId(id)})
        if result.deleted_count == 0:
            return jsonify({'success': False, 'message': 'Class not found', 'error_code': 'NOT_FOUND'}), 404
        return jsonify({'success': True, 'message': 'Class deleted successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error deleting class: {str(e)}', 'error_code': 'DELETE_ERROR'}), 500
