import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiAward,
  FiUsers,
  FiZap,
  FiCheckCircle,
  FiActivity,
  FiTrendingUp
} from 'react-icons/fi';
import stemHeroImg from '../assets/images/stem_hero_visual.jpg';

export default function Hero({ content }) {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-blue-50/60 via-white to-slate-50">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-blue-400/15 via-indigo-400/15 to-purple-400/15 blur-3xl -z-10 pointer-events-none rounded-full" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-400/10 blur-2xl -z-10 pointer-events-none rounded-full" />

      <div className="stem-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* ─── Left Column: Headline & Call To Action ─── */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Research Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-100/80 border border-blue-200/80 text-blue-800 text-xs sm:text-sm font-semibold shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
              <span>{content?.hero_badge || 'Middle School STEM Research Study • Grades 6, 7 & 8'}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              {content?.hero_title_prefix || 'Competitive vs.'}{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {content?.hero_title_highlight || 'Collaborative'}
              </span>{' '}
              {content?.hero_title_suffix || 'STEM Learning'}
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {content?.hero_subtitle || 'Evaluating how individual rank-based motivation compares with squad-based team cooperation in middle-school STEM education. Interactive quizzes, balanced scoring, and real-time research analytics.'}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/student/register"
                className="w-full sm:w-auto stem-btn stem-btn-primary py-3.5 px-7 text-base flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/25"
              >
                <span>{content?.hero_btn_primary || 'Start Student Journey'}</span>
                <FiArrowRight className="w-5 h-5" />
              </Link>

              <Link
                to="/leaderboard"
                className="w-full sm:w-auto stem-btn stem-btn-secondary py-3.5 px-7 text-base flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
              >
                <span>{content?.hero_btn_secondary || 'Explore Top 10 & Rankings'}</span>
              </Link>
            </div>

            {/* Micro Highlights */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>NCERT & STEM Aligned</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Anti-Cheat Protected</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>ANOVA Data Exports</span>
              </div>
            </div>
          </div>

          {/* ─── Right Column: AI-Generated STEM Visual Showcase ─── */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Glow backdrop */}
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-[34px] blur-2xl opacity-25 pointer-events-none" />

              {/* Main Visual Container */}
              <div className="relative rounded-[28px] overflow-hidden shadow-2xl border-4 border-white/90 bg-white z-10 group">
                <img
                  src={stemHeroImg}
                  alt="Middle School STEM Interactive Learning & Science Quizzes"
                  className="w-full h-auto object-cover rounded-[24px] transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Bottom glassmorphic info bar */}
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-white/60 shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                      <FiActivity className="w-4 h-4 text-purple-600 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">Live Research Arena</div>
                      <div className="text-[10px] text-slate-500 font-semibold">Competitive vs Collaborative Study</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Active Session
                  </span>
                </div>
              </div>

              {/* Floating Badge 1: Top Right */}
              <div className="absolute -top-5 -right-5 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-100 z-20 flex items-center gap-3 hidden sm:flex">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs">
                  <FiTrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900">+24% Accuracy</div>
                  <div className="text-[10px] text-slate-500 font-medium">Collaborative Mode</div>
                </div>
              </div>

              {/* Floating Badge 2: Bottom Left */}
              <div className="absolute -bottom-5 -left-5 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-100 z-20 flex items-center gap-3 hidden sm:flex">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-2xs">
                  <FiZap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900">12,000+ STEM Qs</div>
                  <div className="text-[10px] text-slate-500 font-medium">Verified Curriculum</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
