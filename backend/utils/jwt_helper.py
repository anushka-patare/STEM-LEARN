from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, get_jwt
from datetime import timedelta


def generate_tokens(user_id: str, role: str, additional_claims: dict | str = None):
    """Generate short-lived access token (15 min) and refresh token for a user."""
    claims = {
        'role': role,
        'user_id': user_id
    }
    if isinstance(additional_claims, dict):
        claims.update(additional_claims)
    elif isinstance(additional_claims, str):
        claims['name'] = additional_claims

    access_token = create_access_token(
        identity=user_id,
        additional_claims=claims,
        expires_delta=timedelta(minutes=15)
    )
    refresh_token = create_refresh_token(
        identity=user_id,
        additional_claims=claims,
        expires_delta=timedelta(days=30)
    )
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer'
    }


def get_current_user_id():
    """Get the current authenticated user's ID."""
    return get_jwt_identity()


def get_current_user_role():
    """Get the current authenticated user's role."""
    claims = get_jwt()
    return claims.get('role', None)


def get_current_user_claims():
    """Get all claims from the current JWT."""
    return get_jwt()
