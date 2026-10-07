"""AI Service - Supporting Google Gemini & Groq LLMs with robust fallback."""
import os
import json
import requests
from datetime import datetime


def get_ai_settings(db):
    """Retrieve global AI configuration and API keys from database."""
    settings = db.system_settings.find_one({'type': 'global'}) or {}
    gemini_key = settings.get('gemini_api_key') or os.getenv('GEMINI_API_KEY', '')
    groq_key = settings.get('groq_api_key') or os.getenv('GROQ_API_KEY', '')
    primary = settings.get('primary_ai_provider', 'gemini')
    fallback = settings.get('fallback_ai_provider', 'groq')
    groq_model = settings.get('groq_model') or 'qwen/qwen3.8-27b'
    daily_limit = settings.get('daily_student_request_limit', 30)

    # If primary provider has no key but fallback does, automatically use the available provider
    if primary == 'gemini' and not gemini_key and groq_key:
        primary = 'groq'
    elif primary == 'groq' and not groq_key and gemini_key:
        primary = 'gemini'

    return {
        'gemini_key': gemini_key,
        'groq_key': groq_key,
        'primary': primary,
        'fallback': fallback,
        'groq_model': groq_model,
        'daily_limit': daily_limit
    }


def generate_quiz_ai(topic, subject, grade, num_questions=3, difficulty='medium', db=None):
    """Generate multiple choice questions using Gemini or Groq with fallback."""
    cfg = get_ai_settings(db) if db is not None else {
        'gemini_key': os.getenv('GEMINI_API_KEY', ''),
        'groq_key': os.getenv('GROQ_API_KEY', ''),
        'primary': 'gemini',
        'fallback': 'groq'
    }

    prompt = (
        f"You are an expert STEM educator for Grade {grade} students. "
        f"Generate {num_questions} multiple choice questions on '{topic}' for the subject '{subject}' "
        f"with difficulty level '{difficulty}'.\n"
        "Return strictly valid JSON with this format:\n"
        "[\n"
        "  {\n"
        "    \"question\": \"Question text\",\n"
        "    \"option_a\": \"Option A\",\n"
        "    \"option_b\": \"Option B\",\n"
        "    \"option_c\": \"Option C\",\n"
        "    \"option_d\": \"Option D\",\n"
        "    \"correct_answer\": \"A/B/C/D\",\n"
        "    \"explanation\": \"Pedagogical explanation suitable for middle school\",\n"
        "    \"difficulty\": \"" + difficulty + "\",\n"
        "    \"marks\": 1,\n"
        "    \"topic\": \"" + topic + "\"\n"
        "  }\n"
        "]\n"
        "Do not include markdown code block backticks, just the raw JSON."
    )

    # Try Primary
    questions = None
    if cfg['primary'] == 'gemini' and cfg['gemini_key']:
        questions = _call_gemini(prompt, cfg['gemini_key'])
    elif cfg['primary'] == 'groq' and cfg['groq_key']:
        questions = _call_groq(prompt, cfg['groq_key'], model=cfg.get('groq_model'))

    # Try Fallback if primary failed
    if not questions:
        if cfg['fallback'] == 'groq' and cfg['groq_key']:
            questions = _call_groq(prompt, cfg['groq_key'], model=cfg.get('groq_model'))
        elif cfg['fallback'] == 'gemini' and cfg['gemini_key']:
            questions = _call_gemini(prompt, cfg['gemini_key'])

    # Fallback to high quality template generation if API keys not set or rate limited
    if not questions:
        questions = _fallback_stem_questions(topic, subject, grade, num_questions, difficulty)

    return questions


def student_ai_tutor(student_id, query, grade, history=None, db=None):
    """Answer student query with pedagogy-focused STEM assistant guidelines and exam lockdown."""
    cfg = get_ai_settings(db) if db is not None else {
        'gemini_key': os.getenv('GEMINI_API_KEY', ''),
        'groq_key': os.getenv('GROQ_API_KEY', ''),
        'primary': 'gemini',
        'fallback': 'groq',
        'daily_limit': 30
    }

    # Security check: Block AI during active in-progress quiz attempt
    if db is not None:
        now = datetime.utcnow()
        # Automatically mark any past in-progress attempts as expired so student is not locked out
        try:
            db.quiz_attempts.update_many(
                {
                    'student_id': str(student_id),
                    'status': 'in_progress',
                    'expires_at': {'$lte': now}
                },
                {
                    '$set': {
                        'status': 'expired',
                        'updated_at': now
                    }
                }
            )
        except Exception as e:
            print(f"Error auto-expiring attempts: {e}")

        active_exam = db.quiz_attempts.find_one({
            'student_id': str(student_id),
            'status': 'in_progress',
            'expires_at': {'$gt': now}
        })
        if active_exam:
            return {
                'success': False,
                'message': 'AI Tutor is disabled while you have an active examination in progress. Submit your quiz first.',
                'error_code': 'ACTIVE_EXAM_BLOCK'
            }

        # Check student daily quota
        today_str = datetime.utcnow().strftime('%Y-%m-%d')
        usage = db.ai_usage.find_one({'student_id': str(student_id), 'date': today_str})
        count = usage.get('count', 0) if usage else 0
        if count >= cfg['daily_limit']:
            return {
                'success': False,
                'message': f"Daily AI question limit ({cfg['daily_limit']}) reached. Try again tomorrow!",
                'error_code': 'LIMIT_EXCEEDED'
            }

    system_instruction = (
        f"You are a kind, encouraging STEM tutor for a Grade {grade} student. "
        "Keep explanations simple, intuitive, and fun. Use everyday analogies, bullet points, and step-by-step guidance. "
        "Do not use university-level jargon. Foster curiosity and scientific reasoning."
    )

    response_text = None
    prompt = f"{system_instruction}\n\nStudent asks: {query}"

    if cfg['primary'] == 'gemini' and cfg['gemini_key']:
        response_text = _call_gemini_text(prompt, cfg['gemini_key'])
    elif cfg['primary'] == 'groq' and cfg['groq_key']:
        response_text = _call_groq_text(prompt, cfg['groq_key'], model=cfg.get('groq_model'))

    if not response_text and cfg['fallback'] == 'groq' and cfg['groq_key']:
        response_text = _call_groq_text(prompt, cfg['groq_key'], model=cfg.get('groq_model'))
    elif not response_text and cfg['fallback'] == 'gemini' and cfg['gemini_key']:
        response_text = _call_gemini_text(prompt, cfg['gemini_key'])

    if not response_text:
        response_text = _fallback_tutor_reply(query, grade)

    # Record usage & save conversation history in DB
    if db is not None:
        today_str = datetime.utcnow().strftime('%Y-%m-%d')
        db.ai_usage.update_one(
            {'student_id': str(student_id), 'date': today_str},
            {'$inc': {'count': 1}},
            upsert=True
        )
        db.ai_conversations.insert_one({
            'student_id': str(student_id),
            'query': query,
            'response': response_text,
            'grade': grade,
            'timestamp': datetime.utcnow()
        })

    return {'success': True, 'response': response_text}


    # Log usage & conversation in DB
    if db is not None:
        today_str = datetime.utcnow().strftime('%Y-%m-%d')
        db.ai_usage.update_one(
            {'student_id': student_id, 'date': today_str},
            {'$inc': {'count': 1}},
            upsert=True
        )
        db.ai_conversations.insert_one({
            'student_id': student_id,
            'query': query,
            'response': response_text,
            'timestamp': datetime.utcnow()
        })

    return {'success': True, 'response': response_text}


def _call_gemini(prompt, api_key):
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        res = requests.post(url, json=payload, timeout=15)
        if res.status_code == 200:
            text = res.json()['candidates'][0]['content']['parts'][0]['text']
            clean = text.strip().replace('```json', '').replace('```', '')
            return json.loads(clean)
    except Exception as e:
        print(f"Gemini Quiz Gen Error: {e}")
    return None


def _call_gemini_text(prompt, api_key):
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        res = requests.post(url, json=payload, timeout=15)
        if res.status_code == 200:
            return res.json()['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        print(f"Gemini Tutor Error: {e}")
    return None


def _call_groq(prompt, api_key, model=None):
    candidate_models = []
    if model and model.strip():
        candidate_models.append(model.strip())
    for m in ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b']:
        if m not in candidate_models:
            candidate_models.append(m)

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    for candidate in candidate_models:
        try:
            payload = {
                "model": candidate,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3
            }
            res = requests.post(url, headers=headers, json=payload, timeout=15)
            if res.status_code == 200:
                text = res.json()['choices'][0]['message']['content']
                clean = text.strip().replace('```json', '').replace('```', '')
                return json.loads(clean)
            else:
                print(f"Groq Quiz Gen warning on {candidate}: HTTP {res.status_code} - {res.text[:100]}")
        except Exception as e:
            print(f"Groq Quiz Gen Error on {candidate}: {e}")

    return None


def _call_groq_text(prompt, api_key, model=None):
    candidate_models = []
    if model and model.strip():
        candidate_models.append(model.strip())
    for m in ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b']:
        if m not in candidate_models:
            candidate_models.append(m)

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    for candidate in candidate_models:
        try:
            payload = {
                "model": candidate,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.5
            }
            res = requests.post(url, headers=headers, json=payload, timeout=15)
            if res.status_code == 200:
                content = res.json().get('choices', [{}])[0].get('message', {}).get('content')
                if content:
                    return content
            else:
                print(f"Groq Tutor warning on {candidate}: HTTP {res.status_code} - {res.text[:100]}")
        except Exception as e:
            print(f"Groq Tutor Error on {candidate}: {e}")

    return None


def _fallback_stem_questions(topic, subject, grade, num_questions, difficulty):
    """High quality fallback questions for offline or quota-exceeded environments."""
    templates = [
        {
            'question': f"In Grade {grade} {subject}, which fundamental property best describes '{topic}'?",
            'option_a': 'Conservation of Energy and Mass',
            'option_b': 'Continuous Random Fluctuation',
            'option_c': 'Permanent Kinetic Decay',
            'option_d': 'Zero Resistance State',
            'correct_answer': 'A',
            'explanation': f"The conservation laws govern all foundational concepts in {subject}, ensuring energy and mass balance.",
            'difficulty': difficulty,
            'marks': 1,
            'topic': topic
        },
        {
            'question': f"When investigating '{topic}', which scientific instrument or method is most commonly utilized?",
            'option_a': 'Controlled Variable Experimentation',
            'option_b': 'Unverified Qualitative Speculation',
            'option_c': 'Static Visual Observation only',
            'option_d': 'Arbitrary Unit Estimation',
            'correct_answer': 'A',
            'explanation': f"Scientific enquiry requires controlling variables to isolate cause and effect relationships.",
            'difficulty': difficulty,
            'marks': 1,
            'topic': topic
        },
        {
            'question': f"What is the direct practical application of understanding '{topic}' in everyday technology or nature?",
            'option_a': 'Optimizing mechanical efficiency and predictable system performance',
            'option_b': 'Eliminating the need for mathematical formulas',
            'option_c': 'Converting potential energy into total void',
            'option_d': 'Preventing physical motion from occurring',
            'correct_answer': 'A',
            'explanation': f"STEM principles allow engineers and scientists to design reliable machines and predict natural outcomes.",
            'difficulty': difficulty,
            'marks': 1,
            'topic': topic
        }
    ]
    return templates[:num_questions]


def _fallback_tutor_reply(query, grade):
    return (
        f"That's a wonderful STEM question for Grade {grade}! 🌟\n\n"
        f"To understand **{query}**, keep three steps in mind:\n"
        "1. **Core Principle**: Nature and mathematics always follow logical rules and patterns.\n"
        "2. **Simple Analogy**: Think of it like balance scales — when you change one factor, another adjusts.\n"
        "3. **Next Step**: Try breaking this down into a diagram or equation, and test it in your next quiz!\n\n"
        "Feel free to ask another question or ask for a practice problem!"
    )
