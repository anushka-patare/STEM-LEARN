import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { teamService, leaderboardService } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  FiUsers,
  FiAward,
  FiShield,
  FiInbox,
  FiCheckCircle,
  FiCopy,
  FiKey,
  FiLogOut,
  FiFileText,
  FiBarChart2,
  FiList,
  FiTrendingUp,
  FiClock,
  FiArrowRight,
  FiCheck,
  FiXCircle,
  FiZap,
  FiStar
} from 'react-icons/fi';

export default function StudentTeam() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view');

  const validViews = [
    'my_squad',
    'squad_quizzes',
    'squad_results',
    'squad_leaderboard',
    'all_squads',
    'join_team'
  ];

  const [activeTab, setActiveTab] = useState(
    viewParam && validViews.includes(viewParam) ? viewParam : 'my_squad'
  );

  useEffect(() => {
    if (viewParam && validViews.includes(viewParam)) {
      setActiveTab(viewParam);
    }
  }, [viewParam]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ view: newTab });
  };

  const studentGrade = user?.grade ? String(user.grade).replace('Grade', '').trim() : '';

  const [team, setTeam] = useState(null);
  const [allSquads, setAllSquads] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [squadQuizzes, setSquadQuizzes] = useState([]);
  const [squadLeaderboard, setSquadLeaderboard] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [leaderboardGrade, setLeaderboardGrade] = useState(studentGrade || '9');

  const [loading, setLoading] = useState(true);
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (studentGrade && (!leaderboardGrade || leaderboardGrade === 'all')) {
      setLeaderboardGrade(studentGrade);
    }
  }, [studentGrade]);

  // 1. Fetch student's own squad
  const fetchMyTeam = async () => {
    try {
      const res = await teamService.getMyTeam();
      const teamData = res.data?.data !== undefined ? res.data.data : res.data;
      if (teamData && typeof teamData === 'object' && Object.keys(teamData).length > 0) {
        setTeam(teamData);
        return teamData;
      } else {
        setTeam(null);
        return null;
      }
    } catch (err) {
      console.warn('Failed to load my squad team:', err);
      setTeam(null);
      return null;
    }
  };

  // 2. Fetch all squads
  const fetchAllSquads = async () => {
    try {
      const res = await teamService.getAllSquads({ grade: studentGrade || undefined });
      const raw = res.data?.data !== undefined ? res.data.data : res.data;
      if (Array.isArray(raw)) {
        setAllSquads(raw);
      } else {
        setAllSquads([]);
      }
    } catch (err) {
      console.warn('Failed to load all squads:', err);
      setAllSquads([]);
    }
  };

  // 3. Fetch squad detailed performance & results
  const fetchPerformance = async () => {
    try {
      const res = await teamService.getMyTeamPerformance();
      const data = res.data?.data || res.data;
      setPerformance(data);
    } catch (err) {
      console.warn('Failed to load squad performance:', err);
      setPerformance(null);
    }
  };

  // 4. Fetch collaborative squad quizzes
  const fetchSquadQuizzes = async () => {
    try {
      const res = await teamService.getMyTeamQuizzes();
      const raw = res.data?.data || res.data;
      if (Array.isArray(raw)) {
        setSquadQuizzes(raw);
      } else {
        setSquadQuizzes([]);
      }
    } catch (err) {
      console.warn('Failed to load squad quizzes:', err);
      setSquadQuizzes([]);
    }
  };

  // 5. Fetch collaborative squad leaderboard strictly from real DB records
  const fetchSquadLeaderboard = async (gradeOverride) => {
    try {
      const g = gradeOverride !== undefined ? gradeOverride : leaderboardGrade;
      const targetGrade = (g && g !== 'all') ? g : (studentGrade || undefined);
      const params = targetGrade ? { grade: targetGrade } : {};
      const res = await leaderboardService.getTeam(params);
      const raw = res.data?.data?.team_wise || res.data?.data || res.data;
      if (Array.isArray(raw)) {
        setSquadLeaderboard(raw);
      } else {
        setSquadLeaderboard([]);
      }
    } catch (err) {
      console.warn('Failed to load squad leaderboard:', err);
      setSquadLeaderboard([]);
    }
  };

  const handleGradeFilterChange = (g) => {
    setLeaderboardGrade(g);
    fetchSquadLeaderboard(g);
  };

  const loadData = async () => {
    setLoading(true);
    const myTeamData = await fetchMyTeam();
    await Promise.all([
      fetchAllSquads(),
      fetchSquadLeaderboard(studentGrade || '9'),
      myTeamData ? fetchPerformance() : Promise.resolve(),
      fetchSquadQuizzes()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Load contextual tab data on tab switch
  useEffect(() => {
    if (activeTab === 'squad_results' && team && !performance) {
      setLoadingExtra(true);
      fetchPerformance().finally(() => setLoadingExtra(false));
    } else if (activeTab === 'squad_quizzes' && squadQuizzes.length === 0) {
      setLoadingExtra(true);
      fetchSquadQuizzes().finally(() => setLoadingExtra(false));
    } else if (activeTab === 'squad_leaderboard') {
      setLoadingExtra(true);
      fetchSquadLeaderboard().finally(() => setLoadingExtra(false));
    }
  }, [activeTab, team]);

  // Join Team Handler by Code (with switch support)
  const handleJoinByCode = async (e) => {
    if (e) e.preventDefault();
    const codeToUse = joinCode.trim().toUpperCase();
    if (!codeToUse) {
      toast.error('Please enter a team code');
      return;
    }
    if (team) {
      const confirmSwitch = window.confirm(
        `You are currently enrolled in "${team.name}". Each student can belong to 1 squad at a time.\n\nDo you want to leave "${team.name}" and join the new squad?`
      );
      if (!confirmSwitch) return;
    }
    setJoining(true);
    try {
      const res = await teamService.joinTeam({ code: codeToUse, switch: Boolean(team) });
      if (res.data?.success) {
        toast.success(res.data?.message || 'Successfully joined squad!');
        setJoinCode('');
        await loadData();
        handleTabChange('my_squad');
      } else {
        toast.error(res.data?.message || 'Failed to join squad');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid team code or unable to join');
    } finally {
      setJoining(false);
    }
  };

  // Join or Switch Team by Squad ID
  const handleJoinByTeamId = async (teamId, teamName) => {
    if (team && String(team._id) === String(teamId)) {
      toast('You are already a member of this squad!');
      return;
    }
    if (team) {
      const confirmSwitch = window.confirm(
        `You are currently enrolled in "${team.name}". Each student can belong to 1 squad at a time.\n\nDo you want to leave "${team.name}" and switch to "${teamName}"?`
      );
      if (!confirmSwitch) return;
    }
    setJoining(true);
    try {
      const res = await teamService.joinTeam({ team_id: teamId, switch: Boolean(team) });
      if (res.data?.success) {
        toast.success(res.data?.message || `Successfully joined "${teamName}"!`);
        await loadData();
        handleTabChange('my_squad');
      } else {
        toast.error(res.data?.message || 'Failed to join squad');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to join this squad');
    } finally {
      setJoining(false);
    }
  };

  // Leave Team Handler
  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave your current squad?')) return;
    setLeaving(true);
    try {
      const res = await teamService.leaveTeam();
      if (res.data?.success) {
        toast.success('You have left the squad');
        setTeam(null);
        setPerformance(null);
        await loadData();
        handleTabChange('all_squads');
      } else {
        toast.error(res.data?.message || 'Failed to leave squad');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error leaving squad');
    } finally {
      setLeaving(false);
    }
  };

  const copyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast.success(`Squad code "${code}" copied to clipboard!`);
  };

  // Filtered quizzes
  const filteredQuizzes = squadQuizzes.filter((q) => {
    if (selectedSubject === 'all') return true;
    return q.subject_name?.toLowerCase().includes(selectedSubject.toLowerCase());
  });

  // Filtered leaderboard
  const filteredLeaderboard = squadLeaderboard.filter((sq) => {
    if (leaderboardGrade === 'all') return true;
    return String(sq.grade || '').trim() === String(leaderboardGrade).trim();
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Top Header & Navigation Tabs ─── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold mb-2">
              <FiUsers className="w-3.5 h-3.5" />
              <span>Collaborative STEM Learning Cohort</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              STEM Squad Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Team up with classmates, complete quizzes collaboratively, track your team results, and conquer the Squad Leaderboard.
            </p>
          </div>

          {team && (
            <div className="flex items-center gap-3 bg-purple-50 border border-purple-200/80 px-4 py-2.5 rounded-2xl shrink-0">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                {team.name ? team.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider block">
                  Active Squad
                </span>
                <span className="text-sm font-black text-slate-900 truncate block max-w-[150px]">
                  {team.name}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ─── Tab Bar ─── */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => handleTabChange('my_squad')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'my_squad'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <FiShield className="w-3.5 h-3.5" />
            <span>My Squad Team</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('squad_quizzes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'squad_quizzes'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <FiFileText className="w-3.5 h-3.5" />
            <span>Squad Quizzes</span>
            {squadQuizzes.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'squad_quizzes' ? 'bg-purple-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {squadQuizzes.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('squad_results')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'squad_results'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <FiBarChart2 className="w-3.5 h-3.5" />
            <span>Squad Results</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('squad_leaderboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'squad_leaderboard'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <FiAward className="w-3.5 h-3.5" />
            <span>Squad Leaderboard</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('all_squads')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all_squads'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <FiList className="w-3.5 h-3.5" />
            <span>All Squad Teams</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('join_team')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'join_team'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <FiKey className="w-3.5 h-3.5" />
            <span>Join Squad</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-16 text-center text-slate-500">
          <div className="w-9 h-9 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold">Loading squad command center...</p>
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════════
              VIEW 1: MY SQUAD TEAM
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'my_squad' && (
            <>
              {!team ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-14 text-center max-w-xl mx-auto my-6 space-y-6 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-2xs">
                    <FiUsers className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">You Are Not in a Squad Yet</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                      Join an active collaborative squad to team up with classmates, complete quizzes together, unlock squad analytics, and compete on the leaderboard.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleTabChange('all_squads')}
                      className="w-full sm:w-auto stem-btn bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all"
                    >
                      Browse All Squad Teams
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabChange('join_team')}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer transition-all"
                    >
                      Enter Squad Code
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Banner */}
                  <div className="rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 p-8 text-white relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                          <FiShield className="w-3.5 h-3.5" />
                          <span>Official Collaborative Squad</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                          {team.name}
                        </h2>
                        {team.slogan && (
                          <p className="text-white/80 text-sm italic font-medium">
                            "{team.slogan}"
                          </p>
                        )}
                        <p className="text-xs text-white/70">
                          Cohort: Grade {team.grade || studentGrade || '7'}{team.division ? ` - Division ${team.division}` : ''}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {team.code && (
                          <button
                            type="button"
                            onClick={() => copyCode(team.code)}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-2xl border border-white/20 text-xs font-mono font-bold backdrop-blur-md cursor-pointer transition-all"
                            title="Click to copy team code"
                          >
                            <FiCopy className="w-3.5 h-3.5" />
                            <span>CODE: {team.code}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleLeaveTeam}
                          disabled={leaving}
                          className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 hover:text-white px-3.5 py-2.5 rounded-2xl border border-rose-400/30 text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
                        >
                          <FiLogOut className="w-3.5 h-3.5" />
                          <span>{leaving ? 'Leaving...' : 'Leave Squad'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ─── 3 Quick Feature Action Cards ─── */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <button
                      type="button"
                      onClick={() => handleTabChange('squad_quizzes')}
                      className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all text-left flex items-start gap-4 group cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-all">
                        <FiFileText className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                          Squad Quizzes
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Complete STEM assessments with your cohort. Every score contributes directly to team points.
                        </p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 pt-1">
                          <span>Open Quizzes</span>
                          <FiArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTabChange('squad_results')}
                      className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all text-left flex items-start gap-4 group cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <FiBarChart2 className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                          Squad Results
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Review member contributions, passing rates, test history, and subject accuracy.
                        </p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 pt-1">
                          <span>View Analytics</span>
                          <FiArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTabChange('squad_leaderboard')}
                      className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all text-left flex items-start gap-4 group cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-all">
                        <FiAward className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                          Squad Leaderboard
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Compete for #1 against other collaborative squads in Class {team.grade || studentGrade || '7'}.
                        </p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 pt-1">
                          <span>View Standings</span>
                          <FiArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* ─── Metric Summary Cards ─── */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Total Squad Points
                      </span>
                      <strong className="text-2xl font-black text-purple-600">
                        {team.total_score ?? performance?.stats?.total_points ?? 0} XP
                      </strong>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Squad Accuracy
                      </span>
                      <strong className="text-2xl font-black text-emerald-600">
                        {performance?.stats?.average_accuracy ?? team.avg_accuracy ?? 0}%
                      </strong>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Quizzes Completed
                      </span>
                      <strong className="text-2xl font-black text-blue-600">
                        {performance?.stats?.quizzes_completed ?? team.quizzes_completed ?? 0}
                      </strong>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Cohort Members
                      </span>
                      <strong className="text-2xl font-black text-slate-800">
                        {team.members?.length || team.member_count || 1} / {team.max_members || 6}
                      </strong>
                    </div>
                  </div>

                  {/* Scoring Rule info */}
                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiShield className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>
                        <strong>Collaborative Points Policy:</strong> Every quiz completed by team members contributes to your squad's total score.
                      </span>
                    </div>
                    <span className="font-bold text-[11px] bg-purple-200/60 px-2.5 py-1 rounded-full shrink-0">
                      Active Cohort
                    </span>
                  </div>

                  {/* Squad Members Roster */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <FiUsers className="w-5 h-5 text-purple-600" />
                        <span>Squad Roster ({team.members?.length || 0})</span>
                      </h3>
                      <span className="text-xs text-slate-500 font-semibold">
                        Max capacity: {team.max_members || 6} students
                      </span>
                    </div>

                    {!team.members || team.members.length === 0 ? (
                      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
                        No team member records found.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {team.members.map((m) => {
                          const isMe = Boolean(
                            (user && (m._id === user._id || m.student_id === user.student_id)) ||
                            (user?.email && m.email === user.email) ||
                            (user?.full_name && m.full_name === user.full_name)
                          );
                          const displayName = m.full_name || m.name || 'Student';

                          return (
                            <div
                              key={m._id || m.student_id || displayName}
                              className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                                isMe
                                  ? 'border-purple-400 ring-2 ring-purple-500/20 shadow-md bg-purple-50/10'
                                  : 'border-slate-200/90 shadow-2xs hover:shadow-xs'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-2xs">
                                    {displayName.charAt(0).toUpperCase()}
                                  </div>
                                  {isMe && (
                                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                      You
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-sm font-bold text-slate-900 truncate">
                                  {displayName}
                                </h4>
                                <p className="text-[11px] text-purple-600 font-semibold mb-3">
                                  {m.student_id ? `ID: ${String(m.student_id).slice(-8)}` : 'Squad Scholar'}
                                </p>

                                <div className="border-t border-slate-100 pt-2.5 text-xs flex items-center justify-between text-slate-600">
                                  <span>Contributed:</span>
                                  <strong className="text-slate-900">{m.points ?? 0} XP</strong>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 2: SQUAD QUIZZES (squd Quiz cha option)
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'squad_quizzes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <FiFileText className="w-5 h-5 text-purple-600" />
                    <span>Collaborative Squad STEM Quizzes</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Complete these quizzes to earn points for your squad cohort. All scores feed directly into your Squad Total & Leaderboard.
                  </p>
                </div>

                {/* Subject Filter */}
                <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                  {['all', 'Science', 'Mathematics', 'Technology'].map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSelectedSubject(sub)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedSubject === sub
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {sub === 'all' ? 'All Subjects' : sub}
                    </button>
                  ))}
                </div>
              </div>

              {!team && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiZap className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      You are not currently in a squad. Join a squad to have your quiz points count toward a team total!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange('all_squads')}
                    className="font-bold underline cursor-pointer text-amber-900"
                  >
                    Join Squad Now
                  </button>
                </div>
              )}

              {filteredQuizzes.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
                  <FiInbox className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">No Squad Quizzes Available</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    No quizzes found for Grade {studentGrade || '7'} under this filter. Check back soon!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredQuizzes.map((quiz) => {
                    const isScience = quiz.subject_name?.toLowerCase().includes('science');
                    const isMath = quiz.subject_name?.toLowerCase().includes('math');
                    const badgeColor = isScience
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isMath
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200';

                    return (
                      <div
                        key={quiz._id}
                        className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${badgeColor}`}>
                              {quiz.subject_name || 'STEM'}
                            </span>
                            {quiz.my_passed ? (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                <FiCheck className="w-3 h-3" />
                                <span>Passed ({quiz.my_score}%)</span>
                              </span>
                            ) : quiz.my_attempted ? (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                Retake Available
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                Not Attempted
                              </span>
                            )}
                          </div>

                          <div>
                            <h3 className="text-base font-black text-slate-900 line-clamp-1">
                              {quiz.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                              {quiz.description || `Chapter: ${quiz.chapter_name || 'STEM Concept Mastery'}`}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <div>
                              <span className="block text-[10px] text-slate-400 font-bold uppercase">Duration</span>
                              <strong className="text-slate-800">{quiz.duration_minutes || 10} Mins</strong>
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-400 font-bold uppercase">Questions</span>
                              <strong className="text-slate-800">{quiz.questions_count || 5} MCQs</strong>
                            </div>
                          </div>

                          {team && (
                            <div className="text-[11px] text-purple-700 font-semibold flex items-center gap-1.5">
                              <FiUsers className="w-3.5 h-3.5" />
                              <span>Squad Activity: {quiz.squad_completions || 0} attempt(s) by cohort</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                          <span className="text-xs font-black text-purple-700">
                            +{quiz.total_marks || 10} Points Value
                          </span>

                          <button
                            type="button"
                            onClick={() => navigate(`/student/quiz/${quiz._id}`)}
                            className="stem-btn bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-xs font-bold rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all"
                          >
                            <span>{quiz.my_passed ? 'Retake Quiz' : 'Start Squad Quiz'}</span>
                            <FiArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 3: SQUAD RESULTS (Squd result cha option)
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'squad_results' && (
            <div className="space-y-8">
              {!team ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
                  <FiBarChart2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">No Squad Results Available</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-6">
                    You must join a collaborative squad to access collective results and member contribution analytics.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleTabChange('all_squads')}
                    className="stem-btn bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Browse Squads
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <FiBarChart2 className="w-5 h-5 text-purple-600" />
                      <span>{team.name} — Squad Results & Performance</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Collaborative assessment metrics, quiz pass rates, accuracy benchmarks, and member point contributions.
                    </p>
                  </div>

                  {/* Summary KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Total Squad Score
                      </span>
                      <strong className="text-2xl font-black text-purple-600">
                        {performance?.stats?.total_points ?? team.total_score ?? 0} Pts
                      </strong>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Average Accuracy
                      </span>
                      <strong className="text-2xl font-black text-emerald-600">
                        {performance?.stats?.average_accuracy ?? 0}%
                      </strong>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Quizzes Passed
                      </span>
                      <strong className="text-2xl font-black text-blue-600">
                        {performance?.stats?.quizzes_passed ?? 0} / {performance?.stats?.quizzes_completed ?? 0}
                      </strong>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Pass Rate
                      </span>
                      <strong className="text-2xl font-black text-indigo-600">
                        {performance?.stats?.quizzes_completed
                          ? Math.round((performance.stats.quizzes_passed / performance.stats.quizzes_completed) * 100)
                          : 0}%
                      </strong>
                    </div>
                  </div>

                  {/* Member Contribution Breakdown */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <FiTrendingUp className="w-4 h-4 text-purple-600" />
                      <span>Member Point Contributions</span>
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                            <th className="py-3 px-3">Member</th>
                            <th className="py-3 px-3">Points Earned</th>
                            <th className="py-3 px-3">Quizzes Completed</th>
                            <th className="py-3 px-3">Quizzes Passed</th>
                            <th className="py-3 px-3">Avg Accuracy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {performance?.member_contributions?.map((m) => {
                            const isMe = Boolean(
                              (user && (m._id === user._id || m.student_id === user.student_id)) ||
                              (user?.full_name && m.name === user.full_name)
                            );
                            return (
                              <tr key={m._id || m.student_id} className={isMe ? 'bg-purple-50/30 font-bold' : ''}>
                                <td className="py-3 px-3 flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                                    {m.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="text-slate-900">{m.name}</span>
                                    {isMe && (
                                      <span className="ml-1.5 px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 text-[10px] font-black">
                                        You
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-purple-700 font-black">
                                  {m.points} XP
                                </td>
                                <td className="py-3 px-3 text-slate-700">
                                  {m.quizzes_completed}
                                </td>
                                <td className="py-3 px-3 text-emerald-600 font-bold">
                                  {m.quizzes_passed}
                                </td>
                                <td className="py-3 px-3 text-slate-800 font-bold">
                                  {m.average_accuracy}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recent Squad Attempts History */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <FiClock className="w-4 h-4 text-purple-600" />
                      <span>Recent Squad Quiz Activity</span>
                    </h3>

                    {!performance?.recent_activity || performance.recent_activity.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4">
                        No quiz attempts recorded by your squad yet. Start completing quizzes from the "Squad Quizzes" tab!
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                              <th className="py-3 px-3">Quiz Title</th>
                              <th className="py-3 px-3">Completed By</th>
                              <th className="py-3 px-3">Score %</th>
                              <th className="py-3 px-3">Status</th>
                              <th className="py-3 px-3">Subject</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {performance.recent_activity.map((act, idx) => (
                              <tr key={act.attempt_id || idx} className="hover:bg-slate-50/50">
                                <td className="py-3 px-3 font-bold text-slate-900">
                                  {act.quiz_title}
                                </td>
                                <td className="py-3 px-3 text-slate-600">
                                  {act.student_name}
                                </td>
                                <td className="py-3 px-3 font-bold text-slate-800">
                                  {act.score_percentage}%
                                </td>
                                <td className="py-3 px-3">
                                  {act.passed ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                      <FiCheckCircle className="w-3 h-3" />
                                      <span>Passed</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                      <FiXCircle className="w-3 h-3" />
                                      <span>Failed</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-slate-500">
                                  {act.subject_name}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 4: SQUAD LEADERBOARD (squd leaderboard cha option)
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'squad_leaderboard' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold mb-2">
                    <FiAward className="w-3.5 h-3.5" />
                    <span>Collaborative Team Standings</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Official Collaborative Squad Leaderboard
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Real-time rankings based on cumulative squad quiz performance, member accuracy, and participation.
                  </p>
                </div>

                {/* Grade filter */}
                <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                  {['all', '6', '7', '8', '9'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleGradeFilterChange(g)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        leaderboardGrade === g
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {g === 'all' ? 'All Grades' : `Grade ${g}`}
                    </button>
                  ))}
                </div>
              </div>

              {filteredLeaderboard.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
                  <FiInbox className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">No Squad Rankings Available</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    No squads have registered activity in this grade category yet.
                  </p>
                </div>
              ) : (
                <>
                  {/* Top 3 Podium (Only when top team has scored XP > 0) */}
                  {filteredLeaderboard.length >= 2 && filteredLeaderboard[0]?.total_score > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
                      {/* 2nd Place */}
                      {filteredLeaderboard[1] && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs text-center order-2 md:order-1 relative">
                          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-600 font-black text-lg flex items-center justify-center mb-3 shadow-2xs border border-slate-200">
                            🥈 2nd
                          </div>
                          <h4 className="text-base font-black text-slate-900 truncate">
                            {filteredLeaderboard[1].name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Grade {filteredLeaderboard[1].grade || studentGrade || '9'} • {filteredLeaderboard[1].member_count || 0} Members
                          </p>
                          <div className="mt-3 text-lg font-black text-purple-600">
                            {filteredLeaderboard[1].total_score} XP
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {filteredLeaderboard[1].avg_accuracy}% Accuracy
                          </div>
                        </div>
                      )}

                      {/* 1st Place */}
                      {filteredLeaderboard[0] && (
                        <div className="bg-gradient-to-b from-amber-50 to-white rounded-3xl p-8 border-2 border-amber-300 shadow-md text-center order-1 md:order-2 relative -mt-4">
                          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400 text-white font-black text-2xl flex items-center justify-center mb-3 shadow-md">
                            👑 1st
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
                            Cohort Champions
                          </span>
                          <h4 className="text-lg font-black text-slate-900 truncate">
                            {filteredLeaderboard[0].name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Grade {filteredLeaderboard[0].grade || studentGrade || '9'} • {filteredLeaderboard[0].member_count || 0} Members
                          </p>
                          <div className="mt-3 text-2xl font-black text-amber-600">
                            {filteredLeaderboard[0].total_score} XP
                          </div>
                          <div className="text-xs text-slate-500 font-semibold">
                            {filteredLeaderboard[0].avg_accuracy}% Average Accuracy
                          </div>
                        </div>
                      )}

                      {/* 3rd Place */}
                      {filteredLeaderboard[2] && (
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs text-center order-3 relative">
                          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-800 font-black text-lg flex items-center justify-center mb-3 shadow-2xs border border-amber-200">
                            🥉 3rd
                          </div>
                          <h4 className="text-base font-black text-slate-900 truncate">
                            {filteredLeaderboard[2].name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Grade {filteredLeaderboard[2].grade || studentGrade || '9'} • {filteredLeaderboard[2].member_count || 0} Members
                          </p>
                          <div className="mt-3 text-lg font-black text-purple-600">
                            {filteredLeaderboard[2].total_score} XP
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {filteredLeaderboard[2].avg_accuracy}% Accuracy
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-purple-50/80 via-white to-indigo-50/80 rounded-3xl p-6 sm:p-8 border border-purple-200/80 text-center space-y-3 shadow-2xs">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
                        <FiZap className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base sm:text-lg font-black text-slate-900">
                          Grade {leaderboardGrade === 'all' ? (studentGrade || '9') : leaderboardGrade} Collaborative Standings
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
                          Squad rankings are live and authentic from real test completions. Complete collaborative quizzes from the <strong>Squad Quizzes</strong> tab to earn points and claim #1 on the leaderboard!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Leaderboard Table */}
                  <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                      <h3 className="text-base font-black text-slate-900">
                        All Squad Cohort Rankings ({filteredLeaderboard.length})
                      </h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px]">
                            <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                            <th className="py-3.5 px-4">Squad Name</th>
                            <th className="py-3.5 px-4">Cohort</th>
                            <th className="py-3.5 px-4 text-center">Members</th>
                            <th className="py-3.5 px-4 text-center">Quizzes Done</th>
                            <th className="py-3.5 px-4 text-center">Avg Accuracy</th>
                            <th className="py-3.5 px-4 text-right">Total Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredLeaderboard.map((sq, index) => {
                            const isMyTeam = Boolean(team && (team._id === sq.team_id || team.code === sq.code));
                            return (
                              <tr
                                key={sq.team_id || sq.code || index}
                                className={`transition-colors ${
                                  isMyTeam
                                    ? 'bg-purple-50/60 font-bold border-l-4 border-l-purple-600'
                                    : 'hover:bg-slate-50/50'
                                }`}
                              >
                                <td className="py-4 px-4 text-center">
                                  {index === 0 ? (
                                    <span className="w-6 h-6 rounded-full bg-amber-400 text-white font-black text-xs inline-flex items-center justify-center">
                                      1
                                    </span>
                                  ) : index === 1 ? (
                                    <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs inline-flex items-center justify-center">
                                      2
                                    </span>
                                  ) : index === 2 ? (
                                    <span className="w-6 h-6 rounded-full bg-amber-700/80 text-white font-black text-xs inline-flex items-center justify-center">
                                      3
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 font-bold">#{index + 1}</span>
                                  )}
                                </td>

                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-slate-900 text-sm">
                                      {sq.name}
                                    </span>
                                    {isMyTeam && (
                                      <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase">
                                        Your Squad
                                      </span>
                                    )}
                                  </div>
                                  {sq.slogan && (
                                    <p className="text-[11px] text-slate-400 italic font-normal">
                                      "{sq.slogan}"
                                    </p>
                                  )}
                                </td>

                                <td className="py-4 px-4 text-slate-600">
                                  Grade {sq.grade || studentGrade || '7'}{sq.division ? ` - ${sq.division}` : ''}
                                </td>

                                <td className="py-4 px-4 text-center text-slate-700 font-semibold">
                                  {sq.member_count ?? sq.members?.length ?? 0}
                                </td>

                                <td className="py-4 px-4 text-center text-slate-700 font-semibold">
                                  {sq.quizzes_completed ?? 0}
                                </td>

                                <td className="py-4 px-4 text-center">
                                  <span className="text-emerald-600 font-bold">
                                    {sq.avg_accuracy ?? 0}%
                                  </span>
                                </td>

                                <td className="py-4 px-4 text-right">
                                  <span className="text-purple-700 font-black text-sm">
                                    {sq.total_score ?? 0} XP
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 5: ALL SQUAD TEAMS
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'all_squads' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    All Active Squad Teams ({allSquads.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Explore collaborative squads created for Grade {studentGrade || '9'}. Join an open squad to collaborate on tests.
                  </p>
                </div>
              </div>

              {team && (
                <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                      <FiCheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-purple-950">
                        Enrolled in: {team.name} (Grade {team.grade || studentGrade || '9'})
                      </h4>
                      <p className="text-[11px] text-purple-700">
                        Students can belong to 1 squad at a time. Click "Switch Squad" below on another squad if you wish to transfer.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLeaveTeam}
                    disabled={leaving}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {leaving ? 'Leaving...' : 'Leave Squad'}
                  </button>
                </div>
              )}

              {allSquads.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
                  <FiInbox className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">No Squads Available</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    There are no squads created for this class yet. Ask your teacher to set up collaborative squads!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allSquads.map((sq) => {
                    const isMyTeam = Boolean(team && (team._id === sq._id || team.code === sq.code));
                    const membersCount = sq.member_count ?? sq.members?.length ?? 0;
                    const maxMembers = sq.max_members || 6;
                    const isFull = membersCount >= maxMembers;

                    return (
                      <div
                        key={sq._id || sq.code}
                        className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                          isMyTeam
                            ? 'border-purple-400 ring-2 ring-purple-500/20 shadow-md bg-purple-50/20'
                            : 'border-slate-200/90 shadow-xs hover:shadow-md'
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 block">
                                Grade {sq.grade || studentGrade || '9'}{sq.division ? ` - ${sq.division}` : ''}
                              </span>
                              <h3 className="text-base font-black text-slate-900 mt-0.5">
                                {sq.name}
                              </h3>
                            </div>
                            {isMyTeam ? (
                              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-600 text-white shrink-0">
                                Your Squad
                              </span>
                            ) : isFull ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
                                Full
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                                Open Slots
                              </span>
                            )}
                          </div>

                          {sq.slogan && (
                            <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              "{sq.slogan}"
                            </p>
                          )}

                          {/* Member count progress */}
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-500 font-semibold">
                              <span>Squad Members:</span>
                              <strong className="text-slate-800">{membersCount} / {maxMembers}</strong>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-purple-600 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, (membersCount / maxMembers) * 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Members preview */}
                          {Array.isArray(sq.members) && sq.members.length > 0 && (
                            <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
                              <span className="font-bold text-slate-700 block mb-1">Roster:</span>
                              <div className="flex flex-wrap gap-1">
                                {sq.members.slice(0, 4).map((m, idx) => (
                                  <span key={m._id || idx} className="px-2 py-0.5 rounded-lg bg-slate-100 text-[11px] font-medium text-slate-700">
                                    {m.full_name || m.name || 'Member'}
                                  </span>
                                ))}
                                {sq.members.length > 4 && (
                                  <span className="px-1.5 py-0.5 text-[11px] text-slate-400 font-bold">
                                    +{sq.members.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Action */}
                        <div className="pt-5 border-t border-slate-100 mt-4 flex items-center justify-between">
                          {sq.code ? (
                            <button
                              type="button"
                              onClick={() => copyCode(sq.code)}
                              className="text-xs font-mono font-bold text-purple-700 flex items-center gap-1 hover:underline cursor-pointer"
                              title="Click to copy squad code"
                            >
                              <FiCopy className="w-3.5 h-3.5" />
                              <span>{sq.code}</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-mono">CODE: ACTIVE</span>
                          )}

                          {isMyTeam ? (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                              <FiCheckCircle className="w-4 h-4" />
                              <span>Active Squad</span>
                            </span>
                          ) : isFull ? (
                            <button
                              disabled
                              className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed"
                            >
                              Squad Full
                            </button>
                          ) : team ? (
                            <button
                              type="button"
                              onClick={() => handleJoinByTeamId(sq._id, sq.name)}
                              disabled={joining}
                              className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                            >
                              {joining ? 'Switching...' : 'Switch Squad'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleJoinByTeamId(sq._id, sq.name)}
                              disabled={joining}
                              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                            >
                              {joining ? 'Joining...' : 'Join Squad'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              VIEW 6: JOIN TEAM (join team with code)
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'join_team' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-md text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-2xs">
                  <FiKey className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Join a STEM Squad Team
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                    Enter the unique Squad Code given by your teacher or squad captain to immediately link your profile.
                  </p>
                </div>

                {team && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <FiShield className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Currently Enrolled in "{team.name}"</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Entering another squad's code below will transfer your enrollment to the new squad upon confirmation.
                    </p>
                  </div>
                )}

                <form onSubmit={handleJoinByCode} className="space-y-4 text-left bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FiKey className="w-3.5 h-3.5 text-purple-600" />
                      <span>Squad Secret Code</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 7A-SQUAD-1 or CODE"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="stem-input uppercase font-mono font-bold text-base py-3 tracking-widest text-center"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={joining || !joinCode.trim()}
                    className="w-full stem-btn bg-purple-600 hover:bg-purple-700 text-white py-3.5 text-xs font-black uppercase tracking-wider rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <FiUsers className="w-4 h-4" />
                    <span>
                      {joining
                        ? 'Connecting to Squad...'
                        : team
                        ? 'Confirm & Switch Squad'
                        : 'Confirm & Join Squad'}
                    </span>
                  </button>
                </form>

                <div className="text-xs text-slate-400">
                  Want to see available teams first?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabChange('all_squads')}
                    className="text-purple-600 font-bold hover:underline cursor-pointer"
                  >
                    Browse All Squad Teams
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
