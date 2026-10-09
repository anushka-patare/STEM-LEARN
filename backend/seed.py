"""Database seed script - Creates admin account, curriculum, and sample data for Grades 6–9."""
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
from utils.generators import generate_student_id, generate_teacher_id, generate_team_code


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
    ]
    subject_ids = {}
    for subj in subjects_data:
        existing = db.subjects.find_one({'name': subj['name']})
        if existing:
            subject_ids[subj['name']] = str(existing['_id'])
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
    ]
    category_ids = {}
    for cat in categories_data:
        sid = subject_ids.get(cat['subject'], '')
        existing = db.categories.find_one({'name': cat['name'], 'subject_id': sid})
        if existing:
            category_ids[cat['name']] = str(existing['_id'])
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
        # Grade 9 Chapter
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

    # ─── 6. FACULTY / TEACHER ──────────────────────────────────
    teacher_exists = db.users.find_one({'email': 'teacher@stemlearn.com'})
    teacher_id_value = None
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
        result = db.users.insert_one(teacher)
        teacher_id_value = str(result.inserted_id)
        print('✅ Teacher created: teacher (teacher@stemlearn.com)')
    else:
        teacher_id_value = str(teacher_exists['_id'])
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

    # ─── 7. SAMPLE STUDENTS (GRADES 6, 7, 8, 9) ────────────────
    students_data = [
        # Grade 6
        {'name': 'Aarav Gupta', 'grade': '6', 'division': 'A', 'username': 'student6a1', 'email': 'student6a1@stemlearn.com'},
        {'name': 'Diya Sharma', 'grade': '6', 'division': 'B', 'username': 'student6b1', 'email': 'student6b1@stemlearn.com'},
        # Grade 7
        {'name': 'Arjun Patel', 'grade': '7', 'division': 'A', 'username': 'student1', 'email': 'student1@stemlearn.com'},
        {'name': 'Priya Singh', 'grade': '7', 'division': 'A', 'username': 'student2', 'email': 'student2@stemlearn.com'},
        {'name': 'Rohan Kumar', 'grade': '7', 'division': 'A', 'username': 'student3', 'email': 'student3@stemlearn.com'},
        {'name': 'Ananya Desai', 'grade': '7', 'division': 'A', 'username': 'student4', 'email': 'student4@stemlearn.com'},
        {'name': 'Vikram Rao', 'grade': '7', 'division': 'B', 'username': 'student5', 'email': 'student5@stemlearn.com'},
        {'name': 'Sneha Joshi', 'grade': '7', 'division': 'B', 'username': 'student6', 'email': 'student6@stemlearn.com'},
        # Grade 8
        {'name': 'Aditya Malhotra', 'grade': '8', 'division': 'A', 'username': 'student7', 'email': 'student7@stemlearn.com'},
        {'name': 'Kavya Iyer', 'grade': '8', 'division': 'A', 'username': 'student8', 'email': 'student8@stemlearn.com'},
        # Grade 9 (Competitive & Collaborative)
        {'name': 'Reyansh Roy', 'grade': '9', 'division': 'A', 'username': 'student9a1', 'email': 'student9a1@demo.invalid'},
        {'name': 'Tanvi Verma', 'grade': '9', 'division': 'A', 'username': 'student9a2', 'email': 'student9a2@demo.invalid'},
        {'name': 'Ishaan Mehra', 'grade': '9', 'division': 'B', 'username': 'student9b1', 'email': 'student9b1@demo.invalid'},
        {'name': 'Meera Nair', 'grade': '9', 'division': 'B', 'username': 'student9b2', 'email': 'student9b2@demo.invalid'},
    ]

    for i, s in enumerate(students_data):
        existing = db.users.find_one({'$or': [{'username': s['username']}, {'email': s['email']}]})
        if not existing:
            db.users.insert_one({
                'student_id': generate_student_id(),
                'full_name': s['name'],
                'email': s['email'],
                'username': s['username'],
                'password_hash': hash_password('student123'),
                'role': 'student',
                'grade': s['grade'],
                'division': s['division'],
                'roll_number': str(i + 1),
                'mobile': '',
                'photo': '',
                'status': 'active',
                'approval_status': 'active',
                'team_id': None,
                'points': 0,
                'created_at': now,
                'updated_at': now
            })
        else:
            db.users.update_one(
                {'_id': existing['_id']},
                {
                    '$set': {
                        'username': s['username'],
                        'password_hash': hash_password('student123'),
                        'status': 'active',
                        'approval_status': 'active',
                        'grade': s['grade'],
                        'division': s['division'],
                        'updated_at': now
                    }
                }
            )
    print(f'✅ Students verified: {len(students_data)} demo students across Grades 6–9')

    # ─── 8. SAMPLE TEAMS ───────────────────────────────────────
    teams_data = [
        {'name': 'Team Alpha (G7)', 'grade': '7', 'division': 'A'},
        {'name': 'Team Beta (G7)', 'grade': '7', 'division': 'A'},
        {'name': 'Team Gamma (G7)', 'grade': '7', 'division': 'B'},
        {'name': 'Quantum Squad (G9)', 'grade': '9', 'division': 'B'},
        {'name': 'Photon Squad (G9)', 'grade': '9', 'division': 'B'},
    ]
    for t in teams_data:
        if not db.teams.find_one({'name': t['name']}):
            db.teams.insert_one({
                **t,
                'code': generate_team_code(),
                'class_id': '',
                'scoring_method': 'average',
                'status': 'active',
                'created_by': teacher_id_value,
                'created_at': now,
                'updated_at': now
            })
    print('✅ Teams verified: Alpha, Beta, Gamma, Quantum Squad, Photon Squad')

    # ─── 9. SAMPLE QUIZZES & QUESTIONS ─────────────────────────
    fm_chapter_id = chapter_ids.get('Force and Motion', '')
    g9_chapter_id = chapter_ids.get('Gravitation & Work-Energy', '')
    science_id = subject_ids.get('Science', '')
    physics_id = category_ids.get('Physics', '')

    if fm_chapter_id and not db.quizzes.find_one({'chapter_id': fm_chapter_id}):
        quizzes = [
            {'title': 'Basic Concepts of Force', 'seq': 1, 'final': False, 'desc': 'Test your understanding of basic force concepts', 'grade': '7'},
            {'title': 'Types of Forces', 'seq': 2, 'final': False, 'desc': 'Learn about gravity, friction, and applied forces', 'grade': '7'},
            {'title': 'Motion and Speed', 'seq': 3, 'final': False, 'desc': 'Understand motion, speed, and velocity', 'grade': '7'},
            {'title': 'Force and Motion - Final Exam', 'seq': 4, 'final': True, 'desc': 'Comprehensive exam covering all force and motion topics', 'grade': '7'},
        ]
        quiz_ids = []
        for q in quizzes:
            result = db.quizzes.insert_one({
                'title': q['title'],
                'description': q['desc'],
                'grade': q['grade'],
                'subject_id': science_id,
                'category_id': physics_id,
                'chapter_id': fm_chapter_id,
                'difficulty': 'medium',
                'duration_minutes': 15 if q['final'] else 10,
                'total_marks': 20 if q['final'] else 10,
                'passing_percentage': 70,
                'sequence_number': q['seq'],
                'is_final_exam': q['final'],
                'allow_retry': True,
                'max_attempts': 3,
                'retry_delay_hours': 0,
                'require_teacher_unlock': False,
                'randomize_questions': False,
                'show_result': True,
                'security_settings': {
                    'require_fullscreen': True,
                    'tab_switch_detection': True,
                    'window_focus_detection': True,
                    'refresh_protection': True,
                    'copy_protection': True,
                    'paste_protection': True,
                    'right_click_disabled': True,
                    'max_violations': 3,
                    'violation_action': 'auto_submit'
                },
                'mode': 'both',
                'status': 'published',
                'created_by': teacher_id_value,
                'created_at': now,
                'updated_at': now
            })
            quiz_ids.append(str(result.inserted_id))

        # Sample questions for quiz 1
        q1_questions = [
            {'question': 'What is a force?', 'option_a': 'A push or pull', 'option_b': 'A type of energy',
             'option_c': 'A measurement of speed', 'option_d': 'A form of light', 'correct_answer': 'A',
             'explanation': 'A force is a push or pull that can change the motion of an object.', 'difficulty': 'easy'},
            {'question': 'What is the SI unit of force?', 'option_a': 'Joule', 'option_b': 'Newton',
             'option_c': 'Watt', 'option_d': 'Pascal', 'correct_answer': 'B',
             'explanation': 'The SI unit of force is Newton (N), named after Sir Isaac Newton.', 'difficulty': 'easy'},
            {'question': 'Which of the following is a contact force?', 'option_a': 'Gravity', 'option_b': 'Magnetism',
             'option_c': 'Friction', 'option_d': 'Electrostatic force', 'correct_answer': 'C',
             'explanation': 'Friction is a contact force that acts between surfaces that are touching.', 'difficulty': 'medium'},
            {'question': 'What happens when balanced forces act on an object?', 'option_a': 'It accelerates', 'option_b': 'It stays at rest or moves at constant velocity',
             'option_c': 'It stops immediately', 'option_d': 'It changes direction', 'correct_answer': 'B',
             'explanation': 'Balanced forces result in no change in motion - the object stays at rest or continues at constant velocity.', 'difficulty': 'medium'},
        ]
        for i, q in enumerate(q1_questions):
            db.questions.insert_one({
                'quiz_id': quiz_ids[0],
                **q,
                'question_type': 'mcq',
                'marks': 1,
                'order': i + 1,
                'created_by': teacher_id_value,
                'created_at': now
            })
        print(f'✅ Grade 7 Quizzes created: 4 quizzes and sample questions')

    # ─── 10. SYSTEM SETTINGS ───────────────────────────────────
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
