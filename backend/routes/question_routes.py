"""Question management routes with flexible bank search and import/export."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from bson import ObjectId
from datetime import datetime
from middleware.role_middleware import role_required
from utils.validators import sanitize_string

question_bp = Blueprint('questions', __name__)


@question_bp.route('', methods=['GET'])
@jwt_required()
def get_questions():
    """Get questions with optional filtering by quiz_id, grade, subject_id, chapter_id, difficulty, or search."""
    db = current_app.config['db']
    quiz_id = request.args.get('quiz_id', '').strip()
    chapter_id = request.args.get('chapter_id', '').strip()
    subject_id = request.args.get('subject_id', '').strip()
    category_id = request.args.get('category_id', '').strip()
    bloom_level = request.args.get('bloom_level', '').strip()
    grade = request.args.get('grade', '').strip()
    difficulty = request.args.get('difficulty', '').strip()
    search = request.args.get('search', '').strip()
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 200))

    query = {}
    if quiz_id:
        query['quiz_id'] = quiz_id
    if chapter_id:
        query['chapter_id'] = chapter_id
    if subject_id:
        query['subject_id'] = subject_id
    if category_id:
        query['category_id'] = category_id
    if bloom_level and bloom_level != 'all':
        query['bloom_level'] = bloom_level
    if grade and grade != 'all':
        query['grade'] = grade
    if difficulty and difficulty != 'all':
        query['difficulty'] = difficulty
    if search:
        query['$or'] = [
            {'question': {'$regex': search, '$options': 'i'}},
            {'topic': {'$regex': search, '$options': 'i'}},
            {'explanation': {'$regex': search, '$options': 'i'}}
        ]

    try:
        total = db.questions.count_documents(query)
        questions = list(db.questions.find(query)
                        .sort([('order', 1), ('created_at', -1)])
                        .skip((page - 1) * limit)
                        .limit(limit))

        # Preload chapters map for friendly labels
        chapters_map = {str(c['_id']): c.get('name', 'General') for c in db.chapters.find({}, {'name': 1})}

        for q in questions:
            q['_id'] = str(q['_id'])
            if q.get('quiz_id'):
                q['quiz_id'] = str(q['quiz_id'])
            if q.get('chapter_id'):
                q['chapter_id'] = str(q['chapter_id'])
                q['chapter_name'] = chapters_map.get(str(q['chapter_id']), 'General')
            if q.get('subject_id'):
                q['subject_id'] = str(q['subject_id'])
            if q.get('category_id'):
                q['category_id'] = str(q['category_id'])
            if q.get('created_by'):
                q['created_by'] = str(q['created_by'])

        pages = (total + limit - 1) // limit if total > 0 else 0
        return jsonify({
            'success': True,
            'data': {
                'questions': questions,
                'total': total,
                'page': page,
                'pages': pages
            }
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500



@question_bp.route('', methods=['POST'])
@jwt_required()
@role_required('teacher', 'admin')
def create_question():
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    required = ['question', 'correct_answer']
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({'success': False, 'message': f'Missing: {", ".join(missing)}'}), 400

    question = {
        'quiz_id': str(data.get('quiz_id', '')),
        'subject_id': str(data.get('subject_id', '')),
        'category_id': str(data.get('category_id', '')),
        'chapter_id': str(data.get('chapter_id', '')),
        'grade': sanitize_string(str(data.get('grade', '7'))),
        'question': sanitize_string(data['question']),
        'question_type': data.get('question_type', 'mcq'),
        'option_a': sanitize_string(data.get('option_a', '')),
        'option_b': sanitize_string(data.get('option_b', '')),
        'option_c': sanitize_string(data.get('option_c', '')),
        'option_d': sanitize_string(data.get('option_d', '')),
        'correct_answer': str(data['correct_answer']).strip().upper(),
        'explanation': sanitize_string(data.get('explanation', '')),
        'bloom_level': sanitize_string(data.get('bloom_level', 'Remembering')),
        'marks': int(data.get('marks', 1)),
        'difficulty': data.get('difficulty', 'medium'),
        'topic': sanitize_string(data.get('topic', '')),
        'order': int(data.get('order', 0)),
        'created_by': get_jwt_identity(),
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }

    result = db.questions.insert_one(question)
    question['_id'] = str(result.inserted_id)
    return jsonify({'success': True, 'message': 'Question created successfully', 'data': question}), 201


@question_bp.route('/<id>', methods=['PUT'])
@jwt_required()
@role_required('teacher', 'admin')
def update_question(id):
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    if not ObjectId.is_valid(id):
        return jsonify({'success': False, 'message': 'Invalid Question ID'}), 400

    try:
        update = {'updated_at': datetime.utcnow()}
        allowed = ['question', 'option_a', 'option_b', 'option_c', 'option_d',
                   'correct_answer', 'explanation', 'marks', 'difficulty', 'topic',
                   'order', 'question_type', 'quiz_id', 'chapter_id', 'subject_id',
                   'category_id', 'grade', 'bloom_level']
        for f in allowed:
            if f in data:
                update[f] = data[f]

        result = db.questions.update_one({'_id': ObjectId(id)}, {'$set': update})
        if result.matched_count == 0:
            return jsonify({'success': False, 'message': 'Question not found'}), 404
        return jsonify({'success': True, 'message': 'Question updated successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error updating question: {str(e)}'}), 500


@question_bp.route('/<id>', methods=['DELETE'])
@jwt_required()
@role_required('teacher', 'admin')
def delete_question(id):
    db = current_app.config['db']
    if not ObjectId.is_valid(id):
        return jsonify({'success': False, 'message': 'Invalid Question ID'}), 400

    try:
        result = db.questions.delete_one({'_id': ObjectId(id)})
        if result.deleted_count == 0:
            return jsonify({'success': False, 'message': 'Question not found'}), 404
        return jsonify({'success': True, 'message': 'Question deleted successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error deleting question: {str(e)}'}), 500


@question_bp.route('/bulk', methods=['POST'])
@jwt_required()
@role_required('teacher', 'admin')
def bulk_create_questions():
    """Create multiple questions at once (used by AI generator and CSV importer)."""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    questions = data.get('questions', [])
    quiz_id = str(data.get('quiz_id', '')).strip()
    chapter_id = str(data.get('chapter_id', '')).strip()
    subject_id = str(data.get('subject_id', '')).strip()
    grade = str(data.get('grade', '7')).strip()

    if not questions:
        return jsonify({'success': False, 'message': 'Questions list required'}), 400

    created = []
    for q in questions:
        q_quiz_id = str(q.get('quiz_id', quiz_id))
        question_doc = {
            'quiz_id': q_quiz_id,
            'subject_id': str(q.get('subject_id', subject_id)),
            'chapter_id': str(q.get('chapter_id', chapter_id)),
            'grade': str(q.get('grade', grade)),
            'question': sanitize_string(q.get('question', '')),
            'question_type': q.get('question_type', 'mcq'),
            'option_a': sanitize_string(q.get('option_a', '')),
            'option_b': sanitize_string(q.get('option_b', '')),
            'option_c': sanitize_string(q.get('option_c', '')),
            'option_d': sanitize_string(q.get('option_d', '')),
            'correct_answer': str(q.get('correct_answer', 'A')).strip().upper(),
            'explanation': sanitize_string(q.get('explanation', '')),
            'bloom_level': sanitize_string(q.get('bloom_level', 'Understanding')),
            'marks': int(q.get('marks', 1)),
            'difficulty': q.get('difficulty', 'medium'),
            'topic': sanitize_string(q.get('topic', '')),
            'order': len(created) + 1,
            'created_by': user_id,
            'status': q.get('status', 'active'),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = db.questions.insert_one(question_doc)
        question_doc['_id'] = str(result.inserted_id)
        created.append(question_doc)

    return jsonify({'success': True, 'message': f'{len(created)} questions saved to question bank', 'data': created}), 201

