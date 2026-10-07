"""Authentication routes for Student, Teacher, and Admin portals.

Enforces Username + Password authentication across all roles.
Email is used strictly for password reset tokens and official notifications.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from middleware.auth_middleware import jwt_required_custom
from services.auth_service import authenticate_user, register_student, register_teacher, change_user_password
from services.password_reset_service import request_password_reset, verify_reset_token, reset_password_with_token, reset_password_direct

auth_bp = Blueprint('auth', __name__)


# ─── 1. UNIVERSAL & ROLE LOGIN (USERNAME + PASSWORD) ───────────
@auth_bp.route('/login', methods=['POST'])
def universal_login():
    """Universal login with Username + Password."""
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    identifier = data.get('username') or data.get('email') or data.get('identifier', '')
    password = data.get('password', '')
    role = data.get('role', '')  # optional filter

    ip_address = request.remote_addr or '127.0.0.1'
    user_agent = request.user_agent.string if request.user_agent else ''

    success, message, payload, status_code = authenticate_user(
        db, identifier, password, role, ip_address, user_agent
    )

    if not success:
        return jsonify({'success': False, 'message': message}), status_code

    return jsonify({
        'success': True,
        'message': message,
        'data': payload
    }), status_code


@auth_bp.route('/admin/login', methods=['POST'])
def admin_login():
    """Admin portal login (Username + Password)."""
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    identifier = data.get('username') or data.get('email') or data.get('identifier', '')
    password = data.get('password', '')
    ip_address = request.remote_addr or '127.0.0.1'
    user_agent = request.user_agent.string if request.user_agent else ''

    success, message, payload, status_code = authenticate_user(
        db, identifier, password, 'admin', ip_address, user_agent
    )
    if not success:
        return jsonify({'success': False, 'message': message}), status_code
    return jsonify({'success': True, 'message': message, 'data': payload}), status_code


@auth_bp.route('/teacher/login', methods=['POST'])
def teacher_login():
    """Teacher portal login (Username/Employee ID + Password)."""
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    identifier = data.get('username') or data.get('email') or data.get('identifier', '')
    password = data.get('password', '')
    ip_address = request.remote_addr or '127.0.0.1'
    user_agent = request.user_agent.string if request.user_agent else ''

    success, message, payload, status_code = authenticate_user(
        db, identifier, password, 'teacher', ip_address, user_agent
    )
    if not success:
        return jsonify({'success': False, 'message': message}), status_code
    return jsonify({'success': True, 'message': message, 'data': payload}), status_code


@auth_bp.route('/student/login', methods=['POST'])
def student_login():
    """Student portal login (Username/Roll No + Password)."""
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    identifier = data.get('username') or data.get('email') or data.get('identifier', '')
    password = data.get('password', '')
    ip_address = request.remote_addr or '127.0.0.1'
    user_agent = request.user_agent.string if request.user_agent else ''

    success, message, payload, status_code = authenticate_user(
        db, identifier, password, 'student', ip_address, user_agent
    )
    if not success:
        return jsonify({'success': False, 'message': message}), status_code
    return jsonify({'success': True, 'message': message, 'data': payload}), status_code


# ─── 2. REGISTRATION ───────────────────────────────────────────
@auth_bp.route('/register/student', methods=['POST'])
@auth_bp.route('/student/register', methods=['POST'])
def student_register():
    """Student self-registration for Grades 6–9."""
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    ip_address = request.remote_addr or '127.0.0.1'

    success, message, payload, status_code = register_student(db, data, ip_address)
    if not success:
        return jsonify({'success': False, 'message': message}), status_code
    return jsonify({'success': True, 'message': message, 'data': payload}), status_code


@auth_bp.route('/register/teacher', methods=['POST'])
@auth_bp.route('/teacher/register', methods=['POST'])
def teacher_register():
    """Teacher self-registration (status pending, awaiting admin approval)."""
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    ip_address = request.remote_addr or '127.0.0.1'

    success, message, payload, status_code = register_teacher(db, data, ip_address)
    if not success:
        return jsonify({'success': False, 'message': message}), status_code
    return jsonify({'success': True, 'message': message, 'data': payload}), status_code


# ─── 3. FORGOT & RESET PASSWORD (DIRECT CREDENTIALS & TOKEN WORKFLOW) ───
@auth_bp.route('/reset-password-direct', methods=['POST'])
def reset_password_direct_route():
    """Directly reset password for student or teacher verifying current credentials."""
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    identifier = data.get('identifier') or data.get('username') or data.get('email', '')
    current_password = data.get('current_password', '')
    new_password = data.get('new_password') or data.get('password', '')
    ip_address = request.remote_addr or '127.0.0.1'

    success, message, status_code = reset_password_direct(
        db, identifier, current_password, new_password, ip_address
    )
    return jsonify({'success': success, 'message': message}), status_code


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Reset password directly if current_password provided, otherwise request email reset link."""
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    identifier = data.get('username') or data.get('email') or data.get('identifier', '')
    current_password = data.get('current_password')
    new_password = data.get('new_password') or data.get('password')
    ip_address = request.remote_addr or '127.0.0.1'

    # If current_password and new_password are provided, execute direct reset
    if current_password and new_password:
        success, message, status_code = reset_password_direct(
            db, identifier, current_password, new_password, ip_address
        )
        return jsonify({'success': success, 'message': message}), status_code

    app_url = request.headers.get('Origin') or request.host_url
    success, message = request_password_reset(db, identifier, ip_address, app_url)
    return jsonify({'success': True, 'message': message})


@auth_bp.route('/verify-reset-token', methods=['GET'])
def check_reset_token():
    """Validate reset token status before rendering password form."""
    db = current_app.config['db']
    token = request.args.get('token', '')

    valid, message, _ = verify_reset_token(db, token)
    if not valid:
        return jsonify({'success': False, 'message': message}), 400
    return jsonify({'success': True, 'message': 'Token is valid.'})


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Set new password with single-use reset token."""
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    token = data.get('token', '')
    new_password = data.get('password') or data.get('new_password', '')
    ip_address = request.remote_addr or '127.0.0.1'

    success, message = reset_password_with_token(db, token, new_password, ip_address)
    if not success:
        return jsonify({'success': False, 'message': message}), 400
    return jsonify({'success': True, 'message': message})


# ─── 4. AUTHENTICATED PASSWORD CHANGE ──────────────────────────
@auth_bp.route('/change-password', methods=['POST', 'PUT'])
@jwt_required_custom
def change_password():
    """Change password for authenticated user."""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    ip_address = request.remote_addr or '127.0.0.1'

    success, message, status_code = change_user_password(
        db, user_id, current_password, new_password, ip_address
    )
    if not success:
        return jsonify({'success': False, 'message': message}), status_code
    return jsonify({'success': True, 'message': message}), status_code


# ─── 5. USER SESSION & REFRESH ─────────────────────────────────
@auth_bp.route('/me', methods=['GET'])
@jwt_required_custom
def get_current_user():
    """Fetch profile of currently authenticated user."""
    from bson import ObjectId
    db = current_app.config['db']
    user_id = get_jwt_identity()

    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    user_payload = {
        'id': str(user['_id']),
        'user_id': str(user['_id']),
        'username': user.get('username'),
        'email': user.get('email'),
        'full_name': user.get('full_name') or user.get('name'),
        'role': user.get('role'),
        'grade': str(user.get('grade', '')),
        'division': user.get('division', ''),
        'photo': user.get('photo', ''),
        'profile_photo': user.get('profile_photo', {}),
        'must_change_password': bool(user.get('must_change_password', False)),
        'status': user.get('status', 'active'),
        'teacher_id': user.get('teacher_id', ''),
        'mobile': user.get('mobile', ''),
        'subject_specialization': user.get('subject_specialization') or user.get('specialization', ''),
        'education': user.get('education') or user.get('qualification', ''),
        'qualification': user.get('qualification') or user.get('education', ''),
        'assigned_grade': str(user.get('assigned_grade', user.get('grade', ''))),
        'assigned_division': str(user.get('assigned_division', user.get('division', ''))),
        'assigned_subject': user.get('assigned_subject') or user.get('subject', ''),
        'assigned_classes': user.get('assigned_classes', []),
        'roll_number': user.get('roll_number', '')
    }
    return jsonify({'success': True, 'data': user_payload})


@auth_bp.route('/logout', methods=['POST'])
@jwt_required_custom
def logout():
    """Logout current user."""
    # In future or redis blocklist, token can be recorded
    return jsonify({'success': True, 'message': 'Successfully logged out.'})
