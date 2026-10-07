"""Chapter management routes with prerequisite tracking and passing criteria."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from bson import ObjectId
from datetime import datetime
from middleware.role_middleware import admin_required
from utils.validators import sanitize_string

chapter_bp = Blueprint('chapters', __name__)


@chapter_bp.route('', methods=['GET'])
@jwt_required()
def get_chapters():
    db = current_app.config['db']
    category_id = request.args.get('category_id', '')
    subject_id = request.args.get('subject_id', '')
    grade = request.args.get('grade', '')

    query = {}
    if category_id:
        query['category_id'] = category_id
    if subject_id:
        query['subject_id'] = subject_id
    if grade:
        query['grade'] = str(grade)

    chapters = list(db.chapters.find(query).sort([('grade', 1), ('order', 1), ('name', 1)]))
    
    # Preload categories, subjects, and all chapters for fast name resolution
    categories = {str(c['_id']): c.get('name', 'General') for c in db.categories.find({}, {'name': 1})}
    subjects = {str(s['_id']): s.get('name', 'STEM') for s in db.subjects.find({}, {'name': 1})}
    all_chapters_map = {str(ch['_id']): ch.get('name', '') for ch in db.chapters.find({}, {'name': 1})}

    for c in chapters:
        c['_id'] = str(c['_id'])
        c['quiz_count'] = db.quizzes.count_documents({'chapter_id': str(c['_id'])})
        c['category_name'] = categories.get(str(c.get('category_id', '')), 'General')
        c['subject_name'] = subjects.get(str(c.get('subject_id', '')), 'STEM')
        
        # Resolve prerequisite chapter names
        prereqs = c.get('prerequisite_chapter_ids', [])
        if isinstance(prereqs, str) and prereqs:
            prereqs = [prereqs]
        elif not isinstance(prereqs, list):
            prereqs = []
        c['prerequisite_chapter_ids'] = prereqs
        c['prerequisite_names'] = [all_chapters_map.get(pid, pid) for pid in prereqs if pid]
        c['passing_score_pct'] = c.get('passing_score_pct', 70)

    return jsonify({'success': True, 'data': chapters})


@chapter_bp.route('', methods=['POST'])
@jwt_required()
@admin_required
def create_chapter():
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    name = sanitize_string(data.get('name', ''))
    category_id = str(data.get('category_id', '')).strip()
    subject_id = str(data.get('subject_id', '')).strip()
    grade = sanitize_string(str(data.get('grade', '7'))).strip() or '7'
    description = sanitize_string(data.get('description', ''))
    try:
        order = int(data.get('order', 0))
    except (ValueError, TypeError):
        order = 0
    try:
        passing_score_pct = int(data.get('passing_score_pct', 70))
    except (ValueError, TypeError):
        passing_score_pct = 70
    prerequisite_chapter_ids = data.get('prerequisite_chapter_ids', [])
    if isinstance(prerequisite_chapter_ids, str):
        prerequisite_chapter_ids = [prerequisite_chapter_ids] if prerequisite_chapter_ids else []

    if not name or not category_id:
        return jsonify({'success': False, 'message': 'Chapter name and category are required', 'error_code': 'MISSING_FIELDS'}), 400

    # Auto-resolve subject_id if not supplied
    if not subject_id and ObjectId.is_valid(category_id):
        cat = db.categories.find_one({'_id': ObjectId(category_id)})
        if cat and cat.get('subject_id'):
            subject_id = str(cat['subject_id'])

    if order <= 0:
        count_existing = db.chapters.count_documents({'grade': grade})
        order = count_existing + 1

    chapter = {
        'name': name,
        'category_id': category_id,
        'subject_id': subject_id,
        'grade': grade,
        'description': description,
        'order': order,
        'passing_score_pct': passing_score_pct,
        'prerequisite_chapter_ids': prerequisite_chapter_ids,
        'status': 'active',
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    result = db.chapters.insert_one(chapter)
    chapter['_id'] = str(result.inserted_id)
    return jsonify({'success': True, 'message': 'Chapter created successfully', 'data': chapter}), 201


@chapter_bp.route('/<id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_chapter(id):
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    if not ObjectId.is_valid(id):
        return jsonify({'success': False, 'message': 'Invalid Chapter ID', 'error_code': 'INVALID_ID'}), 400

    try:
        update = {'updated_at': datetime.utcnow()}
        for f in ['name', 'description', 'category_id', 'subject_id', 'grade', 'status']:
            if f in data:
                update[f] = sanitize_string(str(data[f])) if f in ['name', 'description', 'grade', 'status'] else str(data[f])
        if 'order' in data:
            update['order'] = int(data['order'])
        if 'passing_score_pct' in data:
            update['passing_score_pct'] = int(data['passing_score_pct'])
        if 'prerequisite_chapter_ids' in data:
            prereqs = data['prerequisite_chapter_ids']
            update['prerequisite_chapter_ids'] = prereqs if isinstance(prereqs, list) else [str(prereqs)]

        result = db.chapters.update_one({'_id': ObjectId(id)}, {'$set': update})
        if result.matched_count == 0:
            return jsonify({'success': False, 'message': 'Chapter not found', 'error_code': 'NOT_FOUND'}), 404
        return jsonify({'success': True, 'message': 'Chapter updated successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error updating chapter: {str(e)}', 'error_code': 'UPDATE_ERROR'}), 500


@chapter_bp.route('/<id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_chapter(id):
    db = current_app.config['db']
    if not ObjectId.is_valid(id):
        return jsonify({'success': False, 'message': 'Invalid Chapter ID', 'error_code': 'INVALID_ID'}), 400

    try:
        result = db.chapters.delete_one({'_id': ObjectId(id)})
        if result.deleted_count == 0:
            return jsonify({'success': False, 'message': 'Chapter not found', 'error_code': 'NOT_FOUND'}), 404
        return jsonify({'success': True, 'message': 'Chapter deleted successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error deleting chapter: {str(e)}', 'error_code': 'DELETE_ERROR'}), 500

