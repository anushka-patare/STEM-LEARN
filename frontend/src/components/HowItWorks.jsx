import { FiUserCheck, FiCpu, FiAward, FiBarChart2 } from 'react-icons/fi';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Enroll & Get Cohort Assigned',
      desc: 'Students sign in to their Grade 6, 7, or 8 dashboard. Teachers configure class sections into individual competitive tracks or collaborative balanced squads.',
      icon: FiUserCheck,
      color: 'blue',
    },
    {
      num: '02',
      title: 'Engage with Equated STEM Quizzes',
      desc: 'Take timed, anti-cheat monitored quizzes across Physics, Coding, Robotics, and Algebra with consistent questions, timers, and passing criteria.',
      icon: FiCpu,
      color: 'indigo',
    },
    {
      num: '03',
      title: 'Track Dynamic Leaderboards',
      desc: 'Watch points calculate live! In solo mode, climb the class ladder. In collaborative mode, every member contribution boosts the squad total.',
      icon: FiAward,
      color: 'purple',
    },
    {
      num: '04',
      title: 'Review Insights & Research Data',
      desc: 'Students receive AI-assisted step-by-step explanations for misconceptions, while teachers export ANOVA research datasets and mastery heatmaps.',
      icon: FiBarChart2,
      color: 'emerald',
    },
  ];

  return (
    <section className="py-20 bg-slate-50 relative overflow-hidden">
      <div className="stem-container">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
            Step-by-Step Flow
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How STEMLearn Works
          </h2>
          <p className="text-base text-slate-600">
            A frictionless learning loop tailored specifically for middle-school cognitive development and academic research integrity.
          </p>
        </div>

        {/* 4 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-slate-300 transition-all flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-3xl font-black text-slate-200 group-hover:text-blue-600 transition-colors">
                      {step.num}
                    </span>
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        step.color === 'blue'
                          ? 'bg-blue-50 text-blue-600'
                          : step.color === 'indigo'
                          ? 'bg-indigo-50 text-indigo-600'
                          : step.color === 'purple'
                          ? 'bg-purple-50 text-purple-600'
                          : 'bg-emerald-50 text-emerald-600'
                      } group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2.5">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>Step {idx + 1} of 4</span>
                  <span className="text-blue-600 uppercase tracking-wider">Verified Flow</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
