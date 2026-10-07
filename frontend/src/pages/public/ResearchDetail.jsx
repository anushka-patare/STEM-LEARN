import {
  FiBarChart2,
  FiBookOpen,
  FiCheckCircle,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiAward
} from 'react-icons/fi';

export default function ResearchDetail() {
  return (
    <div className="w-full py-16 lg:py-24 bg-slate-50">
      <div className="stem-container">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider">
            Academic Research Methodology
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Experimental Framework & Equations
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            A randomized comparative study on the motivational and cognitive impacts of leaderboard gamification in Grades 6–8.
          </p>
        </div>

        {/* Hypothesis Section */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm mb-12 space-y-6">
          <h2 className="text-2xl font-black text-slate-900">
            Formal Research Hypotheses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
              <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                Hypothesis H1
              </span>
              <h3 className="text-base font-bold text-slate-900">Mastery & Accuracy</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Middle-school students in the collaborative squad condition will demonstrate significantly higher post-test percentage accuracy compared to those in the individual competitive condition.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
              <span className="text-xs font-extrabold text-purple-600 uppercase tracking-wider">
                Hypothesis H2
              </span>
              <h3 className="text-base font-bold text-slate-900">Persistence & Retention</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Collaborative squad gamification will result in higher voluntary quiz completion rates and lower drop-off frequencies across challenging engineering and mathematics modules.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
              <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider">
                Hypothesis H3
              </span>
              <h3 className="text-base font-bold text-slate-900">Response Latency</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Top-tier academic performers in the competitive condition will exhibit lower average item response latency, reflecting heightened speed-based competition.
              </p>
            </div>
          </div>
        </div>

        {/* Mathematical Models Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm mb-12 space-y-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              Mathematical Formulations & Scoring Models
            </h2>
            <p className="text-sm text-slate-600">
              The platform implements calibrated mathematical functions to calculate both individual and collaborative rankings without introducing bias.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Model 1: Squad Aggregations */}
            <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
                  Squad Scoring Equations
                </h3>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                  Configurable by Teacher
                </span>
              </div>

              <div className="space-y-4 text-xs font-mono text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">1. Arithmetic Average (Mitigates squad size variance):</div>
                  <div className="text-cyan-300 font-bold">S_squad = (1 / N) * ∑(s_i)</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">2. Cumulative Sum (High-intensity engagement):</div>
                  <div className="text-cyan-300 font-bold">S_squad = ∑(s_i) + Streak_bonus</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">3. Top-K Performance (Free-rider mitigation):</div>
                  <div className="text-cyan-300 font-bold">S_squad = ∑ top_k(s_i) for k = 3</div>
                </div>
              </div>
            </div>

            {/* Model 2: Statistical ANOVA */}
            <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                  One-Way ANOVA Verification
                </h3>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                  Output Telemetry
                </span>
              </div>

              <div className="space-y-4 text-xs font-mono text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Between-Group Sum of Squares (SSB):</div>
                  <div className="text-emerald-300 font-bold">SSB = ∑ n_j * (X̄_j - X̄_total)²</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Within-Group Sum of Squares (SSW):</div>
                  <div className="text-emerald-300 font-bold">SSW = ∑ ∑ (X_ij - X̄_j)²</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">F-Ratio Test Statistic:</div>
                  <div className="text-emerald-300 font-bold">F = (SSB / df_b) / (SSW / df_w)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ethical Standards & Compliance */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm space-y-6">
          <h2 className="text-2xl font-black text-slate-900">
            Ethical Governance & Middle-School Safety
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-slate-600">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 text-sm">Full Data Anonymization</div>
              <p>Exported research tables strip personal phone numbers, emails, and student names, utilizing synthetic research subject IDs.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 text-sm">Balanced Class Demographics</div>
              <p>Squad generator provides gender and baseline-skill balancing to prevent unrepresentative experimental outliers.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 text-sm">Zero Commercialization</div>
              <p>The platform is strictly ad-free, respects middle-school student privacy rights, and does not sell learning analytics.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
