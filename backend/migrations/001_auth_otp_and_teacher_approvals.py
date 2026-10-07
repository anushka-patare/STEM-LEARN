"""
Migration 001: Additive fields for Email OTP, Teacher Approvals, and Security.
Idempotent script safe to run multiple times with dry-run support.
"""
import os
import sys
from datetime import datetime
from pymongo import MongoClient

def run_migration(mongo_uri=None, dry_run=False):
    if not mongo_uri:
        mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/stem_learning')

    client = MongoClient(mongo_uri)
    db = client.get_default_database()
    print(f"[{'DRY RUN' if dry_run else 'APPLYING'}] Running Migration 001 on database: {db.name}")

    # 1. Update existing teachers without approval_status to 'active'
    teacher_query = {'role': 'teacher', 'approval_status': {'$exists': False}}
    teacher_count = db.users.count_documents(teacher_query)
    print(f"Found {teacher_count} teachers requiring approval_status field.")
    if not dry_run and teacher_count > 0:
        db.users.update_many(teacher_query, {'$set': {'approval_status': 'active', 'updated_at': datetime.utcnow()}})

    # 2. Set research_consent default to true for students
    student_query = {'role': 'student', 'research_consent': {'$exists': False}}
    student_count = db.users.count_documents(student_query)
    print(f"Found {student_count} students requiring research_consent field.")
    if not dry_run and student_count > 0:
        db.users.update_many(student_query, {'$set': {'research_consent': True, 'updated_at': datetime.utcnow()}})

    # 3. Create non-destructive indexes
    if not dry_run:
        db.users.create_index([('email', 1)], unique=True, sparse=True)
        db.login_logs.create_index([('created_at', -1)])
        db.quiz_attempts.create_index([('student_id', 1), ('quiz_id', 1)])
        db.quiz_security_events.create_index([('attempt_id', 1)])
        print("Indexes ensured successfully.")

    print("Migration 001 completed successfully.")

if __name__ == '__main__':
    dry = '--dry-run' in sys.argv
    uri = os.getenv('MONGO_URI')
    run_migration(uri, dry_run=dry)
