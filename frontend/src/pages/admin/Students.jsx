import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  FiUsers, 
  FiSearch, 
  FiTrash2, 
  FiPlus, 
  FiEdit2, 
  FiKey, 
  FiRefreshCw, 
  FiChevronLeft, 
  FiChevronRight, 
  FiDownload, 
  FiUpload, 
  FiAtSign,
  FiTrendingUp,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiLayers
} from 'react-icons/fi';
import { adminService, classService } from '../../services/api';
import Avatar from '../../components/Avatar';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Create / Edit Student Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Password Reset Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resettingStudent, setResettingStudent] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Upgrade Class Modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradingStudent, setUpgradingStudent] = useState(null);
  const [upgradeData, setUpgradeData] = useState({
    target_grade: '7',
    target_division: 'A',
    roll_number: '',
  });
  const [submittingUpgrade, setSubmittingUpgrade] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    grade: '7',
    division: 'A',
    roll_number: '',
    mobile: '',
    password: '',
    status: 'active'
  });

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search: search.trim() || undefined,
        grade: gradeFilter !== 'all' ? gradeFilter : undefined,
        division: divisionFilter !== 'all' ? divisionFilter : undefined,
      };

      const res = await adminService.getStudents(params);
      const d = res.data?.data || res.data || {};
      const list = d.students || (Array.isArray(d) ? d : []);
      setStudents(list);
      setTotalPages(d.pages || 1);
      setTotalCount(d.total || list.length);
    } catch (err) {
      toast.error('Failed to load students registry.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, gradeFilter, divisionFilter]);

  const fetchClasses = async () => {
    try {
      const res = await classService.getAll();
      const list = res.data?.data || res.data || [];
      setClasses(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedStudentId(null);
    setFormData({
      full_name: '',
      username: '',
      email: '',
      grade: '7',
      division: 'A',
      roll_number: '',
      mobile: '',
      password: 'STEMLearn@123',
      status: 'active'
    });
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setIsEditing(true);
    setSelectedStudentId(student._id);
    setFormData({
      full_name: student.full_name || student.name || '',
      username: student.username || '',
      email: student.email || '',
      grade: student.grade?.toString() || '7',
      division: student.division || 'A',
      roll_number: student.roll_number || student.roll_no || '',
      mobile: student.mobile || '',
      password: '',
      status: student.status || 'active'
    });
    setShowModal(true);
  };

  const openResetModal = (student) => {
    setResettingStudent(student);
    setNewPassword('');
    setShowPasswordText(false);
    setShowResetModal(true);
  };

  const openUpgradeModal = (student) => {
    setUpgradingStudent(student);
    const curG = parseInt(student.grade, 10);
    const nextG = (!isNaN(curG) && curG < 9) ? String(curG + 1) : String(curG || '7');
    setUpgradeData({
      target_grade: nextG,
      target_division: student.division || 'A',
      roll_number: student.roll_number || student.roll_no || '',
    });
    setShowUpgradeModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      toast.error('Student Name is required.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing) {
        await adminService.updateStudent(selectedStudentId, formData);
        toast.success(`Student profile updated!`);
      } else {
        await adminService.createStudent(formData);
        toast.success(`Student ${formData.full_name} enrolled successfully!`);
      }
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving student record';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpgradeSubmit = async (e) => {
    e.preventDefault();
    if (!upgradingStudent) return;

    try {
      setSubmittingUpgrade(true);
      await adminService.updateStudent(upgradingStudent._id, {
        grade: upgradeData.target_grade,
        division: upgradeData.target_division.toUpperCase().trim(),
        roll_number: upgradeData.roll_number.trim(),
      });
      toast.success(
        `Student ${upgradingStudent.full_name || upgradingStudent.name} upgraded to Grade ${upgradeData.target_grade}-${upgradeData.target_division.toUpperCase()}!`
      );
      setShowUpgradeModal(false);
      fetchStudents();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to upgrade student class';
      toast.error(msg);
    } finally {
      setSubmittingUpgrade(false);
    }
  };

  // CSV Import handler
  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') return;

        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          toast.error('CSV file is empty or has only headers.');
          return;
        }

        const parsed = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 3 && parts[0]) {
            parsed.push({
              full_name: parts[0],
              username: parts[1] || '',
              grade: parts[2] || '7',
              division: parts[3] || 'A',
              roll_number: parts[4] || '',
              email: parts[5] || '',
              mobile: parts[6] || '',
              password: parts[7] || 'STEMLearn@123',
              status: 'active'
            });
          }
        }

        if (parsed.length === 0) {
          toast.error('No valid student rows found in CSV.');
          return;
        }

        setLoading(true);
        const res = await adminService.bulkImportStudents({ students: parsed });
        const resData = res.data?.data || {};
        toast.success(`Imported ${resData.imported_count || parsed.length} students successfully!`);
        if (resData.error_count > 0) {
          toast.error(`${resData.error_count} records had errors or duplicates.`);
        }
        fetchStudents();
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to import CSV';
        toast.error(msg);
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const downloadCSVTemplate = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      'Full Name,Username,Grade,Division,Roll Number,Email,Mobile,Password\n' +
      '"Aarav Patel","aarav.patel","7","A","01","aarav@school.edu","9876543210","STEMLearn@123"\n' +
      '"Diya Sharma","diya.sharma","8","B","02","diya@school.edu","9876543211","STEMLearn@123"\n' +
      '"Rohan Mehta","rohan.mehta","9","A","03","rohan@school.edu","9876543212","STEMLearn@123"';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'stemlearn_students_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete student account for ${name}?`)) {
      return;
    }
    try {
      await adminService.deleteStudent(id);
      toast.success(`Student ${name} deleted.`);
      fetchStudents();
    } catch (err) {
      toast.error('Failed to delete student.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    try {
      setSubmitting(true);
      await adminService.resetStudentPassword(resettingStudent._id, newPassword);
      toast.success(`Password reset for ${resettingStudent.full_name || resettingStudent.name}!`);
      setShowResetModal(false);
      setNewPassword('');
      setResettingStudent(null);
    } catch (err) {
      toast.error('Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FiUsers className="text-purple-600" />
            Student Registry & Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Master registry of all enrolled middle-school student explorers across Grades 6, 7, 8, and 9 ({totalCount} total students).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchStudents}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh student list"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={downloadCSVTemplate}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            title="Download CSV Template"
          >
            <FiDownload className="w-4 h-4" />
            <span className="hidden sm:inline">CSV Template</span>
          </button>

          <label className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <FiUpload className="w-4 h-4" />
            <span className="hidden sm:inline">Import CSV</span>
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          </label>

          <button
            type="button"
            onClick={openCreateModal}
            className="stem-btn bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-4 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <FiPlus className="w-4 h-4" />
            <span>Enroll Student</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search student by name, username, email, ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 shrink-0">Filter Grade:</span>
          {['all', '6', '7', '8', '9'].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                setGradeFilter(g);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                gradeFilter === g
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {g === 'all' ? 'All Grades' : `Grade ${g}`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FiRefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
            <p className="text-sm font-medium">Loading students from MongoDB...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FiUsers className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No students found matching your criteria</p>
            <p className="text-xs text-slate-400">Add a new student or adjust your search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Student Details</th>
                  <th className="py-4 px-6">Username / ID</th>
                  <th className="py-4 px-6">Class Cohort</th>
                  <th className="py-4 px-6">Roll No</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={s.profile_photo?.thumbnail_url || s.photo}
                          name={s.full_name || s.name || 'Student'}
                          size="sm"
                          role="student"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{s.full_name || s.name}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {s.email || 'No email attached'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-purple-700 flex items-center gap-1">
                        <FiAtSign className="w-3 h-3 text-purple-400" />
                        {s.username || s.student_id || 'student'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {s.student_id || s._id.slice(-6)}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-800">
                      Grade {s.grade}-{s.division || 'A'}
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      #{s.roll_number || s.roll_no || '—'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                        s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {s.status || 'active'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Upgrade Class Icon Button */}
                        <button
                          type="button"
                          onClick={() => openUpgradeModal(s)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                          title="Upgrade / Switch Class"
                        >
                          <FiTrendingUp className="w-4 h-4" />
                        </button>

                        {/* Reset Password Icon Button */}
                        <button
                          type="button"
                          onClick={() => openResetModal(s)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                          title="Reset Password"
                        >
                          <FiKey className="w-4 h-4" />
                        </button>

                        {/* Edit Student Icon Button */}
                        <button
                          type="button"
                          onClick={() => openEditModal(s)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                          title="Edit Student"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Student Icon Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(s._id, s.full_name || s.name)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete Student"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing Page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span> ({totalCount} items)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-2 rounded-xl border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white cursor-pointer"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white cursor-pointer"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL 1: Create / Edit Student Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <FiEdit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {isEditing ? 'Edit Student Explorer' : 'Enroll New Student'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isEditing ? 'Update student demographic and academic record' : 'Register a new middle-school student into the cohort directory'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diya Sharma"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-slate-400 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Username (Login ID)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. diya.sharma"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-slate-400 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="diya@school.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-slate-400 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile No
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-slate-400 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Grade
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all shadow-2xs"
                  >
                    <option value="6">Grade 6</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Division
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="A"
                    maxLength={2}
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-slate-400 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Roll No
                  </label>
                  <input
                    type="text"
                    placeholder="01"
                    value={formData.roll_number}
                    onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-slate-400 shadow-2xs"
                  />
                </div>
              </div>

              {!isEditing && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-slate-400 shadow-2xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all shadow-2xs"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive / Suspended</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="stem-btn bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-6 text-xs font-bold cursor-pointer shadow-sm"
                >
                  {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Upgrade / Switch Class Modal ─── */}
      {showUpgradeModal && upgradingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <FiTrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Upgrade Student Class
                </h3>
                <p className="text-xs text-slate-500">
                  Promote or switch cohort for the upcoming term
                </p>
              </div>
            </div>

            {/* Current vs Next Badge */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Class</span>
                <span className="text-sm font-black text-slate-800">
                  Grade {upgradingStudent.grade}-{upgradingStudent.division || 'A'}
                </span>
                <span className="text-[11px] text-slate-500 block">Roll: #{upgradingStudent.roll_number || upgradingStudent.roll_no || '—'}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                ➔
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Promoting To</span>
                <span className="text-sm font-black text-emerald-700">
                  Grade {upgradeData.target_grade}-{upgradeData.target_division || 'A'}
                </span>
                <span className="text-[11px] text-emerald-600 block">Next Academic Year</span>
              </div>
            </div>

            <form onSubmit={handleUpgradeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Grade *
                  </label>
                  <select
                    value={upgradeData.target_grade}
                    onChange={(e) => setUpgradeData({ ...upgradeData, target_grade: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all shadow-2xs"
                  >
                    <option value="6">Grade 6</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Division *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="e.g. A"
                    value={upgradeData.target_division}
                    onChange={(e) => setUpgradeData({ ...upgradeData, target_division: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-slate-400 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Roll Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 05"
                  value={upgradeData.roll_number}
                  onChange={(e) => setUpgradeData({ ...upgradeData, roll_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-slate-400 shadow-2xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>The student will automatically gain access to all quizzes & chapters mapped to the new grade.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submittingUpgrade}
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUpgrade}
                  className="stem-btn bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-6 text-xs font-bold cursor-pointer shadow-sm"
                >
                  {submittingUpgrade ? 'Upgrading...' : 'Confirm Class Upgrade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Redesigned Reset Password Modal ─── */}
      {showResetModal && resettingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <FiKey className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Reset Student Password
                </h3>
                <p className="text-xs text-slate-500">
                  Issue a new credential for this student account
                </p>
              </div>
            </div>

            {/* Student Preview Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <Avatar
                src={resettingStudent.profile_photo?.thumbnail_url || resettingStudent.photo}
                name={resettingStudent.full_name || resettingStudent.name || 'Student'}
                size="sm"
                role="student"
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-sm truncate">
                  {resettingStudent.full_name || resettingStudent.name}
                </div>
                <div className="text-[11px] text-slate-500">
                  ID: <span className="font-mono text-purple-700 font-semibold">{resettingStudent.username || resettingStudent.student_id}</span> • Grade {resettingStudent.grade}-{resettingStudent.division || 'A'}
                </div>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Enter at least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all placeholder:text-slate-400 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPasswordText ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-400">Min 6 characters</span>
                  <button
                    type="button"
                    onClick={() => setNewPassword('STEMLearn@123')}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                  >
                    Fill Default (STEMLearn@123)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setShowResetModal(false);
                    setNewPassword('');
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="stem-btn bg-amber-600 hover:bg-amber-700 text-white py-2.5 px-6 text-xs font-bold cursor-pointer shadow-sm"
                >
                  {submitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
