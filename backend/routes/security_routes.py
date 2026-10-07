"""Security event routes."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from middleware.role_middleware import role_required
security_bp = Blueprint('security', __name__)

@security_bp.route('/events', methods=['GET'])
@jwt_required()
@role_required('teacher', 'admin')
def get_security_events():
    db = current_app.config['db']
    quiz_id = request.args.get('quiz_id', '')
    student_id = request.args.get('student_id', '')
    query = {}
    if quiz_id: query['quiz_id'] = quiz_id
    if student_id: query['student_id'] = student_id
    events = list(db.quiz_security_events.find(query).sort('timestamp', -1).limit(100))
    for e in events:
        e['_id'] = str(e['_id'])
        if e.get('timestamp'): e['timestamp'] = e['timestamp'].isoformat()
    return jsonify({'success': True, 'data': events})
