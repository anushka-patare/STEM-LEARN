"""Security utilities for the application."""
import html
import re


def sanitize_input(value):
    """Sanitize user input to prevent injection attacks."""
    if isinstance(value, str):
        value = value.strip()
        value = html.escape(value)
        return value
    elif isinstance(value, dict):
        return {k: sanitize_input(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [sanitize_input(item) for item in value]
    return value


def sanitize_mongo_query(query: dict) -> dict:
    """Remove MongoDB operators from user input to prevent NoSQL injection."""
    if not isinstance(query, dict):
        return query
    clean = {}
    for key, value in query.items():
        if isinstance(key, str) and key.startswith('$'):
            continue  # Skip MongoDB operators
        if isinstance(value, dict):
            clean[key] = sanitize_mongo_query(value)
        elif isinstance(value, list):
            clean[key] = [sanitize_mongo_query(item) if isinstance(item, dict) else item for item in value]
        else:
            clean[key] = value
    return clean


def mask_sensitive_data(data: dict, sensitive_keys: list = None) -> dict:
    """Mask sensitive fields in a dictionary."""
    if sensitive_keys is None:
        sensitive_keys = ['password', 'password_hash', 'api_key', 'secret_key',
                         'jwt_secret', 'groq_api_key', 'gemini_api_key']
    masked = {}
    for key, value in data.items():
        if key.lower() in [k.lower() for k in sensitive_keys]:
            masked[key] = '********'
        elif isinstance(value, dict):
            masked[key] = mask_sensitive_data(value, sensitive_keys)
        else:
            masked[key] = value
    return masked
