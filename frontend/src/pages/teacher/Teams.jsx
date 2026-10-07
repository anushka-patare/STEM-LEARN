import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { teamService } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  FiUsers,
  FiAward,
  FiCheckCircle,
  FiRefreshCw,
  FiSearch,
  FiBarChart2,
  FiPrinter,
  FiX,
  FiTarget,
  FiActivity,
  FiLayers,
  FiStar,
  FiCheck,
  FiAlertCircle,
  FiUser,
  FiPlusCircle,
  FiEdit2,
  FiTrash2,
  FiCopy,
  FiUserPlus,
  FiUserMinus,
  FiPlus,
  FiInfo
} from 'react-icons/fi';

export default function TeacherTeams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all');

  // Modal report state
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [teamReport, setTeamReport] = useState(null);
  const [activeSubjectFilter, setActiveSubjectFilter] = useState('all');

  // ─── Team Management States ───
  // 1. Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    slogan: '',
    grade: '7',
    division: 'A',
    max_members: 6,
    member_ids: []
  });
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [classStudents, setClassStudents] = useState([]);
  const [loadingClassStudents, setLoadingClassStudents] = useState(false);

  // 2. Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTeam, setEditTeam] = useState({
    id: '',
    name: '',
    slogan: '',
    max_members: 6,
    status: 'active'
  });
  const [updatingTeam, setUpdatingTeam] = useState(false);

  // 3. Manage Members Modal
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [activeManagingTeam, setActiveManagingTeam] = useState(null);
  const [candidateStudentId, setCandidateStudentId] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);

  // 4. Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [deletingTeam, setDeletingTeam] = useState(false);

  const fetchTeamsAndOverview = useCallback(async () => {
    try {
      setLoading(true);
      const teamsRes = await teamService.getTeams();
      const tData = teamsRes.data?.data || {};
      const tList = tData.teams || [];
      const summ = tData.summary || null;

      setTeams(Array.isArray(tList) ? tList : []);
      setOverview(summ);
    } catch (err) {
      toast.error('Failed to load collaborative squads from database');
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamsAndOverview();
  }, [fetchTeamsAndOverview]);

  // Fetch available students for candidate picking
  const fetchClassStudents = async (grade, division) => {
    try {
      setLoadingClassStudents(true);
      const res = await teamService.getAvailableStudents({ grade, division });
      if (res.data?.success) {
        setClassStudents(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load students for class', err);
    } finally {
      setLoadingClassStudents(false);
    }
  };

  // ─── Create Team Actions ───
  const handleOpenCreate = () => {
    const defaultGrade = user?.assigned_grade || user?.grade || '7';
    const defaultDivision = user?.assigned_division || user?.division || 'A';
    setNewTeam({
      name: '',
      slogan: '',
      grade: defaultGrade,
      division: defaultDivision,
      max_members: 6,
      member_ids: []
    });
    fetchClassStudents(defaultGrade, defaultDivision);
    setCreateModalOpen(true);
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeam.name.trim()) {
      toast.error('Please enter a team name');
      return;
    }
    setCreatingTeam(true);
    try {
      const res = await teamService.createTeam(newTeam);
      if (res.data?.success) {
        toast.success(`Collaborative Squad "${newTeam.name}" created successfully!`);
        setCreateModalOpen(false);
        fetchTeamsAndOverview();
      } else {
        toast.error(res.data?.message || 'Failed to create squad');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create squad');
    } finally {
      setCreatingTeam(false);
    }
  };

  const toggleStudentSelection = (studentId) => {
    setNewTeam((prev) => {
      const exists = prev.member_ids.includes(studentId);
      if (exists) {
        return { ...prev, member_ids: prev.member_ids.filter((id) => id !== studentId) };
      } else {
        if (prev.member_ids.length >= prev.max_members) {
          toast.error(`Squad cannot exceed maximum of ${prev.max_members} members`);
          return prev;
        }
        return { ...prev, member_ids: [...prev.member_ids, studentId] };
      }
    });
  };

  // ─── Edit Team Actions ───
  const handleOpenEdit = (t) => {
    setEditTeam({
      id: t._id,
      name: t.name || '',
      slogan: t.slogan || '',
      max_members: t.max_members || 6,
      status: t.status || 'active'
    });
    setEditModalOpen(true);
  };

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    if (!editTeam.name.trim()) {
      toast.error('Team name cannot be empty');
      return;
    }
    setUpdatingTeam(true);
    try {
      const res = await teamService.updateTeam(editTeam.id, {
        name: editTeam.name.trim(),
        slogan: editTeam.slogan.trim(),
        max_members: Number(editTeam.max_members),
        status: editTeam.status
      });
      if (res.data?.success) {
        toast.success('Squad details updated successfully!');
        setEditModalOpen(false);
        fetchTeamsAndOverview();
      } else {
        toast.error(res.data?.message || 'Failed to update squad');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update squad');
    } finally {
      setUpdatingTeam(false);
    }
  };

  // ─── Manage Members Actions ───
  const handleOpenManageMembers = (t) => {
    setActiveManagingTeam(t);
    fetchClassStudents(t.grade, t.division);
    setCandidateStudentId('');
    setMembersModalOpen(true);
  };

  const handleAddMember = async (studentId) => {
    const sId = studentId || candidateStudentId;
    if (!sId || !activeManagingTeam) {
      toast.error('Please select a student');
      return;
    }
    setAddingMember(true);
    try {
      const res = await teamService.addMember(activeManagingTeam._id, sId);
      if (res.data?.success) {
        toast.success('Student added to squad successfully!');
        setCandidateStudentId('');
        await fetchClassStudents(activeManagingTeam.grade, activeManagingTeam.division);
        const teamsRes = await teamService.getTeams();
        const tList = teamsRes.data?.data?.teams || [];
        setTeams(tList);
        const updated = tList.find((x) => x._id === activeManagingTeam._id);
        if (updated) setActiveManagingTeam(updated);
      } else {
        toast.error(res.data?.message || 'Failed to add student');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add student');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (studentId) => {
    if (!activeManagingTeam) return;
    setRemovingMemberId(studentId);
    try {
      const res = await teamService.removeMember(activeManagingTeam._id, studentId);
      if (res.data?.success) {
        toast.success('Member removed from squad');
        await fetchClassStudents(activeManagingTeam.grade, activeManagingTeam.division);
        const teamsRes = await teamService.getTeams();
        const tList = teamsRes.data?.data?.teams || [];
        setTeams(tList);
        const updated = tList.find((x) => x._id === activeManagingTeam._id);
        if (updated) setActiveManagingTeam(updated);
      } else {
        toast.error(res.data?.message || 'Failed to remove member');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  // ─── Delete Team Actions ───
  const handleOpenDelete = (t) => {
    setTeamToDelete(t);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!teamToDelete) return;
    setDeletingTeam(true);
    try {
      const res = await teamService.deleteTeam(teamToDelete._id);
      if (res.data?.success) {
        toast.success(`Squad "${teamToDelete.name}" deleted successfully!`);
        setDeleteModalOpen(false);
        setTeamToDelete(null);
        fetchTeamsAndOverview();
      } else {
        toast.error(res.data?.message || 'Failed to delete squad');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete squad');
    } finally {
      setDeletingTeam(false);
    }
  };

  // Copy Code
  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast.success(`Squad code "${code}" copied to clipboard!`);
  };



  const handleOpenReport = async (team) => {
    setSelectedTeam(team);
    setReportLoading(true);
    setTeamReport(null);
    setActiveSubjectFilter('all');
    try {
      const res = await teamService.getTeamPerformance(team._id);
      if (res.data?.success) {
        setTeamReport(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load team performance report:', err);
      toast.error('Failed to load detailed squad report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleCloseReport = () => {
    setSelectedTeam(null);
    setTeamReport(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter teams
  const filteredTeams = teams.filter((t) => {
    const q = search.toLowerCase();
    const nameMatch = t.name?.toLowerCase().includes(q);
    const codeMatch = t.code?.toLowerCase().includes(q);
    const memberMatch = t.members?.some((m) =>
      m.full_name?.toLowerCase().includes(q) || String(m.roll_number || '').includes(q)
    );
    const matchesSearch = !search || nameMatch || codeMatch || memberMatch;

    if (!matchesSearch) return false;

    if (scoreFilter === 'high') return t.avg_score >= 80;
    if (scoreFilter === 'pass') return t.avg_score >= 70 && t.avg_score < 80;
    if (scoreFilter === 'attention') return t.avg_score < 70 && t.tests_taken > 0;
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <FiUsers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Student Teams Performance
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Manage collaborative squads, member assignments, points ranking, and test performance reports.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {overview && (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black bg-purple-50 text-purple-800 border border-purple-200/80 shadow-2xs">
              <FiLayers className="w-3.5 h-3.5 text-purple-600" />
              Assigned Class: {overview.assigned_class_name || 'Grade 7-A'}
            </span>
          )}

          {/* + Create Team Button */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="stem-btn bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <FiPlusCircle className="w-4 h-4" />
            <span>Create Squad</span>
          </button>



          <button
            type="button"
            onClick={fetchTeamsAndOverview}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            title="Refresh Squads"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>



      {/* ─── Top Team Summary Cards ─── */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
              <FiUsers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{overview.total_teams || 0}</div>
              <div className="text-xs font-semibold text-slate-500">Collaborative Squads</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
              <FiUser className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{overview.total_team_members || 0}</div>
              <div className="text-xs font-semibold text-slate-500">Squad Students Enrolled</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              <FiActivity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{overview.class_team_avg_score || 0}%</div>
              <div className="text-xs font-semibold text-slate-500">Class Squad Average</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
              <FiStar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">
                {Number(overview.total_team_points || 0).toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-slate-500">
                Total Squad Points ({overview.total_tests_passed}/{overview.total_tests_taken} Passed)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Search & Filters Bar ─── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search squad by name, code, or member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="stem-input pl-10 text-xs sm:text-sm w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">Filter Squads:</span>
          <button
            type="button"
            onClick={() => setScoreFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              scoreFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Squads ({teams.length})
          </button>
          <button
            type="button"
            onClick={() => setScoreFilter('high')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              scoreFilter === 'high'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            High Performing (&ge;80%)
          </button>
          <button
            type="button"
            onClick={() => setScoreFilter('pass')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              scoreFilter === 'pass'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            Proficient (70-79%)
          </button>
        </div>
      </div>

      {/* ─── Collaborative Teams Performance Roster Table ─── */}
      {loading ? (
        <div className="min-h-[280px] flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200">
          <FiRefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
          <span className="text-xs font-bold text-slate-500">Loading collaborative squad records...</span>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="min-h-[260px] flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <FiUsers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No Teams Formed Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {search
                ? 'No squads matched your search criteria.'
                : 'Get started by creating student squads for collaborative problem-solving and quizzes.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="stem-btn bg-purple-600 hover:bg-purple-700 text-white py-2 px-5 text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <FiPlusCircle className="w-4 h-4" />
            <span>Create First Squad</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6 text-center w-20">Rank</th>
                  <th className="py-4 px-6">Collaborative Squad</th>
                  <th className="py-4 px-6">Class</th>
                  <th className="py-4 px-6">Active Members</th>
                  <th className="py-4 px-6 text-right">Team Points</th>
                  <th className="py-4 px-6 text-center">Tests Taken / Passed</th>
                  <th className="py-4 px-6">Average Squad Score</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeams.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* 1. Squad Rank */}
                    <td className="py-4 px-6 text-center">
                      {t.rank === 1 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-black text-amber-800 bg-amber-50 border border-amber-300 shadow-2xs text-xs">
                          🥇 #1
                        </span>
                      ) : t.rank === 2 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-black text-slate-700 bg-slate-100 border border-slate-300 shadow-2xs text-xs">
                          🥈 #2
                        </span>
                      ) : t.rank === 3 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-black text-orange-800 bg-orange-50 border border-orange-300 shadow-2xs text-xs">
                          🥉 #3
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-slate-600 bg-slate-100 text-xs">
                          #{t.rank || '-'}
                        </span>
                      )}
                    </td>

                    {/* 2. Collaborative Squad Name & Code */}
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                          {t.name?.charAt(0)?.toUpperCase() || 'T'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                          {t.slogan && (
                            <div className="text-[11px] text-slate-400 italic line-clamp-1">{t.slogan}</div>
                          )}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mt-0.5">
                            <span>Code:</span>
                            <span className="font-mono text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                              {t.code || 'SQUAD'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(t.code)}
                              className="text-slate-400 hover:text-purple-600 transition-colors p-0.5 cursor-pointer"
                              title="Copy Squad Code"
                            >
                              <FiCopy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 3. Class */}
                    <td className="py-4 px-6 text-xs text-slate-700 font-bold whitespace-nowrap">
                      Grade {t.grade}-{t.division || 'A'}
                    </td>

                    {/* 4. Active Members Chips */}
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                        {t.members?.length > 0 ? (
                          t.members.map((m) => (
                            <span
                              key={m._id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                              {m.full_name} (#{m.roll_number || '1'})
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No members yet</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenManageMembers(t)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
                          title="Add or remove members"
                        >
                          <FiUserPlus className="w-3 h-3" />
                          <span>Manage</span>
                        </button>
                      </div>
                    </td>

                    {/* 5. Team Points */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">
                        <FiStar className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
                        {Number(t.points || 0).toLocaleString()} pts
                      </span>
                    </td>

                    {/* 6. Tests Taken / Passed */}
                    <td className="py-4 px-6 text-center text-xs whitespace-nowrap">
                      <div className="font-bold text-slate-800">
                        {t.tests_passed} / {t.tests_taken} Passed
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {t.pass_rate}% Pass Rate
                      </div>
                    </td>

                    {/* 7. Average Squad Score Bar */}
                    <td className="py-4 px-6 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              t.avg_score >= 80
                                ? 'bg-emerald-500'
                                : t.avg_score >= 70
                                ? 'bg-blue-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, t.avg_score || 0)}%` }}
                          />
                        </div>
                        <span className="font-extrabold text-slate-800">{t.avg_score}%</span>
                      </div>
                    </td>

                    {/* 8. Actions */}
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenReport(t)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 shadow-2xs transition-all cursor-pointer"
                          title="View Performance Report"
                        >
                          <FiBarChart2 className="w-3.5 h-3.5" />
                          <span>Report</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenManageMembers(t)}
                          className="p-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all cursor-pointer border border-blue-200"
                          title="Manage Members"
                        >
                          <FiUserPlus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all cursor-pointer border border-amber-200"
                          title="Edit Squad Details"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDelete(t)}
                          className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all cursor-pointer border border-rose-200"
                          title="Delete Squad"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── CREATE TEAM MODAL ─── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-6 py-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center font-bold">
                  <FiPlusCircle className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">Create Collaborative Squad</h2>
                  <p className="text-xs text-purple-200">Form a new peer-learning squad for tests & quizzes.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-2 text-purple-200 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="overflow-y-auto p-6 space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Squad Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Quantum Explorers"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    className="stem-input text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Slogan / Motto
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Learn, Innovate, Excel"
                    value={newTeam.slogan}
                    onChange={(e) => setNewTeam({ ...newTeam, slogan: e.target.value })}
                    className="stem-input text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Grade
                  </label>
                  <input
                    type="text"
                    value={newTeam.grade}
                    onChange={(e) => {
                      setNewTeam({ ...newTeam, grade: e.target.value });
                      fetchClassStudents(e.target.value, newTeam.division);
                    }}
                    className="stem-input text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Division
                  </label>
                  <input
                    type="text"
                    value={newTeam.division}
                    onChange={(e) => {
                      setNewTeam({ ...newTeam, division: e.target.value });
                      fetchClassStudents(newTeam.grade, e.target.value);
                    }}
                    className="stem-input text-xs sm:text-sm uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Max Members
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={newTeam.max_members}
                    onChange={(e) => setNewTeam({ ...newTeam, max_members: Number(e.target.value) })}
                    className="stem-input text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Select Initial Members */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Add Initial Members from Class ({newTeam.member_ids.length} of {newTeam.max_members} selected)
                  </label>
                  <span className="text-[11px] text-slate-400">Optional</span>
                </div>

                {loadingClassStudents ? (
                  <div className="p-4 text-center text-xs text-slate-500">Loading students...</div>
                ) : classStudents.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                    No active students found in Grade {newTeam.grade}-{newTeam.division}
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                    {classStudents.map((s) => {
                      const selected = newTeam.member_ids.includes(s._id);
                      return (
                        <div
                          key={s._id}
                          onClick={() => toggleStudentSelection(s._id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                            selected
                              ? 'bg-purple-50 border-purple-300 text-purple-900'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => {}}
                              className="rounded text-purple-600 focus:ring-purple-500"
                            />
                            <div>
                              <div className="font-bold">{s.full_name}</div>
                              <div className="text-[10px] text-slate-400">
                                Roll #{s.roll_number || 'N/A'} • {s.points || 0} pts
                              </div>
                            </div>
                          </div>
                          {s.has_team && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                              in {s.team_name || 'other squad'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTeam}
                  className="stem-btn bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {creatingTeam ? 'Creating...' : 'Create Squad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT TEAM MODAL ─── */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                  <FiEdit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">Edit Squad Details</h2>
                  <p className="text-xs text-slate-400">Update name, motto, and squad settings.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTeam} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Squad Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTeam.name}
                  onChange={(e) => setEditTeam({ ...editTeam, name: e.target.value })}
                  className="stem-input text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Slogan / Motto
                </label>
                <input
                  type="text"
                  value={editTeam.slogan}
                  onChange={(e) => setEditTeam({ ...editTeam, slogan: e.target.value })}
                  className="stem-input text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Max Members
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={editTeam.max_members}
                    onChange={(e) => setEditTeam({ ...editTeam, max_members: Number(e.target.value) })}
                    className="stem-input text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Squad Status
                  </label>
                  <select
                    value={editTeam.status}
                    onChange={(e) => setEditTeam({ ...editTeam, status: e.target.value })}
                    className="stem-input text-xs sm:text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingTeam}
                  className="stem-btn bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {updatingTeam ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MANAGE MEMBERS MODAL ─── */}
      {membersModalOpen && activeManagingTeam && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-6 py-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center font-bold">
                  <FiUsers className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">
                    Manage Squad: {activeManagingTeam.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-blue-200">
                    <span>Grade {activeManagingTeam.grade}-{activeManagingTeam.division || 'A'}</span>
                    <span>•</span>
                    <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded font-bold">
                      Code: {activeManagingTeam.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(activeManagingTeam.code)}
                      className="text-amber-300 hover:text-white underline text-[11px] cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMembersModalOpen(false)}
                className="p-2 text-blue-200 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6 flex-1">
              {/* Add New Member Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <FiUserPlus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Add Student from Class</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={candidateStudentId}
                    onChange={(e) => setCandidateStudentId(e.target.value)}
                    className="stem-input text-xs sm:text-sm flex-1"
                  >
                    <option value="">-- Select Student to Add --</option>
                    {classStudents
                      .filter((s) => !activeManagingTeam.members?.some((m) => m._id === s._id))
                      .map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.full_name} (Roll #{s.roll_number || 'N/A'}{s.has_team ? ` • in ${s.team_name}` : ' • Unassigned'})
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAddMember(candidateStudentId)}
                    disabled={!candidateStudentId || addingMember}
                    className="stem-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    {addingMember ? 'Adding...' : 'Add to Squad'}
                  </button>
                </div>
              </div>

              {/* Current Active Members List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Current Squad Members ({activeManagingTeam.members?.length || 0})
                  </h3>
                  <span className="text-xs text-slate-400">
                    Max capacity: {activeManagingTeam.max_members || 6}
                  </span>
                </div>

                {!activeManagingTeam.members || activeManagingTeam.members.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                    No members in this squad yet. Select a student above or share the team code.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                    {activeManagingTeam.members.map((m) => (
                      <div
                        key={m._id}
                        className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                            {m.full_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">{m.full_name}</div>
                            <div className="text-[11px] text-slate-400">
                              Roll #{m.roll_number || 'N/A'} • {m.points || 0} pts
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m._id)}
                          disabled={removingMemberId === m._id}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {removingMemberId === m._id ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setMembersModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE TEAM CONFIRMATION MODAL ─── */}
      {deleteModalOpen && teamToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <FiAlertCircle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Squad?</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-800 font-bold">{teamToDelete.name}</strong>?
              </p>
              <p className="text-[11px] text-rose-600 mt-2 bg-rose-50 p-2.5 rounded-xl border border-rose-100 font-medium">
                All enrolled students will be unassigned and reverted to solo status.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingTeam}
                className="stem-btn bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {deletingTeam ? 'Deleting...' : 'Yes, Delete Squad'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DETAILED TEAM PERFORMANCE REPORT MODAL ─── */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-black flex items-center justify-center text-base shadow-sm">
                  {selectedTeam.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black tracking-tight">{selectedTeam.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Code: {selectedTeam.code}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      Grade {selectedTeam.grade}-{selectedTeam.division || 'A'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Collaborative Squad Academic Performance & Subject Test Report
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-all"
                  title="Print Report Card"
                >
                  <FiPrinter className="w-3.5 h-3.5" />
                  Print Report
                </button>
                <button
                  type="button"
                  onClick={handleCloseReport}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1">
              {reportLoading ? (
                <div className="min-h-[350px] flex flex-col items-center justify-center gap-3">
                  <FiRefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
                  <span className="text-xs font-bold text-slate-500">Generating team analytics report...</span>
                </div>
              ) : !teamReport ? (
                <div className="min-h-[250px] flex flex-col items-center justify-center gap-2 text-slate-400">
                  <FiAlertCircle className="w-8 h-8" />
                  <span className="text-xs font-bold">No performance records found for this squad.</span>
                </div>
              ) : (
                <>
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-purple-50/80 p-4 rounded-2xl border border-purple-100">
                      <div className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                        Squad Rank
                      </div>
                      <div className="text-2xl font-black text-purple-900 mt-1">
                        #{teamReport.team_details?.rank || selectedTeam.rank || 1}
                      </div>
                      <div className="text-[11px] text-purple-600 mt-0.5">
                        Class Standing
                      </div>
                    </div>

                    <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-100">
                      <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                        Collaborative XP
                      </div>
                      <div className="text-2xl font-black text-amber-900 mt-1">
                        {teamReport.team_details?.points || selectedTeam.points || 0} pts
                      </div>
                      <div className="text-[11px] text-amber-600 mt-0.5">
                        Total Points Accrued
                      </div>
                    </div>

                    <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100">
                      <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                        Tests Passed
                      </div>
                      <div className="text-2xl font-black text-emerald-900 mt-1">
                        {teamReport.overall_performance?.tests_passed || 0} /{' '}
                        {teamReport.overall_performance?.tests_taken || 0}
                      </div>
                      <div className="text-[11px] text-emerald-600 mt-0.5">
                        {teamReport.overall_performance?.pass_rate || 0}% Success Rate
                      </div>
                    </div>

                    <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-100">
                      <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                        Average Score
                      </div>
                      <div className="text-2xl font-black text-blue-900 mt-1">
                        {teamReport.overall_performance?.avg_score || 0}%
                      </div>
                      <div className="text-[11px] text-blue-600 mt-0.5">
                        Cumulative Mastery
                      </div>
                    </div>
                  </div>

                  {/* Section: Member Contributions */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <FiUsers className="w-4 h-4 text-purple-600" />
                      <span>Member Contributions & Points Breakdown</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {teamReport.members?.map((m) => (
                        <div
                          key={m._id}
                          className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                              {m.full_name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs">{m.full_name}</div>
                              <div className="text-[10px] text-slate-400">
                                Roll #{m.roll_number || '1'}
                              </div>
                            </div>
                          </div>
                          <span className="font-black text-xs text-purple-700 bg-white px-2.5 py-1 rounded-xl border border-purple-200">
                            {m.points || 0} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section: Subject-Wise Mastery Radar */}
                  {teamReport.subject_performance?.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <FiTarget className="w-4 h-4 text-purple-600" />
                        <span>Subject-Wise Performance & Pass Rates</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {teamReport.subject_performance.map((s) => (
                          <div
                            key={s.subject}
                            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2"
                          >
                            <div className="font-bold text-slate-900 text-xs truncate">
                              {s.subject}
                            </div>
                            <div className="flex items-baseline justify-between text-xs">
                              <span className="text-slate-400 text-[11px]">Avg Score:</span>
                              <strong className="text-slate-900 font-black">{s.avg_score}%</strong>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  s.avg_score >= 80
                                    ? 'bg-emerald-500'
                                    : s.avg_score >= 70
                                    ? 'bg-blue-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, s.avg_score)}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-400 flex justify-between">
                              <span>Passed: {s.passed}/{s.taken}</span>
                              <span className="font-bold text-slate-600">{s.pass_rate}% Pass</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section: Test-by-Test Attempts Record */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <FiBarChart2 className="w-4 h-4 text-purple-600" />
                        <span>Recent Test-Wise Performance Records</span>
                      </h3>

                      {/* Subject Filter */}
                      {teamReport.subject_performance?.length > 1 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                          <button
                            type="button"
                            onClick={() => setActiveSubjectFilter('all')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                              activeSubjectFilter === 'all'
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            All Subjects
                          </button>
                          {teamReport.subject_performance.map((sp) => (
                            <button
                              key={sp.subject}
                              type="button"
                              onClick={() => setActiveSubjectFilter(sp.subject)}
                              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
                                activeSubjectFilter === sp.subject
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {sp.subject}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                          <tr>
                            <th className="py-3 px-4">Subject</th>
                            <th className="py-3 px-4">Test / Quiz</th>
                            <th className="py-3 px-4">Student</th>
                            <th className="py-3 px-4 text-center">Score</th>
                            <th className="py-3 px-4 text-center">Percentage</th>
                            <th className="py-3 px-4 text-center">Status</th>
                            <th className="py-3 px-4 text-right">Points</th>
                            <th className="py-3 px-4">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {teamReport.test_records
                            ?.filter(
                              (t) =>
                                activeSubjectFilter === 'all' ||
                                t.subject === activeSubjectFilter
                            )
                            .map((t, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/70">
                                <td className="py-3 px-4 font-bold text-slate-800">
                                  {t.subject}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900">
                                    {t.quiz_title}
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-bold text-purple-700">
                                  {t.student_name} (#{t.student_roll})
                                </td>
                                <td className="py-3 px-4 text-center font-bold text-slate-800">
                                  {t.score} / {t.total_marks}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`font-black text-xs ${
                                      t.passed ? 'text-emerald-700' : 'text-rose-600'
                                    }`}
                                  >
                                    {t.score_percentage}%
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {t.passed ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      <FiCheck className="w-3 h-3 text-emerald-600" />
                                      PASSED
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[10px] bg-rose-100 text-rose-800 border border-rose-200">
                                      <FiX className="w-3 h-3 text-rose-600" />
                                      FAILED
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {t.points_earned > 0 ? (
                                    <span className="font-black text-purple-700">
                                      +{t.points_earned} pts
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-bold">0 pts</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                  {t.formatted_date}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={handleCloseReport}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
