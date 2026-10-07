import { Link } from 'react-router-dom';
import { FiBarChart2, FiCheck, FiArrowRight, FiShield, FiTrendingUp } from 'react-icons/fi';

export default function ResearchSection() {
  return (
    <section className="py-20 bg-slate-50 relative overflow-hidden">
      <div className="stem-container">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
            Academic Research Foundation
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Rigorous Empirical Methodology
          </h2>
          <p className="text-base text-slate-600">
            Engineered to provide peer-review quality telemetry for educational psychologists, teachers, and STEM curriculum directors.
          </p>
        </div>

        {/* 3 Pillars of the Research */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Card 1: Independent Variable */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-2">
                Variable 01
              </span>
              <h3 className="text-lg font-black text-slate-900 mb-3">
                Independent Variable
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The leaderboard motivation condition assigned to student cohorts:
              </p>
              <ul className="mt-3 space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <FiCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Condition A: Competitive Solo Rank</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Condition B: Collaborative Squad Team Rank</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-semibold text-slate-400">
              Assigned across balanced Grade 6–8 classes
            </div>
          </div>

          {/* Card 2: Controlled Variables */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-2">
                Variable 02
              </span>
              <h3 className="text-lg font-black text-slate-900 mb-3">
                Controlled Variables
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Guaranteed identical factors between both experimental arms:
              </p>
              <ul className="mt-3 space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <FiCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Identical quiz items & answer keys</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Equal time limits & passing threshold (60%)</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Same Bloom-taxonomy cognitive distributions</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-semibold text-slate-400">
              Eliminates item-difficulty confounding
            </div>
          </div>

          {/* Card 3: Dependent Variables */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-2">
                Variable 03
              </span>
              <h3 className="text-lg font-black text-slate-900 mb-3">
                Dependent Variables
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Continuous quantitative telemetry logged during every session:
              </p>
              <ul className="mt-3 space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <FiCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Quiz accuracy percentage & raw scores</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Time-on-task and question response latency</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Voluntary chapter re-attempt frequencies</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-semibold text-slate-400">
              Evaluated with One-Way ANOVA & T-Tests
            </div>
          </div>
        </div>

        {/* CTA to Research Page */}
        <div className="text-center">
          <Link
            to="/research"
            className="stem-btn stem-btn-secondary py-3 px-6 text-sm font-bold inline-flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-xs"
          >
            <span>Read Complete Research Proposal & Equations</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
