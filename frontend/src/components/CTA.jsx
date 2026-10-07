import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';

export default function CTA({ content }) {
  return (
    <section className="py-20 bg-slate-50 relative overflow-hidden">
      <div className="stem-container">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-8 sm:p-14 lg:p-20 text-white text-center relative overflow-hidden shadow-2xl">
          {/* Background circles */}
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />

          <div className="max-w-3xl mx-auto space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
              {content?.cta_badge || 'Ready to Discover Your STEM Potential?'}
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {content?.cta_title || 'Start Exploring STEM with Your Classmates Today'}
            </h2>

            <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              {content?.cta_subtitle || 'Solve exciting science and math challenges, unlock achievements, climb leaderboards solo, or bring glory to your squad.'}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/student/register"
                className="w-full sm:w-auto stem-btn bg-white hover:bg-slate-100 text-blue-700 py-3.5 px-8 text-base font-extrabold flex items-center justify-center gap-2.5 shadow-xl shadow-black/10"
              >
                <span>{content?.cta_btn_primary || 'Student Free Registration'}</span>
                <FiArrowRight className="w-5 h-5" />
              </Link>

              <Link
                to="/teacher/login"
                className="w-full sm:w-auto stem-btn bg-blue-700/60 hover:bg-blue-700 text-white py-3.5 px-7 text-base font-bold flex items-center justify-center gap-2 border border-white/20"
              >
                <span>{content?.cta_btn_secondary || 'Teacher Faculty Login'}</span>
              </Link>
            </div>

            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-white/70 font-semibold">
              <div className="flex items-center gap-1.5">
                <FiCheckCircle className="w-4 h-4 text-emerald-300" />
                <span>Middle School Standards</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiCheckCircle className="w-4 h-4 text-emerald-300" />
                <span>Anti-Cheat Security</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiCheckCircle className="w-4 h-4 text-emerald-300" />
                <span>Zero Ads or Commercial Distractions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
