"""Database seed script - Creates admin account, teacher, and curriculum for Grades 6–9."""
import os
import sys
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from utils.password import hash_password
from utils.generators import generate_teacher_id


def check_production_environment():
    """Prevent running seed script in production unless explicitly forced."""
    env = os.getenv('FLASK_ENV', 'development').lower()
    if env == 'production':
        print("❌ ERROR: Database seed script is disabled in production environment.")
        sys.exit(1)


def seed_database():
    """Seed the database with initial data (idempotent for Grades 6-9)."""
    check_production_environment()

    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/stem_learning')
    client = MongoClient(mongo_uri)
    db = client.get_default_database()

    print('🌱 Starting database seed...')
    print(f'📦 Database: {db.name}')

    now = datetime.utcnow()

    # ─── 1. ADMIN USER ─────────────────────────────────────────
    admin_exists = db.users.find_one({'role': 'admin'})
    if not admin_exists:
        admin = {
            'full_name': 'System Admin',
            'email': 'admin@stemlearn.com',
            'username': 'admin',
            'password_hash': hash_password('admin123'),
            'role': 'admin',
            'photo': '',
            'status': 'active',
            'created_at': now,
            'updated_at': now
        }
        db.users.insert_one(admin)
        print('✅ Admin created: admin (admin@stemlearn.com)')
    else:
        db.users.update_one(
            {'_id': admin_exists['_id']},
            {'$set': {
                'username': admin_exists.get('username') or 'admin',
                'password_hash': hash_password('admin123'),
                'status': 'active',
                'updated_at': now
            }}
        )
        print('ℹ️  Admin verified (idempotent)')

    # ─── 2. CLASSES (GRADES 6, 7, 8, 9) ────────────────────────
    classes_data = [
        {'grade': '6', 'division': 'A', 'mode': 'competitive'},
        {'grade': '6', 'division': 'B', 'mode': 'collaborative'},
        {'grade': '7', 'division': 'A', 'mode': 'competitive'},
        {'grade': '7', 'division': 'B', 'mode': 'collaborative'},
        {'grade': '8', 'division': 'A', 'mode': 'competitive'},
        {'grade': '8', 'division': 'B', 'mode': 'collaborative'},
        {'grade': '9', 'division': 'A', 'mode': 'competitive'},
        {'grade': '9', 'division': 'B', 'mode': 'collaborative'},
    ]
    for cls in classes_data:
        existing = db.classes.find_one({'grade': cls['grade'], 'division': cls['division']})
        if not existing:
            db.classes.insert_one({
                **cls,
                'teacher_id': '',
                'status': 'active',
                'created_at': now,
                'updated_at': now
            })
    print(f'✅ Classes verified: Grades 6–9 (Divisions A & B)')

    # ─── 3. SUBJECTS ───────────────────────────────────────────
    subjects_data = [
        {'name': 'Science', 'icon': '🔬', 'description': 'Explore the natural world through Physics, Chemistry, and Biology'},
        {'name': 'Technology', 'icon': '💻', 'description': 'Learn about computers, coding, and digital systems'},
        {'name': 'Mathematics', 'icon': '📐', 'description': 'Master numbers, algebra, geometry, and problem solving'},
        {'name': 'English', 'icon': '📚', 'description': 'Master English grammar, reading comprehension, literature, and communication'},
    ]
    subject_ids = {}
    for subj in subjects_data:
        existing = db.subjects.find_one({'name': subj['name']})
        if existing:
            subject_ids[subj['name']] = str(existing['_id'])
            db.subjects.update_one({'_id': existing['_id']}, {'$set': {'status': 'active', 'updated_at': now}})
        else:
            result = db.subjects.insert_one({
                **subj,
                'grade': '',
                'status': 'active',
                'created_at': now,
                'updated_at': now
            })
            subject_ids[subj['name']] = str(result.inserted_id)
    print(f'✅ Subjects verified: {", ".join(subject_ids.keys())}')

    # ─── 4. CATEGORIES ─────────────────────────────────────────
    categories_data = [
        {'name': 'Physics', 'subject': 'Science', 'description': 'Study of matter, energy, and forces'},
        {'name': 'Chemistry', 'subject': 'Science', 'description': 'Study of substances and reactions'},
        {'name': 'Biology', 'subject': 'Science', 'description': 'Study of living organisms'},
        {'name': 'Programming', 'subject': 'Technology', 'description': 'Learn to code and think algorithmically'},
        {'name': 'Digital Literacy', 'subject': 'Technology', 'description': 'Understanding digital tools and safety'},
        {'name': 'Algebra', 'subject': 'Mathematics', 'description': 'Variables, expressions, and equations'},
        {'name': 'Geometry', 'subject': 'Mathematics', 'description': 'Shapes, angles, and spatial reasoning'},
        {'name': 'Grammar & Vocabulary', 'subject': 'English', 'description': 'Sentence construction, tenses, modals, and vocabulary mastery'},
        {'name': 'Reading Comprehension & Prose', 'subject': 'English', 'description': 'Passage reading comprehension, literature stories, and prose analysis'},
        {'name': 'Writing & Communication Skills', 'subject': 'English', 'description': 'Creative writing, essays, formal letters, and communication'},
    ]
    category_ids = {}
    for cat in categories_data:
        sid = subject_ids.get(cat['subject'], '')
        existing = db.categories.find_one({'name': cat['name'], 'subject_id': sid})
        if existing:
            category_ids[cat['name']] = str(existing['_id'])
            db.categories.update_one({'_id': existing['_id']}, {'$set': {'status': 'active', 'updated_at': now}})
        else:
            result = db.categories.insert_one({
                'name': cat['name'],
                'subject_id': sid,
                'description': cat['description'],
                'status': 'active',
                'created_at': now,
                'updated_at': now
            })
            category_ids[cat['name']] = str(result.inserted_id)
    print(f'✅ Categories verified: {len(category_ids)} categories')

    # ─── 5. CHAPTERS ───────────────────────────────────────────
    chapters_data = [
        {'name': 'Force and Motion', 'category': 'Physics', 'subject': 'Science', 'order': 1, 'description': 'Understanding forces and how objects move'},
        {'name': 'Light and Sound', 'category': 'Physics', 'subject': 'Science', 'order': 2, 'description': 'Properties of light and sound waves'},
        {'name': 'Electricity', 'category': 'Physics', 'subject': 'Science', 'order': 3, 'description': 'Electric circuits, current, and energy'},
        {'name': 'Atoms and Molecules', 'category': 'Chemistry', 'subject': 'Science', 'order': 1, 'description': 'Building blocks of matter'},
        {'name': 'Cell Biology', 'category': 'Biology', 'subject': 'Science', 'order': 1, 'description': 'Structure and function of cells'},
        {'name': 'Python Basics', 'category': 'Programming', 'subject': 'Technology', 'order': 1, 'description': 'Introduction to Python programming'},
        {'name': 'Linear Equations', 'category': 'Algebra', 'subject': 'Mathematics', 'order': 1, 'description': 'Solving linear equations and inequalities'},
        {'name': 'Triangles', 'category': 'Geometry', 'subject': 'Mathematics', 'order': 1, 'description': 'Properties and types of triangles'},
        {'name': 'Gravitation & Work-Energy', 'category': 'Physics', 'subject': 'Science', 'order': 4, 'description': 'Universal gravitation, work, energy, and power principles for Grade 9'},
    ]
    chapter_ids = {}
    for ch in chapters_data:
        cid = category_ids.get(ch['category'], '')
        sid = subject_ids.get(ch['subject'], '')
        existing = db.chapters.find_one({'name': ch['name'], 'category_id': cid})
        if existing:
            chapter_ids[ch['name']] = str(existing['_id'])
        else:
            result = db.chapters.insert_one({
                'name': ch['name'],
                'category_id': cid,
                'subject_id': sid,
                'description': ch['description'],
                'order': ch['order'],
                'status': 'active',
                'created_at': now,
                'updated_at': now
            })
            chapter_ids[ch['name']] = str(result.inserted_id)
    print(f'✅ Chapters verified: {len(chapter_ids)} chapters')

    # ─── 6. TEACHER ────────────────────────────────────────────
    teacher_exists = db.users.find_one({'email': 'teacher@stemlearn.com'})
    if not teacher_exists:
        teacher = {
            'teacher_id': generate_teacher_id(),
            'full_name': 'Dr. Rahul Sharma',
            'email': 'teacher@stemlearn.com',
            'username': 'teacher',
            'password_hash': hash_password('teacher123'),
            'role': 'teacher',
            'education': 'Ph.D. / M.Sc. Physics',
            'mobile': '9876543210',
            'photo': '',
            'subject': 'Science',
            'assigned_classes': [
                {'grade': '6', 'division': 'A'},
                {'grade': '7', 'division': 'A'},
                {'grade': '7', 'division': 'B'},
                {'grade': '8', 'division': 'A'},
                {'grade': '9', 'division': 'A'},
                {'grade': '9', 'division': 'B'}
            ],
            'status': 'active',
            'approval_status': 'active',
            'created_at': now,
            'updated_at': now
        }
        db.users.insert_one(teacher)
        print('✅ Teacher created: teacher (teacher@stemlearn.com)')
    else:
        db.users.update_one(
            {'_id': teacher_exists['_id']},
            {'$set': {
                'username': teacher_exists.get('username') or 'teacher',
                'password_hash': hash_password('teacher123'),
                'status': 'active',
                'approval_status': 'active',
                'updated_at': now
            }}
        )
        print('ℹ️  Teacher verified (idempotent)')

    # ─── 7. SYSTEM SETTINGS ───────────────────────────────────
    if not db.system_settings.find_one({'type': 'global'}):
        db.system_settings.insert_one({
            'type': 'global',
            'student_ai_enabled': True,
            'daily_student_request_limit': 30,
            'max_message_length': 500,
            'max_response_tokens': 1000,
            'primary_ai_provider': 'gemini',
            'fallback_ai_provider': 'groq',
            'allow_teacher_api_keys': False,
            'team_scoring_method': 'average',
            'created_at': now,
            'updated_at': now
        })
        print('✅ System settings initialized')

    print('\n🎉 Database seeding complete & idempotent!')


if __name__ == '__main__':
    seed_database()
