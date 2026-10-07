"""Authentication middleware for JWT verification."""
from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from bson import ObjectId


def jwt_required_custom(fn):
    """Custom JWT required decorator that adds user info to request."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            claims = get_jwt()
            user_id = get_jwt_identity()

            # Attach user info to request
            request.user_id = user_id
            request.user_role = claims.get('role', '')

            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({
                'success': False,
                'message': 'Authentication required',
                'error_code': 'AUTH_REQUIRED'
            }), 401
    return wrapper


def get_current_user(db):
    """Get the current user from the database."""
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', '')

    try:
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if user:
            user['_id'] = str(user['_id'])
            # Remove sensitive fields
            user.pop('password_hash', None)
        return user
    except Exception:
        return None
