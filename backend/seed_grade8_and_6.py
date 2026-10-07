"""Seed Grade 8 and Grade 6 Curriculum Chapters and Learning Pathways."""
import os
import sys
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

def seed_curriculum():
    mongo_uri = os.getenv('MONGO_URI')
    client = MongoClient(mongo_uri)
    db = client['stem_learning']

    science = db.subjects.find_one({'name': 'Science'})
    tech = db.subjects.find_one({'name': 'Technology'})
    math = db.subjects.find_one({'name': 'Mathematics'})

    science_id = str(science['_id']) if science else ''
    tech_id = str(tech['_id']) if tech else ''
    math_id = str(math['_id']) if math else ''

    physics = db.categories.find_one({'name': 'Physics'})
    chemistry = db.categories.find_one({'name': 'Chemistry'})
    biology = db.categories.find_one({'name': 'Biology', 'subject_id': science_id}) or db.categories.find_one({'name': 'Biology'})
    programming = db.categories.find_one({'name': 'Programming'})
    algebra = db.categories.find_one({'name': 'Algebra'})
    geometry = db.categories.find_one({'name': 'Geometry'})

    physics_id = str(physics['_id']) if physics else ''
    chemistry_id = str(chemistry['_id']) if chemistry else ''
    biology_id = str(biology['_id']) if biology else ''
    programming_id = str(programming['_id']) if programming else ''
    algebra_id = str(algebra['_id']) if algebra else ''
    geometry_id = str(geometry['_id']) if geometry else ''

    now = datetime.utcnow()

    # ─── GRADE 8 CHAPTERS ───
    grade8_chapters = [
        # Science / Physics
        {
            'name': 'Force and Pressure',
            'subject_id': science_id,
            'category_id': physics_id,
            'grade': '8',
            'order': 1,
            'description': 'Exploration of contact and non-contact forces, atmospheric pressure, and hydraulic principles.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        {
            'name': 'Friction and Sound Waves',
            'subject_id': science_id,
            'category_id': physics_id,
            'grade': '8',
            'order': 2,
            'description': 'Mechanics of static and kinetic friction, sound vibration frequencies, and acoustics.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        {
            'name': 'Chemical Effects of Current & Light',
            'subject_id': science_id,
            'category_id': physics_id,
            'grade': '8',
            'order': 3,
            'description': 'Electroplating, liquid conduction, reflection laws, and human eye optics.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        # Science / Chemistry
        {
            'name': 'Combustion, Flame & Fuels',
            'subject_id': science_id,
            'category_id': chemistry_id,
            'grade': '8',
            'order': 1,
            'description': 'Types of combustion, ignition temperatures, calorific values, and flame structure zones.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        {
            'name': 'Synthetic Materials & Metals',
            'subject_id': science_id,
            'category_id': chemistry_id,
            'grade': '8',
            'order': 2,
            'description': 'Physical and chemical properties of metals, non-metals, reactivity series, and polymer composites.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        # Science / Biology
        {
            'name': 'Microorganisms: Friend and Foe',
            'subject_id': science_id,
            'category_id': biology_id,
            'grade': '8',
            'order': 1,
            'description': 'Bacteria, fungi, viruses, nitrogen cycle, antibiotics, fermentation, and food preservation.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        {
            'name': 'Cell Structure & Functions',
            'subject_id': science_id,
            'category_id': biology_id,
            'grade': '8',
            'order': 2,
            'description': 'Comparative cytology of plant and animal cells, cell organelles, nucleus, and tissue systems.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        {
            'name': 'Conservation of Plants & Animals',
            'subject_id': science_id,
            'category_id': biology_id,
            'grade': '8',
            'order': 3,
            'description': 'Deforestation impact, biodiversity conservation, biosphere reserves, and ecosystem balance.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        # Technology / Programming
        {
            'name': 'Python Logic: Loops & Functions',
            'subject_id': tech_id,
            'category_id': programming_id,
            'grade': '8',
            'order': 1,
            'description': 'Iteration with loops, custom functions, control flow logic, and algorithmic thinking.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        {
            'name': 'Data Structures & Algorithms',
            'subject_id': tech_id,
            'category_id': programming_id,
            'grade': '8',
            'order': 2,
            'description': 'Working with lists, dictionaries, string manipulations, sorting algorithms, and problem-solving.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        # Mathematics / Algebra
        {
            'name': 'Rational Numbers & Linear Equations',
            'subject_id': math_id,
            'category_id': algebra_id,
            'grade': '8',
            'order': 1,
            'description': 'Properties of rational numbers and solving linear equations with variables on both sides.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        {
            'name': 'Algebraic Expressions & Factorisation',
            'subject_id': math_id,
            'category_id': algebra_id,
            'grade': '8',
            'order': 2,
            'description': 'Polynomial identities, binomial expansions, regrouping terms, and factorisation methods.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        # Mathematics / Geometry
        {
            'name': 'Understanding Quadrilaterals',
            'subject_id': math_id,
            'category_id': geometry_id,
            'grade': '8',
            'order': 1,
            'description': 'Polygons, interior angle sum properties, parallelograms, rhombuses, and geometric constructions.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        {
            'name': 'Mensuration & Solid Shapes',
            'subject_id': math_id,
            'category_id': geometry_id,
            'grade': '8',
            'order': 2,
            'description': 'Surface area and volume of cuboids, cubes, cylinders, and visualising 3D solid figures.',
            'passing_score_pct': 70,
            'status': 'active'
        }
    ]

    # ─── GRADE 6 CHAPTERS ───
    grade6_chapters = [
        {
            'name': 'Motion and Measurement of Distances',
            'subject_id': science_id,
            'category_id': physics_id,
            'grade': '6',
            'order': 1,
            'description': 'Standard units of measurement, types of motion, rectilinear and periodic movement.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        {
            'name': 'Light, Shadows and Reflections',
            'subject_id': science_id,
            'category_id': physics_id,
            'grade': '6',
            'order': 2,
            'description': 'Opaque, transparent, and translucent objects; pinhole camera principles; mirror reflection.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        {
            'name': 'Electricity and Circuits',
            'subject_id': science_id,
            'category_id': physics_id,
            'grade': '6',
            'order': 3,
            'description': 'Electric cells, simple circuit switches, conductors, insulators, and safe electrical handling.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        {
            'name': 'Sorting Materials into Groups',
            'subject_id': science_id,
            'category_id': chemistry_id,
            'grade': '6',
            'order': 1,
            'description': 'Physical properties of matter, hardness, solubility, density in water, and transparency.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        {
            'name': 'Components of Food and Nutrition',
            'subject_id': science_id,
            'category_id': biology_id,
            'grade': '6',
            'order': 1,
            'description': 'Carbohydrates, proteins, fats, vitamins, balanced diet, and deficiency disease prevention.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        {
            'name': 'Introduction to Coding & Logic',
            'subject_id': tech_id,
            'category_id': programming_id,
            'grade': '6',
            'order': 1,
            'description': 'Algorithmic flow, sequencing, logic blocks, and introductory computer science fundamentals.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        {
            'name': 'Integers & Introduction to Algebra',
            'subject_id': math_id,
            'category_id': algebra_id,
            'grade': '6',
            'order': 1,
            'description': 'Negative numbers on number lines, rules of integer addition and variables notation.',
            'passing_score_pct': 70,
            'status': 'active'
        },
        {
            'name': 'Basic Geometrical Ideas & Shapes',
            'subject_id': math_id,
            'category_id': geometry_id,
            'grade': '6',
            'order': 1,
            'description': 'Points, lines, rays, angles, polygons, triangles, quadrilaterals, and circles.',
            'passing_score_pct': 70,
            'status': 'active'
        }
    ]

    all_to_insert = grade8_chapters + grade6_chapters
    inserted_chaps = 0
    for ch in all_to_insert:
        existing = db.chapters.find_one({'name': ch['name'], 'grade': ch['grade']})
        if not existing:
            ch['created_at'] = now
            ch['updated_at'] = now
            res = db.chapters.insert_one(ch)
            inserted_chaps += 1
            print(f"  + Added Chapter: {ch['name']} (Grade {ch['grade']}) -> ID: {res.inserted_id}")
        else:
            print(f"  ~ Chapter already exists: {ch['name']} (Grade {ch['grade']})")

    # ─── Ensure Grade 8 Learning Paths ───
    g8_paths = [
        {
            'title': 'Grade 8 Science: Force, Pressure & Friction',
            'grade': '8',
            'subject_id': science_id,
            'category_id': physics_id,
            'description': 'Master core Grade 8 mechanics covering force, atmospheric pressure, and friction fundamentals.',
            'passing_percentage': 70,
            'status': 'published',
            'created_at': now,
            'updated_at': now
        },
        {
            'title': 'Grade 8 Mathematics: Algebra & Geometry Mastery',
            'grade': '8',
            'subject_id': math_id,
            'category_id': algebra_id,
            'description': 'Comprehensive Grade 8 pathway through rational numbers, linear equations, and quadrilaterals.',
            'passing_percentage': 70,
            'status': 'published',
            'created_at': now,
            'updated_at': now
        },
        {
            'title': 'Grade 8 Technology: Python Logic & Computational Thinking',
            'grade': '8',
            'subject_id': tech_id,
            'category_id': programming_id,
            'description': 'Interactive coding pathway covering Python loops, custom functions, and algorithmic structures.',
            'passing_percentage': 70,
            'status': 'published',
            'created_at': now,
            'updated_at': now
        }
    ]

    for lp in g8_paths:
        existing = db.learning_paths.find_one({'title': lp['title'], 'grade': lp['grade']})
        if not existing:
            res = db.learning_paths.insert_one(lp)
            print(f"  + Added Learning Path: {lp['title']} (Grade {lp['grade']}) -> ID: {res.inserted_id}")
        else:
            print(f"  ~ Learning Path already exists: {lp['title']}")

    # ─── Fix classes name in db.classes if None ───
    for cls in db.classes.find():
        if not cls.get('name') and cls.get('grade') and cls.get('division'):
            db.classes.update_one({'_id': cls['_id']}, {'$set': {'name': f"Grade {cls['grade']}-{cls['division']}"}})
            print(f"  ~ Fixed class name for Grade {cls['grade']}-{cls['division']}")

    # ─── Update existing Grade 8 questions to link with Friction & Sound chapter ───
    sound_ch = db.chapters.find_one({'name': 'Friction and Sound Waves', 'grade': '8'})
    if sound_ch:
        sound_ch_id = str(sound_ch['_id'])
        updated = db.questions.update_many(
            {'grade': '8', '$or': [{'chapter_id': ''}, {'chapter_id': None}]},
            {'$set': {'chapter_id': sound_ch_id, 'subject_id': science_id, 'category_id': physics_id}}
        )
        print(f"  ~ Linked {updated.modified_count} Grade 8 questions to '{sound_ch['name']}'")

    print(f"\n✅ Finished seeding: {inserted_chaps} chapters added. Curriculum ready!")

if __name__ == '__main__':
    seed_curriculum()
