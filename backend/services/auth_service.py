"""Authentication Service for STEMLearn.

Enforces Username + Password login across all roles (Student, Teacher, Admin),
Account Lockouts, Teacher Pending Approval State, and Audit Logging.
"""
from datetime import datetime, timedelta
from bson import ObjectId
from utils.password import hash_password, verify_password, validate_password
from utils.jwt_helper import generate_tokens
from utils.generators import generate_student_id, generate_teacher_id
from utils.validators import validate_email, validate_name, sanitize_string
from services.email_service import send_email, get_smtp_config


def get_auth_policy(db):
    """Retrieve lockout and password policy from settings."""
    settings = db.system_settings.find_one({'type': 'global'}) or {}
    return {
        'max_failed_logins': int(settings.get('max_failed_logins', 5)),
        'lockout_minutes': int(settings.get('lockout_minutes', 15)),
        'min_password_length': int(settings.get('min_password_length', 8)),
        'require_student_approval': bool(settings.get('require_student_approval', False))
    }


def authenticate_user(db, identifier: str, password: str, role: str, ip_address: str, user_agent: str) -> tuple[bool, str, dict | None, int]:
    """
    Authenticate user with Username + Password.
    Identifier can be username, roll number, or employee ID (or email for legacy transition).
    """
    clean_id = sanitize_string(identifier or '').strip().lower()
    if not clean_id or not password:
        return False, "Username and password are required.", None, 400

    now = datetime.utcnow()
    policy = get_auth_policy(db)

    # Search by username, student_id, teacher_id, or email
    query = {
        '$or': [
            {'username': clean_id},
            {'email': clean_id},
            {'student_id': clean_id.upper()},
            {'teacher_id': clean_id.upper()}
        ]
    }
    if role:
        query['role'] = role

    user = db.users.find_one(query)

    # Log audit helper
    def log_attempt(status, reason):
        audit_entry = {
            'user_id': str(user['_id']) if user else clean_id,
            'username': user.get('username') if user else clean_id,
            'role': role or (user.get('role') if user else 'unknown'),
            'ip': ip_address,
            'user_agent': user_agent[:200] if user_agent else '',
            'result': status,
            'reason': reason,
            'at': now
        }
        db.login_audit.insert_one(audit_entry)
        
        # Also log to login_logs for admin logs compatibility
        db.login_logs.insert_one({
            'user_id': str(user['_id']) if user else clean_id,
            'email': user.get('email') if user else (clean_id if '@' in str(clean_id) else None),
            'name': user.get('name') if user else None,
            'username': user.get('username') if user else clean_id,
            'role': role or (user.get('role') if user else 'unknown'),
            'ip_address': ip_address,
            'browser': user_agent[:200] if user_agent else '',
            'login_status': status,
            'login_time': now,
            'created_at': now
        })

    if not user:
        log_attempt('failed', 'User not found')
        return False, "Invalid username or password.", None, 401

    # Check account lockout
    locked_until = user.get('locked_until')
    if locked_until and locked_until > now:
        remaining_mins = int((locked_until - now).total_seconds() / 60) + 1
        log_attempt('locked', f"Account locked until {locked_until}")
        return False, f"Account is temporarily locked due to multiple failed login attempts. Please try again in {remaining_mins} minutes or reset your password.", None, 423

    # Check status & soft delete
    if user.get('is_deleted'):
        log_attempt('failed', 'Account is deleted')
        return False, "This account is no longer active.", None, 403

    user_status = user.get('status', 'active')
    approval_status = user.get('approval_status', 'active')

    # Teacher approval check
    if user.get('role') == 'teacher':
        if approval_status == 'pending' or user_status == 'pending':
            log_attempt('pending_approval', 'Teacher account pending approval')
            return False, "Your teacher registration is pending approval by the administrator.", None, 403
        if approval_status == 'rejected' or user_status == 'rejected':
            reason = user.get('rejection_reason', 'Please contact the administrator.')
            log_attempt('rejected', f"Teacher registration rejected: {reason}")
            return False, f"Your registration was rejected by the administrator: {reason}", None, 403

    if user_status in ['inactive', 'suspended', 'blocked']:
        log_attempt('failed', f"Account status: {user_status}")
        return False, f"Your account is currently {user_status}. Please contact the administrator.", None, 403

    # Verify password hash
    password_hash = user.get('password_hash', '')
    if not password_hash or not verify_password(password, password_hash):
        # Increment failed login counter
        failed_count = user.get('failed_login_count', 0) + 1
        update_fields = {'failed_login_count': failed_count}

        if failed_count >= policy['max_failed_logins']:
            lock_duration = timedelta(minutes=policy['lockout_minutes'])
            update_fields['locked_until'] = now + lock_duration
            db.users.update_one({'_id': user['_id']}, {'$set': update_fields})
            log_attempt('locked', f"Exceeded max failed attempts ({failed_count})")
            return False, f"Account locked for {policy['lockout_minutes']} minutes due to {policy['max_failed_logins']} failed login attempts.", None, 423

        db.users.update_one({'_id': user['_id']}, {'$set': update_fields})
        log_attempt('failed', f"Invalid password (attempt {failed_count}/{policy['max_failed_logins']})")
        return False, "Invalid username or password.", None, 401

    # Login successful: reset failed counters
    db.users.update_one(
        {'_id': user['_id']},
        {
            '$set': {
                'failed_login_count': 0,
                'locked_until': None,
                'last_login': now,
                'updated_at': now
            }
        }
    )

    log_attempt('success', 'Logged in successfully')

    # Generate JWT Tokens
    user_id_str = str(user['_id'])
    tokens = generate_tokens(user_id_str, user.get('role', 'student'), user.get('full_name') or user.get('name'))

    user_payload = {
        'id': user_id_str,
        'user_id': user_id_str,
        'username': user.get('username'),
        'email': user.get('email'),
        'full_name': user.get('full_name') or user.get('name') or user.get('username'),
        'role': user.get('role'),
        'grade': str(user.get('grade', '')),
        'division': user.get('division', ''),
        'photo': user.get('photo', ''),
        'profile_photo': user.get('profile_photo', {}),
        'must_change_password': bool(user.get('must_change_password', False)),
        'status': user_status,
        'teacher_id': user.get('teacher_id', ''),
        'mobile': user.get('mobile', ''),
        'subject_specialization': user.get('subject_specialization') or user.get('specialization', ''),
        'education': user.get('education') or user.get('qualification', ''),
        'qualification': user.get('qualification') or user.get('education', ''),
        'assigned_grade': str(user.get('assigned_grade', user.get('grade', ''))),
        'assigned_division': str(user.get('assigned_division', user.get('division', ''))),
        'assigned_subject': user.get('assigned_subject') or user.get('subject', ''),
        'assigned_classes': user.get('assigned_classes', []),
        'roll_number': user.get('roll_number', '')
    }

    return True, "Login successful.", {
        'access_token': tokens['access_token'],
        'refresh_token': tokens.get('refresh_token'),
        'user': user_payload,
        'must_change_password': bool(user.get('must_change_password', False))
    }, 200


def register_student(db, data: dict, ip_address: str) -> tuple[bool, str, dict | None, int]:
    """Register a new student for Grades 6–9."""
    full_name = sanitize_string(data.get('full_name') or data.get('name', ''))
    username = sanitize_string(data.get('username', '')).lower()
    email = sanitize_string(data.get('email', '')).lower()
    password = data.get('password', '')
    grade = str(data.get('grade', '')).strip()
    division = sanitize_string(data.get('division', 'A')).upper()

    if not full_name:
        return False, "Full name is required.", None, 400
    if not username or len(username) < 3:
        return False, "Username must be at least 3 characters long.", None, 400
    if not email or not validate_email(email):
        return False, "Valid email address is required (for password resets).", None, 400

    if grade not in ['6', '7', '8', '9']:
        return False, "Grade must be one of 6, 7, 8, or 9.", None, 400

    is_valid_pw, pw_msg = validate_password(password)
    if not is_valid_pw:
        return False, pw_msg, None, 400

    # Uniqueness checks
    if db.users.find_one({'username': username}):
        return False, "Username is already taken.", None, 409
    if db.users.find_one({'email': email}):
        return False, "Email address is already registered.", None, 409

    now = datetime.utcnow()
    policy = get_auth_policy(db)
    status = 'pending' if policy['require_student_approval'] else 'active'

    new_student = {
        'student_id': generate_student_id(),
        'full_name': full_name,
        'name': full_name,
        'username': username,
        'email': email,
        'password_hash': hash_password(password),
        'role': 'student',
        'grade': grade,
        'division': division,
        'roll_number': sanitize_string(data.get('roll_number', '')),
        'mobile': sanitize_string(data.get('mobile', '')),
        'photo': '',
        'status': status,
        'approval_status': status,
        'team_id': None,
        'points': 0,
        'created_at': now,
        'updated_at': now
    }

    result = db.users.insert_one(new_student)
    new_student_id = str(result.inserted_id)

    db.login_audit.insert_one({
        'user_id': new_student_id,
        'username': username,
        'role': 'student',
        'ip': ip_address,
        'result': 'student_registered',
        'reason': f"Student registration status: {status}",
        'at': now
    })

    if status == 'pending':
        return True, "Registration submitted successfully. Your account is pending approval.", {'user_id': new_student_id, 'status': 'pending'}, 201

    tokens = generate_tokens(new_student_id, 'student', full_name)
    user_payload = {
        'id': new_student_id,
        'user_id': new_student_id,
        'username': username,
        'email': email,
        'full_name': full_name,
        'role': 'student',
        'grade': grade,
        'division': division,
        'status': 'active'
    }

    return True, "Registration successful.", {
        'access_token': tokens['access_token'],
        'refresh_token': tokens.get('refresh_token'),
        'user': user_payload
    }, 201


def register_teacher(db, data: dict, ip_address: str) -> tuple[bool, str, dict | None, int]:
    """Register a new teacher (always enters pending status awaiting admin approval)."""
    full_name = sanitize_string(data.get('full_name') or data.get('name', ''))
    username = sanitize_string(data.get('username', '')).lower()
    email = sanitize_string(data.get('email', '')).lower()
    password = data.get('password', '')
    subject = sanitize_string(data.get('subject', 'Science'))
    education = sanitize_string(data.get('education', ''))
    mobile = sanitize_string(data.get('mobile', ''))

    if not full_name:
        return False, "Full name is required.", None, 400
    if not username or len(username) < 3:
        return False, "Username must be at least 3 characters long.", None, 400
    if not email or not validate_email(email):
        return False, "Valid email address is required.", None, 400

    is_valid_pw, pw_msg = validate_password(password)
    if not is_valid_pw:
        return False, pw_msg, None, 400

    if db.users.find_one({'username': username}):
        return False, "Username is already taken.", None, 409
    if db.users.find_one({'email': email}):
        return False, "Email address is already registered.", None, 409

    now = datetime.utcnow()
    new_teacher = {
        'teacher_id': generate_teacher_id(),
        'full_name': full_name,
        'name': full_name,
        'username': username,
        'email': email,
        'password_hash': hash_password(password),
        'role': 'teacher',
        'subject': subject,
        'subject_specialization': subject,
        'education': education,
        'mobile': mobile,
        'photo': '',
        'status': 'pending',
        'approval_status': 'pending',
        'assigned_classes': [],
        'created_at': now,
        'updated_at': now
    }

    result = db.users.insert_one(new_teacher)
    new_id = str(result.inserted_id)

    db.login_audit.insert_one({
        'user_id': new_id,
        'username': username,
        'role': 'teacher',
        'ip': ip_address,
        'result': 'teacher_registered_pending',
        'reason': 'Teacher registered - awaiting admin approval',
        'at': now
    })

    return True, "Your teacher registration has been submitted and is pending administrator review.", {
        'user_id': new_id,
        'status': 'pending'
    }, 201


def change_user_password(db, user_id: str, current_password: str, new_password: str, ip_address: str) -> tuple[bool, str, int]:
    """Change password for an authenticated user."""
    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return False, "User not found.", 404

    # If not must_change_password forced, verify current password
    if not user.get('must_change_password') and not verify_password(current_password, user.get('password_hash', '')):
        return False, "Current password is incorrect.", 400

    is_valid, msg = validate_password(new_password)
    if not is_valid:
        return False, msg, 400

    now = datetime.utcnow()
    db.users.update_one(
        {'_id': user['_id']},
        {
            '$set': {
                'password_hash': hash_password(new_password),
                'must_change_password': False,
                'updated_at': now,
                'token_version': user.get('token_version', 0) + 1
            }
        }
    )

    db.login_audit.insert_one({
        'user_id': str(user['_id']),
        'username': user.get('username'),
        'role': user.get('role'),
        'ip': ip_address,
        'result': 'password_changed',
        'reason': 'Password changed by user in session',
        'at': now
    })

    return True, "Password changed successfully.", 200
