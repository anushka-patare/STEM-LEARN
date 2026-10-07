import {
  FiShield,
  FiCpu,
  FiAward,
  FiLayers,
  FiZap,
  FiBarChart2
} from 'react-icons/fi';

export default function FeatureGrid() {
  const features = [
    {
      title: 'Anti-Cheat Fullscreen Engine',
      desc: 'Enforces fullscreen during quizzes, monitors tab-switching and window blur events, and auto-submits upon repeated violations to protect research integrity.',
      icon: FiShield,
      tag: 'Security',
      color: 'blue',
    },
    {
      title: 'Groq & Gemini Dual AI',
      desc: 'Harnesses high-speed Groq LLaMA 3.3 70B and Google Gemini 2.5 Flash to generate NCERT-aligned multiple-choice questions with tailored distractor rationales.',
      icon: FiCpu,
      tag: 'AI Powered',
      color: 'purple',
    },
    {
      title: 'Adaptive Scoring Algorithms',
      desc: 'Flexible mathematical models for squads: calculate team ranks via arithmetic average, cumulative sum, or top-N performers to evaluate social loafing.',
      icon: FiLayers,
      tag: 'Methodology',
      color: 'indigo',
    },
    {
      title: 'Bloom’s Taxonomy Mapping',
      desc: 'All quiz items are indexed by cognitive complexity (Knowledge, Comprehension, Application, Analysis) allowing deep diagnostic learning path recommendations.',
      icon: FiZap,
      tag: 'Pedagogy',
      color: 'amber',
    },
    {
      title: 'Squad & Solo Gamification',
      desc: 'Custom avatars, point multipliers, mastery streaks, and collaborative team trophies maintain high middle-school student engagement throughout the term.',
      icon: FiAward,
      tag: 'Gamification',
      color: 'rose',
    },
    {
      title: 'Automated ANOVA Data Export',
      desc: 'Instant CSV exports formatted for SPSS, R, and Python with pre-computed descriptive statistics, one-way ANOVA F-ratios, and p-value metrics.',
      icon: FiBarChart2,
      tag: 'Research',
      color: 'emerald',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="stem-container">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wider">
            Engineered For Excellence
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Comprehensive Platform Features
          </h2>
          <p className="text-base text-slate-600">
            A complete synthesis of child-friendly gamification, robust anti-cheat controls, and academic-grade data telemetry.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="rounded-3xl p-7 bg-slate-50/70 border border-slate-200/70 hover:border-slate-300 hover:bg-white hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        f.color === 'blue'
                          ? 'bg-blue-100 text-blue-600'
                          : f.color === 'purple'
                          ? 'bg-purple-100 text-purple-600'
                          : f.color === 'indigo'
                          ? 'bg-indigo-100 text-indigo-600'
                          : f.color === 'amber'
                          ? 'bg-amber-100 text-amber-600'
                          : f.color === 'rose'
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-emerald-100 text-emerald-600'
                      } group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-200/80 text-slate-700">
                      {f.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2.5 group-hover:text-blue-600 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
