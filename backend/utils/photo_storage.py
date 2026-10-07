"""Profile Photo Storage and Secure Processing Utility for STEMLearn.

Features:
- Binary inspection via Pillow (verifies real image bytes, not just client MIME/extension).
- Rejection of files > 2MB and non-image payloads.
- Complete EXIF/GPS metadata stripping (child protection).
- Dual generation: 512x512 standard profile avatar + 128x128 high-density thumbnail.
- Path traversal prevention using random UUID filenames.
- Safe deletion and storage abstraction.
"""

import os
import io
import uuid
from PIL import Image, ImageOps
from flask import current_app

MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB
ALLOWED_PIL_FORMATS = {'JPEG', 'PNG', 'WEBP'}
PHOTO_SUBDIR = 'profile_photos'


def get_photo_upload_dir():
    """Return absolute filesystem path for profile photos."""
    base_upload = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    if not os.path.isabs(base_upload):
        # Anchor to backend directory if relative
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        base_upload = os.path.join(backend_dir, base_upload)

    photo_dir = os.path.join(base_upload, PHOTO_SUBDIR)
    os.makedirs(photo_dir, exist_ok=True)
    return photo_dir


def process_and_save_profile_photo(file_stream, filename=None):
    """Validate, strip EXIF, resize, and persist profile photo and thumbnail.

    Returns:
        tuple: (success: bool, data_or_error: dict|str)
    """
    # 1. Read byte stream & check size
    file_bytes = file_stream.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        return False, "File size exceeds the 2MB limit. Please upload a smaller image."

    if len(file_bytes) == 0:
        return False, "Uploaded file is empty."

    # 2. Inspect with Pillow
    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.verify()  # Verifies file integrity
        # Re-open after verify() as verify() can invalidate the stream in Pillow
        image = Image.open(io.BytesIO(file_bytes))
    except Exception as e:
        return False, "Invalid image format. Please upload a valid JPG, PNG, or WEBP file."

    if image.format not in ALLOWED_PIL_FORMATS:
        return False, f"Unsupported image format: {image.format}. Allowed formats: JPG, PNG, WEBP."

    # 3. Strip EXIF by copying image data to a clean RGB canvas
    try:
        # Auto-orient based on EXIF before stripping orientation
        image = ImageOps.exif_transpose(image)
    except Exception:
        pass

    if image.mode in ('RGBA', 'LA', 'P'):
        # Create solid white background for transparency conversion
        background = Image.new('RGB', image.size, (255, 255, 255))
        if image.mode == 'P':
            image = image.convert('RGBA')
        background.paste(image, mask=image.split()[-1])
        rgb_image = background
    else:
        rgb_image = image.convert('RGB')

    # 4. Generate unique random filename
    unique_token = uuid.uuid4().hex
    main_filename = f"{unique_token}.jpg"
    thumb_filename = f"{unique_token}_thumb.jpg"

    photo_dir = get_photo_upload_dir()
    main_filepath = os.path.join(photo_dir, main_filename)
    thumb_filepath = os.path.join(photo_dir, thumb_filename)

    # 5. Crop / Resize to Square (512x512)
    width, height = rgb_image.size
    min_dim = min(width, height)
    left = (width - min_dim) // 2
    top = (height - min_dim) // 2
    right = left + min_dim
    bottom = top + min_dim

    square_image = rgb_image.crop((left, top, right, bottom))
    standard_512 = square_image.resize((512, 512), Image.Resampling.LANCZOS)
    thumb_128 = square_image.resize((128, 128), Image.Resampling.LANCZOS)

    # 6. Save images without EXIF
    standard_512.save(main_filepath, 'JPEG', quality=90, optimize=True)
    thumb_128.save(thumb_filepath, 'JPEG', quality=85, optimize=True)

    return True, {
        'filename': main_filename,
        'thumbnail_filename': thumb_filename,
        'photo_url': f'/api/profile/photo/{main_filename}',
        'thumbnail_url': f'/api/profile/photo/{thumb_filename}',
    }


def delete_stored_photo(filename):
    """Safely delete photo and its thumbnail."""
    if not filename:
        return
    # Prevent directory traversal
    clean_name = os.path.basename(filename)
    photo_dir = get_photo_upload_dir()
    main_path = os.path.join(photo_dir, clean_name)
    if os.path.exists(main_path):
        try:
            os.remove(main_path)
        except OSError:
            pass

    # Also check and remove thumbnail
    if not clean_name.endswith('_thumb.jpg'):
        thumb_name = clean_name.replace('.jpg', '_thumb.jpg')
        thumb_path = os.path.join(photo_dir, thumb_name)
        if os.path.exists(thumb_path):
            try:
                os.remove(thumb_path)
            except OSError:
                pass
