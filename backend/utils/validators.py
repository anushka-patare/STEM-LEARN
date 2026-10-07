import re
import os
from werkzeug.utils import secure_filename


ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
ALLOWED_MIME_TYPES = {'image/jpeg', 'image/png', 'image/webp'}


def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_mobile(mobile: str) -> bool:
    """Validate mobile number (10 digits)."""
    pattern = r'^\d{10}$'
    return bool(re.match(pattern, str(mobile)))


def validate_password(password: str) -> tuple:
    """Validate password strength (min 8 chars, mix of letters & numbers). Returns (is_valid, message)."""
    if not password or len(password) < 8:
        return False, 'Password must be at least 8 characters long.'
    if len(password) > 128:
        return False, 'Password must not exceed 128 characters.'
    if not any(c.isalpha() for c in password) or not any(c.isdigit() for c in password):
        return False, 'Password must contain a combination of letters and numbers.'
    return True, 'Valid'


def validate_name(name: str) -> bool:
    """Validate name (2-100 chars, letters and spaces)."""
    if not name or len(name) < 2 or len(name) > 100:
        return False
    return bool(re.match(r'^[a-zA-Z\s]+$', name))


def validate_grade(grade: str) -> bool:
    """Validate grade is 6, 7, 8, or 9."""
    return str(grade) in ['6', '7', '8', '9']


def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_file_upload(file) -> tuple:
    """Validate file upload. Returns (is_valid, message)."""
    if not file:
        return False, 'No file provided'
    if not file.filename:
        return False, 'No filename'
    if not allowed_file(file.filename):
        return False, f'File type not allowed. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'
    # Check MIME type
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        return False, f'Invalid file type. Allowed: {", ".join(ALLOWED_MIME_TYPES)}'
    return True, 'Valid'


def sanitize_string(value: str) -> str:
    """Basic string sanitization."""
    if not value:
        return ''
    # Remove leading/trailing whitespace
    value = value.strip()
    # Remove potential script tags
    value = re.sub(r'<script.*?</script>', '', value, flags=re.IGNORECASE | re.DOTALL)
    # Remove HTML tags
    value = re.sub(r'<[^>]+>', '', value)
    return value


def validate_object_id(id_str: str) -> bool:
    """Validate MongoDB ObjectId format."""
    return bool(re.match(r'^[0-9a-fA-F]{24}$', str(id_str)))
