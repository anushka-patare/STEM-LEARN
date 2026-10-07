from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
client = MongoClient(os.getenv('MONGO_URI'))
db = client.get_default_database()

print("Total questions:", db.questions.count_documents({}))
sample = list(db.questions.find().limit(10))
for s in sample:
    print("Q:", (s.get('question') or s.get('question_text') or '')[:35], 
          "| Grade:", s.get('grade'), 
          "| SubjectID:", s.get('subject_id'), 
          "| ChapterID:", s.get('chapter_id'), 
          "| QuizID:", s.get('quiz_id'))
