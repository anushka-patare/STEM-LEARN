"""Migration 001: Phase 1 Auth, Indexes, and Security Fields.
Idempotent script to ensure unique indexes, TTL indexes, and user fields.
"""
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from pymongo import MongoClient
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()


def run_migration():
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/stem_learning')
    client = MongoClient(mongo_uri)
    db = client.get_default_database()

    print("🚀 Running Migration 001: Auth indexes and security fields...")

    # 1. Users collection indexes
    try:
        db.users.create_index('username', unique=True, sparse=True)
        db.users.create_index('email', unique=True, sparse=True)
        db.users.create_index([('role', 1), ('status', 1)])
        db.users.create_index([('role', 1), ('approval_status', 1)])
        print("✅ Users indexes verified (username, email, role+status)")
    except Exception as e:
        print(f"⚠️ Users index warning: {e}")

    # 2. Password Reset Tokens indexes (TTL index on expires_at)
    try:
        db.password_reset_tokens.create_index('token_hash', unique=True)
        db.password_reset_tokens.create_index('expires_at', expireAfterSeconds=0)
        db.password_reset_tokens.create_index([('user_id', 1), ('used', 1)])
        print("✅ Password Reset Tokens indexes verified (token_hash, TTL on expires_at)")
    except Exception as e:
        print(f"⚠️ Password reset token index warning: {e}")

    # 3. Login Audit indexes
    try:
        db.login_audit.create_index([('at', -1)])
        db.login_audit.create_index([('user_id', 1), ('at', -1)])
        db.login_audit.create_index([('ip', 1)])
        print("✅ Login Audit indexes verified (at, user_id, ip)")
    except Exception as e:
        print(f"⚠️ Login audit index warning: {e}")

    # 4. Settings unique key index
    try:
        db.settings.create_index('key', unique=True, sparse=True)
        print("✅ Settings index verified (key)")
    except Exception as e:
        print(f"⚠️ Settings index warning: {e}")

    # 5. Populate missing username/status for existing users (idempotent)
    users_cursor = list(db.users.find({'username': {'$exists': False}}))
    migrated_count = 0
    for u in users_cursor:
        base = u.get('roll_number') or u.get('student_id') or u.get('employee_id') or (u.get('email', '').split('@')[0])
        if not base:
            base = f"user_{str(u['_id'])[-6:]}"
        
        derived_username = base.lower()
        # Ensure uniqueness
        if db.users.find_one({'username': derived_username, '_id': {'$ne': u['_id']}}):
            derived_username = f"{derived_username}_{str(u['_id'])[-4:]}"

        db.users.update_one(
            {'_id': u['_id']},
            {
                '$set': {
                    'username': derived_username,
                    'approval_status': u.get('approval_status') or u.get('status') or 'active',
                    'failed_login_count': u.get('failed_login_count', 0),
                    'must_change_password': u.get('must_change_password', False),
                    'is_deleted': False
                }
            }
        )
        migrated_count += 1

    print(f"✅ Users schema migration: {migrated_count} users updated with default security fields.")
    print("🎉 Migration 001 completed successfully!")


if __name__ == '__main__':
    run_migration()
