import { FiLayers, FiBookOpen, FiAward, FiBarChart2 } from 'react-icons/fi';

export default function Stats({ content }) {
  const stats = [
    {
      label: content?.stats_cohorts_label || 'Target Cohorts',
      value: content?.stats_cohorts_value || 'Grades 6–8',
      desc: content?.stats_cohorts_desc || 'Middle school curriculum aligned with NCERT standards',
      icon: FiLayers,
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      label: content?.stats_pillars_label || 'STEM Disciplines',
      value: content?.stats_pillars_value || '3 Core Pillars',
      desc: content?.stats_pillars_desc || 'Science, Technology, and Mathematics',
      icon: FiBookOpen,
      gradient: 'from-indigo-500 to-purple-600',
    },
    {
      label: content?.stats_modes_label || 'Research Conditions',
      value: content?.stats_modes_value || 'Dual Modes',
      desc: content?.stats_modes_desc || 'Individual competitive rank vs. Collaborative team squads',
      icon: FiAward,
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      label: content?.stats_rigor_label || 'Evaluation Rigor',
      value: content?.stats_rigor_value || 'ANOVA Ready',
      desc: content?.stats_rigor_desc || 'Automated data exports with controlled difficulty metrics',
      icon: FiBarChart2,
      gradient: 'from-emerald-500 to-teal-600',
    },
  ];

  return (
    <section className="py-12 bg-white border-y border-slate-200/70">
      <div className="stem-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/60 hover:border-slate-300 hover:bg-white hover:shadow-md transition-all group"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${stat.gradient} text-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mt-1">
                  {stat.label}
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {stat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
