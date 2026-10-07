import os
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv('e:/E DRIVE/Client Project CLG/Anushka patare (4) (1)/backend/.env')
db = MongoClient(os.getenv('MONGO_URI')).get_default_database()

updated = 0
for q in db.quizzes.find():
    ch_id = q.get('chapter_id')
    cat_id = q.get('category_id')
    sub_id = q.get('subject_id')
    
    if ch_id:
        ch = db.chapters.find_one({'_id': ObjectId(ch_id)}) if ObjectId.is_valid(ch_id) else db.chapters.find_one({'_id': ch_id})
        if ch:
            updates = {}
            if (not cat_id or cat_id == '') and ch.get('category_id'):
                updates['category_id'] = str(ch['category_id'])
            if (not sub_id or sub_id == '') and ch.get('subject_id'):
                updates['subject_id'] = str(ch['subject_id'])
            if updates:
                db.quizzes.update_one({'_id': q['_id']}, {'$set': updates})
                updated += 1

print(f"Updated {updated} quizzes with missing category/subject IDs")
for q in db.quizzes.find({'grade': {'$in': ['7', 7, 'Grade 7']}}):
    print(f"Quiz {q.get('title')}: sub={q.get('subject_id')}, cat={q.get('category_id')}, ch={q.get('chapter_id')}, seq={q.get('sequence_number')}")
