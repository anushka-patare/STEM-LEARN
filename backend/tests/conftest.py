"""Pytest configuration, path setup, and shared fixtures."""
import os
import sys

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from app import create_app


@pytest.fixture(scope='session')
def app():
    application = create_app()
    application.config['TESTING'] = True
    return application


@pytest.fixture
def client(app):
    with app.test_client() as test_client:
        yield test_client


@pytest.fixture
def db(app):
    return app.config['db']


@pytest.fixture
def admin_token(client):
    res = client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
    data = res.get_json()
    return data['data']['access_token']


@pytest.fixture
def teacher_token(client):
    res = client.post('/api/auth/login', json={'username': 'teacher', 'password': 'teacher123'})
    data = res.get_json()
    return data['data']['access_token']


@pytest.fixture
def student_token(client):
    res = client.post('/api/auth/login', json={'username': 'student1', 'password': 'student123'})
    data = res.get_json()
    return data['data']['access_token']
