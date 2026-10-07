import bcrypt
from werkzeug.security import check_password_hash as werkzeug_check


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against bcrypt or werkzeug/scrypt hashes cleanly and safely."""
    if not password or not hashed:
        return False
    try:
        # Check if hash is Werkzeug / scrypt / pbkdf2 format
        if hashed.startswith('scrypt:') or hashed.startswith('pbkdf2:'):
            return werkzeug_check(hashed, password)

        # Check bcrypt format ($2a$, $2b$, $2y$)
        if hashed.startswith('$2'):
            return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

        # Fallback to werkzeug check then bcrypt
        try:
            if werkzeug_check(hashed, password):
                return True
        except Exception:
            pass

        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


from utils.validators import validate_password

