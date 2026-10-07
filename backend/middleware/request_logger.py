"""Request logging middleware for STEMLearn."""
import time
import uuid
import logging
from flask import request, g

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
)
logger = logging.getLogger('stemlearn.request')


def register_request_logger(app):
    """Register request logging hooks on the Flask app."""

    @app.before_request
    def start_timer():
        g.start_time = time.time()
        g.request_id = request.headers.get('X-Request-ID', str(uuid.uuid4())[:8])

    @app.after_request
    def log_response(response):
        if request.path.startswith('/api/'):
            duration_ms = round((time.time() - getattr(g, 'start_time', time.time())) * 1000, 2)
            req_id = getattr(g, 'request_id', 'unknown')
            response.headers['X-Request-ID'] = req_id
            
            # Skip noise for health check
            if request.path != '/api/health':
                logger.info(
                    f"[{req_id}] {request.method} {request.path} {response.status_code} ({duration_ms}ms)"
                )
        return response
