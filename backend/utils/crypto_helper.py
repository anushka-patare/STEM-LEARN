"""Cryptographic helpers for encrypting sensitive settings (e.g. SMTP passwords) at rest."""
import os
import base64
import hashlib
from cryptography.fernet import Fernet


def get_fernet():
    """Get or generate a deterministic Fernet cipher instance."""
    fernet_key = os.getenv('FERNET_KEY')
    if not fernet_key:
        # Deterministically derive 32-byte key from SECRET_KEY as fallback
        secret = os.getenv('SECRET_KEY', 'stemlearn_default_secret_key_32bytes_!')
        key = base64.urlsafe_b64encode(hashlib.sha256(secret.encode()).digest())
        return Fernet(key)
    try:
        return Fernet(fernet_key.encode() if isinstance(fernet_key, str) else fernet_key)
    except Exception:
        key = base64.urlsafe_b64encode(hashlib.sha256(str(fernet_key).encode()).digest())
        return Fernet(key)


def encrypt_secret(secret_text: str) -> str:
    """Encrypt plaintext string and return base64 encoded ciphertext."""
    if not secret_text:
        return ""
    f = get_fernet()
    return f.encrypt(secret_text.encode('utf-8')).decode('utf-8')


def decrypt_secret(cipher_text: str) -> str:
    """Decrypt ciphertext string and return plaintext."""
    if not cipher_text:
        return ""
    f = get_fernet()
    try:
        return f.decrypt(cipher_text.encode('utf-8')).decode('utf-8')
    except Exception:
        # If decryption fails (e.g., if stored as plaintext previously), return as-is
        return cipher_text
