"""Video lesson management routes for STEM YouTube content linked to Subject -> Category -> Chapter."""
import re
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from bson import ObjectId
from middleware.role_middleware import role_required
from utils.validators import sanitize_string

video_bp = Blueprint('videos', __name__)


def extract_youtube_id(url):
    """Extract 11-character YouTube video ID from various YouTube URL formats."""
    if not url:
        return None
    url = str(url).strip()
    
    # Direct 11-char ID
    if len(url) == 11 and re.match(r'^[a-zA-Z0-9_-]{11}$', url):
        return url
        
    patterns = [
        r'(?:v=|\/v\/|youtu\.be\/|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})',
        r'(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})',
        r'(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
            
    # Parameter check
    if 'youtube.com' in url or 'youtu.be' in url:
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(url)
        if parsed.hostname in ['www.youtube.com', 'youtube.com', 'm.youtube.com']:
            qs = parse_qs(parsed.query)
            if 'v' in qs and len(qs['v']) > 0 and len(qs['v'][0]) == 11:
                return qs['v'][0]
        elif parsed.hostname == 'youtu.be':
            path = parsed.path.lstrip('/')
            if len(path) == 11:
                return path

    return None


@video_bp.route('', methods=['GET'])
@jwt_required()
def get_videos():
    """Get all videos with optional filters for subject_id, category_id, chapter_id, grade, and search."""
    db = current_app.config['db']
    subject_id = request.args.get('subject_id', '').strip()
    category_id = request.args.get('category_id', '').strip()
    chapter_id = request.args.get('chapter_id', '').strip()
    grade = request.args.get('grade', '').strip()
    search = request.args.get('search', '').strip()

    query = {}
    if subject_id:
        query['subject_id'] = subject_id
    if category_id:
        query['category_id'] = category_id
    if chapter_id:
        query['chapter_id'] = chapter_id
    if grade and grade != 'all':
        query['grade'] = grade
    if search:
        query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}},
            {'chapter_name': {'$regex': search, '$options': 'i'}},
            {'category_name': {'$regex': search, '$options': 'i'}},
            {'subject_name': {'$regex': search, '$options': 'i'}},
        ]

    videos = list(db.videos.find(query).sort([('created_at', -1)]))

    # Fast lookup dictionaries for names
    subjects_map = {str(s['_id']): s.get('name', 'STEM') for s in db.subjects.find({}, {'name': 1})}
    categories_map = {str(c['_id']): c.get('name', 'General') for c in db.categories.find({}, {'name': 1})}
    chapters_map = {str(ch['_id']): ch.get('name', 'General') for ch in db.chapters.find({}, {'name': 1, 'grade': 1})}

    for v in videos:
        v['_id'] = str(v['_id'])
        v['subject_name'] = subjects_map.get(str(v.get('subject_id', '')), v.get('subject_name', 'STEM'))
        v['category_name'] = categories_map.get(str(v.get('category_id', '')), v.get('category_name', 'General'))
        v['chapter_name'] = chapters_map.get(str(v.get('chapter_id', '')), v.get('chapter_name', 'General'))
        vid_id = v.get('youtube_video_id', '')
        v['thumbnail_url'] = f"https://img.youtube.com/vi/{vid_id}/hqdefault.jpg" if vid_id else ""
        v['embed_url'] = f"https://www.youtube-nocookie.com/embed/{vid_id}" if vid_id else ""

    return jsonify({'success': True, 'data': videos})


@video_bp.route('/hierarchy', methods=['GET'])
@jwt_required()
def get_video_hierarchy():
    """Return nested Subject -> Category -> Chapter structure with attached video count and items."""
    db = current_app.config['db']
    grade = request.args.get('grade', '').strip()

    # 1. Fetch all subjects
    subjects = list(db.subjects.find({'status': 'active'}).sort('name', 1))

    # 2. Fetch categories
    categories = list(db.categories.find({'status': 'active'}).sort('name', 1))

    # 3. Fetch chapters
    chapter_query = {'status': 'active'}
    if grade and grade != 'all':
        chapter_query['grade'] = grade
    chapters = list(db.chapters.find(chapter_query).sort([('grade', 1), ('order', 1), ('name', 1)]))

    # 4. Fetch all videos
    all_videos = list(db.videos.find().sort([('created_at', -1)]))

    # Map videos by chapter_id
    videos_by_chapter = {}
    for v in all_videos:
        v['_id'] = str(v['_id'])
        vid_id = v.get('youtube_video_id', '')
        v['thumbnail_url'] = f"https://img.youtube.com/vi/{vid_id}/hqdefault.jpg" if vid_id else ""
        v['embed_url'] = f"https://www.youtube-nocookie.com/embed/{vid_id}" if vid_id else ""
        ch_id = str(v.get('chapter_id', ''))
        if ch_id not in videos_by_chapter:
            videos_by_chapter[ch_id] = []
        videos_by_chapter[ch_id].append(v)

    # Map chapters by category_id
    chapters_by_category = {}
    for ch in chapters:
        ch_id = str(ch['_id'])
        cat_id = str(ch.get('category_id', ''))
        ch_obj = {
            '_id': ch_id,
            'name': ch.get('name', ''),
            'grade': ch.get('grade', ''),
            'description': ch.get('description', ''),
            'subject_id': str(ch.get('subject_id', '')),
            'category_id': cat_id,
            'videos': videos_by_chapter.get(ch_id, []),
            'video_count': len(videos_by_chapter.get(ch_id, []))
        }
        if cat_id not in chapters_by_category:
            chapters_by_category[cat_id] = []
        chapters_by_category[cat_id].append(ch_obj)

    # Map categories by subject_id
    categories_by_subject = {}
    for c in categories:
        cat_id = str(c['_id'])
        sub_id = str(c.get('subject_id', ''))
        cat_chapters = chapters_by_category.get(cat_id, [])
        cat_total_videos = sum(ch['video_count'] for ch in cat_chapters)
        cat_obj = {
            '_id': cat_id,
            'name': c.get('name', ''),
            'description': c.get('description', ''),
            'subject_id': sub_id,
            'chapters': cat_chapters,
            'chapter_count': len(cat_chapters),
            'video_count': cat_total_videos
        }
        if sub_id not in categories_by_subject:
            categories_by_subject[sub_id] = []
        categories_by_subject[sub_id].append(cat_obj)

    # Assemble complete hierarchy
    hierarchy = []
    for s in subjects:
        sub_id = str(s['_id'])
        sub_cats = categories_by_subject.get(sub_id, [])
        sub_total_videos = sum(cat['video_count'] for cat in sub_cats)
        sub_total_chapters = sum(cat['chapter_count'] for cat in sub_cats)
        hierarchy.append({
            '_id': sub_id,
            'name': s.get('name', ''),
            'icon': s.get('icon', '📚'),
            'description': s.get('description', ''),
            'categories': sub_cats,
            'category_count': len(sub_cats),
            'chapter_count': sub_total_chapters,
            'video_count': sub_total_videos
        })

    return jsonify({'success': True, 'data': hierarchy})


@video_bp.route('/<id>', methods=['GET'])
@jwt_required()
def get_video(id):
    """Get single video details."""
    db = current_app.config['db']
    try:
        video = db.videos.find_one({'_id': ObjectId(id)})
        if not video:
            return jsonify({'success': False, 'message': 'Video not found'}), 404
            
        video['_id'] = str(video['_id'])
        vid_id = video.get('youtube_video_id', '')
        video['thumbnail_url'] = f"https://img.youtube.com/vi/{vid_id}/hqdefault.jpg" if vid_id else ""
        video['embed_url'] = f"https://www.youtube-nocookie.com/embed/{vid_id}" if vid_id else ""

        # Resolve names
        subject = db.subjects.find_one({'_id': ObjectId(video['subject_id'])}) if video.get('subject_id') else None
        category = db.categories.find_one({'_id': ObjectId(video['category_id'])}) if video.get('category_id') else None
        chapter = db.chapters.find_one({'_id': ObjectId(video['chapter_id'])}) if video.get('chapter_id') else None

        video['subject_name'] = subject.get('name', 'STEM') if subject else 'STEM'
        video['category_name'] = category.get('name', 'General') if category else 'General'
        video['chapter_name'] = chapter.get('name', 'General') if chapter else 'General'

        return jsonify({'success': True, 'data': video})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@video_bp.route('', methods=['POST'])
@jwt_required()
@role_required('teacher', 'admin')
def create_video():
    """Create and link a new YouTube video lesson to Subject -> Category -> Chapter."""
    db = current_app.config['db']
    user_id = get_jwt_identity()
    user = db.users.find_one({'_id': ObjectId(user_id)})
    teacher_name = user.get('full_name', 'Teacher') if user else 'Teacher'

    data = request.get_json(silent=True) or {}
    title = sanitize_string(data.get('title', '')).strip()
    youtube_url = sanitize_string(data.get('youtube_url', '')).strip()
    description = sanitize_string(data.get('description', '')).strip()
    subject_id = str(data.get('subject_id', '')).strip()
    category_id = str(data.get('category_id', '')).strip()
    chapter_id = str(data.get('chapter_id', '')).strip()
    grade = str(data.get('grade', '7')).strip()
    duration = sanitize_string(data.get('duration', '')).strip() or '10-15 mins'

    if not title:
        return jsonify({'success': False, 'message': 'Video title is required', 'error_code': 'MISSING_TITLE'}), 400
    if not youtube_url:
        return jsonify({'success': False, 'message': 'YouTube URL is required', 'error_code': 'MISSING_URL'}), 400
    if not subject_id or not category_id or not chapter_id:
        return jsonify({
            'success': False,
            'message': 'Subject, Category, and Chapter must all be selected to link this video',
            'error_code': 'MISSING_HIERARCHY'
        }), 400

    youtube_video_id = extract_youtube_id(youtube_url)
    if not youtube_video_id:
        return jsonify({
            'success': False,
            'message': 'Invalid YouTube URL. Please provide a valid YouTube video link (e.g., https://www.youtube.com/watch?v=...)',
            'error_code': 'INVALID_YOUTUBE_URL'
        }), 400

    # Fetch names for denormalized search & display
    subject = db.subjects.find_one({'_id': ObjectId(subject_id)}) if ObjectId.is_valid(subject_id) else None
    category = db.categories.find_one({'_id': ObjectId(category_id)}) if ObjectId.is_valid(category_id) else None
    chapter = db.chapters.find_one({'_id': ObjectId(chapter_id)}) if ObjectId.is_valid(chapter_id) else None

    subject_name = subject.get('name', 'STEM') if subject else 'STEM'
    category_name = category.get('name', 'General') if category else 'General'
    chapter_name = chapter.get('name', 'General') if chapter else 'General'
    if chapter and chapter.get('grade'):
        grade = str(chapter.get('grade'))

    now = datetime.utcnow()
    video_doc = {
        'title': title,
        'youtube_url': youtube_url,
        'youtube_video_id': youtube_video_id,
        'description': description,
        'subject_id': subject_id,
        'subject_name': subject_name,
        'category_id': category_id,
        'category_name': category_name,
        'chapter_id': chapter_id,
        'chapter_name': chapter_name,
        'grade': grade,
        'duration': duration,
        'status': 'active',
        'created_by': user_id,
        'created_by_name': teacher_name,
        'created_at': now,
        'updated_at': now
    }

    result = db.videos.insert_one(video_doc)
    video_doc['_id'] = str(result.inserted_id)
    video_doc['thumbnail_url'] = f"https://img.youtube.com/vi/{youtube_video_id}/hqdefault.jpg"
    video_doc['embed_url'] = f"https://www.youtube-nocookie.com/embed/{youtube_video_id}"

    return jsonify({
        'success': True,
        'message': f'Video "{title}" linked successfully to chapter "{chapter_name}"!',
        'data': video_doc
    }), 201


@video_bp.route('/<id>', methods=['PUT'])
@jwt_required()
@role_required('teacher', 'admin')
def update_video(id):
    """Update an existing video lesson."""
    db = current_app.config['db']
    data = request.get_json(silent=True) or {}
    
    try:
        existing = db.videos.find_one({'_id': ObjectId(id)})
        if not existing:
            return jsonify({'success': False, 'message': 'Video not found'}), 404

        update_fields = {'updated_at': datetime.utcnow()}

        if 'title' in data:
            title = sanitize_string(data['title']).strip()
            if not title:
                return jsonify({'success': False, 'message': 'Title cannot be empty'}), 400
            update_fields['title'] = title

        if 'youtube_url' in data:
            youtube_url = sanitize_string(data['youtube_url']).strip()
            youtube_video_id = extract_youtube_id(youtube_url)
            if not youtube_video_id:
                return jsonify({'success': False, 'message': 'Invalid YouTube URL'}), 400
            update_fields['youtube_url'] = youtube_url
            update_fields['youtube_video_id'] = youtube_video_id

        if 'description' in data:
            update_fields['description'] = sanitize_string(data['description']).strip()

        if 'duration' in data:
            update_fields['duration'] = sanitize_string(data['duration']).strip()

        if 'grade' in data:
            update_fields['grade'] = str(data['grade']).strip()

        # If subject/category/chapter changed
        if 'subject_id' in data:
            update_fields['subject_id'] = str(data['subject_id']).strip()
            s = db.subjects.find_one({'_id': ObjectId(update_fields['subject_id'])}) if ObjectId.is_valid(update_fields['subject_id']) else None
            if s:
                update_fields['subject_name'] = s.get('name', 'STEM')

        if 'category_id' in data:
            update_fields['category_id'] = str(data['category_id']).strip()
            c = db.categories.find_one({'_id': ObjectId(update_fields['category_id'])}) if ObjectId.is_valid(update_fields['category_id']) else None
            if c:
                update_fields['category_name'] = c.get('name', 'General')

        if 'chapter_id' in data:
            update_fields['chapter_id'] = str(data['chapter_id']).strip()
            ch = db.chapters.find_one({'_id': ObjectId(update_fields['chapter_id'])}) if ObjectId.is_valid(update_fields['chapter_id']) else None
            if ch:
                update_fields['chapter_name'] = ch.get('name', 'General')
                if ch.get('grade'):
                    update_fields['grade'] = str(ch.get('grade'))

        db.videos.update_one({'_id': ObjectId(id)}, {'$set': update_fields})
        updated = db.videos.find_one({'_id': ObjectId(id)})
        updated['_id'] = str(updated['_id'])
        vid_id = updated.get('youtube_video_id', '')
        updated['thumbnail_url'] = f"https://img.youtube.com/vi/{vid_id}/hqdefault.jpg" if vid_id else ""
        updated['embed_url'] = f"https://www.youtube-nocookie.com/embed/{vid_id}" if vid_id else ""

        return jsonify({'success': True, 'message': 'Video updated successfully', 'data': updated})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@video_bp.route('/<id>', methods=['DELETE'])
@jwt_required()
@role_required('teacher', 'admin')
def delete_video(id):
    """Delete a video lesson."""
    db = current_app.config['db']
    try:
        result = db.videos.delete_one({'_id': ObjectId(id)})
        if result.deleted_count == 0:
            return jsonify({'success': False, 'message': 'Video not found'}), 404
        return jsonify({'success': True, 'message': 'Video lesson deleted successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400
