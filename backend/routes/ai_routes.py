"""AI routes - Live Google Gemini & Groq LLM integration with pedagogy guardrails."""
import os
import requests
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from middleware.role_middleware import role_required, student_required
from services.ai_service import generate_quiz_ai, student_ai_tutor, get_ai_settings

ai_bp = Blueprint('ai', __name__)


@ai_bp.route('/teacher/generate-quiz', methods=['POST'])
@jwt_required()
@role_required('teacher', 'admin')
def generate_quiz():
    db = current_app.config['db']
    data = request.get_json() or {}
    topic = data.get('topic', '').strip()
    subject = data.get('subject', 'Science').strip()
    grade = str(data.get('grade', '7'))
    num_questions = int(data.get('num_questions', 3))
    difficulty = data.get('difficulty', 'medium')

    if not topic:
        return jsonify({'success': False, 'message': 'Topic is required', 'error_code': 'VALIDATION_ERROR'}), 400

    num_questions = max(1, min(10, num_questions))
    questions = generate_quiz_ai(
        topic=topic,
        subject=subject,
        grade=grade,
        num_questions=num_questions,
        difficulty=difficulty,
        db=db
    )

    return jsonify({
        'success': True,
        'data': {
            'topic': topic,
            'subject': subject,
            'grade': grade,
            'difficulty': difficulty,
            'questions': questions
        }
    })


@ai_bp.route('/teacher/test-provider', methods=['POST'])
@jwt_required()
@role_required('teacher', 'admin')
def test_provider():
    db = current_app.config['db']
    data = request.get_json() or {}
    provider = data.get('provider')
    cfg = get_ai_settings(db)
    target = provider or cfg.get('primary', 'gemini')

    # Test key presence and basic ping
    if target == 'gemini':
        key = cfg.get('gemini_key') or os.getenv('GEMINI_API_KEY', '')
        if not key:
            return jsonify({'success': False, 'message': 'Gemini API key is not configured in settings or environment'}), 400
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
            res = requests.post(url, json={"contents": [{"parts": [{"text": "Hello, respond with 'OK'"}]}]}, timeout=10)
            if res.status_code == 200:
                return jsonify({'success': True, 'message': 'Gemini 1.5 Flash is active and responding successfully!', 'provider': 'gemini'})
            else:
                return jsonify({'success': False, 'message': f'Gemini returned HTTP {res.status_code}: {res.text[:120]}'}), 502
        except Exception as e:
            return jsonify({'success': False, 'message': f'Gemini connection error: {str(e)}'}), 500

    elif target == 'groq':
        key = cfg.get('groq_key') or os.getenv('GROQ_API_KEY', '')
        if not key:
            return jsonify({'success': False, 'message': 'Groq API key is not configured in settings or environment'}), 400
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
            payload = {"model": "qwen/qwen3.8-27b", "messages": [{"role": "user", "content": "ping"}], "max_tokens": 10}
            res = requests.post(url, headers=headers, json=payload, timeout=10)
            if res.status_code == 200:
                return jsonify({'success': True, 'message': 'Groq (qwen/qwen3.8-27b) is active and responding successfully!', 'provider': 'groq'})
            else:
                return jsonify({'success': False, 'message': f'Groq returned HTTP {res.status_code}: {res.text[:120]}'}), 502
        except Exception as e:
            return jsonify({'success': False, 'message': f'Groq connection error: {str(e)}'}), 500

    return jsonify({'success': False, 'message': f'Unknown AI provider: {target}'}), 400


@ai_bp.route('/student/chat', methods=['POST'])
@jwt_required()
@student_required
def student_chat():
    db = current_app.config['db']
    student_id = get_jwt_identity()
    data = request.get_json() or {}
    query = data.get('query', '').strip()

    if not query:
        return jsonify({'success': False, 'message': 'Query cannot be empty', 'error_code': 'VALIDATION_ERROR'}), 400

    # Get student's grade if available
    from bson import ObjectId
    student = db.users.find_one({'_id': ObjectId(student_id)}) if ObjectId.is_valid(student_id) else {}
    grade = data.get('grade') or student.get('grade', 7)

    result = student_ai_tutor(student_id=student_id, query=query, grade=grade, db=db)
    if not result.get('success'):
        status_code = 403 if result.get('error_code') == 'ACTIVE_EXAM_BLOCK' else (429 if result.get('error_code') == 'LIMIT_EXCEEDED' else 500)
        return jsonify(result), status_code

    return jsonify({
        'success': True,
        'data': {
            'response': result.get('response'),
            'student_id': student_id,
            'grade': grade
        }
    })


@ai_bp.route('/student/history', methods=['GET'])
@jwt_required()
@student_required
def chat_history():
    db = current_app.config['db']
    user_id = get_jwt_identity()
    history = list(db.ai_conversations.find({'student_id': user_id}).sort('timestamp', -1).limit(50))
    for h in history:
        h['_id'] = str(h['_id'])
        if h.get('timestamp'):
            h['timestamp'] = h['timestamp'].isoformat()
    return jsonify({'success': True, 'data': history})
