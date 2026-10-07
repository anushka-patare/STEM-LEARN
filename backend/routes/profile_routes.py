"""Profile management and secure photo upload/serving routes."""
import os
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, decode_token
from bson import ObjectId
from utils.validators import sanitize_string
from utils.photo_storage import process_and_save_profile_photo, delete_stored_photo, get_photo_upload_dir
from middleware.role_middleware import admin_required

profile_bp = Blueprint('profile', __name__)


def _log_photo_event(db, user_id, role, event_type, details=""):
    """Write photo modification event to audit log."""
    try:
        db.login_logs.insert_one({
            'user_id': str(user_id),
            'role': role,
            'event_type': event_type,
            'details': details,
            'ip_address': request.remote_addr,
            'browser': request.user_agent.string[:200] if request.user_agent else '',
            'created_at': datetime.utcnow()
        })
    except Exception:
        pass


@profile_bp.route('', methods=['GET'])
@jwt_required()
def get_profile():
    db = current_app.config['db']
    user_id = get_jwt_identity()
    try:
        user = db.users.find_one({'_id': ObjectId(user_id)}, {'password_hash': 0, 'otp_hash': 0})
        if not user:
            return jsonify({'success': False, 'message': 'User not found', 'error_code': 'NOT_FOUND'}), 404
        user['_id'] = str(user['_id'])
        if user.get('team_id'):
            user['team_id'] = str(user['team_id'])
        if user.get('education') and not user.get('qualification'):
            user['qualification'] = user['education']
        elif user.get('qualification') and not user.get('education'):
            user['education'] = user['qualification']
        return jsonify({'success': True, 'data': user})
    except Exception:
        return jsonify({'success': False, 'message': 'Error loading profile', 'error_code': 'FETCH_ERROR'}), 500


@profile_bp.route('', methods=['PUT'])
@jwt_required()
def update_profile():
    db = current_app.config['db']
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', '')

    data = request.get_json(silent=True) or {}
    try:
        update = {'updated_at': datetime.utcnow()}

        # Handle username update with validation and uniqueness
        if 'username' in data and data['username']:
            new_username = sanitize_string(data['username']).strip().lower()
            if len(new_username) < 3:
                return jsonify({'success': False, 'message': 'Username must be at least 3 characters long', 'error_code': 'INVALID_USERNAME'}), 400
            
            existing = db.users.find_one({'username': new_username, '_id': {'$ne': ObjectId(user_id)}})
            if existing:
                return jsonify({'success': False, 'message': 'Username is already taken by another account. Please choose a different username.', 'error_code': 'USERNAME_EXISTS'}), 409
            
            update['username'] = new_username

        # Allowed fields to edit
        allowed = ['full_name', 'name', 'mobile']
        if role == 'student':
            allowed.extend(['roll_number'])
        elif role == 'teacher':
            allowed.extend(['qualification', 'education', 'subject_specialization', 'bio'])
        elif role == 'admin':
            allowed.extend(['email'])

        for f in allowed:
            if f in data:
                val = sanitize_string(data[f])
                update[f] = val
                if f == 'full_name':
                    update['name'] = val
                elif f == 'name':
                    update['full_name'] = val
                elif f == 'education':
                    update['qualification'] = val
                elif f == 'qualification':
                    update['education'] = val

        db.users.update_one({'_id': ObjectId(user_id)}, {'$set': update})
        updated_user = db.users.find_one({'_id': ObjectId(user_id)}, {'password_hash': 0, 'otp_hash': 0})
        if updated_user:
            updated_user['_id'] = str(updated_user['_id'])
            if updated_user.get('team_id'):
                updated_user['team_id'] = str(updated_user['team_id'])
            if updated_user.get('education') and not updated_user.get('qualification'):
                updated_user['qualification'] = updated_user['education']
            elif updated_user.get('qualification') and not updated_user.get('education'):
                updated_user['education'] = updated_user['qualification']

        return jsonify({'success': True, 'message': 'Profile updated successfully', 'data': updated_user})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to update profile: {str(e)}', 'error_code': 'UPDATE_ERROR'}), 500


# ─── SECURE PHOTO UPLOAD / REPLACE ──────────────────────────────
@profile_bp.route('/photo', methods=['POST'])
@jwt_required()
def upload_profile_photo():
    """Upload or replace user profile photo with EXIF stripping and 512x512 / 128x128 resizing."""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'student')

    file = request.files.get('photo') or request.files.get('file')
    if not file:
        return jsonify({'success': False, 'message': 'No image file provided', 'error_code': 'NO_FILE'}), 400

    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({'success': False, 'message': 'User not found', 'error_code': 'NOT_FOUND'}), 404

    # Process, strip EXIF, and generate standard + thumbnail
    success, result = process_and_save_profile_photo(file.stream, file.filename)
    if not success:
        return jsonify({'success': False, 'message': result, 'error_code': 'INVALID_IMAGE'}), 400

    # Delete previous photo if existed
    old_photo = user.get('profile_photo', {})
    if isinstance(old_photo, dict) and old_photo.get('filename'):
        delete_stored_photo(old_photo['filename'])
    elif user.get('photo'):
        delete_stored_photo(user.get('photo'))

    photo_meta = {
        'filename': result['filename'],
        'thumbnail_filename': result['thumbnail_filename'],
        'photo_url': result['photo_url'],
        'thumbnail_url': result['thumbnail_url'],
        'updated_at': datetime.utcnow()
    }

    db.users.update_one(
        {'_id': ObjectId(user_id)},
        {'$set': {
            'profile_photo': photo_meta,
            'photo': result['photo_url'],
            'updated_at': datetime.utcnow()
        }}
    )

    _log_photo_event(db, user_id, role, 'photo_uploaded', f"Updated photo: {result['filename']}")

    return jsonify({
        'success': True,
        'message': 'Profile photo uploaded and processed successfully',
        'data': photo_meta
    })


# ─── REMOVE OWN PHOTO ───────────────────────────────────────────
@profile_bp.route('/photo', methods=['DELETE'])
@jwt_required()
def remove_profile_photo():
    """Remove user's current profile photo and revert to initials avatar."""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role', 'student')

    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    old_photo = user.get('profile_photo', {})
    if isinstance(old_photo, dict) and old_photo.get('filename'):
        delete_stored_photo(old_photo['filename'])
    elif user.get('photo'):
        delete_stored_photo(user.get('photo'))

    db.users.update_one(
        {'_id': ObjectId(user_id)},
        {'$unset': {'profile_photo': ''}, '$set': {'photo': '', 'updated_at': datetime.utcnow()}}
    )

    _log_photo_event(db, user_id, role, 'photo_removed', 'User removed profile photo')

    return jsonify({
        'success': True,
        'message': 'Profile photo removed successfully'
    })


# ─── SERVE AUTHENTICATED PHOTO WITH PRIVACY CHECKS ─────────────
@profile_bp.route('/photo/<filename>', methods=['GET'])
def serve_profile_photo(filename):
    """Serve photo with token validation and child student privacy controls."""
    db = current_app.config['db']
    clean_name = os.path.basename(filename)

    # 1. Resolve token from Authorization header or ?token= query parameter
    auth_header = request.headers.get('Authorization', '')
    token_str = ''
    if auth_header.startswith('Bearer '):
        token_str = auth_header.split(' ')[1]
    elif request.args.get('token'):
        token_str = request.args.get('token')

    requester_id = None
    requester_role = None

    if token_str:
        try:
            decoded = decode_token(token_str)
            requester_id = decoded.get('sub')
            requester_role = decoded.get('role')
        except Exception:
            pass

    # 2. Find photo owner in DB
    photo_owner = db.users.find_one({
        '$or': [
            {'profile_photo.filename': clean_name},
            {'profile_photo.thumbnail_filename': clean_name},
            {'photo': {'$regex': clean_name}}
        ]
    })

    # If owner is not found, check if file exists in photo directory
    photo_dir = get_photo_upload_dir()
    file_path = os.path.join(photo_dir, clean_name)
    if not os.path.exists(file_path):
        return jsonify({'success': False, 'message': 'Photo not found'}), 404

    # 3. Privacy Checks:
    # If owner is a student and requester is another student:
    if photo_owner and photo_owner.get('role') == 'student':
        is_self = requester_id and str(photo_owner['_id']) == str(requester_id)
        is_faculty_or_admin = requester_role in ['teacher', 'admin']

        if not is_self and not is_faculty_or_admin:
            # Check system setting
            settings = db.system_settings.find_one({'key': 'privacy_settings'}) or {}
            public_allowed = settings.get('show_student_photos_publicly', False)
            if not public_allowed:
                # Privacy rule: child photo protected from public/other students
                return jsonify({'success': False, 'message': 'Student photo visibility is restricted'}), 403

    return send_from_directory(photo_dir, clean_name)


# ─── ADMIN MODERATION: REMOVE ANY USER'S PHOTO ─────────────────
@profile_bp.route('/admin/users/<user_id>/photo', methods=['DELETE'])
@jwt_required()
@admin_required
def admin_remove_user_photo(user_id):
    """Admin moderation endpoint to remove an inappropriate profile photo."""
    db = current_app.config['db']
    try:
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        old_photo = user.get('profile_photo', {})
        if isinstance(old_photo, dict) and old_photo.get('filename'):
            delete_stored_photo(old_photo['filename'])
        elif user.get('photo'):
            delete_stored_photo(user.get('photo'))

        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$unset': {'profile_photo': ''}, '$set': {'photo': '', 'updated_at': datetime.utcnow()}}
        )

        admin_id = get_jwt_identity()
        _log_photo_event(db, admin_id, 'admin', 'photo_moderated_by_admin', f"Admin removed photo for user {user_id}")

        return jsonify({'success': True, 'message': "User's profile photo removed by administrator"})
    except Exception:
        return jsonify({'success': False, 'message': 'Failed to remove user photo'}), 500
