import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiAward,
  FiUsers,
  FiUser,
  FiTrendingUp,
  FiTarget,
  FiShield,
  FiCheckCircle,
  FiStar,
  FiZap,
  FiActivity,
  FiLayers,
  FiChevronRight,
  FiX,
  FiInfo,
  FiRefreshCw,
  FiCompass
} from 'react-icons/fi';
import { leaderboardService, pageService } from '../../services/api';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('top10'); // 'top10', 'classwise', 'teamwise'
  const [activeGrade, setActiveGrade] = useState('7');
  const [teamGradeFilter, setTeamGradeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Data state
  const [leaderboardData, setLeaderboardData] = useState({
    top10: [],
    class_wise: { '6': [], '7': [], '8': [] },
    team_wise: [],
    metrics: {
      total_scholars: 0,
      total_squads: 0,
      total_quizzes_completed: 0,
      average_accuracy: 0,
      top_student: null,
      top_squad: null,
    },
    settings: {
      spotlight_enabled: true,
      spotlight_badge: '★ Academic Spotlight',
      spotlight_title: 'Middle School STEM Excellence Showcase',
      spotlight_text: 'Live rankings update in real-time as students solve calibrated quizzes in science, technology, engineering, and mathematics.',
    }
  });

  // CMS Content
  const [cmsContent, setCmsContent] = useState({
    badge: 'Live Academic Telemetry & Rankings',
    title: 'STEMLearn Hall of Fame & Leaderboards',
    subtitle: 'Celebrating top middle-school students, class toppers, and collaborative STEM squads across Grades 6, 7 & 8.',
    top10_title: 'Global Top 10 Scholars',
    top10_desc: 'The highest-performing students across all participating middle school divisions.',
    classwise_title: 'Class & Division Toppers',
    classwise_desc: 'Top ranking students segmented by Grade 6, Grade 7, and Grade 8 cohorts.',
    teamwise_title: 'Collaborative STEM Squads',
    teamwise_desc: 'Team-based leaderboard evaluating cooperative synergy, joint quizzes, and squad points.',
    rules_title: 'Leaderboard Fairness & Scoring Rules',
    rules_p1: 'Scoring is governed by calibrated quiz difficulty, completion speed, and zero tolerance for anti-cheat anomalies.',
  });

  // Modal State for Full Details
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSquad, setSelectedSquad] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resLb, resCms] = await Promise.allSettled([
        leaderboardService.getPublicOverview(),
        pageService.getPageContent('leaderboard')
      ]);

      if (resLb.status === 'fulfilled' && resLb.value?.data?.success) {
        setLeaderboardData(resLb.value.data.data);
      }
      if (resCms.status === 'fulfilled' && resCms.value?.data?.success && resCms.value.data.data) {
        setCmsContent((prev) => ({ ...prev, ...resCms.value.data.data }));
      }
    } catch (err) {
      console.error('Failed to load leaderboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const { top10, class_wise, team_wise, metrics, settings } = leaderboardData;

  const currentClassStudents = class_wise[activeGrade] || [];
  const filteredSquads = team_wise.filter((t) =>
    teamGradeFilter === 'all' ? true : String(t.grade) === String(teamGradeFilter)
  );

  return (
    <div className="w-full py-12 lg:py-20 bg-slate-50 min-h-screen">
      <div className="stem-container">
        {/* ─── Page Hero Header ─── */}
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 text-blue-900 text-xs font-bold uppercase tracking-wider shadow-xs">
            <FiAward className="w-4 h-4 text-amber-500 animate-bounce" />
            <span>{cmsContent.badge}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            {cmsContent.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {cmsContent.subtitle}
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh Standings</span>
            </button>
          </div>
        </div>

        {/* ─── Spotlight Announcement (If Enabled by Admin) ─── */}
        {settings.spotlight_enabled && (
          <div className="mb-12 max-w-4xl mx-auto rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5">
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-extrabold uppercase tracking-wider">
                  {settings.spotlight_badge || cmsContent.badge}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {settings.spotlight_title || 'Weekly STEM Champion Showcase'}
                </h3>
                <p className="text-white/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  {settings.spotlight_text}
                </p>
              </div>

              {metrics.top_student && (
                <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-4 text-center shrink-0 w-full sm:w-auto">
                  <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">Current #1 Scholar</div>
                  <div className="text-base font-extrabold text-white mt-0.5">{metrics.top_student.full_name}</div>
                  <div className="text-xs text-white/80 font-medium">
                    Grade {metrics.top_student.grade} • {metrics.top_student.points} pts
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Metric Highlights Grid ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FiUser className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{metrics.total_scholars}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ranked Scholars</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <FiUsers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{metrics.total_squads}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Squads</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FiAward className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">
                {metrics.top_student ? `${metrics.top_student.points} pts` : '500 pts'}
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Peak Benchmark</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FiTarget className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{metrics.average_accuracy}%</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform Accuracy</div>
            </div>
          </div>
        </div>

        {/* ─── Main Category Tab Navigation ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 pb-4 mb-8 gap-4">
          <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('top10')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'top10'
                  ? 'bg-white text-blue-600 shadow-md scale-102'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FiAward className="w-4 h-4" />
              <span>Global Top 10</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('classwise')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'classwise'
                  ? 'bg-white text-blue-600 shadow-md scale-102'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FiLayers className="w-4 h-4" />
              <span>Class-Wise Rankings</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('teamwise')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'teamwise'
                  ? 'bg-white text-blue-600 shadow-md scale-102'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FiUsers className="w-4 h-4" />
              <span>Collaborative Squads</span>
            </button>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            {activeTab === 'top10' && cmsContent.top10_desc}
            {activeTab === 'classwise' && cmsContent.classwise_desc}
            {activeTab === 'teamwise' && cmsContent.teamwise_desc}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            TAB 1: GLOBAL TOP 10 LEADERBOARD
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'top10' && (
          <div className="space-y-10">
            {/* If 0 students registered */}
            {top10.length === 0 && (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-500 shadow-sm">
                <FiInfo className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <h4 className="text-base font-bold text-slate-800">No Student Scores in Database Yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Registered students will appear here in real-time as they solve quizzes and earn points.
                </p>
                <div className="mt-4">
                  <Link
                    to="/student/register"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
                  >
                    <span>Register New Student</span>
                    <FiChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* If exactly 1 student */}
            {top10.length === 1 && (
              <div className="max-w-md mx-auto pt-4">
                <div className="bg-gradient-to-b from-amber-50/80 via-white to-amber-50/30 rounded-3xl p-7 border-2 border-amber-300 shadow-xl relative text-center hover:shadow-2xl transition-all">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black flex items-center justify-center text-lg shadow-md border-2 border-white">
                    👑 #1
                  </div>
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black text-3xl flex items-center justify-center mx-auto mb-3 shadow-md">
                    {top10[0].full_name?.charAt(0)}
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                    Global Champion
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">{top10[0].full_name}</h3>
                  <div className="text-xs text-slate-500 font-semibold">
                    Grade {top10[0].grade} {top10[0].division ? `• Division ${top10[0].division}` : ''}
                  </div>
                  <div className="mt-4 py-2.5 px-6 rounded-2xl bg-amber-100/80 border border-amber-300 inline-block font-black text-amber-950 text-xl shadow-xs">
                    {top10[0].points} pts
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-amber-200/60 text-xs text-slate-600 font-semibold">
                    <div>Accuracy: <strong className="text-slate-900">{top10[0].accuracy}%</strong></div>
                    <div>Streak: <strong className="text-amber-700 font-bold">{top10[0].streak}d 🔥</strong></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(top10[0])}
                    className="mt-4 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md transition-colors cursor-pointer"
                  >
                    View Full Details
                  </button>
                </div>
              </div>
            )}

            {/* If exactly 2 students */}
            {top10.length === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto gap-6 pt-4">
                {/* 🥇 Rank 1 */}
                <div className="bg-gradient-to-b from-amber-50/80 via-white to-amber-50/30 rounded-3xl p-7 border-2 border-amber-300 shadow-xl relative text-center hover:shadow-2xl transition-all">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black flex items-center justify-center text-lg shadow-md border-2 border-white">
                    👑 #1
                  </div>
                  <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black text-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
                    {top10[0].full_name?.charAt(0)}
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                    Global Champion
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">{top10[0].full_name}</h3>
                  <div className="text-xs text-slate-500 font-semibold">
                    Grade {top10[0].grade} {top10[0].division ? `• Division ${top10[0].division}` : ''}
                  </div>
                  <div className="mt-4 py-2 px-5 rounded-2xl bg-amber-100/80 border border-amber-300 inline-block font-black text-amber-950 text-lg shadow-xs">
                    {top10[0].points} pts
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-amber-200/60 text-xs text-slate-600 font-semibold">
                    <div>Accuracy: <strong className="text-slate-900">{top10[0].accuracy}%</strong></div>
                    <div>Streak: <strong className="text-amber-700 font-bold">{top10[0].streak}d 🔥</strong></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(top10[0])}
                    className="mt-4 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md transition-colors cursor-pointer"
                  >
                    View Full Details
                  </button>
                </div>

                {/* 🥈 Rank 2 */}
                <div className="bg-white rounded-3xl p-7 border-2 border-slate-200 shadow-md relative text-center hover:shadow-xl transition-all">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-700 font-black flex items-center justify-center text-sm shadow-sm">
                    #2
                  </div>
                  <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-400 text-slate-800 font-black text-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                    {top10[1].full_name?.charAt(0)}
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Silver Scholar</div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">{top10[1].full_name}</h3>
                  <div className="text-xs text-slate-500 font-semibold">
                    Grade {top10[1].grade} {top10[1].division ? `• Division ${top10[1].division}` : ''}
                  </div>
                  <div className="mt-4 py-2 px-5 rounded-xl bg-slate-50 border border-slate-200 inline-block font-black text-slate-800 text-lg">
                    {top10[1].points} pts
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-semibold">
                    <div>Accuracy: <strong className="text-slate-800">{top10[1].accuracy}%</strong></div>
                    <div>Streak: <strong className="text-slate-800">{top10[1].streak}d</strong></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(top10[1])}
                    className="mt-4 w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    View Full Details
                  </button>
                </div>
              </div>
            )}

            {/* If 3 or more students: full 3-column podium */}
            {top10.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6">
                {/* 🥈 Rank 2 */}
                <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-md order-2 md:order-1 relative text-center hover:shadow-xl transition-all">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-700 font-black flex items-center justify-center text-sm shadow-sm">
                    #2
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-400 text-slate-800 font-black text-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                    {top10[1].full_name?.charAt(0)}
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Silver Scholar</div>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">{top10[1].full_name}</h3>
                  <div className="text-xs text-slate-500 font-semibold">
                    Grade {top10[1].grade} {top10[1].division ? `• Division ${top10[1].division}` : ''}
                  </div>
                  <div className="mt-4 py-2 px-4 rounded-xl bg-slate-50 border border-slate-200 inline-block font-black text-slate-800 text-base">
                    {top10[1].points} pts
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-semibold">
                    <div>Accuracy: <strong className="text-slate-800">{top10[1].accuracy}%</strong></div>
                    <div>Streak: <strong className="text-slate-800">{top10[1].streak}d</strong></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(top10[1])}
                    className="mt-4 w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    View Full Details
                  </button>
                </div>

                {/* 🥇 Rank 1 (Tall Center) */}
                <div className="bg-gradient-to-b from-amber-50/80 via-white to-amber-50/30 rounded-3xl p-7 border-2 border-amber-300 shadow-xl order-1 md:order-2 relative text-center scale-105 hover:shadow-2xl transition-all">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black flex items-center justify-center text-lg shadow-md border-2 border-white">
                    👑 #1
                  </div>
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black text-3xl flex items-center justify-center mx-auto mb-3 shadow-md">
                    {top10[0].full_name?.charAt(0)}
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                    Global Champion
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">{top10[0].full_name}</h3>
                  <div className="text-xs text-slate-500 font-semibold">
                    Grade {top10[0].grade} {top10[0].division ? `• Division ${top10[0].division}` : ''}
                  </div>
                  <div className="mt-4 py-2.5 px-6 rounded-2xl bg-amber-100/80 border border-amber-300 inline-block font-black text-amber-950 text-xl shadow-xs">
                    {top10[0].points} pts
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-amber-200/60 text-xs text-slate-600 font-semibold">
                    <div>Accuracy: <strong className="text-slate-900">{top10[0].accuracy}%</strong></div>
                    <div>Streak: <strong className="text-amber-700 font-bold">{top10[0].streak}d 🔥</strong></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(top10[0])}
                    className="mt-4 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md transition-colors cursor-pointer"
                  >
                    View Full Details
                  </button>
                </div>

                {/* 🥉 Rank 3 */}
                <div className="bg-white rounded-3xl p-6 border-2 border-amber-600/30 shadow-md order-3 relative text-center hover:shadow-xl transition-all">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-amber-100 border-2 border-amber-300 text-amber-900 font-black flex items-center justify-center text-sm shadow-sm">
                    #3
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-700 text-white font-black text-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                    {top10[2].full_name?.charAt(0)}
                  </div>
                  <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Bronze Scholar</div>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">{top10[2].full_name}</h3>
                  <div className="text-xs text-slate-500 font-semibold">
                    Grade {top10[2].grade} {top10[2].division ? `• Division ${top10[2].division}` : ''}
                  </div>
                  <div className="mt-4 py-2 px-4 rounded-xl bg-slate-50 border border-slate-200 inline-block font-black text-slate-800 text-base">
                    {top10[2].points} pts
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-semibold">
                    <div>Accuracy: <strong className="text-slate-800">{top10[2].accuracy}%</strong></div>
                    <div>Streak: <strong className="text-slate-800">{top10[2].streak}d</strong></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(top10[2])}
                    className="mt-4 w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    View Full Details
                  </button>
                </div>
              </div>
            )}

            {/* Real Students Standing Table */}
            {top10.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{cmsContent.top10_title} (Live Real-Time)</h3>
                    <p className="text-xs text-slate-500">Live verified records from student database ({top10.length} scholars).</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Real-Time DB</span>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-6 text-center">Rank</th>
                        <th className="py-3 px-6">Student Name</th>
                        <th className="py-3 px-4">Class</th>
                        <th className="py-3 px-4 text-center">Quizzes</th>
                        <th className="py-3 px-4 text-center">Accuracy</th>
                        <th className="py-3 px-4 text-center">Streak</th>
                        <th className="py-3 px-6 text-right">Points</th>
                        <th className="py-3 px-6 text-center">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {top10.map((st) => (
                        <tr key={st.student_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6 text-center">
                            <span
                              className={`inline-flex w-7 h-7 rounded-full font-black items-center justify-center text-xs ${
                                st.rank === 1
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : st.rank === 2
                                  ? 'bg-slate-200 text-slate-800'
                                  : st.rank === 3
                                  ? 'bg-amber-700/20 text-amber-900'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              #{st.rank}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-extrabold text-slate-900 flex items-center gap-2">
                              {st.full_name}
                              {st.rank === 1 && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                  Top Leader
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">ID: {st.student_id}</div>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-600">
                            Grade {st.grade || '—'} {st.division ? `- ${st.division}` : ''}
                          </td>
                          <td className="py-4 px-4 text-center font-semibold text-slate-700">
                            {st.quizzes_completed}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                              {st.accuracy}%
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-amber-600">
                            {st.streak} days 🔥
                          </td>
                          <td className="py-4 px-6 text-right font-black text-slate-900 text-sm">
                            {st.points}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedStudent(st)}
                              className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs transition-colors cursor-pointer"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 2: CLASS-WISE RANKINGS
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'classwise' && (
          <div className="space-y-8">
            {/* Grade Selector Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {['6', '7', '8'].map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => setActiveGrade(grade)}
                  className={`px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                    activeGrade === grade
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Grade {grade} Rankings ({class_wise[grade]?.length || 0} Scholars)
                </button>
              ))}
            </div>

            {/* Class Standings Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Grade {activeGrade} Leaderboard Standings
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Normalized scores for middle school curriculum units mapped to Grade {activeGrade}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                    Grade {activeGrade} Cohort
                  </span>
                </div>
              </div>

              {currentClassStudents.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <FiInfo className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No registered student scores in Grade {activeGrade} yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-6 text-center">Class Rank</th>
                        <th className="py-3 px-6">Student Scholar</th>
                        <th className="py-3 px-4">Division</th>
                        <th className="py-3 px-4 text-center">Quizzes Done</th>
                        <th className="py-3 px-4 text-center">Accuracy</th>
                        <th className="py-3 px-4 text-center">Active Streak</th>
                        <th className="py-3 px-6 text-right">Class Points</th>
                        <th className="py-3 px-6 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {currentClassStudents.map((st, idx) => (
                        <tr key={st.student_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6 text-center">
                            <span
                              className={`inline-flex w-7 h-7 rounded-full font-black items-center justify-center text-xs ${
                                idx === 0
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : idx === 1
                                  ? 'bg-slate-200 text-slate-800'
                                  : idx === 2
                                  ? 'bg-amber-700/20 text-amber-900'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              #{idx + 1}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-extrabold text-slate-900 flex items-center gap-2">
                              {st.full_name}
                              {idx === 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                  Class Topper
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">ID: {st.student_id}</div>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-600">
                            Division {st.division}
                          </td>
                          <td className="py-4 px-4 text-center font-semibold text-slate-700">
                            {st.quizzes_completed}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                              {st.accuracy}%
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-amber-600">
                            {st.streak} days
                          </td>
                          <td className="py-4 px-6 text-right font-black text-blue-600 text-sm">
                            {st.points}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedStudent(st)}
                              className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs transition-colors cursor-pointer"
                            >
                              Full Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 3: COLLABORATIVE SQUADS / TEAMS
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'teamwise' && (
          <div className="space-y-8">
            {/* Squads Grade Filter */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h4 className="text-sm font-black text-slate-900">Filter Squads by Class Level</h4>
                <p className="text-xs text-slate-500">Collaborative team ranking based on joint quiz performance.</p>
              </div>

              <div className="flex items-center gap-2">
                {[
                  { id: 'all', label: 'All Squads' },
                  { id: '6', label: 'Grade 6' },
                  { id: '7', label: 'Grade 7' },
                  { id: '8', label: 'Grade 8' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTeamGradeFilter(f.id)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      teamGradeFilter === f.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Squads Grid */}
            {filteredSquads.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-500 shadow-xs">
                <FiUsers className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <h4 className="text-base font-bold text-slate-800">
                  {teamGradeFilter === 'all'
                    ? 'No Collaborative Squads Found'
                    : `No Squads Found in Grade ${teamGradeFilter}`}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {teamGradeFilter === 'all'
                    ? 'Collaborative squads formed by teachers or students will appear here in real-time.'
                    : `Currently active squads are in Grades 6 and 7. Switch filter to view active squads.`}
                </p>
                {teamGradeFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setTeamGradeFilter('all')}
                    className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    View All Active Squads
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSquads.map((team, idx) => (
                  <div
                    key={team.team_id || idx}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-black items-center justify-center text-xs">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          Grade {team.grade}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 mb-1">{team.name}</h3>
                      <div className="text-xs font-semibold text-slate-400 mb-4">Code: {team.code}</div>

                      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl text-center mb-5">
                        <div>
                          <div className="text-xs text-slate-400 font-medium">Members</div>
                          <div className="text-sm font-black text-slate-800 mt-0.5">{team.member_count}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 font-medium">Accuracy</div>
                          <div className="text-sm font-black text-emerald-600 mt-0.5">{team.avg_accuracy}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 font-medium">Quizzes</div>
                          <div className="text-sm font-black text-purple-600 mt-0.5">{team.quizzes_completed}</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Squad Points</div>
                        <div className="text-lg font-black text-slate-900">{team.total_score} pts</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedSquad(team)}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Squad Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Leaderboard Rules & Anti-Cheat Standards Card ─── */}
        <div className="mt-16 bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FiShield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">{cmsContent.rules_title}</h3>
              <p className="text-xs text-slate-500">Integrity, difficulty weighting, and research compliance.</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {cmsContent.rules_p1}
          </p>

          <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-500 shrink-0" />
              <span>Equal Question Calibration</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-500 shrink-0" />
              <span>Zero-Tolerance Anti-Cheat</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-500 shrink-0" />
              <span>Collaborative Synergy Weighting</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MODAL: STUDENT FULL BREAKDOWN DETAILS
         ══════════════════════════════════════════════════════════════ */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md">
                {selectedStudent.full_name?.charAt(0)}
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                  Rank #{selectedStudent.rank || selectedStudent.class_rank}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{selectedStudent.full_name}</h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Grade {selectedStudent.grade} • Division {selectedStudent.division} • ID: {selectedStudent.student_id}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl text-center mb-6 border border-slate-100">
              <div>
                <div className="text-xs text-slate-400 font-medium">Total Points</div>
                <div className="text-lg font-black text-blue-600 mt-0.5">{selectedStudent.points}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Accuracy</div>
                <div className="text-lg font-black text-emerald-600 mt-0.5">{selectedStudent.accuracy}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Quiz Streak</div>
                <div className="text-lg font-black text-amber-600 mt-0.5">{selectedStudent.streak} days</div>
              </div>
            </div>

            {/* Subject Mastery Breakdown */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                STEM Discipline Mastery Breakdown
              </h4>
              {Object.entries(selectedStudent.subject_breakdown || {}).map(([subject, pct]) => (
                <div key={subject} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700 capitalize">
                    <span>{subject}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Badges / Accolades */}
            <div className="space-y-2 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Unlocked Accolades & Badges
              </h4>
              <div className="flex flex-wrap gap-2">
                {(selectedStudent.badges || ['Academic Explorer', 'Quiz Challenger']).map((b, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold"
                  >
                    <FiStar className="w-3.5 h-3.5 text-amber-500" />
                    {b}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              className="w-full py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: SQUAD / TEAM FULL DETAILS
         ══════════════════════════════════════════════════════════════ */}
      {selectedSquad && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedSquad(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md">
                👥
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                  Squad Rank #{selectedSquad.rank}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{selectedSquad.name}</h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Squad Code: {selectedSquad.code} • Grade {selectedSquad.grade}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl text-center mb-6 border border-slate-100">
              <div>
                <div className="text-xs text-slate-400 font-medium">Team Score</div>
                <div className="text-lg font-black text-purple-600 mt-0.5">{selectedSquad.total_score}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Accuracy</div>
                <div className="text-lg font-black text-emerald-600 mt-0.5">{selectedSquad.avg_accuracy}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Quizzes Done</div>
                <div className="text-lg font-black text-blue-600 mt-0.5">{selectedSquad.quizzes_completed}</div>
              </div>
            </div>

            {/* Squad Members Roster */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Squad Members Roster ({selectedSquad.member_count} Members)
              </h4>
              <div className="space-y-2">
                {selectedSquad.members && selectedSquad.members.length > 0 ? (
                  selectedSquad.members.map((m, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-extrabold text-slate-800">{m.name}</div>
                        {m.email && <div className="text-[10px] text-slate-400 font-medium">{m.email}</div>}
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                        {m.role || 'Member'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400 italic">
                    No members assigned to this squad yet.
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedSquad(null)}
              className="w-full py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close Squad Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
