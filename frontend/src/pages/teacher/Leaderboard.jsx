import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { leaderboardService } from '../../services/api';
import { FiAward, FiUsers, FiDownload, FiRefreshCw, FiTrendingUp } from 'react-icons/fi';

export default function TeacherLeaderboard() {
  const [activeTab, setActiveTab] = useState('collaborative');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [collaborativeData, setCollaborativeData] = useState([]);
  const [competitiveData, setCompetitiveData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboards = async () => {
    setLoading(true);
    try {
      const params = selectedGrade ? { grade: selectedGrade } : {};
      const [collabRes, compRes] = await Promise.all([
        leaderboardService.getCollaborative(params),
        leaderboardService.getCompetitive(params),
      ]);
      setCollaborativeData(collabRes.data?.data || []);
      setCompetitiveData(compRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load leaderboard data:', err);
      toast.error('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboards();
  }, [selectedGrade]);

  const currentList = activeTab === 'collaborative' ? collaborativeData : competitiveData;

  const handleExportCSV = () => {
    if (currentList.length === 0) {
      toast.error('No leaderboard data available to export');
      return;
    }

    const csvContent =
      'data:text/csv;charset=utf-8,Rank,Name,Grade,Division,Score\n' +
      (activeTab === 'collaborative'
        ? collaborativeData.map((s) => `${s.rank},"${s.name}",Grade ${s.grade || ''},Squad,${s.score || s.total_points || 0}`).join('\n')
        : competitiveData.map((s) => `${s.rank},"${s.full_name}",Grade ${s.grade || ''},${s.division || 'A'},${s.points || 0}`).join('\n'));

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leaderboard_${activeTab}_grade_${selectedGrade || 'all'}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leaderboard exported to CSV successfully!');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FiAward className="w-8 h-8 text-amber-500" />
            Class Leaderboard Central
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Supervise both Collaborative Squad standings and Competitive Solo rankings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Grade filter */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="stem-input text-xs sm:text-sm py-2 px-3 border border-slate-300 rounded-xl bg-white"
          >
            <option value="">All Grades (6–9)</option>
            <option value="6">Grade 6</option>
            <option value="7">Grade 7</option>
            <option value="8">Grade 8</option>
            <option value="9">Grade 9</option>
          </select>

          <button
            type="button"
            onClick={handleExportCSV}
            className="stem-btn stem-btn-secondary py-2 px-4 text-xs font-bold flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl cursor-pointer"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-200/80 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('collaborative')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'collaborative'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-700'
              }`}
            >
              Squad Standings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('competitive')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'competitive'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700'
              }`}
            >
              Solo Standings
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[260px] flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200">
          <FiRefreshCw className="w-7 h-7 text-amber-500 animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Loading standings...</span>
        </div>
      ) : currentList.length === 0 ? (
        <div className="min-h-[260px] flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center">
          <FiAward className="w-10 h-10 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700">No Standings Recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            {activeTab === 'collaborative'
              ? 'No collaborative squads found for this grade. Ensure teams have submitted quiz attempts.'
              : 'No student scores recorded yet for this grade.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Rank</th>
                  <th className="py-4 px-6">
                    {activeTab === 'collaborative' ? 'Squad Team Name' : 'Student Name'}
                  </th>
                  <th className="py-4 px-6">Grade / Section</th>
                  <th className="py-4 px-6">
                    {activeTab === 'collaborative' ? 'Squad Members' : 'Student ID'}
                  </th>
                  <th className="py-4 px-6 text-right">Points / Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentList.map((item) => (
                  <tr key={item.rank || item._id || item.student_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center ${
                        item.rank === 1
                          ? 'bg-amber-100 text-amber-800'
                          : item.rank === 2
                          ? 'bg-slate-200 text-slate-800'
                          : item.rank === 3
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.rank}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {activeTab === 'collaborative' ? item.name : item.full_name}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      Grade {item.grade || '-'}{item.division ? `-${item.division}` : ''}
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold text-slate-600">
                      {activeTab === 'collaborative'
                        ? `${item.member_count || 0} Members (${item.scoring_method || 'average'})`
                        : item.student_id || 'STU-ID'}
                    </td>
                    <td className="py-4 px-6 text-right font-black text-slate-900">
                      {activeTab === 'collaborative' ? `${item.score || item.total_points || 0} Pts` : `${item.points || 0} Pts`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

