import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { leaderboardService } from '../../services/api';
import {
  FiAward,
  FiZap,
  FiStar,
  FiInbox,
  FiCheckCircle,
  FiTrendingUp,
  FiUser
} from 'react-icons/fi';

export default function StudentLeaderboard() {
  const { user } = useAuth();
  const [soloRanks, setSoloRanks] = useState([]);
  const [loading, setLoading] = useState(true);

  const studentGrade = user?.grade ? String(user.grade) : '';

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const soloRes = await leaderboardService.getIndividual({
          grade: studentGrade || undefined,
        });

        const soloRaw =
          soloRes.data?.data?.top10 ||
          soloRes.data?.data ||
          (Array.isArray(soloRes.data) ? soloRes.data : []);

        if (Array.isArray(soloRaw)) {
          // If backend didn't filter by grade or returned all, guarantee filtering by student's class
          const filtered = studentGrade
            ? soloRaw.filter(
                (s) =>
                  !s.grade ||
                  String(s.grade).trim().toLowerCase() ===
                    studentGrade.trim().toLowerCase()
              )
            : soloRaw;

          // Re-index ranks for this class
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
      } catch (err) {
        console.error('Failed to load solo leaderboard:', err);
        setSoloRanks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user, studentGrade]);

  const currentUserRank = soloRanks.find((s) => s.is_current_user);
  const topStudent = soloRanks[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
            <FiAward className="w-3.5 h-3.5" />
            <span>Solo Academic Standings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Class {studentGrade || '7'} Solo STEM Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time individual performance rankings exclusive to your class cohort. Earn points by completing quizzes!
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-2xl border border-slate-200 shadow-2xs self-start sm:self-auto">
          <span className="text-xs text-slate-500 font-semibold">Your Class:</span>
          <span className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 text-xs font-extrabold">
            Class {studentGrade || '7'} {user?.division || ''}
          </span>
        </div>
      </div>

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
              Class Top Scholar
            </span>
            <div className="text-lg font-black text-slate-900 truncate max-w-[180px]">
              {topStudent ? topStudent.student_name : 'No submissions'}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">
              {topStudent ? `${topStudent.points} Pts Leader` : 'Awaiting scores'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Leaderboard Table */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold">Loading Class {studentGrade || '7'} standings...</p>
        </div>
      ) : soloRanks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto my-6">
          <FiInbox className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Class Standings Yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            No students from Class {studentGrade || '7'} have earned points yet. Take quizzes to claim the top spot!
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiTrendingUp className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                Class {studentGrade || '7'} Student Rankings
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {soloRanks.length} Active Scholars
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6 w-20">Rank</th>
                  <th className="py-4 px-6">Student Scholar</th>
                  <th className="py-4 px-6">Cohort</th>
                  <th className="py-4 px-6 text-center">Quizzes Done</th>
                  <th className="py-4 px-6 text-center">Accuracy</th>
                  <th className="py-4 px-6 text-right">Points</th>
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
    </div>
  );
}
