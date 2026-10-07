import { Link } from 'react-router-dom';
import {
  FiUsers,
  FiBookOpen,
  FiAward,
  FiBarChart2,
  FiArrowRight,
  FiCheckCircle
} from 'react-icons/fi';

export default function TeacherSection() {
  const teacherTools = [
    {
      title: 'Class & Division Management',
      desc: 'Seamlessly organize students by Grade (6, 7, 8) and Division. Assign research condition parameters per section.',
      icon: FiUsers,
    },
    {
      title: 'AI Question Authoring',
      desc: 'Create calibrated question banks in seconds with Bloom taxonomy flags, distractors, and difficulty coefficients.',
      icon: FiBookOpen,
    },
    {
      title: 'Automated Squad Balancing',
      desc: 'Distribute students into equitable collaborative teams based on baseline diagnostic performance or random seeds.',
      icon: FiAward,
    },
    {
      title: 'Real-Time Class Heatmaps',
      desc: 'Spot struggling topics instantly with topic mastery matrices and exportable CSVs for statistical ANOVA analysis.',
      icon: FiBarChart2,
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="stem-container">
        <div className="rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-800 to-emerald-950 p-8 sm:p-12 lg:p-16 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                Built For Middle School Educators
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Empower Your STEM Classroom with Actionable Analytics
              </h2>

              <p className="text-slate-300 text-base leading-relaxed">
                Take the guesswork out of student motivation. Monitor whether your middle-schoolers thrive under individual competitive leaderboards or collaborative team goals with zero administrative friction.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                <Link
                  to="/teacher/login"
                  className="w-full sm:w-auto stem-btn bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 px-7 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                >
                  <span>Teacher Faculty Sign In</span>
                  <FiArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/about"
                  className="w-full sm:w-auto stem-btn bg-slate-800 hover:bg-slate-700 text-slate-200 py-3.5 px-6 text-sm font-semibold flex items-center justify-center gap-2 border border-slate-700"
                >
                  <span>Learn Faculty Features</span>
                </Link>
              </div>
            </div>

            {/* Right 2x2 Grid of Educator Capabilities */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teacherTools.map((t, idx) => {
                const Icon = t.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/50 hover:bg-slate-800 transition-all space-y-2.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white">{t.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{t.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
