"""Role-based access control middleware."""
from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import get_jwt


def role_required(*allowed_roles):
    """Decorator to restrict access to specific roles."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('role', '')

            if user_role not in allowed_roles:
                return jsonify({
                    'success': False,
                    'message': 'Access denied. Insufficient permissions.',
                    'error_code': 'FORBIDDEN'
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def admin_required(fn):
    """Decorator to restrict access to admin only."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({
                'success': False,
                'message': 'Admin access required',
                'error_code': 'ADMIN_REQUIRED'
            }), 403
        return fn(*args, **kwargs)
    return wrapper


def teacher_required(fn):
    """Decorator to restrict access to teachers only."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') != 'teacher':
            return jsonify({
                'success': False,
                'message': 'Teacher access required',
                'error_code': 'TEACHER_REQUIRED'
            }), 403
        return fn(*args, **kwargs)
    return wrapper


def student_required(fn):
    """Decorator to restrict access to students only."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') != 'student':
            return jsonify({
                'success': False,
                'message': 'Student access required',
                'error_code': 'STUDENT_REQUIRED'
            }), 403
        return fn(*args, **kwargs)
    return wrapper
