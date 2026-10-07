"""Subject management routes."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from bson import ObjectId
from datetime import datetime
from middleware.role_middleware import admin_required
from utils.validators import sanitize_string

subject_bp = Blueprint('subjects', __name__)


@subject_bp.route('', methods=['GET'])
@jwt_required()
def get_subjects():
    db = current_app.config['db']
    grade = request.args.get('grade', '')
    query = {}
    if grade:
        query['grade'] = grade
    subjects = list(db.subjects.find(query).sort('name', 1))
    for s in subjects:
        s['_id'] = str(s['_id'])
        s['category_count'] = db.categories.count_documents({'subject_id': str(s['_id'])})
    return jsonify({'success': True, 'data': subjects})


@subject_bp.route('', methods=['POST'])
@jwt_required()
@admin_required
def create_subject():
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    name = sanitize_string(data.get('name', '')).strip()
    code = sanitize_string(data.get('code', '')).strip().upper()
    description = sanitize_string(data.get('description', '')).strip()
    grade = sanitize_string(str(data.get('grade', ''))).strip()
    icon = sanitize_string(data.get('icon', '📚')).strip()

    if not name:
        return jsonify({'success': False, 'message': 'Subject name required', 'error_code': 'MISSING_FIELDS'}), 400

    if not code:
        code = name[:4].upper()

    subject = {
        'name': name, 'code': code, 'description': description, 'grade': grade,
        'icon': icon, 'status': 'active',
        'created_at': datetime.utcnow(), 'updated_at': datetime.utcnow()
    }
    result = db.subjects.insert_one(subject)
    subject['_id'] = str(result.inserted_id)
    subject['category_count'] = 0
    return jsonify({'success': True, 'message': 'Subject created', 'data': subject}), 201


@subject_bp.route('/<id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_subject(id):
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    try:
        update = {'updated_at': datetime.utcnow()}
        for f in ['name', 'code', 'description', 'grade', 'icon', 'status']:
            if f in data:
                val = sanitize_string(str(data[f]))
                if f == 'code':
                    val = val.upper()
                update[f] = val
        result = db.subjects.update_one({'_id': ObjectId(id)}, {'$set': update})
        if result.matched_count == 0:
            return jsonify({'success': False, 'message': 'Subject not found', 'error_code': 'NOT_FOUND'}), 404
        return jsonify({'success': True, 'message': 'Subject updated'})
    except Exception:
        return jsonify({'success': False, 'message': 'Error', 'error_code': 'UPDATE_ERROR'}), 500


@subject_bp.route('/<id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_subject(id):
    db = current_app.config['db']
    try:
        result = db.subjects.delete_one({'_id': ObjectId(id)})
        if result.deleted_count == 0:
            return jsonify({'success': False, 'message': 'Subject not found', 'error_code': 'NOT_FOUND'}), 404
        return jsonify({'success': True, 'message': 'Subject deleted'})
    except Exception:
        return jsonify({'success': False, 'message': 'Error', 'error_code': 'DELETE_ERROR'}), 500
