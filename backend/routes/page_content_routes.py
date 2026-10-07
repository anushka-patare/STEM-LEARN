"""Routes for public page content and administrative CMS management."""
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt
from middleware.role_middleware import admin_required

page_bp = Blueprint('page_content', __name__)

DEFAULT_PAGE_CONTENTS = {
    'home': {
        'hero_badge': 'Middle School STEM Research Study • Grades 6, 7 & 8',
        'hero_title_prefix': 'Competitive vs.',
        'hero_title_highlight': 'Collaborative',
        'hero_title_suffix': 'STEM Learning',
        'hero_subtitle': 'Evaluating how individual rank-based motivation compares with squad-based team cooperation in middle-school STEM education. Interactive quizzes, balanced scoring, and real-time research analytics.',
        'hero_btn_primary': 'Start Student Journey',
        'hero_btn_secondary': 'Explore Curriculum',
        'stats_cohorts_value': 'Grades 6–8',
        'stats_cohorts_label': 'Target Cohorts',
        'stats_cohorts_desc': 'Middle school curriculum aligned with NCERT standards',
        'stats_pillars_value': '4 Core Pillars',
        'stats_pillars_label': 'STEM Disciplines',
        'stats_pillars_desc': 'Science, Technology, Engineering, and Mathematics',
        'stats_modes_value': 'Dual Modes',
        'stats_modes_label': 'Research Conditions',
        'stats_modes_desc': 'Individual competitive rank vs. Collaborative team squads',
        'stats_rigor_value': 'ANOVA Ready',
        'stats_rigor_label': 'Evaluation Rigor',
        'stats_rigor_desc': 'Automated data exports with controlled difficulty metrics',
        'cta_badge': 'Ready to Discover Your STEM Potential?',
        'cta_title': 'Start Exploring STEM with Your Classmates Today',
        'cta_subtitle': 'Solve exciting science and math challenges, unlock achievements, climb leaderboards solo, or bring glory to your squad.',
        'cta_btn_primary': 'Student Free Registration',
        'cta_btn_secondary': 'Teacher Faculty Login',
    },
    'about': {
        'badge': 'About the Academic Research',
        'title': 'STEMLearn Research Initiative',
        'subtitle': 'Evaluating the Effectiveness of Competitive vs. Collaborative Leaderboards in Middle School STEM Learning (Grades 6, 7 & 8).',
        'context_title': 'Research Context & Problem Statement',
        'context_p1': 'Middle school represents a pivotal developmental juncture where students form their enduring attitudes towards Science, Technology, Engineering, and Mathematics. While digital gamification has emerged as a popular pedagogical tool, conventional systems overwhelmingly default to individual zero-sum leaderboards.',
        'context_p2': 'However, high-stakes individual rank boards often foster math anxiety and discourage students who fall behind early. Conversely, collaborative team gamification can stimulate peer mentorship and psychological safety, but may suffer from "free-rider" effects.',
        'context_p3': 'STEMLearn was developed as a controlled empirical platform to definitively compare these two social dynamics under strict experimental conditions—keeping the curriculum, quiz items, time limits, and grading rubrics 100% identical.',
        'objective_1_title': 'Empirical Motivation Comparison',
        'objective_1_desc': 'Investigate whether middle-school students perform better academically when driven by individual ranking status versus collective squad goals.',
        'objective_2_title': 'Rigorous Item Difficulty Control',
        'objective_2_desc': 'Eliminate question difficulty bias by delivering the exact same questions, time limits, and passing standards across both experimental cohorts.',
        'objective_3_title': 'Psychological Anxiety Mitigation',
        'objective_3_desc': 'Measure if collaborative squad scoring reduces STEM test anxiety and encourages lower-performing students to attempt challenging problems.',
        'objective_4_title': 'Evidence-Based ANOVA Telemetry',
        'objective_4_desc': 'Provide educational psychologists with clean, exportable quantitative datasets with pre-computed F-ratios, p-values, and effect sizes.',
    },
    'curriculum': {
        'badge': 'Standardized Academic Blueprint',
        'title': 'Middle School STEM Curriculum',
        'subtitle': 'Structured across Grades 6, 7, and 8. Mapped directly to national middle-school science and mathematics syllabi to ensure experimental validity.',
        'pedagogy_title': 'Experimental Alignment & Pedagogy',
        'pedagogy_p1': 'Every quiz item in STEMLearn is calibrated for difficulty, cognitive level (Bloom\'s Taxonomy), and chapter learning objectives. Both competitive individual students and collaborative team squads receive identical question banks.',
        'grade6_overview': 'Grade 6 lays fundamental conceptual ground in natural sciences, arithmetic operations, basic algebra, geometric structures, and introductory computing.',
        'grade7_overview': 'Grade 7 expands into thermal physics, chemical transformations, rational numbers, algebraic expressions, environmental biology, and algorithmic logic.',
        'grade8_overview': 'Grade 8 advances to cellular microbiology, force and pressure, linear equations, mensuration, data handling, and scientific problem-solving.',
    },
    'leaderboard': {
        'badge': 'Live Academic Telemetry & Rankings',
        'title': 'STEMLearn Hall of Fame & Leaderboards',
        'subtitle': 'Celebrating top middle-school students, class toppers, and collaborative STEM squads across Grades 6, 7 & 8.',
        'spotlight_badge': '★ Academic Spotlight',
        'spotlight_title': 'Middle School STEM Excellence Showcase',
        'spotlight_text': 'Rankings update in real-time as students solve calibrated quizzes in science, technology, engineering, and mathematics.',
        'top10_title': 'Global Top 10 Scholars',
        'top10_desc': 'The highest-performing students across all participating middle school divisions.',
        'classwise_title': 'Class & Division Toppers',
        'classwise_desc': 'Top ranking students segmented by Grade 6, Grade 7, and Grade 8 cohorts.',
        'teamwise_title': 'Collaborative STEM Squads',
        'teamwise_desc': 'Team-based leaderboard evaluating cooperative synergy, joint quizzes, and squad points.',
        'rules_title': 'Leaderboard Fairness & Scoring Rules',
        'rules_p1': 'Scoring is governed by calibrated quiz difficulty, completion speed, and zero tolerance for anti-cheat anomalies.',
    },
    'contact': {
        'badge': 'Inquiries & Collaboration',
        'title': 'Contact STEMLearn',
        'subtitle': 'Have questions regarding middle school participation, research datasets, or technical support? Connect with us directly.',
        'dept_name': 'Department of Computer Science & Engineering',
        'sub_dept': 'Educational Technology & Research Laboratory',
        'address': 'Academic Research Complex, University Campus',
        'city_state': 'Maharashtra, India - 422005',
        'email': 'research@stemlearn.edu',
        'support_email': 'support@stemlearn.edu',
        'phone': '+91 98765 43210',
        'hours': 'Monday – Friday: 9:00 AM – 5:30 PM IST',
        'response_time': 'Research queries answered within 24 business hours.',
    },
    'footer': {
        'brand_title': 'STEMLearn',
        'brand_subtitle': 'Grades 6 – 8 Educational Research',
        'brand_desc': 'An evidence-based middle school STEM platform designed to evaluate learning efficacy across competitive individual leaderboards and collaborative squad-based learning dynamics.',
        'badge_curriculum': 'Curriculum Aligned',
        'badge_anticheat': 'Anti-Cheat Secured',
        'badge_ai': 'AI Augmented',
        'dept_name': 'Department of Computer Science & Engineering',
        'email': 'research@stemlearn.edu',
        'phone': '+91 98765 43210',
        'copyright': 'STEMLearn Research Project. Middle School STEM Learning Assessment.',
        'study_note': 'Grades 6–8 Controlled Study',
    }
}


@page_bp.route('', methods=['GET'])
def get_all_pages():
    """Retrieve content dictionary for all managed public pages."""
    db = current_app.config['db']
    pages = {}
    try:
        docs = list(db.page_contents.find({}))
        db_pages = {d['page_key']: d.get('content', {}) for d in docs if 'page_key' in d}
        for key, default_val in DEFAULT_PAGE_CONTENTS.items():
            merged = {**default_val, **db_pages.get(key, {})}
            pages[key] = merged
        return jsonify({'success': True, 'data': pages})
    except Exception as e:
        return jsonify({'success': True, 'data': DEFAULT_PAGE_CONTENTS})


@page_bp.route('/<page_key>', methods=['GET'])
def get_page_content(page_key):
    """Retrieve content for a specific page key (home, about, curriculum, contact, footer)."""
    db = current_app.config['db']
    clean_key = (page_key or '').lower().strip()
    default_content = DEFAULT_PAGE_CONTENTS.get(clean_key, {})

    try:
        doc = db.page_contents.find_one({'page_key': clean_key})
        if doc and 'content' in doc:
            merged = {**default_content, **doc['content']}
            return jsonify({'success': True, 'data': merged, 'updated_at': doc.get('updated_at')})
        return jsonify({'success': True, 'data': default_content})
    except Exception as e:
        return jsonify({'success': True, 'data': default_content})


@page_bp.route('/<page_key>', methods=['PUT'])
@jwt_required()
@admin_required
def update_page_content(page_key):
    """Administrative endpoint to update content for a given page."""
    db = current_app.config['db']
    clean_key = (page_key or '').lower().strip()
    data = request.get_json(silent=True) or {}

    if clean_key not in DEFAULT_PAGE_CONTENTS:
        return jsonify({'success': False, 'message': f'Invalid page key: {page_key}'}), 400

    now = datetime.utcnow()
    # Merge existing or default with incoming changes
    existing = db.page_contents.find_one({'page_key': clean_key})
    current_content = existing.get('content', {}) if existing else DEFAULT_PAGE_CONTENTS[clean_key].copy()
    current_content.update(data)

    db.page_contents.update_one(
        {'page_key': clean_key},
        {
            '$set': {
                'page_key': clean_key,
                'content': current_content,
                'updated_at': now
            }
        },
        upsert=True
    )

    return jsonify({
        'success': True,
        'message': f"{clean_key.capitalize()} page content updated successfully!",
        'data': current_content
    })
