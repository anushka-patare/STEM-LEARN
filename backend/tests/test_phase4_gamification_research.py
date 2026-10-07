"""Test suite for Phase 4: Gamification, Learning Paths, Research Telemetry ANOVA, and Audit Logs."""
import pytest
from bson import ObjectId


def test_leaderboards_competitive_and_collaborative(client, student_token, admin_token):
    student_headers = {'Authorization': f'Bearer {student_token}'}

    # 1. Competitive individual leaderboard
    comp_res = client.get('/api/leaderboard/competitive?grade=8', headers=student_headers)
    assert comp_res.status_code == 200
    comp_data = comp_res.get_json()['data']
    assert isinstance(comp_data, list)
    if len(comp_data) > 1:
        assert comp_data[0]['points'] >= comp_data[1]['points']

    # 2. Collaborative squad leaderboard
    collab_res = client.get('/api/leaderboard/collaborative', headers=student_headers)
    assert collab_res.status_code == 200
    collab_data = collab_res.get_json()['data']
    assert isinstance(collab_data, list)


def test_learning_paths_crud(client, teacher_token):
    headers = {'Authorization': f'Bearer {teacher_token}'}

    # 1. Create Learning Path
    create_res = client.post('/api/learning-paths', json={
        'title': 'Astrophysics & Solar Exploration Path',
        'grade': '9',
        'description': 'Master celestial orbits, planetary geology, and light spectrum analysis',
        'passing_percentage': 75,
        'quizzes': ['507f1f77bcf86cd799439055']
    }, headers=headers)
    assert create_res.status_code == 201
    path_id = create_res.get_json()['data']['_id']

    # 2. Update Learning Path
    upd_res = client.put(f'/api/learning-paths/{path_id}', json={
        'title': 'Advanced Astrophysics & Solar Exploration Path',
        'status': 'published'
    }, headers=headers)
    assert upd_res.status_code == 200

    # 3. Get Learning Paths
    get_res = client.get('/api/learning-paths?grade=9', headers=headers)
    assert get_res.status_code == 200
    paths = get_res.get_json()['data']
    assert any(p['_id'] == path_id for p in paths)

    # 4. Delete Learning Path
    del_res = client.delete(f'/api/learning-paths/{path_id}', headers=headers)
    assert del_res.status_code == 200


def test_research_analytics_and_csv_export(client, teacher_token):
    headers = {'Authorization': f'Bearer {teacher_token}'}

    # 1. Research Overview / ANOVA Summary
    summary_res = client.get('/api/research/overview', headers=headers)
    assert summary_res.status_code == 200
    summary_data = summary_res.get_json()['data']
    assert 'descriptive' in summary_data
    assert 'anova_table' in summary_data
    assert len(summary_data['descriptive']) == 2
    assert len(summary_data['anova_table']) == 3

    # 2. Research CSV Dataset Export
    export_res = client.get('/api/research/export', headers=headers)
    assert export_res.status_code == 200
    assert 'text/csv' in export_res.content_type
    assert b'attempt_id' in export_res.data or b'participant_id' in export_res.data


def test_admin_login_logs_audit(client, admin_token):
    headers = {'Authorization': f'Bearer {admin_token}'}

    logs_res = client.get('/api/admin/login-logs?limit=10', headers=headers)
    assert logs_res.status_code == 200
    logs_data = logs_res.get_json()['data']
    assert 'logs' in logs_data
    assert 'total' in logs_data
