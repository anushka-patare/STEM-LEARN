import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { teacherService, quizService } from '../../services/api';
import {
  FiUsers,
  FiFileText,
  FiTrendingUp,
  FiAward,
  FiBarChart2,
  FiPlusCircle,
  FiPlus,
  FiLayers,
  FiArrowRight,
  FiInbox
} from 'react-icons/fi';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assignedClasses: 0,
    totalStudents: 0,
    activeQuizzes: 0,
    totalAttempts: 0,
    classesList: [],
  });
  const [recentQuizzes, setRecentQuizzes] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [dashRes, quizRes] = await Promise.allSettled([
          teacherService.getDashboard(),
          quizService.getAll({ limit: 5 }),
        ]);

        if (dashRes.status === 'fulfilled') {
          const d = dashRes.value?.data?.data || dashRes.value?.data || {};
          setStats({
            assignedClasses: d.assigned_classes ?? 0,
            totalStudents: d.total_students ?? 0,
            activeQuizzes: d.active_quizzes ?? 0,
            totalAttempts: d.total_attempts ?? 0,
            classesList: Array.isArray(d.classes_list) ? d.classes_list : [],
          });
        }

        if (quizRes.status === 'fulfilled') {
          const qData = quizRes.value?.data?.data?.quizzes || (Array.isArray(quizRes.value?.data?.data) ? quizRes.value.data.data : (Array.isArray(quizRes.value?.data) ? quizRes.value.data : []));
          if (Array.isArray(qData)) {
            setRecentQuizzes(qData.slice(0, 5));
          }
        }
      } catch (err) {
        console.error('Failed to load teacher dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  const classNamesText = stats.classesList.length > 0
    ? stats.classesList.map(c => `${c.grade || ''}${c.division ? '-' + c.division : ''}`).join(', ')
    : 'No active classes assigned';

  return (
    <div className="space-y-8">
      {/* Faculty Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              STEM Faculty Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome, Professor {user?.full_name || 'Faculty'}! 🎓
            </h1>
            <p className="text-white/80 text-sm max-w-xl">
              Subject Specialization: <strong>{user?.subject_specialization || 'Integrated STEM & Science'}</strong>. Managing middle-school experimental cohorts and question banks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/teacher/quizzes?action=create"
              className="stem-btn bg-white hover:bg-slate-100 text-emerald-800 py-2.5 px-5 text-xs font-extrabold flex items-center gap-2 shadow-md shadow-black/10"
            >
              <FiPlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Add Manual Quiz</span>
            </Link>
            <Link
              to="/teacher/quizzes"
              className="stem-btn bg-emerald-800/80 hover:bg-emerald-900 text-white py-2.5 px-5 text-xs font-bold flex items-center gap-2 border border-white/20"
            >
              <FiFileText className="w-4 h-4 text-emerald-300" />
              <span>All Quizzes</span>
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold">Loading faculty metrics...</p>
        </div>
      ) : (
        <>
          {/* 4 Core Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FiLayers className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Assigned Classes
                </span>
                <div className="text-xl font-black text-slate-900">{stats.assignedClasses} Divisions</div>
                <span className="text-[11px] text-slate-500 font-medium truncate block max-w-[150px]">
                  {classNamesText}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FiUsers className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Active Students
                </span>
                <div className="text-xl font-black text-slate-900">{stats.totalStudents} Enrolled</div>
                <span className="text-[11px] text-blue-600 font-semibold">In Cohorts</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <FiFileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Active Quizzes
                </span>
                <div className="text-xl font-black text-slate-900">{stats.activeQuizzes} Published</div>
                <span className="text-[11px] text-purple-600 font-semibold">Live in curriculum</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <FiTrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quiz Attempts
                </span>
                <div className="text-xl font-black text-slate-900">{stats.totalAttempts} Submissions</div>
                <span className="text-[11px] text-emerald-600 font-semibold">Logged Attempts</span>
              </div>
            </div>
          </div>

          {/* Recent Quizzes & Research Snapshot */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Recent Class Assessments */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Recent Class Assessments
                  </h3>
                  <p className="text-xs text-slate-400">
                    Track completion status and manage competitive vs. collaborative quiz settings
                  </p>
                </div>
                <Link
                  to="/teacher/quizzes"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <span>Manage Quizzes</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentQuizzes.length === 0 ? (
                <div className="py-12 text-center">
                  <FiInbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No quizzes created yet</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Get started by creating your first manual quiz.
                  </p>
                  <Link
                    to="/teacher/quizzes?action=create"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    <FiPlusCircle className="w-3.5 h-3.5" />
                    <span>Add Manual Quiz</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentQuizzes.map((q) => {
                    const isCollab = q.gamification_mode === 'collaborative' || q.mode === 'collaborative';
                    return (
                      <div
                        key={q._id}
                        className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900 text-sm">{q.title}</span>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                isCollab
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {isCollab ? 'Collaborative' : 'Competitive'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              q.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {q.status}
                            </span>
                          </div>
                          <div className="text-slate-500">
                            Subject: <strong>{q.subject_name || q.subject || 'STEM'}</strong>
                            {q.target_class && ` • Class Cohort: ${q.target_class}`}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-left sm:text-right">
                            <div className="font-bold text-slate-800">{q.question_count || 0} Questions</div>
                            <div className="text-[11px] text-slate-400">
                              {q.time_limit ? `${q.time_limit} mins` : 'No time limit'}
                            </div>
                          </div>

                          <Link
                            to="/teacher/performance"
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
                          >
                            View Stats
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Quick Educator Actions */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <h3 className="text-base font-black text-slate-900">
                  Quick Actions
                </h3>

                <div className="space-y-2.5">
                  <Link
                    to="/teacher/quizzes?action=create"
                    className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/70 flex items-center justify-between text-xs font-bold text-emerald-900 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <FiPlusCircle className="w-5 h-5 text-emerald-600" />
                      <span>Add Manual Quiz</span>
                    </div>
                    <FiArrowRight className="w-4 h-4 text-emerald-600" />
                  </Link>

                  <Link
                    to="/teacher/teams"
                    className="w-full p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/70 flex items-center justify-between text-xs font-bold text-purple-900 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <FiUsers className="w-5 h-5 text-purple-600" />
                      <span>Manage Collaborative Squads</span>
                    </div>
                    <FiArrowRight className="w-4 h-4 text-purple-600" />
                  </Link>

                  <Link
                    to="/teacher/classes"
                    className="w-full p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/70 flex items-center justify-between text-xs font-bold text-blue-900 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <FiLayers className="w-5 h-5 text-blue-600" />
                      <span>View My Classes</span>
                    </div>
                    <FiArrowRight className="w-4 h-4 text-blue-600" />
                  </Link>

                  <Link
                    to="/teacher/performance"
                    className="w-full p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 flex items-center justify-between text-xs font-bold text-emerald-900 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <FiTrendingUp className="w-5 h-5 text-emerald-600" />
                      <span>Student Academic Performance</span>
                    </div>
                    <FiArrowRight className="w-4 h-4 text-emerald-600" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
