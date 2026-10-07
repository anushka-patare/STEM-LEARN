import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentService, leaderboardService } from '../../services/api';
import {
  FiAward,
  FiBook,
  FiTrendingUp,
  FiUsers,
  FiCheckCircle,
  FiArrowRight,
  FiClock,
  FiPlay,
  FiZap,
  FiBarChart2,
  FiLock,
  FiBookOpen
} from 'react-icons/fi';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [learningPaths, setLearningPaths] = useState([]);
  const [topSquads, setTopSquads] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [dashRes, pathRes, squadRes] = await Promise.allSettled([
          studentService.getDashboard(),
          studentService.getLearningPaths(),
          leaderboardService.getTeam(),
        ]);

        if (dashRes.status === 'fulfilled' && dashRes.value.data) {
          const payload = dashRes.value.data?.data || dashRes.value.data;
          setDashboardData(payload);
        }

        if (pathRes.status === 'fulfilled' && pathRes.value.data) {
          const pList = pathRes.value.data?.data || (Array.isArray(pathRes.value.data) ? pathRes.value.data : []);
          setLearningPaths(Array.isArray(pList) ? pList : []);
        }

        if (squadRes.status === 'fulfilled' && squadRes.value.data) {
          const sList = squadRes.value.data?.data || (Array.isArray(squadRes.value.data) ? squadRes.value.data : []);
          setTopSquads(Array.isArray(sList) ? sList.slice(0, 3) : []);
        }
      } catch (err) {
        console.warn('Dashboard data fetch warning:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  const stats = [
    {
      label: 'My Total Points',
      value: dashboardData?.stats?.points ?? dashboardData?.student?.points ?? user?.points ?? 0,
      icon: FiZap,
      color: 'amber',
      sub: `${dashboardData?.stats?.quizzes_passed ?? 0} quizzes passed`,
    },
    {
      label: 'Class Rank',
      value: `#${dashboardData?.stats?.rank ?? '1'}`,
      icon: FiAward,
      color: 'blue',
      sub: `Grade ${user?.grade || '6'} Standings`,
    },
    {
      label: 'Quiz Accuracy',
      value: `${dashboardData?.stats?.average_accuracy ?? dashboardData?.stats?.average_score ?? 0}%`,
      icon: FiTrendingUp,
      color: 'emerald',
      sub: `Across ${dashboardData?.stats?.quizzes_attempted ?? 0} attempts`,
    },
    {
      label: 'My Squad Team',
      value: dashboardData?.team?.name || 'No Squad Assigned',
      icon: FiUsers,
      color: 'purple',
      sub: dashboardData?.team?.code ? `Code: ${dashboardData.team.code}` : 'Ask teacher to assign',
    },
  ];

  return (
    <div className="space-y-8">
      {/* ─── Top Welcome Banner ─── */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Grade {user?.grade || '7'}-{user?.division || 'A'} Explorer
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {user?.full_name || 'Student'}! 🚀
            </h1>
            <p className="text-white/80 text-sm max-w-xl">
              Ready to challenge your STEM skills today? Solve new quizzes, help your squad climb the leaderboard, or ask the AI assistant for hints!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/student/quizzes"
              className="stem-btn bg-white hover:bg-slate-100 text-blue-700 py-2.5 px-5 text-xs font-extrabold flex items-center gap-2 shadow-md shadow-black/10"
            >
              <FiPlay className="w-3.5 h-3.5" />
              <span>Take Quiz</span>
            </Link>
            <Link
              to="/student/team"
              className="stem-btn bg-white/20 hover:bg-white/30 text-white py-2.5 px-5 text-xs font-bold flex items-center gap-2 border border-white/30 backdrop-blur-xs"
            >
              <FiUsers className="w-3.5 h-3.5" />
              <span>Squad Hub</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 4 Metric Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center gap-4"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  s.color === 'amber'
                    ? 'bg-amber-50 text-amber-600'
                    : s.color === 'blue'
                    ? 'bg-blue-50 text-blue-600'
                    : s.color === 'emerald'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-purple-50 text-purple-600'
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                  {s.label}
                </span>
                <div className="text-xl font-black text-slate-900 truncate">
                  {s.value}
                </div>
                <span className="text-[11px] text-slate-500 font-medium block truncate">
                  {s.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Two Columns: Current Path & Available Quizzes ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Active Learning Path Progress */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            {learningPaths.length > 0 ? (
              (() => {
                const currentPath = learningPaths[0];
                const quizzes = currentPath.quizzes || [];
                const completedCount = quizzes.filter(q => q.completed).length;
                const progressPct = quizzes.length > 0 ? Math.round((completedCount / quizzes.length) * 100) : 0;

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
                          Current Learning Path
                        </span>
                        <h3 className="text-lg font-black text-slate-900">
                          {currentPath.title || `Grade ${user?.grade || '7'} STEM Pathway`}
                        </h3>
                      </div>
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {progressPct}% Completed
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {/* Quizzes/Chapters In This Module */}
                    <div className="space-y-2.5 pt-2">
                      {quizzes.length > 0 ? (
                        quizzes.slice(0, 4).map((q, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                              q.completed
                                ? 'bg-emerald-50/70 border-emerald-200/70 text-slate-800'
                                : idx === completedCount
                                ? 'bg-blue-50/70 border-blue-200/70 text-slate-900'
                                : 'bg-slate-50 border-slate-100 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {q.completed ? (
                                <FiCheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : idx === completedCount ? (
                                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping shrink-0" />
                              ) : (
                                <FiLock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                              )}
                              <span className="font-semibold truncate">
                                {q.title || `Assessment Module ${idx + 1}`}
                              </span>
                            </div>
                            {q.completed ? (
                              <span className="text-emerald-600 font-bold">Passed</span>
                            ) : idx === completedCount ? (
                              <Link
                                to={`/student/quiz/${q.quiz_id || q._id || ''}`}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
                              >
                                Take Quiz
                              </Link>
                            ) : (
                              <span>Locked</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic py-2">No quiz modules added to this pathway yet.</p>
                      )}
                    </div>
                  </>
                );
              })()
            ) : (
              <div className="py-6 text-center space-y-3">
                <FiBookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800">No Active Learning Path Assigned</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Your teachers will sequence prerequisite STEM modules for your grade.
                  </p>
                </div>
                <Link
                  to="/student/quizzes"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors"
                >
                  <FiPlay className="w-3.5 h-3.5" />
                  <span>Browse Available Quizzes</span>
                </Link>
              </div>
            )}

            <div className="pt-2 text-right">
              <Link
                to="/student/learning"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1.5"
              >
                <span>View All Curriculum Units</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Leaderboard Quick Glance */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Live Squad Leaderboard
              </h3>
              <Link
                to="/student/leaderboard"
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Full Standings
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              {topSquads.length > 0 ? (
                topSquads.map((squad, idx) => {
                  const isUserTeam = squad.team_id === user?.team_id || squad._id === user?.team_id;
                  return (
                    <div
                      key={squad.team_id || squad._id || idx}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        idx === 0
                          ? 'bg-amber-50/80 border-amber-200/60'
                          : isUserTeam
                          ? 'bg-blue-50/80 border-blue-200/60'
                          : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full font-black flex items-center justify-center text-[11px] ${
                            idx === 0
                              ? 'bg-amber-400 text-amber-950'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">
                            {squad.name || squad.team_name || `Squad ${idx + 1}`}
                            {isUserTeam && <span className="text-[10px] text-blue-600 font-extrabold ml-1.5">(My Squad)</span>}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {squad.member_count ?? squad.members_count ?? 4} members • Collaborative
                          </div>
                        </div>
                      </div>
                      <span className={`font-black ${idx === 0 ? 'text-amber-800' : 'text-slate-800'}`}>
                        {squad.score ?? squad.total_points ?? 0} Pts
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-slate-400 space-y-1">
                  <FiUsers className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-600">No Squad Standings Yet</p>
                  <p className="text-[11px] text-slate-400">Team rankings will update once collaborative quizzes are taken.</p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Link
                to="/student/leaderboard"
                className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 border border-slate-200/80 transition-all"
              >
                <FiBarChart2 className="w-4 h-4 text-blue-600" />
                <span>Switch to Competitive Solo Ranks</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
