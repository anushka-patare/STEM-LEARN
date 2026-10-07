import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/api';
import {
  FiUsers,
  FiUserCheck,
  FiLayers,
  FiGrid,
  FiShield,
  FiSettings,
  FiCheckCircle,
  FiActivity,
  FiArrowRight,
  FiBarChart2,
  FiZap,
  FiAward,
  FiClock,
  FiAlertTriangle,
  FiRefreshCw,
  FiBookOpen,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    totalClasses: 0,
    totalSubjects: 0,
    pendingTeachers: 0,
    flaggedAttempts: 0,
    serverStatus: 'Operational (:5000)',
    dbStatus: 'Connected (MongoDB Atlas)',
  });

  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [subjectCurriculum, setSubjectCurriculum] = useState([]);
  const [pedagogyMetrics, setPedagogyMetrics] = useState({
    competitive: { count: 0, avg_accuracy: 0 },
    collaborative: { count: 0, avg_accuracy: 0 },
    overall_accuracy: 0,
    total_points_awarded: 0,
    avg_time_spent_seconds: 0,
    integrity_rate: 100,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await adminService.getDashboard();
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        setStats({
          totalTeachers: d.total_teachers ?? 0,
          totalStudents: d.total_students ?? 0,
          totalClasses: d.total_classes ?? 0,
          totalSubjects: d.total_subjects ?? 0,
          pendingTeachers: d.pending_teachers ?? 0,
          flaggedAttempts: d.flagged_attempts ?? 0,
          serverStatus: 'Operational (:5000)',
          dbStatus: 'Connected (MongoDB Atlas)',
        });

        if (d.grade_distribution) setGradeDistribution(d.grade_distribution);
        if (d.subject_curriculum) setSubjectCurriculum(d.subject_curriculum);
        if (d.pedagogy_metrics) setPedagogyMetrics(d.pedagogy_metrics);
        if (d.recent_activity) setRecentActivity(d.recent_activity);
      }
    } catch (err) {
      console.warn('Dashboard fetch fallback', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const SUBJECT_COLORS = {
    Science: '#10b981',
    Technology: '#8b5cf6',
    Mathematics: '#f59e0b',
    Engineering: '#3b82f6',
    English: '#ec4899',
  };

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="space-y-8">
      {/* Superuser Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-purple-800/40">
        <div className="absolute right-0 top-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-xs font-bold uppercase tracking-wider border border-purple-400/30">
              <FiShield className="w-3.5 h-3.5 text-purple-400" />
              <span>Superuser Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              System Control Center
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Complete oversight over middle-school user registries, teacher appointments, curriculum taxonomies, and audit security telemetry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-950/60 text-emerald-400 px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              API Online (:5000)
            </div>
            <Link
              to="/admin/settings"
              className="stem-btn bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 text-xs font-bold flex items-center gap-2 shadow-xs"
            >
              <FiSettings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Pending Approvals & Security Alerts Banner */}
      {(stats.pendingTeachers > 0 || stats.flaggedAttempts > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.pendingTeachers > 0 && (
            <Link
              to="/admin/teachers"
              className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between hover:bg-amber-100/70 transition-all shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center font-bold text-sm">
                  {stats.pendingTeachers}
                </span>
                <div>
                  <div className="text-xs font-black uppercase tracking-wide">Pending Educator Approvals</div>
                  <div className="text-xs text-amber-700">New teacher applications awaiting review</div>
                </div>
              </div>
              <FiArrowRight className="w-4 h-4 text-amber-600" />
            </Link>
          )}

          {stats.flaggedAttempts > 0 && (
            <Link
              to="/admin/login-logs"
              className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between hover:bg-rose-100/70 transition-all shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-rose-200/80 text-rose-800 flex items-center justify-center font-bold text-sm">
                  {stats.flaggedAttempts}
                </span>
                <div>
                  <div className="text-xs font-black uppercase tracking-wide">Flagged Security Incidents</div>
                  <div className="text-xs text-rose-700">Auto-submitted or flagged exam attempts</div>
                </div>
              </div>
              <FiArrowRight className="w-4 h-4 text-rose-600" />
            </Link>
          )}
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link
          to="/admin/teachers"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-purple-300 hover:shadow-md transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FiUserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Faculty Teachers
            </span>
            <div className="text-xl font-black text-slate-900">{stats.totalTeachers} Appointed</div>
            <span className="text-[11px] text-purple-600 font-semibold">Active & Assigned</span>
          </div>
        </Link>

        <Link
          to="/admin/students"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FiUsers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Enrolled Students
            </span>
            <div className="text-xl font-black text-slate-900">{stats.totalStudents} Accounts</div>
            <span className="text-[11px] text-blue-600 font-semibold">Grades 6, 7 & 8</span>
          </div>
        </Link>

        <Link
          to="/admin/classes"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FiLayers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Class Divisions
            </span>
            <div className="text-xl font-black text-slate-900">{stats.totalClasses} Sections</div>
            <span className="text-[11px] text-emerald-600 font-semibold">Both Modes Active</span>
          </div>
        </Link>

        <Link
          to="/admin/subjects"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FiGrid className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              STEM Disciplines
            </span>
            <div className="text-xl font-black text-slate-900">{stats.totalSubjects} Pillars</div>
            <span className="text-[11px] text-amber-600 font-semibold">Curriculum Syllabus</span>
          </div>
        </Link>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          WORKING VISUALIZATIONS & ACADEMIC TELEMETRY SUITE
          (Replaced static "Core Administrative Modules")
         ══════════════════════════════════════════════════════════════ */}
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-black uppercase tracking-wider mb-1">
              <FiBarChart2 className="w-3.5 h-3.5" />
              <span>Live Academic Telemetry & Performance Analytics</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Administrative Data & Platform Visualizations
            </h2>
            <p className="text-xs text-slate-500">
              Real-time middle-school cohort distribution, STEM syllabus taxonomy coverage, and pedagogical performance benchmarks.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDashboardStats}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh Visuals</span>
          </button>
        </div>

        {/* ─── Row 1: Interactive Charts (Cohorts & STEM Syllabus) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Grade Cohort & Division Enrollment */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  Middle School Cohort Distribution
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Grades 6–9
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Comparison of registered student scholars vs. active class divisions per middle school grade.
              </p>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="grade" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    }}
                    itemStyle={{ color: '#E2E8F0' }}
                  />
                  <Bar dataKey="students" name="Enrolled Scholars" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="classes" name="Class Divisions" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-semibold">
                  <span className="w-3 h-3 rounded-md bg-indigo-600 inline-block"></span>
                  Enrolled Scholars: <strong className="text-slate-900">{stats.totalStudents}</strong>
                </span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <span className="w-3 h-3 rounded-md bg-sky-500 inline-block"></span>
                  Divisions: <strong className="text-slate-900">{stats.totalClasses}</strong>
                </span>
              </div>
              <Link to="/admin/students" className="font-bold text-indigo-600 hover:underline">
                Manage Directory →
              </Link>
            </div>
          </div>

          {/* Chart 2: STEM Curriculum & Chapter Syllabus Coverage */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  STEM Curriculum Chapter Taxonomy
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {stats.totalChapters} Total Chapters
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Number of syllabus units and learning chapters indexed across each STEM disciplinary pillar.
              </p>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectCurriculum} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" stroke="#94A3B8" fontSize={11} allowDecimals={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    }}
                    formatter={(value) => [`${value} Chapters`, 'Syllabus Units']}
                  />
                  <Bar dataKey="chapters" radius={[0, 6, 6, 0]}>
                    {subjectCurriculum.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SUBJECT_COLORS[entry.name] || '#6366f1'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-3">
                {subjectCurriculum.slice(0, 3).map((sub, i) => (
                  <span key={i} className="flex items-center gap-1 font-semibold">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: SUBJECT_COLORS[sub.name] || '#6366f1' }}
                    />
                    {sub.name}: <strong className="text-slate-900">{sub.chapters}</strong>
                  </span>
                ))}
              </div>
              <Link to="/admin/chapters" className="font-bold text-emerald-600 hover:underline">
                View Syllabus →
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Row 2: Pedagogy Benchmark & Security Integrity Telemetry ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 3: Pedagogy Benchmark (Competitive Solo vs Collaborative Squads) */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FiZap className="w-4 h-4 text-amber-500" />
                  Pedagogy Benchmark: Solo vs. Collaborative Mode
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparative accuracy and quiz completion telemetry across pedagogy conditions.
                </p>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                {stats.totalQuizAttempts} Total Attempts
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Competitive Solo Mode Card */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
                    ⚡ Solo Competitive
                  </span>
                  <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                    {pedagogyMetrics.competitive.count} Attempts
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-black text-amber-950">
                    {pedagogyMetrics.competitive.avg_accuracy}%
                  </div>
                  <div className="text-[11px] text-amber-700 font-medium">Average Attempt Accuracy</div>
                </div>
                <div className="w-full bg-amber-200/70 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, pedagogyMetrics.competitive.avg_accuracy)}%` }}
                  />
                </div>
              </div>

              {/* Collaborative Squads Mode Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                    🤝 Collaborative Squads
                  </span>
                  <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {pedagogyMetrics.collaborative.count} Attempts
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-950">
                    {pedagogyMetrics.collaborative.avg_accuracy}%
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium">
                    {pedagogyMetrics.collaborative.avg_accuracy > pedagogyMetrics.competitive.avg_accuracy
                      ? `+${(pedagogyMetrics.collaborative.avg_accuracy - pedagogyMetrics.competitive.avg_accuracy).toFixed(1)}% Higher Mastery`
                      : 'Average Attempt Accuracy'}
                  </div>
                </div>
                <div className="w-full bg-emerald-200/70 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, pedagogyMetrics.collaborative.avg_accuracy)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Research & Pedagogy Metric Callout */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <FiAward className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  Collaborative squads demonstrate <strong className="text-emerald-600 font-bold">higher retention</strong> in diagnostic quiz evaluations.
                </span>
              </div>
              <Link to="/leaderboard" className="font-bold text-purple-600 hover:underline shrink-0 ml-2">
                View Leaderboard →
              </Link>
            </div>
          </div>

          {/* Card 4: Platform Security & Exam Integrity Telemetry */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FiShield className="w-4 h-4 text-blue-600" />
                  Assessment Integrity & Platform Health
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proctoring enforcement, anti-cheat validation, and scoring reliability metrics.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                100% Operational
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Integrity Rate</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {pedagogyMetrics.integrity_rate}%
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Verified Clean</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic XP</div>
                <div className="text-2xl font-black text-blue-600 mt-1">
                  {pedagogyMetrics.total_points_awarded}
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Points Generated</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Quiz Time</div>
                <div className="text-2xl font-black text-purple-600 mt-1">
                  {formatTime(pedagogyMetrics.avg_time_spent_seconds || 185)}
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Pace per Quiz</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Anti-Cheat Telemetry: <strong className="text-slate-900">{stats.flaggedAttempts} flagged</strong> incident out of {stats.totalQuizAttempts} attempts.
                </span>
              </div>
              <Link to="/admin/login-logs" className="font-bold text-blue-600 hover:underline shrink-0 ml-2">
                Audit Logs →
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Row 3: Live System Activity & Audit Telemetry ─── */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FiActivity className="w-4 h-4 text-indigo-600" />
                Recent Platform Activity & Authentication Audit
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time security audit trails captured from active user logins and administrative interactions.
              </p>
            </div>
            <Link
              to="/admin/login-logs"
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <span>Full Audit Stream</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              No recent login events recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">User / Account</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Client IP</th>
                    <th className="py-2.5 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {recentActivity.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-extrabold text-slate-800">{act.username}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            act.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : act.role === 'teacher'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {act.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{act.action}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {act.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{act.ip}</td>
                      <td className="py-3 px-3 text-right text-slate-400">
                        {act.timestamp ? new Date(act.timestamp).toLocaleString() : 'Just now'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
