import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBookOpen,
  FiAward,
  FiUsers,
  FiShield,
  FiCheckCircle,
  FiArrowRight,
  FiCpu,
  FiTarget,
  FiGlobe
} from 'react-icons/fi';
import { pageService } from '../../services/api';

export default function About() {
  const [content, setContent] = useState({
    badge: 'About the Academic Research',
    title: 'STEMLearn Research Initiative',
    subtitle: 'Evaluating the Effectiveness of Competitive vs. Collaborative Leaderboards in Middle School STEM Learning (Grades 6, 7 & 8).',
    context_title: 'Research Context & Problem Statement',
    context_p1: 'Middle school represents a pivotal developmental juncture where students form their enduring attitudes towards Science, Technology, and Mathematics. While digital gamification has emerged as a popular pedagogical tool, conventional systems overwhelmingly default to individual zero-sum leaderboards.',
    context_p2: 'However, high-stakes individual rank boards often foster math anxiety and discourage students who fall behind early. Conversely, collaborative team gamification can stimulate peer mentorship and psychological safety, but may suffer from "free-rider" effects.',
    context_p3: 'STEMLearn was developed as a controlled empirical platform to definitively compare these two social dynamics under strict experimental conditions—keeping the curriculum, quiz items, time limits, and grading rubrics 100% identical.',
    objective_1_title: 'Empirical Motivation Comparison',
    objective_1_desc: 'Investigate whether middle-school students perform better academically when driven by individual ranking status versus collective squad goals.',
    objective_2_title: 'Rigorous Item Difficulty Control',
    objective_2_desc: 'Eliminate question difficulty bias by delivering the exact same questions, time limits, and passing standards across both experimental cohorts.',
    objective_3_title: 'Psychological Anxiety Mitigation',
    objective_3_desc: 'Measure if collaborative squad scoring reduces STEM test anxiety and encourages lower-performing students to attempt challenging problems.',
    objective_4_title: 'Evidence-Based ANOVA Telemetry',
    objective_4_desc: 'Provide educational psychologists with clean, exportable quantitative datasets with pre-computed F-ratios, p-values, and effect sizes.',
  });

  useEffect(() => {
    const loadContent = async () => {
      try {
        const res = await pageService.getPageContent('about');
        if (res.data?.success && res.data.data) {
          setContent((prev) => ({ ...prev, ...res.data.data }));
        }
      } catch (e) {
        // Fallback
      }
    };
    loadContent();
  }, []);

  const objectives = [
    {
      title: content.objective_1_title || 'Empirical Motivation Comparison',
      desc: content.objective_1_desc || 'Investigate whether middle-school students perform better academically when driven by individual ranking status versus collective squad goals.',
      icon: FiTarget,
    },
    {
      title: content.objective_2_title || 'Rigorous Item Difficulty Control',
      desc: content.objective_2_desc || 'Eliminate question difficulty bias by delivering the exact same questions, time limits, and passing standards across both experimental cohorts.',
      icon: FiShield,
    },
    {
      title: content.objective_3_title || 'Psychological Anxiety Mitigation',
      desc: content.objective_3_desc || 'Measure if collaborative squad scoring reduces STEM test anxiety and encourages lower-performing students to attempt challenging problems.',
      icon: FiUsers,
    },
    {
      title: content.objective_4_title || 'Evidence-Based ANOVA Telemetry',
      desc: content.objective_4_desc || 'Provide educational psychologists with clean, exportable quantitative datasets with pre-computed F-ratios, p-values, and effect sizes.',
      icon: FiAward,
    },
  ];

  return (
    <div className="w-full py-16 lg:py-24 bg-slate-50">
      <div className="stem-container">
        {/* Page Hero */}
        <div className="max-w-4xl mx-auto text-center space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
            {content.badge}
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {content.title}
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            {content.subtitle}
          </p>
        </div>

        {/* Executive Summary Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm mb-16 space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {content.context_title}
          </h2>
          <div className="text-sm sm:text-base text-slate-600 space-y-4 leading-relaxed">
            <p>
              {content.context_p1}
            </p>
            <p>
              {content.context_p2}
            </p>
            <p>
              {content.context_p3}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FiBookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Curriculum</div>
                <div className="text-xs text-slate-500">NCERT Standards</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <FiUsers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Target Group</div>
                <div className="text-xs text-slate-500">Middle School (Grades 6–8)</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FiShield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Ethics & Privacy</div>
                <div className="text-xs text-slate-500">100% Anonymized Telemetry</div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Research Objectives Grid */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <h2 className="text-3xl font-black text-slate-900">
              Core Study Objectives
            </h2>
            <p className="text-sm text-slate-600">
              Four foundational pillars that govern data collection and statistical validation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {objectives.map((obj, i) => {
              const Icon = obj.icon;
              return (
                <div
                  key={i}
                  className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all space-y-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{obj.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {obj.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform Technical Stack Overview */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            System & Research Architecture
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Frontend UI</span>
              <h4 className="text-base font-bold text-slate-900">React.js & Tailwind</h4>
              <p className="text-xs text-slate-600">
                Responsive, accessible interface with strict role isolation and fullscreen anti-cheat listeners.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Backend API</span>
              <h4 className="text-base font-bold text-slate-900">Python Flask</h4>
              <p className="text-xs text-slate-600">
                RESTful blueprints with JWT authentication, bcrypt hashing, and rate-limiting safeguards.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Database</span>
              <h4 className="text-base font-bold text-slate-900">MongoDB Atlas</h4>
              <p className="text-xs text-slate-600">
                Flexible document schema indexing quizzes, student attempts, squad compositions, and audit logs.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Artificial Intelligence</span>
              <h4 className="text-base font-bold text-slate-900">Groq & Gemini</h4>
              <p className="text-xs text-slate-600">
                Dual inference engine providing sub-second question generation and middle-school Socratic hints.
              </p>
            </div>
          </div>
        </div>

        {/* Call to action card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-blue-600 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-2xl font-black">Want to inspect student standings & top squads?</h3>
            <p className="text-blue-100 text-sm">
              Discover top 10 scholars, grade-wise toppers, and collaborative squad telemetry for Grades 6, 7, and 8.
            </p>
          </div>
          <Link
            to="/leaderboard"
            className="stem-btn bg-white hover:bg-slate-100 text-blue-700 py-3 px-6 text-sm font-bold whitespace-nowrap shadow-md"
          >
            <span>Explore Hall of Fame</span>
            <FiArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
