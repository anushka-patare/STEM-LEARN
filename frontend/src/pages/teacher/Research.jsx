import { useState, useEffect, useCallback } from 'react';
import { researchService } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  FiBarChart2, 
  FiDownload, 
  FiCheckCircle, 
  FiTrendingUp, 
  FiRefreshCw, 
  FiDatabase,
  FiUsers,
  FiInbox
} from 'react-icons/fi';

export default function TeacherResearch() {
  const [loading, setLoading] = useState(true);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [isSignificant, setIsSignificant] = useState(false);
  const [descriptive, setDescriptive] = useState([]);
  const [anovaTable, setAnovaTable] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await researchService.getOverview();
      const d = res.data?.data || res.data || {};

      if (Array.isArray(d.descriptive)) {
        setDescriptive(d.descriptive);
      }
      if (Array.isArray(d.anova_table)) {
        setAnovaTable(d.anova_table);
      }
      if (d.total_participants !== undefined) {
        setTotalParticipants(d.total_participants);
      }
      if (d.significant !== undefined) {
        setIsSignificant(d.significant);
      }
    } catch (err) {
      console.error('Failed to load research telemetry', err);
      toast.error('Unable to fetch live ANOVA telemetry');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownloadDataset = async () => {
    try {
      const res = await researchService.exportData();
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `stem_research_telemetry_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Raw SPSS/CSV telemetry dataset downloaded successfully');
    } catch (err) {
      toast.error('Failed to export dataset');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Experimental Research Telemetry (ANOVA)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Empirical statistical evaluation comparing Competitive vs. Collaborative Middle-School cohorts (Grades 6–9).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh research telemetry"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleDownloadDataset}
            className="stem-btn bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export SPSS / CSV Telemetry</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold">Calculating real-time ANOVA metrics...</p>
        </div>
      ) : descriptive.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <FiInbox className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Research Telemetry Available</h3>
          <p className="text-xs text-slate-500 mt-1">
            Statistical tests require student quiz submissions from both collaborative and competitive classes to calculate ANOVA variance.
          </p>
        </div>
      ) : (
        <>
          {/* Descriptive Statistics Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Descriptive Statistics by Experimental Condition
                </h3>
                <p className="text-xs text-slate-400">
                  Evaluated across identical science and math quizzes under controlled laboratory conditions
                </p>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
                <FiUsers className="w-3.5 h-3.5" />
                N = {totalParticipants} Participants
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Experimental Condition</th>
                    <th className="py-3.5 px-4">Sample (N)</th>
                    <th className="py-3.5 px-4">Mean Accuracy</th>
                    <th className="py-3.5 px-4">Std Deviation (SD)</th>
                    <th className="py-3.5 px-4">Avg Completion Time</th>
                    <th className="py-3.5 px-4 text-right">Total Attempts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {descriptive.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{row.group}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{row.n} students</td>
                      <td className="py-3.5 px-4 font-black text-purple-700 text-sm">{row.mean_accuracy}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{row.sd}</td>
                      <td className="py-3.5 px-4 text-slate-600">{row.avg_time}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                        {row.total_attempts} attempts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* One-Way ANOVA Table */}
          {anovaTable.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  One-Way Analysis of Variance (ANOVA)
                </h3>
                <p className="text-xs text-slate-400">
                  Between-groups variance comparison testing hypothesis H1 (Collaborative mastery vs. Solo competitiveness)
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Source of Variation</th>
                      <th className="py-3.5 px-4">Sum of Squares (SS)</th>
                      <th className="py-3.5 px-4">df</th>
                      <th className="py-3.5 px-4">Mean Squares (MS)</th>
                      <th className="py-3.5 px-4">F-Statistic</th>
                      <th className="py-3.5 px-4 text-right">p-value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-mono">
                    {anovaTable.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 font-sans font-bold text-slate-900">{row.source}</td>
                        <td className="py-3.5 px-4 text-slate-700">{row.ss}</td>
                        <td className="py-3.5 px-4 text-slate-700">{row.df}</td>
                        <td className="py-3.5 px-4 text-slate-700">{row.ms}</td>
                        <td className="py-3.5 px-4 font-black text-purple-700">{row.f}</td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                          {row.p}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Statistical Conclusion Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-3">
                <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    {isSignificant ? 'Statistically Significant Effect Confirmed (p < 0.05): ' : 'Telemetry In Progress: '}
                  </span>
                  {isSignificant
                    ? 'Students engaged in the collaborative squad condition achieve higher mastery accuracy and higher re-attempt rates compared to individual competitive participants.'
                    : 'Collecting further test attempts across cohorts to calculate full statistical power.'}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
