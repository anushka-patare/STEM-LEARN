"""Profile Photo Service for STEMLearn.

Handles profile photo validation, Pillow re-encoding, EXIF stripping,
square cropping, 256px/128px thumbnail generation, and deletion on replace.
"""
import os
from bson import ObjectId
from utils.photo_storage import process_and_save_profile_photo, delete_photo_file


def upload_user_photo(db, user_id: str, file_stream, role: str = None) -> tuple[bool, str, dict | None, int]:
    """Process and assign profile photo to user."""
    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return False, "User not found.", None, 404

    # Process and save new photo
    success, result = process_and_save_profile_photo(file_stream)
    if not success:
        return False, result, None, 400

    # Delete old photo files if they existed
    old_photo = user.get('profile_photo', {})
    if old_photo:
        delete_photo_file(old_photo.get('photo_path'))
        delete_photo_file(old_photo.get('thumbnail_path'))

    # Update user document
    db.users.update_one(
        {'_id': user['_id']},
        {
            '$set': {
                'profile_photo': result,
                'photo': result.get('photo_url', ''),
                'updated_at': result.get('uploaded_at')
            }
        }
    )

    return True, "Profile photo updated successfully.", result, 200


def delete_user_photo(db, user_id: str) -> tuple[bool, str, int]:
    """Delete user profile photo from disk and database."""
    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return False, "User not found.", 404

    old_photo = user.get('profile_photo', {})
    if old_photo:
        delete_photo_file(old_photo.get('photo_path'))
        delete_photo_file(old_photo.get('thumbnail_path'))

    db.users.update_one(
        {'_id': user['_id']},
        {
            '$unset': {'profile_photo': ''},
            '$set': {'photo': '', 'updated_at': user.get('updated_at')}
        }
    )

    return True, "Profile photo deleted successfully.", 200
