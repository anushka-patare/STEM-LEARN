import uuid
import os
import time
from werkzeug.utils import secure_filename


def generate_student_id() -> str:
    """Generate unique student ID."""
    timestamp = str(int(time.time()))[-6:]
    random_part = uuid.uuid4().hex[:4].upper()
    return f'STU-{timestamp}-{random_part}'


def generate_teacher_id() -> str:
    """Generate unique teacher ID."""
    timestamp = str(int(time.time()))[-6:]
    random_part = uuid.uuid4().hex[:4].upper()
    return f'TCH-{timestamp}-{random_part}'


def generate_attempt_id() -> str:
    """Generate unique quiz attempt ID."""
    return f'ATT-{uuid.uuid4().hex[:12].upper()}'


def generate_conversation_id() -> str:
    """Generate unique AI conversation ID."""
    return f'CONV-{uuid.uuid4().hex[:12].upper()}'


def generate_safe_filename(original_filename: str) -> str:
    """Generate a safe server-side filename."""
    ext = ''
    if '.' in original_filename:
        ext = original_filename.rsplit('.', 1)[1].lower()
    safe_name = f'{uuid.uuid4().hex}'
    if ext:
        safe_name = f'{safe_name}.{ext}'
    return safe_name


def generate_team_code() -> str:
    """Generate a short team code."""
    return uuid.uuid4().hex[:8].upper()
