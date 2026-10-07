"""Grade 9 Seed & Data Management Script for STEMLearn.

Provides idempotent seeding and cleanup of Grade 9 classes, curriculum,
teacher assignments, demo students (student9a1@demo.invalid - student9b5@demo.invalid),
squad teams, and sample quiz attempts.

Usage:
    python seed_grade9.py              # Normal idempotent insertion
    python seed_grade9.py --dry-run    # Preview changes without modifying database
    python seed_grade9.py --cleanup    # Remove only documents marked is_demo: true
"""

import os
import sys
import argparse
from datetime import datetime, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from utils.password import hash_password
from utils.generators import generate_student_id, generate_team_code


def get_db():
    """Connect to MongoDB."""
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/stem_learning')
    client = MongoClient(mongo_uri)
    return client.get_default_database()


def check_production_environment():
    """Refuse to run if FLASK_ENV or ENV is production."""
    env = os.getenv('FLASK_ENV', os.getenv('ENV', 'development')).lower()
    if env in ['production', 'prod']:
        print("❌ ERROR: seed_grade9.py is blocked from running in production environment.")
        sys.exit(1)


def cleanup_grade9_demo_data(db, dry_run=False):
    """Safely remove only documents marked with is_demo: true."""
    print("🧹 [CLEANUP] Finding all demo documents marked with is_demo: true...")

    collections = [
        'quiz_attempts',
        'quiz_security_events',
        'quizzes',
        'chapters',
        'teams',
        'classes',
        'users'
    ]

    for col_name in collections:
        col = db[col_name]
        count = col.count_documents({'is_demo': True})
        print(f"   Found {count} demo records in '{col_name}'")
        if not dry_run and count > 0:
            res = col.delete_many({'is_demo': True})
            print(f"   🗑️ Deleted {res.deleted_count} demo records from '{col_name}'")

    print("✅ Grade 9 demo data cleanup complete.")


def seed_grade9_data(db, dry_run=False):
    """Seed Grade 9 classes, curriculum, demo teacher assignment, students, squads, and attempts."""
    print("🌱 [SEED GRADE 9] Checking and provisioning Grade 9 data...")
    if dry_run:
        print("🔍 RUNNING IN DRY-RUN MODE: No database records will be modified.")

    now = datetime.utcnow()
    inserted_summary = {
        'classes': 0,
        'chapters': 0,
        'quizzes': 0,
        'students': 0,
        'teams': 0,
        'attempts': 0
    }

    # ─── 1. TEACHER LOOKUP ─────────────────────────────────────
    teacher = db.users.find_one({'email': 'teacher@stemlearn.com', 'role': 'teacher'})
    teacher_id = str(teacher['_id']) if teacher else ''

    # ─── 2. GRADE 9 CLASSES (9-A: Competitive, 9-B: Collaborative) ─
    grade9_classes = [
        {'grade': '9', 'division': 'A', 'teacher_id': teacher_id, 'status': 'active', 'is_demo': True, 'mode': 'competitive'},
        {'grade': '9', 'division': 'B', 'teacher_id': teacher_id, 'status': 'active', 'is_demo': True, 'mode': 'collaborative'},
    ]

    for cls in grade9_classes:
        existing = db.classes.find_one({'grade': cls['grade'], 'division': cls['division']})
        if not existing:
            if not dry_run:
                db.classes.insert_one({**cls, 'created_at': now, 'updated_at': now})
            inserted_summary['classes'] += 1
            print(f"   ➕ Class created: Grade {cls['grade']}-{cls['division']} ({cls['mode']})")
        else:
            print(f"   ℹ️  Class already exists: Grade {cls['grade']}-{cls['division']}")

    # ─── 3. ASSIGN TEACHER TO GRADE 9 CLASSES ──────────────────
    if teacher and not dry_run:
        assigned = teacher.get('assigned_classes', [])
        has_9a = any(isinstance(c, dict) and c.get('grade') == '9' and c.get('division') == 'A' for c in assigned)
        has_9b = any(isinstance(c, dict) and c.get('grade') == '9' and c.get('division') == 'B' for c in assigned)
        updated_assigned = list(assigned)
        if not has_9a:
            updated_assigned.append({'grade': '9', 'division': 'A', 'subject': 'Science'})
        if not has_9b:
            updated_assigned.append({'grade': '9', 'division': 'B', 'subject': 'Science'})
        if len(updated_assigned) != len(assigned):
            db.users.update_one({'_id': teacher['_id']}, {'$set': {'assigned_classes': updated_assigned, 'updated_at': now}})
            print("   ✅ Updated demo teacher with Grade 9-A and 9-B assignments")

    # ─── 4. SUBJECTS & CATEGORIES LOOKUP ───────────────────────
    science = db.subjects.find_one({'name': 'Science'})
    tech = db.subjects.find_one({'name': 'Technology'})
    eng = db.subjects.find_one({'name': 'Engineering'})
    math = db.subjects.find_one({'name': 'Mathematics'})

    science_id = str(science['_id']) if science else ''
    physics = db.categories.find_one({'name': 'Physics'})
    physics_id = str(physics['_id']) if physics else ''

    # ─── 5. STARTER GRADE 9 CHAPTERS ───────────────────────────
    g9_chapters_data = [
        {
            'name': 'Thermodynamics and Heat Energy',
            'subject': 'Science',
            'subject_id': science_id,
            'category': 'Physics',
            'category_id': physics_id,
            'grade': '9',
            'order': 1,
            'description': 'Principles of heat transfer, enthalpy, laws of thermodynamics, and thermal equilibrium.',
            'passing_percentage': 70,
            'is_demo': True
        },
        {
            'name': 'Chemical Bonding and Molecular Structure',
            'subject': 'Science',
            'subject_id': science_id,
            'category': 'Chemistry',
            'category_id': str(db.categories.find_one({'name': 'Chemistry'}).get('_id', '')) if db.categories.find_one({'name': 'Chemistry'}) else '',
            'grade': '9',
            'order': 2,
            'description': 'Ionic, covalent, and metallic bonds, electron dot structures, and molecular polarity.',
            'passing_percentage': 70,
            'is_demo': True
        },
        {
            'name': 'Python Scripting and Data Structures',
            'subject': 'Technology',
            'subject_id': str(tech['_id']) if tech else '',
            'category': 'Programming',
            'category_id': str(db.categories.find_one({'name': 'Programming'}).get('_id', '')) if db.categories.find_one({'name': 'Programming'}) else '',
            'grade': '9',
            'order': 1,
            'description': 'Object-oriented concepts, lists, dictionaries, functions, and algorithmic complexity.',
            'passing_percentage': 70,
            'is_demo': True
        },
        {
            'name': 'Quadratic Equations and Coordinate Geometry',
            'subject': 'Mathematics',
            'subject_id': str(math['_id']) if math else '',
            'category': 'Algebra',
            'category_id': str(db.categories.find_one({'name': 'Algebra'}).get('_id', '')) if db.categories.find_one({'name': 'Algebra'}) else '',
            'grade': '9',
            'order': 1,
            'description': 'Factoring, quadratic formula, parabolic curves, coordinate planes, and geometric distance.',
            'passing_percentage': 70,
            'is_demo': True
        }
    ]

    chapter_map = {}
    for ch in g9_chapters_data:
        existing = db.chapters.find_one({'name': ch['name'], 'grade': '9'})
        if not existing:
            if not dry_run:
                res = db.chapters.insert_one({**ch, 'status': 'active', 'created_at': now, 'updated_at': now})
                chapter_map[ch['name']] = str(res.inserted_id)
            else:
                chapter_map[ch['name']] = 'dry-run-ch-id'
            inserted_summary['chapters'] += 1
            print(f"   ➕ Chapter created: Grade 9 - {ch['name']}")
        else:
            chapter_map[ch['name']] = str(existing['_id'])
            print(f"   ℹ️  Chapter already exists: Grade 9 - {ch['name']}")

    # ─── 6. SAMPLE QUIZZES FOR GRADE 9 ─────────────────────────
    thermo_id = chapter_map.get('Thermodynamics and Heat Energy', '')
    if thermo_id:
        existing_quiz = db.quizzes.find_one({'title': 'Grade 9 Thermodynamics Mastery', 'grade': '9'})
        if not existing_quiz:
            quiz_doc = {
                'title': 'Grade 9 Thermodynamics Mastery',
                'description': 'Assess core comprehension of heat engines, specific heat capacity, and thermal expansion.',
                'grade': '9',
                'subject_id': science_id,
                'category_id': physics_id,
                'chapter_id': thermo_id,
                'difficulty': 'medium',
                'duration_minutes': 15,
                'total_marks': 20,
                'passing_percentage': 70,
                'sequence_number': 1,
                'is_final_exam': False,
                'allow_retry': True,
                'max_attempts': 3,
                'questions': [
                    {
                        'id': 'q9-1',
                        'text': 'Which law of thermodynamics states that energy cannot be created or destroyed?',
                        'options': ['Zeroth Law', 'First Law', 'Second Law', 'Third Law'],
                        'correct_answer': 'First Law',
                        'marks': 5,
                        'bloom_taxonomy': 'Recall'
                    },
                    {
                        'id': 'q9-2',
                        'text': 'In heat transfer, thermal radiation transfers energy via which mechanism?',
                        'options': ['Electromagnetic waves', 'Direct molecular collision', 'Fluid convection currents', 'Electron migration'],
                        'correct_answer': 'Electromagnetic waves',
                        'marks': 5,
                        'bloom_taxonomy': 'Comprehension'
                    },
                    {
                        'id': 'q9-3',
                        'text': 'What is the standard SI unit of specific heat capacity?',
                        'options': ['J / (kg·K)', 'Calories', 'Watts / m²', 'Joules / second'],
                        'correct_answer': 'J / (kg·K)',
                        'marks': 5,
                        'bloom_taxonomy': 'Application'
                    },
                    {
                        'id': 'q9-4',
                        'text': 'When heat flows spontaneously between two isolated objects, in which direction does it flow?',
                        'options': ['From higher temperature to lower temperature', 'From lower temperature to higher temperature', 'Equally in both directions', 'Independent of temperature'],
                        'correct_answer': 'From higher temperature to lower temperature',
                        'marks': 5,
                        'bloom_taxonomy': 'Analysis'
                    }
                ],
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
                'created_by': teacher_id or 'admin',
                'is_demo': True,
                'created_at': now,
                'updated_at': now
            }
            if not dry_run:
                q_res = db.quizzes.insert_one(quiz_doc)
                g9_quiz_id = str(q_res.inserted_id)
            else:
                g9_quiz_id = 'dry-run-quiz-id'
            inserted_summary['quizzes'] += 1
            print("   ➕ Quiz created: Grade 9 Thermodynamics Mastery")
        else:
            g9_quiz_id = str(existing_quiz['_id'])

    # ─── 7. DEMO GRADE 9 SQUADS (for 9-B Collaborative) ────────
    squad_a_doc = db.teams.find_one({'name': 'Quantum Ninjas', 'grade': '9'})
    if not squad_a_doc:
        squad_a_data = {
            'name': 'Quantum Ninjas',
            'grade': '9',
            'division': 'B',
            'code': generate_team_code(),
            'scoring_method': 'average',
            'status': 'active',
            'created_by': teacher_id,
            'is_demo': True,
            'created_at': now,
            'updated_at': now
        }
        if not dry_run:
            res_a = db.teams.insert_one(squad_a_data)
            squad_a_id = str(res_a.inserted_id)
        else:
            squad_a_id = 'dry-run-sq-a'
        inserted_summary['teams'] += 1
        print("   ➕ Squad created: Quantum Ninjas (Grade 9-B)")
    else:
        squad_a_id = str(squad_a_doc['_id'])

    squad_b_doc = db.teams.find_one({'name': 'Cyber Voyagers', 'grade': '9'})
    if not squad_b_doc:
        squad_b_data = {
            'name': 'Cyber Voyagers',
            'grade': '9',
            'division': 'B',
            'code': generate_team_code(),
            'scoring_method': 'average',
            'status': 'active',
            'created_by': teacher_id,
            'is_demo': True,
            'created_at': now,
            'updated_at': now
        }
        if not dry_run:
            res_b = db.teams.insert_one(squad_b_data)
            squad_b_id = str(res_b.inserted_id)
        else:
            squad_b_id = 'dry-run-sq-b'
        inserted_summary['teams'] += 1
        print("   ➕ Squad created: Cyber Voyagers (Grade 9-B)")
    else:
        squad_b_id = str(squad_b_doc['_id'])

    # ─── 8. 10 DEMO STUDENTS (5 in 9-A Competitive, 5 in 9-B Collaborative) ─
    demo_students = [
        # 9-A Competitive
        {'name': 'Tanvi Deshpande', 'email': 'student9a1@demo.invalid', 'grade': '9', 'division': 'A', 'roll': '01', 'team_id': None, 'points': 880},
        {'name': 'Devansh Kapoor', 'email': 'student9a2@demo.invalid', 'grade': '9', 'division': 'A', 'roll': '02', 'team_id': None, 'points': 920},
        {'name': 'Isha Kulkarni', 'email': 'student9a3@demo.invalid', 'grade': '9', 'division': 'A', 'roll': '03', 'team_id': None, 'points': 850},
        {'name': 'Neel Banerji', 'email': 'student9a4@demo.invalid', 'grade': '9', 'division': 'A', 'roll': '04', 'team_id': None, 'points': 790},
        {'name': 'Zoya Siddiqui', 'email': 'student9a5@demo.invalid', 'grade': '9', 'division': 'A', 'roll': '05', 'team_id': None, 'points': 940},

        # 9-B Collaborative
        {'name': 'Rishi Sen', 'email': 'student9b1@demo.invalid', 'grade': '9', 'division': 'B', 'roll': '01', 'team_id': squad_a_id, 'points': 910},
        {'name': 'Meera Sundaram', 'email': 'student9b2@demo.invalid', 'grade': '9', 'division': 'B', 'roll': '02', 'team_id': squad_a_id, 'points': 930},
        {'name': 'Kabir Nambiar', 'email': 'student9b3@demo.invalid', 'grade': '9', 'division': 'B', 'roll': '03', 'team_id': squad_b_id, 'points': 860},
        {'name': 'Tara Choudhury', 'email': 'student9b4@demo.invalid', 'grade': '9', 'division': 'B', 'roll': '04', 'team_id': squad_b_id, 'points': 890},
        {'name': 'Yuvraj Rana', 'email': 'student9b5@demo.invalid', 'grade': '9', 'division': 'B', 'roll': '05', 'team_id': squad_b_id, 'points': 840},
    ]

    student_obj_ids = []
    for s in demo_students:
        existing_s = db.users.find_one({'email': s['email']})
        if not existing_s:
            s_doc = {
                'student_id': generate_student_id(),
                'full_name': s['name'],
                'email': s['email'],
                'username': s['email'],
                'password_hash': hash_password('student123'),
                'role': 'student',
                'grade': s['grade'],
                'division': s['division'],
                'roll_number': s['roll'],
                'team_id': s['team_id'],
                'points': s['points'],
                'status': 'active',
                'is_demo': True,
                'created_at': now,
                'updated_at': now
            }
            if not dry_run:
                res_s = db.users.insert_one(s_doc)
                student_obj_ids.append(str(res_s.inserted_id))
            inserted_summary['students'] += 1
            print(f"   ➕ Demo student created: {s['name']} ({s['email']}) -> Grade {s['grade']}-{s['division']}")
        else:
            student_obj_ids.append(str(existing_s['_id']))
            print(f"   ℹ️  Demo student already exists: {s['email']}")

    # ─── 9. SAMPLE QUIZ ATTEMPTS (For Telemetry & Leaderboard) ──
    if thermo_id and not dry_run and g9_quiz_id and student_obj_ids:
        for sid in student_obj_ids[:4]:
            existing_attempt = db.quiz_attempts.find_one({'student_id': sid, 'quiz_id': g9_quiz_id})
            if not existing_attempt:
                student_user = db.users.find_one({'_id': MongoClient().get_default_database().users.find_one({'_id': MongoClient().get_default_database().users.find_one({'email': 'student9a1@demo.invalid'})['_id']})['_id']}) if False else db.users.find_one({'email': 'student9a1@demo.invalid'})
                attempt_doc = {
                    'student_id': sid,
                    'quiz_id': g9_quiz_id,
                    'teacher_id': teacher_id,
                    'score': 18,
                    'total_marks': 20,
                    'percentage': 90.0,
                    'passed': True,
                    'started_at': now - timedelta(hours=2),
                    'completed_at': now - timedelta(hours=1, minutes=45),
                    'duration_seconds': 900,
                    'mode': 'competitive',
                    'status': 'completed',
                    'is_demo': True,
                    'created_at': now
                }
                db.quiz_attempts.insert_one(attempt_doc)
                inserted_summary['attempts'] += 1

    print("\n========================================================")
    print("🎉 Grade 9 Seeding Finished Summary:")
    print(f"   • Classes Inserted:  {inserted_summary['classes']}")
    print(f"   • Chapters Inserted: {inserted_summary['chapters']}")
    print(f"   • Quizzes Inserted:  {inserted_summary['quizzes']}")
    print(f"   • Teams Inserted:    {inserted_summary['teams']}")
    print(f"   • Students Inserted: {inserted_summary['students']}")
    print(f"   • Attempts Inserted: {inserted_summary['attempts']}")
    print("========================================================")


def main():
    parser = argparse.ArgumentParser(description="STEMLearn Grade 9 Seeding & Management Script")
    parser.add_argument('--dry-run', action='store_true', help='Preview actions without modifying database')
    parser.add_argument('--cleanup', action='store_true', help='Remove only is_demo: true documents')

    args = parser.parse_args()

    check_production_environment()
    db = get_db()

    if args.cleanup:
        cleanup_grade9_demo_data(db, dry_run=args.dry_run)
    else:
        seed_grade9_data(db, dry_run=args.dry_run)


if __name__ == '__main__':
    main()
