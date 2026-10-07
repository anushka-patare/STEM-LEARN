"""Learning path routes."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from middleware.role_middleware import role_required
learning_path_bp = Blueprint('learning_paths', __name__)

@learning_path_bp.route('', methods=['GET'])
@jwt_required()
def get_learning_paths():
    db = current_app.config['db']
    grade = request.args.get('grade', '')
    subject_id = request.args.get('subject_id', '')
    query = {}
    if grade: query['grade'] = grade
    if subject_id: query['subject_id'] = subject_id
    paths = list(db.learning_paths.find(query).sort('created_at', -1))
    for p in paths: p['_id'] = str(p['_id'])
    return jsonify({'success': True, 'data': paths})

@learning_path_bp.route('', methods=['POST'])
@jwt_required()
@role_required('teacher', 'admin')
def create_learning_path():
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    path = {
        'title': data.get('title', ''), 'grade': data.get('grade', ''),
        'subject_id': data.get('subject_id', ''), 'category_id': data.get('category_id', ''),
        'chapter_id': data.get('chapter_id', ''), 'description': data.get('description', ''),
        'quizzes': data.get('quizzes', []), 'passing_percentage': int(data.get('passing_percentage', 70)),
        'status': 'draft', 'created_by': get_jwt_identity(),
        'created_at': datetime.utcnow(), 'updated_at': datetime.utcnow()
    }
    result = db.learning_paths.insert_one(path)
    path['_id'] = str(result.inserted_id)
    return jsonify({'success': True, 'message': 'Learning path created', 'data': path}), 201

@learning_path_bp.route('/<id>', methods=['PUT'])
@jwt_required()
@role_required('teacher', 'admin')
def update_learning_path(id):
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    try:
        update = {'updated_at': datetime.utcnow()}
        for f in ['title', 'description', 'quizzes', 'passing_percentage', 'status', 'grade', 'subject_id', 'category_id', 'chapter_id']:
            if f in data: update[f] = data[f]
        db.learning_paths.update_one({'_id': ObjectId(id)}, {'$set': update})
        return jsonify({'success': True, 'message': 'Updated'})
    except Exception:
        return jsonify({'success': False, 'message': 'Error'}), 500

@learning_path_bp.route('/<id>', methods=['DELETE'])
@jwt_required()
@role_required('teacher', 'admin')
def delete_learning_path(id):
    db = current_app.config['db']
    try:
        db.learning_paths.delete_one({'_id': ObjectId(id)})
        return jsonify({'success': True, 'message': 'Deleted'})
    except Exception:
        return jsonify({'success': False, 'message': 'Error'}), 500
