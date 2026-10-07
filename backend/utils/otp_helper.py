"""
Secure OTP Generation, Hashing, and Rate Limiting Helper.
"""
import secrets
import hashlib
from datetime import datetime, timedelta

def generate_otp_code() -> str:
    """Generate a cryptographically secure 6-digit numeric OTP."""
    return ''.join(str(secrets.randbelow(10)) for _ in range(6))

def hash_otp(otp_code: str) -> str:
    """Hash an OTP code using SHA-256."""
    return hashlib.sha256(otp_code.encode('utf-8')).hexdigest()

def verify_otp_hash(provided_code: str, stored_hash: str) -> bool:
    """Verify if the provided OTP matches the stored hash."""
    if not provided_code or not stored_hash:
        return False
    return hash_otp(str(provided_code).strip()) == stored_hash

def can_request_otp(user_doc: dict, db=None, ip_address=None, email=None) -> tuple:
    """
    Check cooldown and hourly rate limits for requesting OTP.
    Returns (allowed: bool, message: str, cooldown_seconds: int)
    """
    now = datetime.utcnow()
    last_req = user_doc.get('otp_last_requested_at') if user_doc else None

    # 1. 60-second cooldown check
    if last_req:
        elapsed = (now - last_req).total_seconds()
        if elapsed < 60:
            remaining = int(60 - elapsed)
            return False, f"Please wait {remaining} seconds before requesting a new OTP.", remaining

    # 2. Hourly rate limit check (max 5 per hour)
    if db and (email or (user_doc and user_doc.get('email'))):
        target_email = email or user_doc.get('email')
        one_hour_ago = now - timedelta(hours=1)
        hourly_count = db.login_logs.count_documents({
            'user_id': target_email,
            'event_type': 'otp_requested',
            'created_at': {'$gte': one_hour_ago}
        })
        if hourly_count >= 5:
            return False, "Maximum OTP requests per hour (5) exceeded. Please try again later.", 3600

    return True, "Allowed", 0
