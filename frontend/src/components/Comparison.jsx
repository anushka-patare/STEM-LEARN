import {
  FiAward,
  FiUsers,
  FiCheck,
  FiActivity,
  FiShield,
  FiBarChart2,
  FiLayers
} from 'react-icons/fi';

export default function Comparison() {
  const comparisonData = [
    {
      feature: 'Participation Unit',
      competitive: 'Individual student solo challenge',
      collaborative: 'Balanced teams of 3–5 peers (Squad)',
    },
    {
      feature: 'Scoring Formula',
      competitive: 'Raw individual quiz points + speed bonus',
      collaborative: 'Configurable: Team Average, Sum, or Top-N',
    },
    {
      feature: 'Leaderboard Visibility',
      competitive: 'Student vs. all classmates in cohort',
      collaborative: 'Squad vs. all other squads in cohort',
    },
    {
      feature: 'Psychological Driver',
      competitive: 'Personal mastery, rank ambition & status',
      collaborative: 'Peer encouragement, collective responsibility',
    },
    {
      feature: 'Quiz Content & Time',
      competitive: 'Identical questions, difficulty & time limit',
      collaborative: 'Identical questions, difficulty & time limit',
    },
    {
      feature: 'Passing Standard',
      competitive: '60% benchmark for individual clearance',
      collaborative: '60% benchmark for individual clearance',
    },
    {
      feature: 'Research Metric',
      competitive: 'Individual retention & test latency',
      collaborative: 'Peer assistance & team persistence',
    },
  ];

  return (
    <section className="py-20 bg-white relative">
      <div className="stem-container">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider">
            Experimental Design
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Competitive vs. Collaborative Modes
          </h2>
          <p className="text-base text-slate-600">
            A scientifically controlled setup where content difficulty remains identical while the social motivational structure changes to measure learning impact.
          </p>
        </div>

        {/* 2 Big Cards: Competitive vs Collaborative */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Competitive Card */}
          <div className="rounded-3xl p-8 bg-gradient-to-b from-blue-50/50 to-white border-2 border-blue-200 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/40 rounded-full blur-2xl -z-0 pointer-events-none" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30">
                  <FiAward className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Competitive Mode</h3>
                  <p className="text-xs font-semibold text-blue-600">Individual Achievement Focus</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                Solo Rank
              </span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Students take STEM quizzes independently. Ranks are determined by direct individual points, accuracy, and response speed. Ideal for assessing solitary problem-solving and competitive drive.
            </p>

            <div className="space-y-3 border-t border-blue-100 pt-6">
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <FiCheck className="w-3.5 h-3.5" />
                </div>
                <span>Real-time individual rank updates</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <FiCheck className="w-3.5 h-3.5" />
                </div>
                <span>Personal accuracy streaks and badges</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <FiCheck className="w-3.5 h-3.5" />
                </div>
                <span>Direct self-paced revision incentives</span>
              </div>
            </div>
          </div>

          {/* Collaborative Card */}
          <div className="rounded-3xl p-8 bg-gradient-to-b from-purple-50/50 to-white border-2 border-purple-200 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/40 rounded-full blur-2xl -z-0 pointer-events-none" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/30">
                  <FiUsers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Collaborative Mode</h3>
                  <p className="text-xs font-semibold text-purple-600">Squad-Based Synergy Focus</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-800">
                Squad Rank
              </span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Students are placed in balanced teams. The team’s overall score is calculated from member efforts, promoting peer encouragement, collective accountability, and reducing anxiety among struggling students.
            </p>

            <div className="space-y-3 border-t border-purple-100 pt-6">
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <FiCheck className="w-3.5 h-3.5" />
                </div>
                <span>Team scoring methods: Average, Sum, or Top-N</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <FiCheck className="w-3.5 h-3.5" />
                </div>
                <span>Shared team points and trophy unlocking</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <FiCheck className="w-3.5 h-3.5" />
                </div>
                <span>Encourages low-performing peers to participate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Side-by-Side Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">Comparative Dimension</th>
                <th className="py-4 px-6 text-blue-700">Competitive Condition</th>
                <th className="py-4 px-6 text-purple-700">Collaborative Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-900 text-xs sm:text-sm">
                    {row.feature}
                  </td>
                  <td className="py-3.5 px-6 text-slate-600 text-xs sm:text-sm">
                    {row.competitive}
                  </td>
                  <td className="py-3.5 px-6 text-slate-600 text-xs sm:text-sm">
                    {row.collaborative}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Research Rigor Alert Box */}
        <div className="mt-8 p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
          <FiShield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Strict Research Equivalence: </span>
            The platform enforces that questions, duration, grading rubric, and chapter sequence remain 100% identical between conditions. The study does not bias towards either condition; outcomes are evaluated purely using empirical post-test ANOVA.
          </div>
        </div>
      </div>
    </section>
  );
}
