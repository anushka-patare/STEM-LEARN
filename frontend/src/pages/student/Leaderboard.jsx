import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { leaderboardService, teamService } from '../../services/api';
import {
  FiAward,
  FiZap,
  FiStar,
  FiInbox,
  FiCheckCircle,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiShield,
  FiArrowRight
} from 'react-icons/fi';

export default function StudentLeaderboard() {
  const { user } = useAuth();
  const [activeMode, setActiveMode] = useState('solo'); // 'solo' | 'squad'
  const [soloRanks, setSoloRanks] = useState([]);
  const [squadRanks, setSquadRanks] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  const studentGrade = user?.grade ? String(user.grade).replace('Grade', '').trim() : '';

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const [soloRes, squadRes, myTeamRes] = await Promise.all([
          leaderboardService.getIndividual({ grade: studentGrade || undefined }),
          leaderboardService.getTeam(),
          teamService.getMyTeam().catch(() => ({ data: { data: null } }))
        ]);

        // Process Solo Ranks
        const soloRaw =
          soloRes.data?.data?.top10 ||
          soloRes.data?.data ||
          (Array.isArray(soloRes.data) ? soloRes.data : []);

        if (Array.isArray(soloRaw)) {
          const filtered = studentGrade
            ? soloRaw.filter(
                (s) =>
                  !s.grade ||
                  String(s.grade).replace('Grade', '').trim().toLowerCase() ===
                    studentGrade.toLowerCase()
              )
            : soloRaw;

          const mappedSolo = filtered.map((s, index) => ({
            rank: index + 1,
            student_id: s.student_id || s._id,
            student_name: s.full_name || s.student_name || 'Student Scholar',
            grade: s.grade ? `Class ${s.grade}${s.division ? ' - ' + s.division : ''}` : `Class ${studentGrade || '7'}`,
            points: s.points ?? 0,
            quizzes_taken: s.quizzes_completed ?? s.quizzes_taken ?? s.quiz_count ?? 0,
            accuracy: s.accuracy !== undefined && s.accuracy !== null ? `${s.accuracy}%` : '--',
            is_current_user: Boolean(
              (user?.student_id && s.student_id === user.student_id) ||
              (user?.email && s.email === user.email) ||
              (user?.full_name && s.full_name === user.full_name) ||
              (user?._id && String(s.student_id) === String(user._id)) ||
              s.is_current_user
            ),
          }));
          setSoloRanks(mappedSolo);
        } else {
          setSoloRanks([]);
        }

        // Process Squad Ranks
        const squadRaw = squadRes.data?.data?.team_wise || squadRes.data?.data || squadRes.data;
        if (Array.isArray(squadRaw)) {
          const filteredSquads = studentGrade
            ? squadRaw.filter(
                (sq) =>
                  !sq.grade ||
                  String(sq.grade).replace('Grade', '').trim().toLowerCase() ===
                    studentGrade.toLowerCase()
              )
            : squadRaw;
          setSquadRanks(filteredSquads);
        } else {
          setSquadRanks([]);
        }

        // Set My Team
        const mTeamData = myTeamRes.data?.data !== undefined ? myTeamRes.data.data : myTeamRes.data;
        if (mTeamData && typeof mTeamData === 'object' && Object.keys(mTeamData).length > 0) {
          setMyTeam(mTeamData);
        } else {
          setMyTeam(null);
        }
      } catch (err) {
        console.error('Failed to load leaderboard data:', err);
        setSoloRanks([]);
        setSquadRanks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user, studentGrade]);

  const currentUserRank = soloRanks.find((s) => s.is_current_user);
  const currentSquadRank = squadRanks.find(
    (sq) => myTeam && (sq.team_id === myTeam._id || sq.code === myTeam.code)
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
            <FiAward className="w-3.5 h-3.5" />
            <span>Academic Excellence Standings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Class {studentGrade || '7'} STEM Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Compare performance in competitive solo standings or collaborative squad rankings.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-2xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMode('solo')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeMode === 'solo'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FiUser className="w-3.5 h-3.5" />
            <span>Solo Scholars</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('squad')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeMode === 'squad'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FiUsers className="w-3.5 h-3.5" />
            <span>Collaborative Squads</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-16 text-center text-slate-500">
          <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold">Loading verified leaderboard standings...</p>
        </div>
      ) : activeMode === 'solo' ? (
        <>
          {/* Top 3 Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <FiAward className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Your Class Rank
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {currentUserRank ? `#${currentUserRank.rank}` : '--'}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Out of {soloRanks.length} Students
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FiZap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Your STEM XP
                </span>
                <div className="text-2xl font-black text-blue-600">
                  {user?.points ?? 0} Pts
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Verified Quiz Points
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FiStar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Class #1 Leader
                </span>
                <div className="text-base font-black text-slate-900 truncate max-w-[170px]">
                  {soloRanks[0] ? soloRanks[0].student_name : 'No Submissions'}
                </div>
                <span className="text-[11px] text-emerald-600 font-bold">
                  {soloRanks[0] ? `${soloRanks[0].points} Pts` : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Solo Standings Table */}
          {soloRanks.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
              <FiInbox className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Solo Leaderboard Records</h3>
              <p className="text-xs text-slate-500 mt-1">
                Completed quiz assessments will automatically rank students here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">
                  Individual Academic Rankings ({soloRanks.length})
                </h3>
                <span className="text-xs font-semibold text-slate-400">Class {studentGrade || '7'}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="py-3.5 px-6 w-20">Rank</th>
                      <th className="py-3.5 px-6">Student Scholar</th>
                      <th className="py-3.5 px-6">Cohort</th>
                      <th className="py-3.5 px-6 text-center">Quizzes Done</th>
                      <th className="py-3.5 px-6 text-center">Accuracy</th>
                      <th className="py-3.5 px-6 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {soloRanks.map((s) => {
                      const isTop1 = s.rank === 1;
                      const isTop2 = s.rank === 2;
                      const isTop3 = s.rank === 3;

                      return (
                        <tr
                          key={s.student_id || s.rank}
                          className={`transition-colors ${
                            s.is_current_user
                              ? 'bg-blue-50/80 font-bold hover:bg-blue-100/70 border-l-4 border-l-blue-600'
                              : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="py-4 px-6">
                            <span
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                                isTop1
                                  ? 'bg-amber-400 text-amber-950 shadow-sm'
                                  : isTop2
                                  ? 'bg-slate-200 text-slate-800'
                                  : isTop3
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {s.rank}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                  s.is_current_user
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {s.student_name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                  <span>{s.student_name}</span>
                                  {s.is_current_user && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-extrabold uppercase">
                                      You
                                    </span>
                                  )}
                                  {isTop1 && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black border border-amber-300">
                                      👑 #1 Leader
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400 font-normal">
                                  Student ID: {s.student_id ? String(s.student_id).slice(-8) : 'Verified'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6 text-xs text-slate-600">
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 font-bold">
                              {s.grade}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-xs text-slate-600 text-center font-semibold">
                            {s.quizzes_taken} Tests
                          </td>

                          <td className="py-4 px-6 text-xs text-center font-bold text-slate-700">
                            {s.accuracy}
                          </td>

                          <td className="py-4 px-6 text-right font-black text-blue-700 text-base">
                            {s.points} Pts
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Collaborative Squads Mode */
        <div className="space-y-8">
          {/* My Squad Highlight Banner */}
          {myTeam ? (
            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 p-6 rounded-3xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-xl">
                  {myTeam.name ? myTeam.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/70 tracking-wider block">
                    Your Registered Squad
                  </span>
                  <h3 className="text-xl font-black">{myTeam.name}</h3>
                  <p className="text-xs text-white/80">
                    Grade {myTeam.grade || studentGrade} • {myTeam.members?.length || 1} Members
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/student/team?view=squad_quizzes"
                  className="px-4 py-2 rounded-xl bg-white text-purple-700 font-bold text-xs hover:bg-white/90 transition-colors shadow-xs"
                >
                  Take Squad Quizzes
                </Link>
                <Link
                  to="/student/team?view=squad_results"
                  className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors"
                >
                  View Squad Results
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiShield className="w-4 h-4 text-purple-600 shrink-0" />
                <span>You haven't joined a squad yet. Join a team to compete on the Collaborative Leaderboard!</span>
              </div>
              <Link
                to="/student/team?view=all_squads"
                className="font-bold underline text-purple-700 shrink-0"
              >
                Join Squad
              </Link>
            </div>
          )}

          {/* Squad Leaderboard Table */}
          {squadRanks.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
              <FiInbox className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Collaborative Squads Found</h3>
              <p className="text-xs text-slate-500 mt-1">
                No active squads registered for Class {studentGrade || '7'} yet.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">
                  Collaborative Squad Rankings ({squadRanks.length})
                </h3>
                <span className="text-xs font-semibold text-slate-400">Class {studentGrade || '7'} Cohorts</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="py-3.5 px-6 w-20 text-center">Rank</th>
                      <th className="py-3.5 px-6">Squad Name</th>
                      <th className="py-3.5 px-6">Cohort</th>
                      <th className="py-3.5 px-6 text-center">Members</th>
                      <th className="py-3.5 px-6 text-center">Quizzes Done</th>
                      <th className="py-3.5 px-6 text-center">Accuracy</th>
                      <th className="py-3.5 px-6 text-right">Total Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {squadRanks.map((sq, index) => {
                      const isMyTeam = Boolean(
                        myTeam && (sq.team_id === myTeam._id || sq.code === myTeam.code)
                      );
                      return (
                        <tr
                          key={sq.team_id || sq.code || index}
                          className={`transition-colors ${
                            isMyTeam
                              ? 'bg-purple-50/70 font-bold border-l-4 border-l-purple-600'
                              : 'hover:bg-slate-50/50'
                          }`}
                        >
                          <td className="py-4 px-6 text-center">
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

                          <td className="py-4 px-6">
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

                          <td className="py-4 px-6 text-slate-600">
                            Grade {sq.grade || studentGrade || '7'}{sq.division ? ` - ${sq.division}` : ''}
                          </td>

                          <td className="py-4 px-6 text-center text-slate-700 font-semibold">
                            {sq.member_count ?? sq.members?.length ?? 0}
                          </td>

                          <td className="py-4 px-6 text-center text-slate-700 font-semibold">
                            {sq.quizzes_completed ?? 0}
                          </td>

                          <td className="py-4 px-6 text-center">
                            <span className="text-emerald-600 font-bold">
                              {sq.avg_accuracy ?? 0}%
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right">
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
          )}
        </div>
      )}
    </div>
  );
}
