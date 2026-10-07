import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { toast } from 'react-hot-toast';
import Avatar from '../../components/Avatar';
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiEye,
  FiKey,
  FiSlash,
  FiCheckCircle,
  FiAlertCircle,
  FiSearch,
  FiX,
  FiUser,
  FiMail,
  FiLock,
  FiBookOpen,
  FiAward,
  FiPhone,
  FiLayers,
  FiRefreshCw,
  FiEyeOff,
  FiShield,
  FiCalendar,
} from 'react-icons/fi';

const SUBJECT_OPTIONS = [
  'Integrated Science',
  'Physics & Mechanics',
  'Chemistry & Materials',
  'Biology & Life Sciences',
  'Applied Mathematics',
  'Computer Science & AI',
  'Robotics & Engineering',
  'Environmental Science',
];

const formatAssignedClass = (teacher) => {
  if (!teacher) return 'Unassigned';
  if (teacher.assigned_grade && teacher.assigned_division) {
    return `Grade ${teacher.assigned_grade}-${teacher.assigned_division}`;
  }
  if (Array.isArray(teacher.assigned_classes) && teacher.assigned_classes.length > 0) {
    const first = teacher.assigned_classes[0];
    if (typeof first === 'string' && first.trim()) return first;
    if (typeof first === 'object' && first !== null && first.grade && first.division) {
      return `Grade ${first.grade}-${first.division}`;
    }
  }
  return 'Unassigned';
};

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'approvals'
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalAllocation, setApprovalAllocation] = useState({
    grade: '7',
    division: 'A',
    subject: 'Science',
  });

  // Active teacher for view / edit / password / approval
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Form states
  const [newTeacher, setNewTeacher] = useState({
    full_name: '',
    teacher_id: '',
    email: '',
    password: '',
    subject_specialization: '',
    assigned_grade: '7',
    assigned_division: 'A',
    assigned_subject: 'Integrated Science',
    education: '',
    mobile: '',
  });

  const [editTeacher, setEditTeacher] = useState({
    full_name: '',
    teacher_id: '',
    email: '',
    subject_specialization: '',
    assigned_grade: '7',
    assigned_division: 'A',
    assigned_subject: 'Integrated Science',
    education: '',
    mobile: '',
    status: 'active',
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Helper to generate auto-filled Teacher ID
  const generateTeacherId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `TCH-${randomNum}`;
  };

  // Fetch teachers from backend
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const [allRes, pendingRes] = await Promise.allSettled([
        adminService.getTeachers({ limit: 100 }),
        adminService.getPendingTeachers(),
      ]);

      if (allRes.status === 'fulfilled' && allRes.value.data?.success && allRes.value.data?.data?.teachers) {
        setTeachers(allRes.value.data.data.teachers);
      }
      if (pendingRes.status === 'fulfilled' && pendingRes.value.data?.success && pendingRes.value.data?.data) {
        setPendingTeachers(pendingRes.value.data.data);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Open Add Modal with auto-filled Teacher ID
  const handleOpenAdd = () => {
    setNewTeacher({
      full_name: '',
      teacher_id: generateTeacherId(),
      email: '',
      password: '',
      subject_specialization: '',
      assigned_grade: '7',
      assigned_division: 'A',
      assigned_subject: 'Integrated Science',
      education: '',
      mobile: '',
    });
    setShowAddPassword(false);
    setShowAddModal(true);
  };

  // Refresh auto-generated Teacher ID
  const handleRegenerateId = () => {
    setNewTeacher((prev) => ({ ...prev, teacher_id: generateTeacherId() }));
  };

  // Submit Add Teacher
  const handleCreateTeacher = async (e) => {
    e.preventDefault();

    if (!newTeacher.full_name.trim() || !newTeacher.email.trim() || !newTeacher.password) {
      toast.error('Please fill in Full Name, Email, and Password');
      return;
    }

    if (newTeacher.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    const assignedClassStr = `Grade ${newTeacher.assigned_grade}-${newTeacher.assigned_division}`;

    const payload = {
      full_name: newTeacher.full_name.trim(),
      teacher_id: newTeacher.teacher_id.trim() || generateTeacherId(),
      email: newTeacher.email.trim().toLowerCase(),
      password: newTeacher.password,
      subject: newTeacher.assigned_subject,
      subject_specialization: newTeacher.subject_specialization.trim() || newTeacher.assigned_subject,
      assigned_grade: newTeacher.assigned_grade,
      assigned_division: newTeacher.assigned_division,
      assigned_subject: newTeacher.assigned_subject,
      assigned_classes: [assignedClassStr],
      education: newTeacher.education.trim(),
      mobile: newTeacher.mobile.trim(),
      status: 'active',
    };

    setActionLoading(true);
    try {
      const res = await adminService.createTeacher(payload);
      if (res.data?.success) {
        toast.success(`Teacher ${newTeacher.full_name} appointed successfully!`);
        setShowAddModal(false);
        fetchTeachers();
      } else {
        toast.error(res.data?.message || 'Failed to appoint teacher');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to appoint teacher');
    } finally {
      setActionLoading(false);
    }
  };

  // Open View Modal
  const handleOpenView = (teacher) => {
    setSelectedTeacher(teacher);
    setShowViewModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (teacher) => {
    setSelectedTeacher(teacher);
    let g = teacher.assigned_grade || '7';
    let d = teacher.assigned_division || 'A';
    if (!teacher.assigned_grade && Array.isArray(teacher.assigned_classes) && teacher.assigned_classes.length > 0) {
      const first = teacher.assigned_classes[0];
      if (typeof first === 'string' && first.includes('Grade ') && first.includes('-')) {
        const parts = first.replace('Grade ', '').split('-');
        g = parts[0] || '7';
        d = parts[1] || 'A';
      } else if (typeof first === 'object' && first !== null) {
        g = first.grade || '7';
        d = first.division || 'A';
      }
    }

    setEditTeacher({
      full_name: teacher.full_name || teacher.name || '',
      teacher_id: teacher.teacher_id || '',
      email: teacher.email || '',
      subject_specialization: teacher.subject_specialization || teacher.subject || 'General Science',
      assigned_grade: g,
      assigned_division: d,
      assigned_subject: teacher.assigned_subject || teacher.subject || 'Integrated Science',
      education: teacher.education || '',
      mobile: teacher.mobile || '',
      status: teacher.status || 'active',
    });
    setShowEditModal(true);
  };

  // Submit Edit Teacher
  const handleUpdateTeacher = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    const assignedClassStr = `Grade ${editTeacher.assigned_grade}-${editTeacher.assigned_division}`;

    const payload = {
      full_name: editTeacher.full_name.trim(),
      teacher_id: editTeacher.teacher_id.trim(),
      email: editTeacher.email.trim().toLowerCase(),
      subject: editTeacher.assigned_subject,
      subject_specialization: editTeacher.subject_specialization.trim() || editTeacher.assigned_subject,
      assigned_grade: editTeacher.assigned_grade,
      assigned_division: editTeacher.assigned_division,
      assigned_subject: editTeacher.assigned_subject,
      assigned_classes: [assignedClassStr],
      education: editTeacher.education.trim(),
      mobile: editTeacher.mobile.trim(),
      status: editTeacher.status,
    };

    setActionLoading(true);
    try {
      await adminService.updateTeacher(selectedTeacher._id, payload);
      toast.success('Teacher details updated successfully!');
      setShowEditModal(false);
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update teacher');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Change Password Modal
  const handleOpenPassword = (teacher) => {
    setSelectedTeacher(teacher);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setShowResetPassword(false);
    setShowResetConfirmPassword(false);
    setShowPasswordModal(true);
  };

  // Submit Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please enter and confirm the new password');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.resetTeacherPassword(selectedTeacher._id, passwordForm.newPassword);
      toast.success(`Password reset for ${selectedTeacher.full_name}!`);
      setShowPasswordModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Block / Unblock
  const handleToggleBlock = async (teacher) => {
    const nextStatus = teacher.status === 'blocked' ? 'active' : 'blocked';
    const actionName = nextStatus === 'blocked' ? 'block' : 'unblock';

    if (!window.confirm(`Are you sure you want to ${actionName} ${teacher.full_name}?`)) {
      return;
    }

    try {
      await adminService.updateTeacher(teacher._id, { status: nextStatus });
      toast.success(`Teacher is now ${nextStatus}`);
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Delete Teacher
  const handleDeleteTeacher = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete faculty account for ${name}?`)) {
      try {
        await adminService.deleteTeacher(id);
        toast.success(`Faculty account for ${name} deleted.`);
        fetchTeachers();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete teacher');
      }
    }
  };

  // Filtered teachers list
  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      (t.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.teacher_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subject_specialization || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subject || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || (t.status || 'active') === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Teacher Approvals Handlers
  const handleOpenApprove = (teacher) => {
    setSelectedTeacher(teacher);
    setApprovalAllocation({
      grade: teacher.assigned_grade || '7',
      division: teacher.assigned_division || 'A',
      subject: teacher.subject_specialization || 'Science',
    });
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    setActionLoading(true);
    try {
      const assignedClassStr = `Grade ${approvalAllocation.grade}-${approvalAllocation.division}`;
      await adminService.approveTeacher(selectedTeacher._id, {
        assigned_classes: [assignedClassStr],
        subject_specialization: approvalAllocation.subject,
      });
      toast.success(`Teacher ${selectedTeacher.full_name} approved and activated!`);
      setShowApproveModal(false);
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve teacher');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (teacher) => {
    setSelectedTeacher(teacher);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    setActionLoading(true);
    try {
      await adminService.rejectTeacher(selectedTeacher._id, { reason: rejectReason });
      toast.success(`Teacher ${selectedTeacher.full_name} rejected.`);
      setShowRejectModal(false);
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject application');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ─── Top Header & Controls ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/20">
              <FiBookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Teacher Faculty Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Appoint faculty members, assign STEM grades & divisions, approve applicant teachers, and monitor account status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-6 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all self-start md:self-auto"
          >
            <FiPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Appoint New Teacher</span>
          </button>
        </div>
      </div>

      {/* ─── Top Level Tabs ─── */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-4 text-xs sm:text-sm font-black transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
            activeTab === 'all'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>All Faculty ({teachers.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 px-4 text-xs sm:text-sm font-black transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
            activeTab === 'approvals'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Teacher Approvals</span>
          {pendingTeachers.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
              {pendingTeachers.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'approvals' ? (
        /* ─── Pending Approvals Tab ─── */
        <div className="space-y-4">
          {pendingTeachers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <FiCheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Pending Teacher Applications</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All educator onboarding submissions have been reviewed and approved.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pendingTeachers.map((t) => (
                <div
                  key={t._id}
                  className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-md hover:shadow-lg transition-all space-y-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                    Pending Approval
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 font-black text-lg flex items-center justify-center">
                      {t.full_name?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">{t.full_name}</h4>
                      <p className="text-xs text-slate-500">{t.email}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <p><span className="font-bold text-slate-700">Qualification:</span> {t.qualification || 'N/A'}</p>
                    <p><span className="font-bold text-slate-700">Specialization:</span> {t.subject_specialization || 'STEM'}</p>
                    <p><span className="font-bold text-slate-700">Mobile:</span> {t.mobile || 'N/A'}</p>
                    <p><span className="font-bold text-slate-700">Applied:</span> {new Date(t.created_at).toLocaleDateString()}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenApprove(t)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <FiCheckCircle className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenReject(t)}
                      className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer"
                    >
                      <FiX className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ─── All Teachers Tab ─── */
        <>

      {/* ─── Search & Status Filters ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by teacher name, email, ID, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-600/30 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
            Status:
          </span>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-purple-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({teachers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({teachers.filter((t) => (t.status || 'active') === 'active').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('blocked')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'blocked'
                  ? 'bg-white text-rose-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Blocked ({teachers.filter((t) => t.status === 'blocked').length})
            </button>
          </div>
        </div>
      </div>

      {/* ─── Teachers Table ─── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">Teacher Profile</th>
                <th className="py-4 px-6">Subject & Specialization</th>
                <th className="py-4 px-6">Assigned Class & Div</th>
                <th className="py-4 px-6">Education</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <FiUser className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold">No teachers found matching your criteria</p>
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t) => {
                  const isBlocked = t.status === 'blocked';
                  const assignedClassText = formatAssignedClass(t);

                  return (
                    <tr
                      key={t._id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isBlocked ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* 1. Teacher Profile */}
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={t.profile_photo?.thumbnail_url || t.photo}
                            name={t.full_name || 'Teacher'}
                            size="md"
                            role="teacher"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{t.full_name}</span>
                              {isBlocked && (
                                <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-md font-extrabold uppercase">
                                  Blocked
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal flex items-center gap-2 mt-0.5">
                              <span>{t.email}</span>
                              <span className="text-slate-300">•</span>
                              <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md font-bold text-[10px]">
                                {t.teacher_id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Specialization */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800">
                          {t.assigned_subject || t.subject || 'General STEM'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal">
                          {t.subject_specialization || 'STEM Education'}
                        </div>
                      </td>

                      {/* 3. Assigned Class & Division */}
                      <td className="py-4 px-6 text-slate-700 font-semibold">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 text-xs font-bold">
                          <FiLayers className="w-3.5 h-3.5 text-purple-600" />
                          <span>{assignedClassText}</span>
                        </div>
                      </td>

                      {/* 4. Education */}
                      <td className="py-4 px-6 text-slate-500">
                        {t.education || 'Master in Education'}
                      </td>

                      {/* 5. Status Badge */}
                      <td className="py-4 px-6">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                            <FiAlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* 6. Action Icons (View, Edit, Change Password, Block/Unblock, Delete) */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* 1. View Action */}
                          <button
                            type="button"
                            onClick={() => handleOpenView(t)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all hover:scale-110 cursor-pointer"
                            title="View Teacher Profile"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>

                          {/* 2. Edit Action */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(t)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all hover:scale-110 cursor-pointer"
                            title="Edit Faculty Details"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>

                          {/* 3. Change Password Action */}
                          <button
                            type="button"
                            onClick={() => handleOpenPassword(t)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all hover:scale-110 cursor-pointer"
                            title="Change / Reset Password"
                          >
                            <FiKey className="w-4 h-4" />
                          </button>

                          {/* 4. Block / Unblock Action */}
                          <button
                            type="button"
                            onClick={() => handleToggleBlock(t)}
                            className={`p-2 rounded-xl transition-all hover:scale-110 cursor-pointer ${
                              isBlocked
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-rose-600'
                            }`}
                            title={isBlocked ? 'Unblock Faculty Account' : 'Block Faculty Account'}
                          >
                            {isBlocked ? (
                              <FiCheckCircle className="w-4 h-4" />
                            ) : (
                              <FiSlash className="w-4 h-4" />
                            )}
                          </button>

                          {/* 5. Delete Action */}
                          <button
                            type="button"
                            onClick={() => handleDeleteTeacher(t._id, t.full_name)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all hover:scale-110 cursor-pointer"
                            title="Delete Teacher"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
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

      {/* ════════════════════════════════════════════════════════════════
          MODAL 1: REDESIGNED "APPOINT NEW TEACHER" BOX
          ════════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/20">
                  <FiPlus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Appoint New Faculty Member
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assign teacher ID, credentials, class division, and STEM curriculum subject
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-5">
              {/* ── Group 1: Identity & Credentials ── */}
              <div className="space-y-3">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <FiUser className="w-3.5 h-3.5" />
                  <span>Faculty Identity & Login Credentials</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Rajesh Rao"
                        value={newTeacher.full_name}
                        onChange={(e) =>
                          setNewTeacher({ ...newTeacher, full_name: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-600/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Teacher ID (AUTO-FILLED) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        Teacher ID * <span className="text-[10px] text-purple-600 font-semibold">(Auto-Filled)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleRegenerateId}
                        className="text-[11px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer"
                        title="Generate another ID"
                      >
                        <FiRefreshCw className="w-3 h-3" />
                        <span>Regenerate</span>
                      </button>
                    </div>
                    <div className="relative">
                      <FiAward className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-600 w-4 h-4 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={newTeacher.teacher_id}
                        onChange={(e) =>
                          setNewTeacher({ ...newTeacher, teacher_id: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2.5 bg-purple-50/60 font-mono font-bold text-xs sm:text-sm text-purple-900 border border-purple-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-600/30 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Faculty Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Faculty Email *
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                      <input
                        type="email"
                        required
                        placeholder="teacher@school.edu"
                        value={newTeacher.email}
                        onChange={(e) =>
                          setNewTeacher({ ...newTeacher, email: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-600/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                      <input
                        type={showAddPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={newTeacher.password}
                        onChange={(e) =>
                          setNewTeacher({ ...newTeacher, password: e.target.value })
                        }
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-600/30 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAddPassword(!showAddPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        {showAddPassword ? (
                          <FiEyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <FiEye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Group 2: Class, Division & Subject Assignment ── */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <FiLayers className="w-3.5 h-3.5" />
                  <span>Class Cohort, Division & Subject Assignment</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Assigned Class / Grade */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Assigned Class *
                    </label>
                    <select
                      value={newTeacher.assigned_grade}
                      onChange={(e) =>
                        setNewTeacher({ ...newTeacher, assigned_grade: e.target.value })
                      }
                      className="w-full px-3 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm font-semibold text-slate-800 border border-slate-200 focus:outline-hidden cursor-pointer"
                    >
                      <option value="6">Grade 6</option>
                      <option value="7">Grade 7</option>
                      <option value="8">Grade 8</option>
                      <option value="9">Grade 9</option>
                    </select>
                  </div>

                  {/* Assign Division */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Assign Division *
                    </label>
                    <select
                      value={newTeacher.assigned_division}
                      onChange={(e) =>
                        setNewTeacher({ ...newTeacher, assigned_division: e.target.value })
                      }
                      className="w-full px-3 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm font-semibold text-slate-800 border border-slate-200 focus:outline-hidden cursor-pointer"
                    >
                      <option value="A">Division A</option>
                      <option value="B">Division B</option>
                      <option value="C">Division C</option>
                    </select>
                  </div>

                  {/* Assign Subject for Class */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Assign Subject *
                    </label>
                    <select
                      value={newTeacher.assigned_subject}
                      onChange={(e) =>
                        setNewTeacher({ ...newTeacher, assigned_subject: e.target.value })
                      }
                      className="w-full px-3 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm font-semibold text-slate-800 border border-slate-200 focus:outline-hidden cursor-pointer"
                    >
                      {SUBJECT_OPTIONS.map((subj) => (
                        <option key={subj} value={subj}>
                          {subj}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Specialization */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Specialization Area
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Applied Physics & Mechanics"
                      value={newTeacher.subject_specialization}
                      onChange={(e) =>
                        setNewTeacher({
                          ...newTeacher,
                          subject_specialization: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-600/30 transition-all"
                    />
                  </div>

                  {/* Education / Qualifications */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Education / Qualification
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. M.Sc. Physics, B.Ed."
                      value={newTeacher.education}
                      onChange={(e) =>
                        setNewTeacher({ ...newTeacher, education: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-600/30 transition-all"
                    />
                  </div>
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Contact Mobile Number (Optional)
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={newTeacher.mobile}
                      onChange={(e) =>
                        setNewTeacher({ ...newTeacher, mobile: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-600/30 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* ── Footer Actions ── */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2.5 px-7 rounded-xl text-xs font-bold shadow-md shadow-purple-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Appointing...' : 'Appoint Faculty Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODAL 2: "VIEW TEACHER PROFILE" BOX
          ════════════════════════════════════════════════════════════════ */}
      {showViewModal && selectedTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100">
            {/* Header with Avatar */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  {selectedTeacher.full_name?.charAt(0) || 'T'}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {selectedTeacher.full_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md font-bold text-xs">
                      {selectedTeacher.teacher_id}
                    </span>
                    {selectedTeacher.status === 'blocked' ? (
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        Blocked
                      </span>
                    ) : (
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active Faculty
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Information Grid */}
            <div className="space-y-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    Email Address
                  </span>
                  <span className="font-semibold text-slate-800 text-xs">
                    {selectedTeacher.email}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    Phone / Mobile
                  </span>
                  <span className="font-semibold text-slate-800 text-xs">
                    {selectedTeacher.mobile || 'Not specified'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    Assigned Subject
                  </span>
                  <span className="font-bold text-purple-700 text-xs">
                    {selectedTeacher.assigned_subject || selectedTeacher.subject || 'General Science'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    Assigned Cohort
                  </span>
                  <span className="font-bold text-indigo-700 text-xs">
                    {formatAssignedClass(selectedTeacher)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">
                  Subject Specialization
                </span>
                <span className="font-medium text-slate-700 text-xs">
                  {selectedTeacher.subject_specialization || 'Integrated STEM Pedagogy'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">
                  Education & Qualifications
                </span>
                <span className="font-medium text-slate-700 text-xs">
                  {selectedTeacher.education || 'Master in STEM Education'}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  handleOpenPassword(selectedTeacher);
                }}
                className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FiKey className="w-3.5 h-3.5" />
                <span>Reset Password</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowViewModal(false);
                    handleOpenEdit(selectedTeacher);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODAL 3: "EDIT FACULTY DETAILS" BOX
          ════════════════════════════════════════════════════════════════ */}
      {showEditModal && selectedTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <FiEdit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Edit Faculty Details
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update profile, assigned grade, division, and subject
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTeacher} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTeacher.full_name}
                    onChange={(e) =>
                      setEditTeacher({ ...editTeacher, full_name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm text-slate-800 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-600/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Teacher ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTeacher.teacher_id}
                    onChange={(e) =>
                      setEditTeacher({ ...editTeacher, teacher_id: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-800 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-600/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Faculty Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editTeacher.email}
                    onChange={(e) =>
                      setEditTeacher({ ...editTeacher, email: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm text-slate-800 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-600/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Account Status
                  </label>
                  <select
                    value={editTeacher.status}
                    onChange={(e) =>
                      setEditTeacher({ ...editTeacher, status: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm font-bold text-slate-800 border border-slate-200 focus:outline-hidden cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>

              {/* Class, Division, Subject Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Assigned Class *
                  </label>
                  <select
                    value={editTeacher.assigned_grade}
                    onChange={(e) =>
                      setEditTeacher({ ...editTeacher, assigned_grade: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm font-semibold text-slate-800 border border-slate-200 focus:outline-hidden cursor-pointer"
                  >
                    <option value="6">Grade 6</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Assign Division *
                  </label>
                  <select
                    value={editTeacher.assigned_division}
                    onChange={(e) =>
                      setEditTeacher({ ...editTeacher, assigned_division: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm font-semibold text-slate-800 border border-slate-200 focus:outline-hidden cursor-pointer"
                  >
                    <option value="A">Division A</option>
                    <option value="B">Division B</option>
                    <option value="C">Division C</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Assign Subject *
                  </label>
                  <select
                    value={editTeacher.assigned_subject}
                    onChange={(e) =>
                      setEditTeacher({ ...editTeacher, assigned_subject: e.target.value })
                    }
                    className="w-full px-3 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm font-semibold text-slate-800 border border-slate-200 focus:outline-hidden cursor-pointer"
                  >
                    {SUBJECT_OPTIONS.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={editTeacher.subject_specialization}
                    onChange={(e) =>
                      setEditTeacher({
                        ...editTeacher,
                        subject_specialization: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm text-slate-800 border border-slate-200 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Education
                  </label>
                  <input
                    type="text"
                    value={editTeacher.education}
                    onChange={(e) =>
                      setEditTeacher({ ...editTeacher, education: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm text-slate-800 border border-slate-200 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white py-2.5 px-6 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODAL 4: "CHANGE / RESET PASSWORD" BOX
          ════════════════════════════════════════════════════════════════ */}
      {showPasswordModal && selectedTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <FiKey className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Change Password
                  </h3>
                  <p className="text-xs text-slate-500">
                    For {selectedTeacher.full_name} ({selectedTeacher.teacher_id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new password (min 6 chars)"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showResetPassword ? (
                      <FiEyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <FiEye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type={showResetConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/30"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowResetConfirmPassword(!showResetConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showResetConfirmPassword ? (
                      <FiEyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <FiEye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Match Helper */}
              {passwordForm.confirmPassword && (
                <div className="pt-0.5">
                  {passwordForm.newPassword === passwordForm.confirmPassword ? (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      Passwords match
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                      <FiAlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      Passwords do not match
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    actionLoading ||
                    !passwordForm.newPassword ||
                    passwordForm.newPassword !== passwordForm.confirmPassword
                  }
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-6 rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Approve Pending Teacher */}
      {showApproveModal && selectedTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <FiCheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Approve Educator Application</h3>
                  <p className="text-xs text-slate-500">{selectedTeacher.full_name} ({selectedTeacher.email})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmApprove} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Grade Allocation</label>
                  <select
                    value={approvalAllocation.grade}
                    onChange={(e) => setApprovalAllocation({ ...approvalAllocation, grade: e.target.value })}
                    className="stem-input text-xs sm:text-sm"
                  >
                    <option value="6">Grade 6</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Division</label>
                  <select
                    value={approvalAllocation.division}
                    onChange={(e) => setApprovalAllocation({ ...approvalAllocation, division: e.target.value })}
                    className="stem-input text-xs sm:text-sm"
                  >
                    <option value="A">Division A</option>
                    <option value="B">Division B</option>
                    <option value="C">Division C</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject Assignment</label>
                <select
                  value={approvalAllocation.subject}
                  onChange={(e) => setApprovalAllocation({ ...approvalAllocation, subject: e.target.value })}
                  className="stem-input text-xs sm:text-sm"
                >
                  <option value="Science">Science (Physics, Chemistry, Biology)</option>
                  <option value="Technology">Technology & Computational Thinking</option>
                  <option value="Engineering">Engineering & Simple Machines</option>
                  <option value="Mathematics">Mathematics & Algebra</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl text-xs text-emerald-800">
                Approving this faculty member will activate their account and email them login credentials.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="stem-btn bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-6 text-xs font-bold cursor-pointer"
                >
                  {actionLoading ? 'Approving...' : 'Confirm & Activate Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reject Pending Teacher */}
      {showRejectModal && selectedTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <FiAlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Reject Application</h3>
                  <p className="text-xs text-slate-500">{selectedTeacher.full_name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Current qualification does not match requirements for Grade 6-9 STEM curriculum."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="stem-input text-xs sm:text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rejectReason.trim()}
                  className="stem-btn bg-rose-600 hover:bg-rose-700 text-white py-2.5 px-6 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
