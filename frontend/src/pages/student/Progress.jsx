import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/api';
import { Link } from 'react-router-dom';
import {
  FiTrendingUp,
  FiAward,
  FiZap,
  FiCheckCircle,
  FiAlertCircle,
  FiBarChart2,
  FiInbox,
  FiArrowRight,
  FiClock,
  FiRotateCcw,
  FiBookOpen,
  FiTarget,
  FiXCircle,
  FiCheck,
  FiCpu,
  FiActivity,
  FiSearch
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ReferenceLine,
  Cell
} from 'recharts';

export default function StudentProgress() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [tableFilter, setTableFilter] = useState('all'); // 'all' | 'passed' | 'failed'
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    avgAccuracy: 0,
    quizzesAttempted: 0,
    quizzesPassed: 0,
    classRank: 1,
    totalPoints: 0,
  });

  const studentGrade = user?.grade ? String(user.grade) : '7';

  useEffect(() => {
    const fetchProgressData = async () => {
      setLoading(true);
      try {
        const [progressRes, dashRes, quizzesRes] = await Promise.allSettled([
          studentService.getProgress(),
          studentService.getDashboard(),
          studentService.getQuizzes(),
        ]);

        let attemptList = [];
        if (progressRes.status === 'fulfilled') {
          const raw = progressRes.value?.data?.data !== undefined ? progressRes.value.data.data : progressRes.value?.data;
          if (Array.isArray(raw)) attemptList = raw;
        }

        let dashStats = {};
        let dashUser = {};
        if (dashRes.status === 'fulfilled') {
          const dashData = dashRes.value?.data?.data !== undefined ? dashRes.value.data.data : dashRes.value?.data;
          if (dashData) {
            dashStats = dashData.stats || {};
            dashUser = dashData.student || {};
          }
        }

        let quizList = [];
        if (quizzesRes.status === 'fulfilled') {
          const rawQ = quizzesRes.value?.data?.data !== undefined ? quizzesRes.value.data.data : quizzesRes.value?.data;
          if (rawQ?.quizzes && Array.isArray(rawQ.quizzes)) {
            quizList = rawQ.quizzes;
          } else if (Array.isArray(rawQ)) {
            quizList = rawQ;
          }
        }

        setAttempts(attemptList);
        setQuizzes(quizList);

        // Compute overall accuracy across completed attempts
        let computedAccuracy = 0;
        if (dashStats.average_score !== undefined && dashStats.average_score > 0) {
          computedAccuracy = Math.round(dashStats.average_score);
        } else if (dashStats.average_accuracy !== undefined && dashStats.average_accuracy > 0) {
          computedAccuracy = Math.round(dashStats.average_accuracy);
        } else if (attemptList.length > 0) {
          const validScores = attemptList.map(a => a.score_percentage ?? a.accuracy ?? a.score ?? 0);
          computedAccuracy = Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
        }

        const passedCount = attemptList.filter(a => a.passed === true).length;

        setStats({
          avgAccuracy: computedAccuracy,
          quizzesAttempted: dashStats.quizzes_attempted ?? attemptList.length,
          quizzesPassed: dashStats.quizzes_passed ?? passedCount,
          classRank: dashStats.rank ?? 1,
          totalPoints: dashUser.points ?? user?.points ?? 0,
        });
      } catch (err) {
        console.error('Failed to load student progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [user]);

  // Unique curriculum quizzes mastered vs total
  const totalCurriculumQuizzes = quizzes.length;
  const masteredCurriculumQuizzes = quizzes.filter(q => q.passed === true).length;
  const curriculumPercentage = totalCurriculumQuizzes > 0
    ? Math.round((masteredCurriculumQuizzes / totalCurriculumQuizzes) * 100)
    : 0;

  // Find next academic target (first unlocked quiz not yet passed)
  const nextTargetQuiz = useMemo(() => {
    if (!quizzes || quizzes.length === 0) return null;
    return quizzes.find(q => !q.is_locked && !q.passed);
  }, [quizzes]);

  // Find most recent failed attempt (if any) for quick revision suggestion
  const lastFailedAttempt = useMemo(() => {
    return attempts.find(a => a.passed === false);
  }, [attempts]);

  // Format accuracy trajectory in chronological order (oldest to newest)
  const accuracyHistory = useMemo(() => {
    if (!attempts || attempts.length === 0) return [];
    // attempts is sorted newest first, so we take the latest 10 and reverse to chronological order
    const recent = [...attempts].slice(0, 10).reverse();
    return recent.map((a, i) => {
      const score = Math.round(a.score_percentage ?? a.accuracy ?? a.score ?? 0);
      const title = a.quiz_title || `Assessment ${i + 1}`;
      const shortTitle = title.length > 14 ? title.substring(0, 12) + '...' : title;
      return {
        key: a._id || i,
        attemptLabel: `Attempt ${i + 1}`,
        shortTitle,
        fullTitle: title,
        score,
        subject: a.subject_name || 'Science',
        date: a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : 'Recent',
        passed: Boolean(a.passed),
      };
    });
  }, [attempts]);

  // Subject-wise Breakdown across curriculum & attempts
  const subjectBreakdown = useMemo(() => {
    const subjectsMap = {};

    // First populate from all available quizzes in the curriculum
    quizzes.forEach(q => {
      const sub = q.subject_name || 'Science';
      if (!subjectsMap[sub]) {
        subjectsMap[sub] = {
          name: sub,
          totalQuizzes: 0,
          passedQuizzes: 0,
          scores: [],
        };
      }
      subjectsMap[sub].totalQuizzes += 1;
      if (q.passed) subjectsMap[sub].passedQuizzes += 1;
    });

    // If no quizzes loaded yet, populate from attempts
    if (Object.keys(subjectsMap).length === 0) {
      ['Science', 'Mathematics', 'Technology'].forEach(sub => {
        subjectsMap[sub] = {
          name: sub,
          totalQuizzes: 0,
          passedQuizzes: 0,
          scores: [],
        };
      });
    }

    // Populate scores from attempts
    attempts.forEach(a => {
      const sub = a.subject_name || 'Science';
      if (!subjectsMap[sub]) {
        subjectsMap[sub] = {
          name: sub,
          totalQuizzes: 0,
          passedQuizzes: 0,
          scores: [],
        };
      }
      const score = a.score_percentage ?? a.accuracy ?? a.score ?? 0;
      subjectsMap[sub].scores.push(score);
    });

    const colors = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DB2777'];

    return Object.values(subjectsMap).map((item, idx) => {
      const avgScore = item.scores.length > 0
        ? Math.round(item.scores.reduce((a, b) => a + b, 0) / item.scores.length)
        : 0;
      const completionRate = item.totalQuizzes > 0
        ? Math.round((item.passedQuizzes / item.totalQuizzes) * 100)
        : (item.scores.length > 0 ? 100 : 0);

      return {
        ...item,
        avgScore,
        completionRate,
        fillColor: colors[idx % colors.length],
      };
    });
  }, [quizzes, attempts]);

  // High performing vs focus topics
  const highPerforming = useMemo(() => {
    return attempts.filter(a => a.passed === true || (a.score_percentage ?? a.accuracy ?? 0) >= 70);
  }, [attempts]);

  const focusTopics = useMemo(() => {
    return attempts.filter(a => a.passed === false || (a.score_percentage ?? a.accuracy ?? 0) < 70);
  }, [attempts]);

  // Filtered attempts for activity table
  const filteredAttempts = useMemo(() => {
    return attempts.filter(a => {
      if (tableFilter === 'passed' && !a.passed) return false;
      if (tableFilter === 'failed' && a.passed) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (a.quiz_title || '').toLowerCase().includes(q);
        const subMatch = (a.subject_name || '').toLowerCase().includes(q);
        const chMatch = (a.chapter_name || '').toLowerCase().includes(q);
        if (!titleMatch && !subMatch && !chMatch) return false;
      }
      return true;
    });
  }, [attempts, tableFilter, searchQuery]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Loading student progress analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ─── Page Header with Cohort & Curriculum Status ─── */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold mb-2">
              <FiTarget className="w-3.5 h-3.5" />
              <span>Class {studentGrade} Academic Progression</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Learning Analytics & Mastery
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Track your STEM syllabus completion, diagnostic trajectory, and recommended revisions for Class {studentGrade}.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 self-start sm:self-auto">
            <span className="text-xs text-slate-500 font-semibold">Student Cohort:</span>
            <span className="px-2.5 py-1 rounded-xl bg-purple-600 text-white text-xs font-black shadow-xs">
              Class {studentGrade} {user?.division || 'A'}
            </span>
          </div>
        </div>

        {/* Curriculum Progress Bar */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800">
                Class {studentGrade} Curriculum Mastery:
              </span>
              <span className="text-xs font-extrabold text-purple-700">
                {masteredCurriculumQuizzes} of {totalCurriculumQuizzes || '6'} Quizzes Mastered
              </span>
            </div>
            <span className="text-xs font-black text-purple-700 bg-white px-3 py-0.5 rounded-full border border-purple-200 shadow-2xs self-start sm:self-auto">
              {curriculumPercentage}% Complete
            </span>
          </div>
          <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-purple-200/60 p-0.5">
            <div
              className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, curriculumPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── 4 Top Key Performance Indicators (KPI Cards) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Curriculum Mastery */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <FiTarget className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Curriculum Mastery
            </span>
            <div className="text-2xl font-black text-slate-900">
              {masteredCurriculumQuizzes} / {totalCurriculumQuizzes || '6'}
            </div>
            <span className="text-[11px] text-purple-700 font-semibold">
              {curriculumPercentage}% Syllabus Passed
            </span>
          </div>
        </div>

        {/* KPI 2: Overall Average Score */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FiTrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Average Score
            </span>
            <div className="text-2xl font-black text-slate-900">{stats.avgAccuracy}%</div>
            <span className="text-[11px] font-semibold text-slate-500">
              {stats.avgAccuracy >= 70 ? (
                <span className="text-emerald-600 font-bold">Above 70% Benchmark ✅</span>
              ) : (
                <span className="text-amber-600 font-bold">70% Passing Threshold</span>
              )}
            </span>
          </div>
        </div>

        {/* KPI 3: Total Points Earned */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FiAward className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total STEM Points
            </span>
            <div className="text-2xl font-black text-amber-600">{stats.totalPoints} Pts</div>
            <Link
              to="/student/leaderboard"
              className="text-[11px] text-purple-600 font-bold hover:underline"
            >
              Class Rank #{stats.classRank} →
            </Link>
          </div>
        </div>

        {/* KPI 4: Total Attempts & Pass Rate */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FiZap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Test Evaluations
            </span>
            <div className="text-2xl font-black text-slate-900">
              {stats.quizzesAttempted}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">
              {stats.quizzesAttempted > 0
                ? `${Math.round((stats.quizzesPassed / stats.quizzesAttempted) * 100)}% Pass Rate`
                : 'No tests taken yet'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Current Academic Target / Recommended Next Step Banner ─── */}
      {nextTargetQuiz ? (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider backdrop-blur-xs">
              <FiTarget className="w-3.5 h-3.5" />
              <span>Current Learning Target</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {nextTargetQuiz.title}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 max-w-xl">
              {nextTargetQuiz.chapter_name ? `${nextTargetQuiz.chapter_name} • ` : ''}
              {nextTargetQuiz.subject_name || 'STEM'} • Passing threshold: {nextTargetQuiz.passing_percentage || 70}%. Pass this quiz to advance to the next chapter.
            </p>
          </div>

          <div className="z-10 shrink-0">
            <Link
              to={`/student/quiz/${nextTargetQuiz._id}`}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-purple-50 text-purple-900 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-md hover:shadow-xl transition-all cursor-pointer"
            >
              <span>Start Assessment</span>
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : lastFailedAttempt ? (
        <div className="p-6 rounded-3xl bg-amber-500/10 border-2 border-amber-400/40 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <FiAlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 block">
                Recommended Revision
              </span>
              <h3 className="text-base font-black text-slate-900">
                Retake {lastFailedAttempt.quiz_title}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Last score: {Math.round(lastFailedAttempt.score_percentage ?? 0)}%. You can retake this assessment to reach the 70% passing threshold and boost your points.
              </p>
            </div>
          </div>
          {lastFailedAttempt.quiz_id && (
            <Link
              to={`/student/quiz/${lastFailedAttempt.quiz_id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors self-start md:self-auto shrink-0"
            >
              <FiRotateCcw className="w-3.5 h-3.5" />
              <span>Retake Now</span>
            </Link>
          )}
        </div>
      ) : totalCurriculumQuizzes > 0 && masteredCurriculumQuizzes >= totalCurriculumQuizzes ? (
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <FiCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black">All Class {studentGrade} Assessments Mastered!</h3>
            <p className="text-xs text-emerald-700 mt-0.5">
              Outstanding work! You have successfully passed all assigned STEM quizzes for this grade. Check the Leaderboard to see your overall ranking!
            </p>
          </div>
        </div>
      ) : null}

      {/* ─── Subject-wise Progress & Mastery Grid ─── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FiBookOpen className="w-5 h-5 text-purple-600" />
            <span>Subject-wise Syllabus Progress</span>
          </h2>
          <p className="text-xs text-slate-500">
            Assessments completed and diagnostic performance broken down by STEM discipline
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjectBreakdown.map((sub) => {
            const isMastered = sub.totalQuizzes > 0 && sub.passedQuizzes >= sub.totalQuizzes;
            const hasStarted = sub.passedQuizzes > 0 || sub.scores.length > 0;

            return (
              <div
                key={sub.name}
                className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-900">{sub.name}</span>
                    {isMastered ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        Mastered
                      </span>
                    ) : hasStarted ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        In Progress
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-baseline justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Mastery Score:</span>
                    <strong className="text-slate-900 font-black text-sm">
                      {sub.avgScore > 0 ? `${sub.avgScore}%` : 'Not attempted'}
                    </strong>
                  </div>

                  <div className="flex items-baseline justify-between text-xs text-slate-500 mt-1">
                    <span>Quizzes Passed:</span>
                    <span className="font-bold text-slate-800">
                      {sub.passedQuizzes} / {sub.totalQuizzes || '—'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, sub.completionRate)}%`,
                        backgroundColor: sub.fillColor,
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-right text-slate-400 font-semibold">
                    {sub.completionRate}% syllabus passed
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto my-6">
          <FiInbox className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Assessment Records Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Take your assigned STEM chapter quizzes to see your accuracy charts, subject breakdown, and learning trajectory.
          </p>
          <Link
            to="/student/quizzes"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <span>Start an Assessment</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <>
          {/* ─── Visual Charts Row ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Accuracy Progression */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <FiTrendingUp className="w-4 h-4 text-purple-600" />
                    <span>Assessment Score Progression</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Chronological score trajectory across recent evaluations
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                  Passing: 70%
                </span>
              </div>

              <div className="h-64 w-full">
                {accuracyHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={accuracyHistory} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="attemptLabel" stroke="#94A3B8" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={11} unit="%" />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-lg space-y-1">
                                <div className="font-bold">{data.fullTitle}</div>
                                <div className="text-slate-300 text-[11px]">{data.subject} • {data.date}</div>
                                <div className="text-purple-300 font-extrabold text-sm pt-0.5">
                                  Score: {data.score}%
                                </div>
                                <div className={`text-[10px] font-black uppercase ${data.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {data.passed ? '✓ Passed' : '✗ Below Passing Benchmark'}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine
                        y={70}
                        stroke="#EF4444"
                        strokeDasharray="4 4"
                        label={{
                          value: 'Benchmark (70%)',
                          fill: '#EF4444',
                          fontSize: 10,
                          position: 'top',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#7C3AED"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#7C3AED' }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Trajectory will show after tests are completed.
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Subject Mastery Benchmark */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <FiBarChart2 className="w-4 h-4 text-blue-600" />
                    <span>Subject Mastery Benchmarks</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Aggregate diagnostic accuracy across STEM disciplines
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
                  Target: ≥ 70%
                </span>
              </div>

              <div className="h-64 w-full">
                {subjectBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={subjectBreakdown.map(s => ({
                        subject: s.name,
                        mastery: s.avgScore,
                        fillColor: s.fillColor,
                        passedCount: s.passedQuizzes,
                        totalCount: s.totalQuizzes,
                      }))}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="subject" stroke="#94A3B8" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={11} unit="%" />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-lg space-y-1">
                                <div className="font-bold">{data.subject}</div>
                                <div className="text-purple-300 font-extrabold text-sm">
                                  Mastery: {data.mastery}%
                                </div>
                                <div className="text-slate-300 text-[10px]">
                                  {data.passedCount} of {data.totalCount || '—'} Tests Passed
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine
                        y={70}
                        stroke="#EF4444"
                        strokeDasharray="4 4"
                        label={{
                          value: 'Passing (70%)',
                          fill: '#EF4444',
                          fontSize: 10,
                          position: 'top',
                        }}
                      />
                      <Bar dataKey="mastery" radius={[8, 8, 0, 0]}>
                        {subjectBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fillColor} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Subject mastery data will calculate as you take more quizzes.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Strengths & Revision Focus Cards ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mastered Units */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <FiCheckCircle className="w-4 h-4" />
                  <span>Mastered Assessments (Passing Benchmark Met)</span>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  {highPerforming.length}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {highPerforming.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 italic text-center">
                    No passing scores recorded yet. Retake tests to master concepts!
                  </div>
                ) : (
                  highPerforming.slice(0, 4).map((a, i) => (
                    <div
                      key={a._id || i}
                      className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-emerald-950 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold block text-slate-900">{a.quiz_title}</span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          {a.subject_name || 'Science'} • +{a.points_earned || 0} Points
                        </span>
                      </div>
                      <span className="font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg text-xs">
                        {Math.round(a.score_percentage ?? a.accuracy ?? 0)}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Revision Suggested */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  <FiAlertCircle className="w-4 h-4" />
                  <span>Recommended for Revision (Below Passing Threshold)</span>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700">
                  {focusTopics.length}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {focusTopics.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-emerald-700 font-medium text-center">
                    🎉 Excellent work! All your completed assessments meet or exceed the passing benchmark.
                  </div>
                ) : (
                  focusTopics.slice(0, 4).map((a, i) => (
                    <div
                      key={a._id || i}
                      className="p-3 rounded-2xl bg-rose-50/50 border border-rose-200 text-rose-950 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold block text-slate-900">{a.quiz_title}</span>
                        <span className="text-[11px] text-rose-600 font-medium">
                          Score: {Math.round(a.score_percentage ?? a.accuracy ?? 0)}% • Needs Retake
                        </span>
                      </div>
                      {a.quiz_id && (
                        <Link
                          to={`/student/quiz/${a.quiz_id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors"
                        >
                          <FiRotateCcw className="w-3 h-3" />
                          <span>Retake</span>
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ─── Detailed Assessment Activity Table with Search & Filters ─── */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Recent Assessments Activity Log ({attempts.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete chronological history of tests submitted in Class {studentGrade}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <FiSearch className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search test..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Filter buttons */}
                <div className="inline-flex rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setTableFilter('all')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      tableFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableFilter('passed')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      tableFilter === 'passed'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-emerald-700'
                    }`}
                  >
                    Passed
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableFilter('failed')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      tableFilter === 'failed'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-rose-700'
                    }`}
                  >
                    Failed
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6">Assessment Title</th>
                    <th className="py-3.5 px-6">Subject</th>
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6">Time Taken</th>
                    <th className="py-3.5 px-6">Score</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                        No assessments match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAttempts.slice(0, 8).map((r, idx) => {
                      const isPassed = Boolean(r.passed);
                      const pct = Math.round(r.score_percentage ?? r.accuracy ?? 0);
                      const rawTime = r.time_taken_seconds ?? 0;
                      const timeStr = rawTime > 0 ? `${Math.floor(rawTime / 60)}m ${rawTime % 60}s` : '1m';

                      return (
                        <tr key={r._id || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-6 font-bold text-slate-900">
                            <div>{r.quiz_title}</div>
                            {r.chapter_name && (
                              <div className="text-[11px] text-slate-400 font-normal">
                                {r.chapter_name}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-xs text-slate-600">
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 font-bold text-[11px]">
                              {r.subject_name || 'Science'}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-xs text-slate-500">
                            {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : 'Recent'}
                          </td>
                          <td className="py-3.5 px-6 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <FiClock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{timeStr}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6">
                            <span className="font-bold text-slate-900 block">
                              {r.correct_answers !== undefined ? `${r.correct_answers}/${r.total_questions || 18} Correct` : `${r.score} Pts`}
                            </span>
                            <span className={`text-xs font-black ${isPassed ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {pct}%
                            </span>
                          </td>
                          <td className="py-3.5 px-6">
                            {isPassed ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <FiCheckCircle className="w-3 h-3" />
                                Passed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <FiXCircle className="w-3 h-3" />
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            {r.quiz_id ? (
                              <Link
                                to={`/student/quiz/${r.quiz_id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 shadow-2xs transition-colors"
                              >
                                <FiRotateCcw className="w-3 h-3" />
                                <span>Retake</span>
                              </Link>
                            ) : (
                              <Link
                                to="/student/quizzes"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold border border-slate-200"
                              >
                                <span>Quizzes</span>
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
