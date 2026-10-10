"""STEMLearn – Flask Backend Application."""
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from flask import Flask, jsonify, send_from_directory
from flask.json.provider import DefaultJSONProvider
from bson import ObjectId
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pymongo import MongoClient
from config import config
from middleware.error_handler import register_error_handlers

class CustomJSONProvider(DefaultJSONProvider):
    """Ensure MongoDB ObjectId is serialized to string in all JSON responses."""
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)

# Global database reference
db = None
limiter = None


def create_app(config_name=None):
    """Create and configure the Flask application."""
    global db, limiter

    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.json_provider_class = CustomJSONProvider
    app.json = CustomJSONProvider(app)
    app.config.from_object(config.get(config_name, config['default']))

    # CORS - Allow local and deployed frontend origins (e.g. Render, Vercel)
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
            "supports_credentials": True
        }
    })

    # JWT
    jwt = JWTManager(app)

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'message': 'Token has expired',
            'error_code': 'TOKEN_EXPIRED'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'success': False,
            'message': 'Invalid token',
            'error_code': 'INVALID_TOKEN'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'success': False,
            'message': 'Authorization token is required',
            'error_code': 'MISSING_TOKEN'
        }), 401

    # Rate Limiter
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=[app.config.get('RATELIMIT_DEFAULT', '100/hour')],
        storage_uri="memory://"
    )

    # MongoDB Connection
    try:
        client = MongoClient(app.config['MONGO_URI'])
        db = client.get_default_database()
        # Test connection
        client.admin.command('ping')
        print('✅ MongoDB connected successfully!')
    except Exception as e:
        print(f'❌ MongoDB connection failed: {str(e)}')
        sys.exit(1)

    # Store db in app config for access in routes
    app.config['db'] = db

    # Create upload directories
    upload_folder = app.config.get('UPLOAD_FOLDER', 'uploads')
    os.makedirs(os.path.join(upload_folder, 'students'), exist_ok=True)
    os.makedirs(os.path.join(upload_folder, 'teachers'), exist_ok=True)

    # Register error handlers and request logger
    register_error_handlers(app)
    from middleware.request_logger import register_request_logger
    register_request_logger(app)

    # Register blueprints
    from routes.auth_routes import auth_bp
    from routes.admin_routes import admin_bp
    from routes.profile_routes import profile_bp
    from routes.class_routes import class_bp
    from routes.subject_routes import subject_bp
    from routes.category_routes import category_bp
    from routes.chapter_routes import chapter_bp
    from routes.student_routes import student_bp
    from routes.teacher_routes import teacher_bp
    from routes.quiz_routes import quiz_bp
    from routes.question_routes import question_bp
    from routes.learning_path_routes import learning_path_bp
    from routes.team_routes import team_bp
    from routes.leaderboard_routes import leaderboard_bp
    from routes.research_routes import research_bp
    from routes.security_routes import security_bp
    from routes.ai_routes import ai_bp
    from routes.page_content_routes import page_bp
    from routes.video_routes import video_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(class_bp, url_prefix='/api/classes')
    app.register_blueprint(subject_bp, url_prefix='/api/subjects')
    app.register_blueprint(category_bp, url_prefix='/api/categories')
    app.register_blueprint(chapter_bp, url_prefix='/api/chapters')
    app.register_blueprint(student_bp, url_prefix='/api/student')
    app.register_blueprint(teacher_bp, url_prefix='/api/teacher')
    app.register_blueprint(quiz_bp, url_prefix='/api/quizzes')
    app.register_blueprint(question_bp, url_prefix='/api/questions')
    app.register_blueprint(learning_path_bp, url_prefix='/api/learning-paths')
    app.register_blueprint(team_bp, url_prefix='/api/teams')
    app.register_blueprint(leaderboard_bp, url_prefix='/api/leaderboard')
    app.register_blueprint(research_bp, url_prefix='/api/research')
    app.register_blueprint(security_bp, url_prefix='/api/security')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(page_bp, url_prefix='/api/pages')
    app.register_blueprint(video_bp, url_prefix='/api/videos')

    # Serve uploaded files
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory(upload_folder, filename)

    # Root status endpoint for browser and service uptime checks
    @app.route('/')
    @app.route('/api')
    def root_status():
        return jsonify({
            'success': True,
            'status': 'healthy',
            'message': 'STEMLearn Backend API is online and running',
            'health_check': '/api/health',
            'version': '1.0.0'
        }), 200

    # Health check
    @app.route('/api/health')
    def health_check():
        db_status = 'connected'
        try:
            db.command('ping')
        except Exception as e:
            db_status = f'disconnected: {str(e)}'
            return jsonify({
                'success': False,
                'status': 'unhealthy',
                'database': db_status,
                'version': '1.0.0'
            }), 503

        return jsonify({
            'success': True,
            'status': 'healthy',
            'message': 'STEMLearn API is running',
            'database': db_status,
            'version': '1.0.0'
        })

    # Central Grades Config Endpoint
    @app.route('/api/config/grades', methods=['GET'])
    def get_grades_config():
        grades = app.config.get('GRADES', [6, 7, 8, 9])
        allowed_grades = app.config.get('ALLOWED_GRADES', ['6', '7', '8', '9'])
        return jsonify({
            'success': True,
            'data': grades,
            'allowed_grades': allowed_grades
        })

    # Setup database indexes
    setup_indexes(db)

    # Start login log cleanup scheduler
    start_cleanup_scheduler(app, db)

    return app


def setup_indexes(db):
    """Create MongoDB indexes for performance."""
    try:
        # Users
        db.users.create_index('email', unique=True, sparse=True)
        db.users.create_index('username', unique=True, sparse=True)
        db.users.create_index('role')

        # Quiz attempts
        db.quiz_attempts.create_index([('student_id', 1), ('quiz_id', 1)])
        db.quiz_attempts.create_index('started_at')

        # Leaderboards
        db.leaderboards.create_index([('mode', 1), ('class_id', 1)])

        # Research data
        db.research_data.create_index([('mode', 1), ('class_id', 1), ('subject_id', 1)])

        # Security events
        db.quiz_security_events.create_index([('student_id', 1), ('quiz_id', 1)])

        # Login logs
        db.login_logs.create_index('created_at')

        # AI usage
        db.ai_usage_logs.create_index([('student_id', 1), ('created_at', 1)])

        # Classes
        db.classes.create_index('grade')

        # Subjects
        db.subjects.create_index('name')

        # Categories
        db.categories.create_index('subject_id')

        # Chapters
        db.chapters.create_index('category_id')

        # Quizzes
        db.quizzes.create_index([('chapter_id', 1), ('sequence_number', 1)])

        # Questions
        db.questions.create_index('quiz_id')

        # Learning paths
        db.learning_paths.create_index([('class_id', 1), ('subject_id', 1)])

        # Teams
        db.teams.create_index('class_id')
        db.team_members.create_index([('team_id', 1), ('student_id', 1)])

        # Videos
        db.videos.create_index([('subject_id', 1), ('chapter_id', 1)])
        db.videos.create_index('created_at')

        print('✅ Database indexes created')
    except Exception as e:
        print(f'⚠️ Index creation warning: {str(e)}')


def start_cleanup_scheduler(app, db):
    """Start the background scheduler for login log cleanup."""
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from jobs.cleanup_login_logs import cleanup_old_login_logs

        scheduler = BackgroundScheduler()
        scheduler.add_job(
            func=lambda: cleanup_old_login_logs(db),
            trigger='interval',
            hours=1,
            id='cleanup_login_logs'
        )
        scheduler.start()
        print('✅ Login log cleanup scheduler started')
    except Exception as e:
        print(f'⚠️ Scheduler warning: {str(e)}')


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
