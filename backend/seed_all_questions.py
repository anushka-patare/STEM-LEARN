from pymongo import MongoClient
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
client = MongoClient(os.getenv('MONGO_URI'))
db = client.get_default_database()

chapters = {c.get('name'): str(c['_id']) for c in db.chapters.find()}
subjects = {s.get('name'): str(s['_id']) for s in db.subjects.find()}
science_id = subjects.get('Science', '')
math_id = subjects.get('Mathematics', '')
tech_id = subjects.get('Technology', '')

new_questions = [
    # ─── Light and Sound (Grade 7 - Science) ───
    {
        'chapter_id': chapters.get('Light and Sound', ''),
        'subject_id': science_id,
        'grade': '7',
        'question': 'Which of the following describes the bouncing back of light from a polished surface?',
        'option_a': 'Refraction',
        'option_b': 'Reflection',
        'option_c': 'Dispersion',
        'option_d': 'Absorption',
        'correct_answer': 'B',
        'marks': 1,
        'difficulty': 'easy',
        'bloom_level': 'Remembering',
        'explanation': 'Reflection occurs when light rays hit a smooth, polished surface like a mirror and bounce back into the medium.'
    },
    {
        'chapter_id': chapters.get('Light and Sound', ''),
        'subject_id': science_id,
        'grade': '7',
        'question': 'Sound waves cannot propagate through which of the following media?',
        'option_a': 'Solid steel',
        'option_b': 'Sea water',
        'option_c': 'Vacuum',
        'option_d': 'Humid air',
        'correct_answer': 'C',
        'marks': 1,
        'difficulty': 'easy',
        'bloom_level': 'Understanding',
        'explanation': 'Sound waves require a material medium (solid, liquid, or gas) for transmission; they cannot travel through a vacuum.'
    },
    {
        'chapter_id': chapters.get('Light and Sound', ''),
        'subject_id': science_id,
        'grade': '7',
        'question': 'What determines the pitch or shrillness of a sound produced by a vibrating body?',
        'option_a': 'Amplitude',
        'option_b': 'Frequency',
        'option_c': 'Speed',
        'option_d': 'Wavelength',
        'correct_answer': 'B',
        'marks': 2,
        'difficulty': 'medium',
        'bloom_level': 'Analyzing',
        'explanation': 'Frequency of vibration determines the pitch of the sound. Higher frequency corresponds to higher pitch.'
    },
    {
        'chapter_id': chapters.get('Light and Sound', ''),
        'subject_id': science_id,
        'grade': '7',
        'question': 'When white light passes through a glass prism, it splits into seven spectrum colors. This phenomenon is called:',
        'option_a': 'Total internal reflection',
        'option_b': 'Interference',
        'option_c': 'Dispersion of light',
        'option_d': 'Diffraction',
        'correct_answer': 'C',
        'marks': 1,
        'difficulty': 'medium',
        'bloom_level': 'Understanding',
        'explanation': 'Dispersion is the splitting of composite white light into its constituent seven rainbow spectrum colors.'
    },
    {
        'chapter_id': chapters.get('Light and Sound', ''),
        'subject_id': science_id,
        'grade': '7',
        'question': 'What is the standard unit used to measure the loudness of a sound wave?',
        'option_a': 'Hertz (Hz)',
        'option_b': 'Decibel (dB)',
        'option_c': 'Newton (N)',
        'option_d': 'Pascal (Pa)',
        'correct_answer': 'B',
        'marks': 1,
        'difficulty': 'easy',
        'bloom_level': 'Remembering',
        'explanation': 'Loudness of sound is expressed in the decibel (dB) scale, which depends on the wave amplitude.'
    },

    # ─── Electricity (Grade 7 - Science) ───
    {
        'chapter_id': chapters.get('Electricity', ''),
        'subject_id': science_id,
        'grade': '7',
        'question': 'Which of the following components is used to open or close an electric circuit?',
        'option_a': 'Electric cell',
        'option_b': 'Connecting wire',
        'option_c': 'Electric switch',
        'option_d': 'Electric bulb',
        'correct_answer': 'C',
        'marks': 1,
        'difficulty': 'easy',
        'bloom_level': 'Remembering',
        'explanation': 'A switch or key is an electrical device designed to manually break or complete the circuit path.'
    },
    {
        'chapter_id': chapters.get('Electricity', ''),
        'subject_id': science_id,
        'grade': '7',
        'question': 'The heating effect of an electric current is utilized in which of the following household appliances?',
        'option_a': 'Electric iron',
        'option_b': 'Refrigerator compressor',
        'option_c': 'Battery charger',
        'option_d': 'Electric bell',
        'correct_answer': 'A',
        'marks': 1,
        'difficulty': 'easy',
        'bloom_level': 'Understanding',
        'explanation': 'An electric iron uses high-resistance heating elements (nichrome) to convert electric energy into thermal energy.'
    },
    {
        'chapter_id': chapters.get('Electricity', ''),
        'subject_id': science_id,
        'grade': '7',
        'question': 'A safety device containing a thin wire with low melting point that breaks upon excessive current is called:',
        'option_a': 'Electromagnet',
        'option_b': 'Electric fuse',
        'option_c': 'Voltmeter',
        'option_d': 'Rheostat',
        'correct_answer': 'B',
        'marks': 2,
        'difficulty': 'medium',
        'bloom_level': 'Understanding',
        'explanation': 'An electric fuse protects appliances by melting and breaking the circuit when excessive current flows.'
    },
    {
        'chapter_id': chapters.get('Electricity', ''),
        'subject_id': science_id,
        'grade': '7',
        'question': 'When electric current flows through a wire coiled around an iron nail, the nail becomes a:',
        'option_a': 'Permanent bar magnet',
        'option_b': 'Static conductor',
        'option_c': 'Temporary electromagnet',
        'option_d': 'Dielectric insulator',
        'correct_answer': 'C',
        'marks': 2,
        'difficulty': 'medium',
        'bloom_level': 'Applying',
        'explanation': 'The magnetic field of current circulating through a solenoid magnetizes the soft iron core into an electromagnet.'
    },
    {
        'chapter_id': chapters.get('Electricity', ''),
        'subject_id': science_id,
        'grade': '7',
        'question': 'Which symbol correctly represents an electric battery in a circuit schematic?',
        'option_a': 'A single long and short parallel line',
        'option_b': 'A combination of two or more interconnected electric cells',
        'option_c': 'A circle with a letter V inside',
        'option_d': 'A zig-zag continuous resistor line',
        'correct_answer': 'B',
        'marks': 1,
        'difficulty': 'easy',
        'bloom_level': 'Remembering',
        'explanation': 'A battery is formed by connecting two or more galvanic cells in series or parallel.'
    },

    # ─── Cell Biology (Grade 7 - Science) ───
    {
        'chapter_id': chapters.get('Cell Biology', ''),
        'subject_id': science_id,
        'grade': '7',
        'question': 'Which cellular organelle is responsible for photosynthesis in green plant cells?',
        'option_a': 'Mitochondria',
        'option_b': 'Chloroplast',
        'option_c': 'Endoplasmic Reticulum',
        'option_d': 'Golgi apparatus',
        'correct_answer': 'B',
        'marks': 1,
        'difficulty': 'easy',
        'bloom_level': 'Remembering',
        'explanation': 'Chloroplasts contain chlorophyll pigments that trap radiant solar energy to synthesize glucose.'
    },
    {
        'chapter_id': chapters.get('Cell Biology', ''),
        'subject_id': science_id,
        'grade': '7',
        'question': 'What structural layer provides rigidity and shape to plant cells but is absent in animal cells?',
        'option_a': 'Plasma membrane',
        'option_b': 'Cellulosic cell wall',
        'option_c': 'Nuclear membrane',
        'option_d': 'Ribosomal matrix',
        'correct_answer': 'B',
        'marks': 1,
        'difficulty': 'easy',
        'bloom_level': 'Understanding',
        'explanation': 'The outer cell wall composed of cellulose fibers protects and stiffens plant cells against osmotic lysis.'
    },
    {
        'chapter_id': chapters.get('Cell Biology', ''),
        'subject_id': science_id,
        'grade': '7',
        'question': 'Which organelle serves as the control center of cellular genetic activities and mitosis?',
        'option_a': 'Nucleus',
        'option_b': 'Lysosome',
        'option_c': 'Centriole',
        'option_d': 'Peroxisome',
        'correct_answer': 'A',
        'marks': 1,
        'difficulty': 'easy',
        'bloom_level': 'Remembering',
        'explanation': 'The nucleus stores genomic chromatin and coordinates cellular gene expression and division.'
    },
    {
        'chapter_id': chapters.get('Cell Biology', ''),
        'subject_id': science_id,
        'grade': '7',
        'question': 'The jelly-like fluid that fills the interior of a living cell between the plasma membrane and nucleus is:',
        'option_a': 'Nucleoplasm',
        'option_b': 'Cytoplasm',
        'option_c': 'Cytosol lipids',
        'option_d': 'Synovial fluid',
        'correct_answer': 'B',
        'marks': 1,
        'difficulty': 'easy',
        'bloom_level': 'Remembering',
        'explanation': 'Cytoplasm holds all organelle complexes and sustains primary metabolic enzymatic pathways.'
    },
    {
        'chapter_id': chapters.get('Cell Biology', ''),
        'subject_id': science_id,
        'grade': '7',
        'question': 'Which microscopic instrument was invented by Antonie van Leeuwenhoek and Robert Hooke to observe cells?',
        'option_a': 'Spectrometer',
        'option_b': 'Compound Microscope',
        'option_c': 'Oscilloscope',
        'option_d': 'Seismograph',
        'correct_answer': 'B',
        'marks': 1,
        'difficulty': 'easy',
        'bloom_level': 'Understanding',
        'explanation': 'Optical compound microscopes made discovery of cell wall structures in cork slices possible.'
    },

    # ─── Triangles (Grade 7 - Mathematics) ───
    {
        'chapter_id': chapters.get('Triangles', ''),
        'subject_id': math_id,
        'grade': '7',
        'question': 'What is the sum of all three interior angles in any Euclidean triangle?',
        'option_a': '90°',
        'option_b': '180°',
        'option_c': '270°',
        'option_d': '360°',
        'correct_answer': 'B',
        'marks': 1,
        'difficulty': 'easy',
        'bloom_level': 'Remembering',
        'explanation': 'The Angle Sum Property states that the sum of interior angles in any triangle is always 180 degrees.'
    },
    {
        'chapter_id': chapters.get('Triangles', ''),
        'subject_id': math_id,
        'grade': '7',
        'question': 'In an isosceles triangle, if the vertex angle is 40°, what is the measure of each base angle?',
        'option_a': '70°',
        'option_b': '60°',
        'option_c': '50°',
        'option_d': '80°',
        'correct_answer': 'A',
        'marks': 2,
        'difficulty': 'medium',
        'bloom_level': 'Applying',
        'explanation': 'Sum is 180°. Remaining sum = 180 - 40 = 140°. Since base angles are equal, each base angle = 140 / 2 = 70°.'
    },
    {
        'chapter_id': chapters.get('Triangles', ''),
        'subject_id': math_id,
        'grade': '7',
        'question': 'According to the Triangle Inequality Theorem, the sum of lengths of any two sides of a triangle must be:',
        'option_a': 'Equal to the third side',
        'option_b': 'Less than the third side',
        'option_c': 'Greater than the third side',
        'option_d': 'Half of the third side',
        'correct_answer': 'C',
        'marks': 1,
        'difficulty': 'medium',
        'bloom_level': 'Understanding',
        'explanation': 'For any triangle with side lengths a, b, c: a + b > c, b + c > a, and a + c > b.'
    },
    {
        'chapter_id': chapters.get('Triangles', ''),
        'subject_id': math_id,
        'grade': '7',
        'question': 'Which theorem states that in a right-angled triangle, Hypotenuse² = Base² + Perpendicular²?',
        'option_a': 'Euclid’s Axiom',
        'option_b': 'Pythagoras Theorem',
        'option_c': 'Thales Theorem',
        'option_d': 'Archimedes Principle',
        'correct_answer': 'B',
        'marks': 1,
        'difficulty': 'easy',
        'bloom_level': 'Remembering',
        'explanation': 'Pythagoras theorem relates hypotenuse c and legs a, b as c² = a² + b² in right-angled triangles.'
    },
    {
        'chapter_id': chapters.get('Triangles', ''),
        'subject_id': math_id,
        'grade': '7',
        'question': 'An exterior angle of a triangle equals 110°. If one opposite interior angle is 45°, the other opposite angle is:',
        'option_a': '55°',
        'option_b': '65°',
        'option_c': '75°',
        'option_d': '45°',
        'correct_answer': 'B',
        'marks': 2,
        'difficulty': 'medium',
        'bloom_level': 'Applying',
        'explanation': 'Exterior angle = Sum of interior opposite angles. 110° = 45° + x => x = 110° - 45° = 65°.'
    }
]

inserted = 0
for q in new_questions:
    if q.get('chapter_id'):
        q['created_at'] = datetime.utcnow()
        q['updated_at'] = datetime.utcnow()
        db.questions.insert_one(q)
        inserted += 1

print(f"Successfully seeded {inserted} questions across Class 7 STEM chapters!")
