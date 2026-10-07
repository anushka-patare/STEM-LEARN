import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { teamService } from '../../services/api';
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
  FiPlus
} from 'react-icons/fi';

export default function StudentTeam() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view');

  // Dropdown states: 'all_squads' | 'join_team' | 'my_squad'
  const [activeTab, setActiveTab] = useState(
    viewParam && ['all_squads', 'join_team', 'my_squad'].includes(viewParam)
      ? viewParam
      : 'my_squad'
  );

  useEffect(() => {
    if (viewParam && ['all_squads', 'join_team', 'my_squad'].includes(viewParam)) {
      setActiveTab(viewParam);
    }
  }, [viewParam]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ view: newTab });
  };
  const [team, setTeam] = useState(null);
  const [allSquads, setAllSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const studentGrade = user?.grade ? String(user.grade) : '';

  // Fetch student's own squad
  const fetchMyTeam = async () => {
    try {
      const res = await teamService.getMyTeam();
      const teamData = res.data?.data !== undefined ? res.data.data : res.data;
      if (teamData && typeof teamData === 'object' && Object.keys(teamData).length > 0) {
        setTeam(teamData);
      } else {
        setTeam(null);
      }
    } catch (err) {
      console.warn('Failed to load my squad team:', err);
      setTeam(null);
    }
  };

  // Fetch all squads in the class/school
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

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchMyTeam(), fetchAllSquads()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // If student has no team initially, default dropdown to 'all_squads' or keep 'my_squad' with guidance
  useEffect(() => {
    if (!loading && !team && activeTab === 'my_squad') {
      // Keep 'my_squad' view showing the friendly empty banner with shortcut buttons
    }
  }, [loading, team]);

  // Join Team Handler
  const handleJoinByCode = async (e) => {
    if (e) e.preventDefault();
    const codeToUse = joinCode.trim().toUpperCase();
    if (!codeToUse) {
      toast.error('Please enter a team code');
      return;
    }
    setJoining(true);
    try {
      const res = await teamService.joinTeam({ code: codeToUse });
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

  const handleJoinByTeamId = async (teamId, teamName) => {
    setJoining(true);
    try {
      const res = await teamService.joinTeam({ team_id: teamId });
      if (res.data?.success) {
        toast.success(`Successfully joined "${teamName}"!`);
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Top Header ─── */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold mb-2">
          <FiUsers className="w-3.5 h-3.5" />
          <span>Collaborative STEM Squads</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          STEM Squad Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Browse all squads, join a new team with a code, or manage your active squad cohort.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold">Loading squad information...</p>
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════════
              OPTION 1: ALL SQUAD TEAM (all squd team)
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'all_squads' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    All Active Squad Teams ({allSquads.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Explore squads created for Class {studentGrade || '7'}. Join an open squad to collaborate on tests.
                  </p>
                </div>
              </div>

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
                                Grade {sq.grade || studentGrade || '7'}{sq.division ? ` - ${sq.division}` : ''}
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
                              <span>Joined</span>
                            </span>
                          ) : isFull ? (
                            <button
                              disabled
                              className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed"
                            >
                              Squad Full
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
              OPTION 2: JOIN TEAM (join team)
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
                    <span>{joining ? 'Connecting to Squad...' : 'Confirm & Join Squad'}</span>
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

          {/* ══════════════════════════════════════════════════════════════
              OPTION 3: MY SQUAD TEAM (my squd team)
             ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'my_squad' && (
            <>
              {!team ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center max-w-xl mx-auto my-6 space-y-6 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-2xs">
                    <FiUsers className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">You Are Not in a Squad Yet</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                      Join an active collaborative squad to team up with classmates, complete quizzes together, and compete on the leaderboard.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleTabChange('all_squads')}
                      className="w-full sm:w-auto stem-btn bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                    >
                      Browse All Squad Teams
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabChange('join_team')}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
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
                          <FiUsers className="w-3.5 h-3.5" />
                          <span>My Official Squad</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                          {team.name}
                        </h2>
                        {team.slogan && (
                          <p className="text-white/80 text-sm italic">
                            "{team.slogan}"
                          </p>
                        )}
                        <p className="text-xs text-white/70">
                          Cohort: Grade {team.grade || studentGrade || '7'}{team.division ? ` - ${team.division}` : ''}
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

                  {/* Scoring Rule info */}
                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiShield className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>
                        <strong>Collaborative Points:</strong> Every quiz completed by team members contributes to your squad's total score.
                      </span>
                    </div>
                    <span className="font-bold text-[11px] bg-purple-200/60 px-2.5 py-1 rounded-full shrink-0">
                      Active Cohort
                    </span>
                  </div>

                  {/* Squad Members Roster */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <span>Squad Roster ({team.members?.length || 0})</span>
                    </h3>

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
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                      You
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-sm font-bold text-slate-900 truncate">
                                  {displayName}
                                </h4>
                                <p className="text-[11px] text-purple-600 font-semibold mb-3">
                                  {m.student_id ? `ID: ${String(m.student_id).slice(-8)}` : 'Squad Member'}
                                </p>

                                <div className="border-t border-slate-100 pt-2.5 text-xs flex items-center justify-between text-slate-600">
                                  <span>XP Points:</span>
                                  <strong className="text-slate-900">{m.points ?? 0} Pts</strong>
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
        </>
      )}
    </div>
  );
}
