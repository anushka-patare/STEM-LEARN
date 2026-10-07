"""Category management routes."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from bson import ObjectId
from datetime import datetime
from middleware.role_middleware import admin_required
from utils.validators import sanitize_string

category_bp = Blueprint('categories', __name__)


@category_bp.route('', methods=['GET'])
@jwt_required()
def get_categories():
    db = current_app.config['db']
    subject_id = request.args.get('subject_id', '')
    query = {}
    if subject_id:
        query['subject_id'] = subject_id
    categories = list(db.categories.find(query).sort('name', 1))
    
    # Pre-fetch subjects
    subjects = {str(s['_id']): s.get('name', 'General') for s in db.subjects.find({}, {'name': 1})}

    for c in categories:
        c['_id'] = str(c['_id'])
        c['chapter_count'] = db.chapters.count_documents({'category_id': str(c['_id'])})
        c['subject_name'] = subjects.get(str(c.get('subject_id', '')), 'STEM')
    return jsonify({'success': True, 'data': categories})


@category_bp.route('', methods=['POST'])
@jwt_required()
@admin_required
def create_category():
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    name = sanitize_string(data.get('name', ''))
    subject_id = data.get('subject_id', '')
    description = sanitize_string(data.get('description', ''))

    if not name or not subject_id:
        return jsonify({'success': False, 'message': 'Name and subject_id required', 'error_code': 'MISSING_FIELDS'}), 400

    category = {
        'name': name, 'subject_id': subject_id, 'description': description,
        'status': 'active', 'created_at': datetime.utcnow(), 'updated_at': datetime.utcnow()
    }
    result = db.categories.insert_one(category)
    category['_id'] = str(result.inserted_id)
    return jsonify({'success': True, 'message': 'Category created', 'data': category}), 201


@category_bp.route('/<id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_category(id):
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    try:
        update = {'updated_at': datetime.utcnow()}
        for f in ['name', 'description', 'subject_id', 'status']:
            if f in data:
                update[f] = sanitize_string(str(data[f])) if f != 'subject_id' else data[f]
        result = db.categories.update_one({'_id': ObjectId(id)}, {'$set': update})
        if result.matched_count == 0:
            return jsonify({'success': False, 'message': 'Category not found', 'error_code': 'NOT_FOUND'}), 404
        return jsonify({'success': True, 'message': 'Category updated'})
    except Exception:
        return jsonify({'success': False, 'message': 'Error', 'error_code': 'UPDATE_ERROR'}), 500


@category_bp.route('/<id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_category(id):
    db = current_app.config['db']
    try:
        result = db.categories.delete_one({'_id': ObjectId(id)})
        if result.deleted_count == 0:
            return jsonify({'success': False, 'message': 'Category not found', 'error_code': 'NOT_FOUND'}), 404
        return jsonify({'success': True, 'message': 'Category deleted'})
    except Exception:
        return jsonify({'success': False, 'message': 'Error', 'error_code': 'DELETE_ERROR'}), 500
