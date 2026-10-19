"""Database seed script - Maharashtra State Board Curriculum (Grades 6–9).
Sets up Admin, 1 Faculty Teacher assigned to all 12 classes (6, 7, 8, 9 Divisions A, B, C),
and comprehensive chapter question banks with 20 MCQs each.
No hardcoded student data.
"""
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
from curriculum_msbshse import get_msbshse_chapters_and_questions


def check_production_environment():
    """Prevent running seed script in production unless explicitly forced."""
    env = os.getenv('FLASK_ENV', 'development').lower()
    if env == 'production':
        print("❌ ERROR: Database seed script is disabled in production environment.")
        sys.exit(1)


def seed_database():
    """Seed the database with Maharashtra State Board curriculum & classes."""
    check_production_environment()

    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/stem_learning')
    client = MongoClient(mongo_uri)
    db = client.get_default_database()

    print('🌱 Starting Maharashtra State Board database seed...')
    print(f'📦 Database: {db.name}')

    now = datetime.utcnow()

    # ─── 1. CLEAN UP HARDCODED STUDENTS & TEAMS ────────────────
    # Per user request: "not add hardcoded data seed.py edit"
    deleted_students = db.users.delete_many({'role': 'student'})
    if deleted_students.deleted_count > 0:
        print(f'🧹 Cleaned up {deleted_students.deleted_count} hardcoded student records')
    db.teams.delete_many({})
    db.team_members.delete_many({})

    # ─── 2. ADMIN USER ─────────────────────────────────────────
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

    # ─── 3. TEACHER (1 FACULTY ASSIGNED TO ALL CLASSES) ────────
    all_class_labels = [
        'Grade 6-A', 'Grade 6-B', 'Grade 6-C',
        'Grade 7-A', 'Grade 7-B', 'Grade 7-C',
        'Grade 8-A', 'Grade 8-B', 'Grade 8-C',
        'Grade 9-A', 'Grade 9-B', 'Grade 9-C'
    ]
    all_class_dicts = [
        {'grade': '6', 'division': 'A'}, {'grade': '6', 'division': 'B'}, {'grade': '6', 'division': 'C'},
        {'grade': '7', 'division': 'A'}, {'grade': '7', 'division': 'B'}, {'grade': '7', 'division': 'C'},
        {'grade': '8', 'division': 'A'}, {'grade': '8', 'division': 'B'}, {'grade': '8', 'division': 'C'},
        {'grade': '9', 'division': 'A'}, {'grade': '9', 'division': 'B'}, {'grade': '9', 'division': 'C'},
    ]

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
            'education': 'M.Sc., B.Ed. (State Board Curriculum Specialist)',
            'mobile': '9876543210',
            'photo': '',
            'subject': 'Science',
            'assigned_subject': 'All STEM Disciplines',
            'assigned_grade': 'All',
            'assigned_division': 'All',
            'assigned_classes': all_class_labels,
            'assigned_classes_details': all_class_dicts,
            'status': 'active',
            'approval_status': 'active',
            'created_at': now,
            'updated_at': now
        }
        result = db.users.insert_one(teacher)
        teacher_id_value = str(result.inserted_id)
        print('✅ Faculty Teacher created: teacher (teacher@stemlearn.com)')
    else:
        teacher_id_value = str(teacher_exists['_id'])
        db.users.update_one(
            {'_id': teacher_exists['_id']},
            {'$set': {
                'username': teacher_exists.get('username') or 'teacher',
                'password_hash': hash_password('teacher123'),
                'full_name': teacher_exists.get('full_name') or 'Dr. Rahul Sharma',
                'assigned_classes': all_class_labels,
                'assigned_classes_details': all_class_dicts,
                'assigned_subject': 'All STEM Disciplines',
                'status': 'active',
                'approval_status': 'active',
                'updated_at': now
            }}
        )
        print('ℹ️  Faculty Teacher verified & assigned to all 12 classes')

    # ─── 4. CLASSES (6-A,B,C; 7-A,B,C; 8-A,B,C; 9-A,B,C) ──────
    classes_data = [
        # Grade 6
        {'grade': '6', 'division': 'A', 'mode': 'competitive', 'name': 'Grade 6-A'},
        {'grade': '6', 'division': 'B', 'mode': 'collaborative', 'name': 'Grade 6-B'},
        {'grade': '6', 'division': 'C', 'mode': 'collaborative', 'name': 'Grade 6-C'},
        # Grade 7
        {'grade': '7', 'division': 'A', 'mode': 'competitive', 'name': 'Grade 7-A'},
        {'grade': '7', 'division': 'B', 'mode': 'collaborative', 'name': 'Grade 7-B'},
        {'grade': '7', 'division': 'C', 'mode': 'collaborative', 'name': 'Grade 7-C'},
        # Grade 8
        {'grade': '8', 'division': 'A', 'mode': 'competitive', 'name': 'Grade 8-A'},
        {'grade': '8', 'division': 'B', 'mode': 'collaborative', 'name': 'Grade 8-B'},
        {'grade': '8', 'division': 'C', 'mode': 'collaborative', 'name': 'Grade 8-C'},
        # Grade 9
        {'grade': '9', 'division': 'A', 'mode': 'competitive', 'name': 'Grade 9-A'},
        {'grade': '9', 'division': 'B', 'mode': 'collaborative', 'name': 'Grade 9-B'},
        {'grade': '9', 'division': 'C', 'mode': 'collaborative', 'name': 'Grade 9-C'},
    ]

    for cls in classes_data:
        existing = db.classes.find_one({'grade': cls['grade'], 'division': cls['division']})
        class_doc = {
            'grade': cls['grade'],
            'division': cls['division'],
            'mode': cls['mode'],
            'name': cls['name'],
            'teacher_id': teacher_id_value,
            'teacher_ids': [teacher_id_value],
            'teacher_name': 'Dr. Rahul Sharma',
            'status': 'active',
            'updated_at': now
        }
        if not existing:
            class_doc['created_at'] = now
            db.classes.insert_one(class_doc)
        else:
            db.classes.update_one({'_id': existing['_id']}, {'$set': class_doc})
    print('✅ 12 Classes verified (6-A,B,C, 7-A,B,C, 8-A,B,C, 9-A,B,C) with Teacher assigned')

    # ─── 5. SUBJECTS (MSBSHSE) ─────────────────────────────────
    subjects_data = [
        {'name': 'Science', 'icon': '🔬', 'description': 'Maharashtra State Board General Science & Technology (Physics, Chemistry, Biology)'},
        {'name': 'Mathematics', 'icon': '📐', 'description': 'Maharashtra State Board Mathematics, Algebra, Geometry, and Problem Solving'},
        {'name': 'Technology', 'icon': '💻', 'description': 'Information and Communication Technology (ICT), Digital Literacy & Computing'},
        {'name': 'English', 'icon': '📚', 'description': 'Maharashtra State Board English Balbharati: Grammar, Vocabulary & Composition'},
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

    # ─── 6. CATEGORIES (DISCIPLINES) ───────────────────────────
    categories_data = [
        {'name': 'Physics', 'subject': 'Science', 'description': 'Study of matter, energy, motion, forces, pressure, and electricity'},
        {'name': 'Chemistry', 'subject': 'Science', 'description': 'Study of substances, chemical reactions, atoms, acids and bases'},
        {'name': 'Biology', 'subject': 'Science', 'description': 'Study of the living world, cells, micro-organisms, and ecosystems'},
        {'name': 'Algebra', 'subject': 'Mathematics', 'description': 'Variables, equations, polynomials, sets, integers, and operations'},
        {'name': 'Geometry', 'subject': 'Mathematics', 'description': 'Points, lines, planes, triangles, circles, and constructions'},
        {'name': 'Programming', 'subject': 'Technology', 'description': 'Computer systems, ICT tools, applications in science, and software'},
        {'name': 'Digital Literacy', 'subject': 'Technology', 'description': 'Cyber security, word processing, spreadsheets, and internet safety'},
        {'name': 'Grammar & Vocabulary', 'subject': 'English', 'description': 'Parts of speech, tenses, sentence structure, idioms, and voice'},
    ]
    category_ids = {}
    for cat in categories_data:
        sid = subject_ids.get(cat['subject'], '')
        existing = db.categories.find_one({'name': cat['name']})
        if existing:
            category_ids[cat['name']] = str(existing['_id'])
            db.categories.update_one({'_id': existing['_id']}, {'$set': {'status': 'active', 'subject_id': sid, 'updated_at': now}})
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

    # ─── 7. CHAPTERS, QUIZZES, & 20 MCQs PER CHAPTER ───────────
    chapters_with_mcqs = get_msbshse_chapters_and_questions()
    total_quizzes = 0
    total_mcqs = 0

    for ch_info in chapters_with_mcqs:
        ch_name = ch_info['name']
        grade = str(ch_info['grade'])
        subj_name = ch_info['subject']
        cat_name = ch_info['category']

        sid = subject_ids.get(subj_name, '')
        cid = category_ids.get(cat_name, '')

        # Upsert Chapter
        existing_ch = db.chapters.find_one({'name': ch_name, 'grade': grade})
        ch_id = None
        if existing_ch:
            ch_id = str(existing_ch['_id'])
            db.chapters.update_one(
                {'_id': existing_ch['_id']},
                {'$set': {
                    'subject_id': sid,
                    'category_id': cid,
                    'order': ch_info['order'],
                    'description': ch_info['description'],
                    'status': 'active',
                    'passing_score_pct': 70,
                    'updated_at': now
                }}
            )
        else:
            res = db.chapters.insert_one({
                'name': ch_name,
                'grade': grade,
                'subject_id': sid,
                'category_id': cid,
                'order': ch_info['order'],
                'description': ch_info['description'],
                'status': 'active',
                'passing_score_pct': 70,
                'created_at': now,
                'updated_at': now
            })
            ch_id = str(res.inserted_id)

        # Upsert Quiz for Chapter (Total 20 marks, 20 minutes)
        quiz_title = f"{ch_name} - Assessment"
        existing_quiz = db.quizzes.find_one({'chapter_id': ch_id})
        quiz_id = None

        quiz_doc = {
            'title': quiz_title,
            'description': f"Official Maharashtra State Board 20-MCQ Mastery Assessment for {ch_name} (Grade {grade}).",
            'grade': grade,
            'subject_id': sid,
            'category_id': cid,
            'chapter_id': ch_id,
            'difficulty': 'medium',
            'duration_minutes': 20,
            'total_marks': 20,
            'passing_percentage': 70,
            'sequence_number': ch_info['order'],
            'is_final_exam': False,
            'allow_retry': True,
            'max_attempts': 5,
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
            'updated_at': now
        }

        if existing_quiz:
            quiz_id = str(existing_quiz['_id'])
            db.quizzes.update_one({'_id': existing_quiz['_id']}, {'$set': quiz_doc})
        else:
            quiz_doc['created_at'] = now
            res = db.quizzes.insert_one(quiz_doc)
            quiz_id = str(res.inserted_id)

        total_quizzes += 1

        # Delete existing questions for this quiz to keep exactly the fresh 20 MCQs
        db.questions.delete_many({'quiz_id': quiz_id})

        # Insert 20 MCQs
        mcqs_to_insert = []
        for i, q in enumerate(ch_info['questions']):
            mcqs_to_insert.append({
                'quiz_id': quiz_id,
                'chapter_id': ch_id,
                'subject_id': sid,
                'grade': grade,
                'question': q['q'],
                'option_a': q['a'],
                'option_b': q['b'],
                'option_c': q['c'],
                'option_d': q['d'],
                'correct_answer': q['ans'],
                'explanation': q['exp'],
                'difficulty': q.get('diff', 'medium'),
                'bloom_level': 'Understanding',
                'question_type': 'mcq',
                'marks': 1,
                'order': i + 1,
                'created_by': teacher_id_value,
                'created_at': now,
                'updated_at': now
            })

        if mcqs_to_insert:
            db.questions.insert_many(mcqs_to_insert)
            total_mcqs += len(mcqs_to_insert)

    print(f'✅ Seeded {len(chapters_with_mcqs)} Maharashtra State Board Chapters across Grades 6–9')
    print(f'✅ Seeded {total_quizzes} Quizzes with {total_mcqs} comprehensive MCQs (20 per chapter)')

    # ─── 8. SYSTEM SETTINGS ────────────────────────────────────
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

    print('\n🎉 Maharashtra State Board curriculum & classes database seed complete!')


if __name__ == '__main__':
    seed_database()
