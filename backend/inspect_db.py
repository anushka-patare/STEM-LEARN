"""Database inspection script for STEMLearn."""
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
mongo_uri = os.getenv('MONGO_URI')
client = MongoClient(mongo_uri)
db = client.get_default_database()

print("="*60)
print("STEMLEARN DATABASE INSPECTION REPORT")
print("="*60)
print(f"Database Name: {db.name}\n")

print("--- GRADE DISTRIBUTION ---")
print("Classes by grade:")
for c in db.classes.aggregate([{"$group": {"_id": "$grade", "count": {"$sum": 1}}}]):
    print(f"  Grade {c['_id']}: {c['count']} classes")

print("\nStudents by grade:")
for s in db.users.aggregate([{"$match": {"role": "student"}}, {"$group": {"_id": "$grade", "count": {"$sum": 1}}}]):
    print(f"  Grade {s['_id']}: {s['count']} students")

print("\nQuizzes by grade:")
for q in db.quizzes.aggregate([{"$group": {"_id": "$grade_level", "count": {"$sum": 1}}}]):
    print(f"  Grade {q['_id']}: {q['count']} quizzes")

print("\nTeams by grade:")
for t in db.teams.aggregate([{"$group": {"_id": "$grade", "count": {"$sum": 1}}}]):
    print(f"  Grade {t['_id']}: {t['count']} teams")

print("\n--- USER ROLES & STATUSES ---")
for u in db.users.aggregate([{"$group": {"_id": {"role": "$role", "status": "$approval_status"}, "count": {"$sum": 1}}}]):
    print(f"  Role {u['_id']}: {u['count']}")

print("="*60)
