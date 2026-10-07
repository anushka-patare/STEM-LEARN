from pymongo import MongoClient
import os
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()
client = MongoClient(os.getenv('MONGO_URI'))
db = client.get_default_database()

quizzes_map = {}
for q in db.quizzes.find():
    quizzes_map[str(q['_id'])] = q

count_updated = 0
for qn in db.questions.find():
    qid = str(qn.get('quiz_id', ''))
    update = {}
    if not qn.get('question') and qn.get('question_text'):
        update['question'] = qn['question_text']
    
    # Options mapping if options array exists
    if qn.get('options') and isinstance(qn['options'], list) and len(qn['options']) >= 4:
        if not qn.get('option_a'):
            update['option_a'] = qn['options'][0]
        if not qn.get('option_b'):
            update['option_b'] = qn['options'][1]
        if not qn.get('option_c'):
            update['option_c'] = qn['options'][2]
        if not qn.get('option_d'):
            update['option_d'] = qn['options'][3]
        if 'correct_option_index' in qn and not qn.get('correct_answer'):
            idx = qn['correct_option_index']
            letters = ['A', 'B', 'C', 'D']
            update['correct_answer'] = letters[idx] if idx < 4 else 'A'

    if qid in quizzes_map:
        qz = quizzes_map[qid]
        if not qn.get('grade') and qz.get('grade'):
            update['grade'] = str(qz['grade'])
        if not qn.get('subject_id') and qz.get('subject_id'):
            update['subject_id'] = str(qz['subject_id'])
        if not qn.get('chapter_id') and qz.get('chapter_id'):
            update['chapter_id'] = str(qz['chapter_id'])
        if not qn.get('category_id') and qz.get('category_id'):
            update['category_id'] = str(qz['category_id'])

    if update:
        db.questions.update_one({'_id': qn['_id']}, {'$set': update})
        count_updated += 1

print(f"Updated {count_updated} questions with metadata!")

# Check distribution per chapter
print("\nQuestions per chapter:")
for c in db.chapters.find():
    cid = str(c['_id'])
    count = db.questions.count_documents({'chapter_id': cid})
    print(f"- Chapter '{c.get('name')}' (Grade {c.get('grade')}): {count} questions")
