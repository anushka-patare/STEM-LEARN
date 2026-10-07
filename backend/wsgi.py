"""STEMLearn – Production WSGI Entry Point."""
import os
from app import create_app

app = create_app(os.getenv('FLASK_ENV', 'production'))

if __name__ == '__main__':
    # Default to Waitress on Windows / fallback, port 5000
    try:
        from waitress import serve
        print("🚀 Starting STEMLearn backend with Waitress on http://0.0.0.0:5000 ...")
        serve(app, host='0.0.0.0', port=5000, threads=8)
    except ImportError:
        app.run(host='0.0.0.0', port=5000)
