"""Request validation middleware."""
from flask import request, jsonify
from functools import wraps
from utils.validators import sanitize_string, validate_object_id
from utils.security import sanitize_mongo_query


def validate_json(fn):
    """Ensure request has valid JSON body."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not request.is_json:
            return jsonify({
                'success': False,
                'message': 'Request must be JSON',
                'error_code': 'INVALID_CONTENT_TYPE'
            }), 400
        return fn(*args, **kwargs)
    return wrapper


def validate_required_fields(*required_fields):
    """Validate that required fields are present in request JSON."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            data = request.get_json(silent=True)
            if not data:
                return jsonify({
                    'success': False,
                    'message': 'Request body is required',
                    'error_code': 'MISSING_BODY'
                }), 400

            missing = []
            for field in required_fields:
                if field not in data or data[field] is None or (isinstance(data[field], str) and not data[field].strip()):
                    missing.append(field)

            if missing:
                return jsonify({
                    'success': False,
                    'message': f'Missing required fields: {", ".join(missing)}',
                    'error_code': 'MISSING_FIELDS'
                }), 400

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def validate_object_id_param(param_name='id'):
    """Validate that a URL parameter is a valid MongoDB ObjectId."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            param_value = kwargs.get(param_name, '')
            if not validate_object_id(param_value):
                return jsonify({
                    'success': False,
                    'message': f'Invalid {param_name} format',
                    'error_code': 'INVALID_ID'
                }), 400
            return fn(*args, **kwargs)
        return wrapper
    return decorator
