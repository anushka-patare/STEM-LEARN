"""Global error handler middleware."""
from flask import jsonify
from werkzeug.exceptions import HTTPException


def register_error_handlers(app):
    """Register global error handlers."""

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({
            'success': False,
            'message': 'Bad request',
            'error_code': 'BAD_REQUEST'
        }), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({
            'success': False,
            'message': 'Authentication required',
            'error_code': 'UNAUTHORIZED'
        }), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({
            'success': False,
            'message': 'Access denied',
            'error_code': 'FORBIDDEN'
        }), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({
            'success': False,
            'message': 'Resource not found',
            'error_code': 'NOT_FOUND'
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({
            'success': False,
            'message': 'Method not allowed',
            'error_code': 'METHOD_NOT_ALLOWED'
        }), 405

    @app.errorhandler(413)
    def payload_too_large(e):
        return jsonify({
            'success': False,
            'message': 'File too large. Maximum size is 5MB.',
            'error_code': 'PAYLOAD_TOO_LARGE'
        }), 413

    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        return jsonify({
            'success': False,
            'message': 'Too many requests. Please try again later.',
            'error_code': 'RATE_LIMIT_EXCEEDED'
        }), 429

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({
            'success': False,
            'message': 'An internal error occurred. Please try again.',
            'error_code': 'INTERNAL_ERROR'
        }), 500

    @app.errorhandler(Exception)
    def handle_exception(e):
        import traceback
        traceback.print_exc()
        if isinstance(e, HTTPException):
            return jsonify({
                'success': False,
                'message': e.description,
                'error_code': 'HTTP_ERROR'
            }), e.code
        # Don't expose internal errors
        return jsonify({
            'success': False,
            'message': str(e) if app.debug else 'An unexpected error occurred',
            'error_code': 'UNEXPECTED_ERROR'
        }), 500
