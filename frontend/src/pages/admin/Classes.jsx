import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  FiLayers, 
  FiPlus, 
  FiTrash2, 
  FiEdit2, 
  FiLock, 
  FiUnlock, 
  FiUsers, 
  FiRefreshCw, 
  FiSearch,
  FiX
} from 'react-icons/fi';
import { classService, adminService } from '../../services/api';

export default function AdminClasses() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    grade: '7',
    division: 'A',
    teacher_ids: [],
    teacher_id: '',
    teacher_name: '',
    mode: 'Collaborative',
    mode_locked: false,
  });

  const fetchClassesAndTeachers = async () => {
    try {
      setLoading(true);
      const [classRes, teacherRes] = await Promise.all([
        classService.getAll(),
        adminService.getTeachers({ limit: 100 }).catch(() => ({ data: [] }))
      ]);

      const classList = classRes.data?.data || classRes.data || [];
      const rawTeachers = teacherRes.data?.data?.teachers || teacherRes.data?.data || teacherRes.data?.teachers || teacherRes.data || [];
      const teacherList = Array.isArray(rawTeachers) ? rawTeachers : [];

      setClasses(Array.isArray(classList) ? classList : []);
      setTeachers(teacherList);
    } catch (err) {
      toast.error('Failed to load class cohorts or teachers.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesAndTeachers();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedClassId(null);
    setFormData({
      grade: '7',
      division: '',
      teacher_ids: [],
      teacher_id: '',
      teacher_name: '',
      mode: 'Collaborative',
      mode_locked: false,
    });
    setShowModal(true);
  };

  const openEditModal = (cls) => {
    setIsEditing(true);
    setSelectedClassId(cls._id);

    // Extract all teacher IDs for this class
    let tids = [];
    if (Array.isArray(cls.teachers) && cls.teachers.length > 0) {
      tids = cls.teachers.map(t => String(t.id || t._id));
    } else if (Array.isArray(cls.teacher_ids) && cls.teacher_ids.length > 0) {
      tids = cls.teacher_ids.map(String);
    } else if (cls.teacher_id) {
      tids = [String(cls.teacher_id)];
    }

    setFormData({
      grade: cls.grade?.toString() || '7',
      division: cls.division || '',
      teacher_ids: tids,
      teacher_id: tids[0] || '',
      teacher_name: cls.teacher_name || '',
      mode: cls.mode || 'Collaborative',
      mode_locked: !!cls.mode_locked,
    });
    setShowModal(true);
  };

  const handleToggleTeacher = (teacherId) => {
    setFormData(prev => {
      const exists = prev.teacher_ids.includes(teacherId);
      const updatedIds = exists
        ? prev.teacher_ids.filter(id => id !== teacherId)
        : [...prev.teacher_ids, teacherId];

      const selectedNames = teachers
        .filter(t => updatedIds.includes(String(t._id)))
        .map(t => t.full_name || t.name);

      return {
        ...prev,
        teacher_ids: updatedIds,
        teacher_id: updatedIds[0] || '',
        teacher_name: selectedNames.join(', ')
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.division.trim()) {
      toast.error('Division/Section letter is required.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing) {
        await classService.update(selectedClassId, formData);
        toast.success(`Grade ${formData.grade}-${formData.division.toUpperCase()} updated successfully!`);
      } else {
        await classService.create(formData);
        toast.success(`Grade ${formData.grade}-${formData.division.toUpperCase()} provisioned!`);
      }
      setShowModal(false);
      fetchClassesAndTeachers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving class section';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLock = async (cls) => {
    const newLockState = !cls.mode_locked;
    try {
      await classService.update(cls._id, { mode_locked: newLockState });
      toast.success(newLockState ? 'Class section locked' : 'Class section unlocked');
      setClasses(prev => prev.map(c => c._id === cls._id ? { ...c, mode_locked: newLockState } : c));
    } catch (err) {
      toast.error('Failed to update lock status');
    }
  };

  const handleDelete = async (cls) => {
    if (!window.confirm(`Are you sure you want to delete ${cls.name || `Grade ${cls.grade}-${cls.division}`}?`)) {
      return;
    }
    try {
      await classService.delete(cls._id);
      toast.success('Class division deleted');
      setClasses(prev => prev.filter(c => c._id !== cls._id));
    } catch (err) {
      toast.error('Failed to delete class');
    }
  };

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = (cls.name || `Grade ${cls.grade}-${cls.division}`)
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      (cls.teacher_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'all' || cls.grade?.toString() === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FiLayers className="text-purple-600" />
            Class & Division Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure middle-school class cohorts (Grades 6–9), appoint supervising teachers, and manage class status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchClassesAndTeachers}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh list"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="stem-btn bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Class Division</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search class or teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="stem-input pl-10 text-xs sm:text-sm w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-600">Filter Grade:</label>
          <div className="flex gap-1.5 overflow-x-auto">
            {['all', '6', '7', '8', '9'].map(g => (
              <button
                key={g}
                onClick={() => setGradeFilter(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  gradeFilter === g
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {g === 'all' ? 'All Grades' : `Grade ${g}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FiRefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
            <p className="text-sm font-medium">Loading class cohorts from database...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FiLayers className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No class divisions found</p>
            <p className="text-xs text-slate-400">Click &quot;Add Class Division&quot; above to provision your first cohort.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Class Section</th>
                  <th className="py-4 px-6">Supervising Teachers</th>
                  <th className="py-4 px-6">Enrolled Students</th>
                  <th className="py-4 px-6">Lock Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredClasses.map((cls) => {
                  const tCount = cls.teachers_count || (cls.teachers && cls.teachers.length) || 0;
                  return (
                    <tr key={cls._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. Class Section */}
                      <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                          {cls.name || `Grade ${cls.grade}-${cls.division}`}
                        </div>
                      </td>

                      {/* 2. Supervising Teachers (Count Badge + Teacher Badges) */}
                      <td className="py-4 px-6">
                        <div className="space-y-1.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-xs ${
                            tCount > 0
                              ? 'bg-purple-50 text-purple-700 border border-purple-200/70'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            <FiUsers className="w-3.5 h-3.5 text-purple-600" />
                            {tCount} {tCount === 1 ? 'Teacher' : 'Teachers'}
                          </span>

                          {cls.teachers && cls.teachers.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-w-sm pt-0.5">
                              {cls.teachers.map((t) => (
                                <span
                                  key={t.id || t._id}
                                  className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium border border-slate-200/60"
                                  title={`${t.name} (${t.subject || 'STEM'}) • ${t.email}`}
                                >
                                  <span className="font-bold text-slate-900">{t.name}</span>
                                  {t.subject && (
                                    <span className="text-purple-600 font-semibold text-[10px]">({t.subject})</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          ) : cls.teacher_name && cls.teacher_name !== 'Unassigned' ? (
                            <p className="text-xs font-semibold text-slate-700">{cls.teacher_name}</p>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">No teachers assigned</p>
                          )}
                        </div>
                      </td>

                      {/* 3. Enrolled Students (Count Badge) */}
                      <td className="py-4 px-6 text-slate-600">
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full font-bold text-slate-700 text-xs">
                          <FiUsers className="w-3.5 h-3.5 text-purple-600" />
                          {cls.students_count || 0} Students
                        </span>
                      </td>

                      {/* 4. Lock Status */}
                      <td className="py-4 px-6">
                        <button
                          type="button"
                          onClick={() => handleToggleLock(cls)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            cls.mode_locked
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title={cls.mode_locked ? "Click to unlock class section" : "Click to lock class section"}
                        >
                          {cls.mode_locked ? (
                            <>
                              <FiLock className="w-3.5 h-3.5 text-rose-600" />
                              <span>Locked</span>
                            </>
                          ) : (
                            <>
                              <FiUnlock className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Active</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* 5. Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(cls)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                            title="Edit Class Section"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cls)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete Class Section"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">
                {isEditing ? 'Edit Class Cohort' : 'Add New Class Cohort'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Grade
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="stem-input text-xs sm:text-sm"
                  >
                    <option value="6">Grade 6</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Division / Section
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="e.g. A, B, C"
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value.toUpperCase() })}
                    className="stem-input text-xs sm:text-sm uppercase font-bold"
                  />
                </div>
              </div>

              {/* Multiple Subject Teachers Assignment */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Assign Subject Teachers ({formData.teacher_ids.length} Selected)
                  </label>
                  {formData.teacher_ids.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, teacher_ids: [], teacher_id: '', teacher_name: '' }))}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {teachers.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                    No approved teachers found in database. You can appoint teachers from Teacher Management.
                  </div>
                ) : (
                  <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5 bg-slate-50/60">
                    {teachers.map(t => {
                      const tid = String(t._id);
                      const isSelected = formData.teacher_ids.includes(tid);
                      const tSubject = t.assigned_subject || t.subject || t.subject_specialization || 'General STEM';

                      return (
                        <label
                          key={tid}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all text-xs ${
                            isSelected 
                              ? 'bg-purple-100/80 border border-purple-300 shadow-2xs font-semibold' 
                              : 'bg-white hover:bg-slate-100/70 border border-slate-200/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleTeacher(tid)}
                              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block">{t.full_name || t.name}</span>
                              <span className="text-[11px] text-slate-500">{t.email}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                            {tSubject}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  1 class sathi multiple subject che teachers select karu shakta.
                </p>
              </div>

              {/* Lock Section */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <input
                  type="checkbox"
                  id="mode_lock"
                  checked={formData.mode_locked}
                  onChange={(e) => setFormData({ ...formData, mode_locked: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="mode_lock" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  Lock class section <span className="text-slate-400 font-normal">(restrict status changes)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="stem-btn bg-purple-600 hover:bg-purple-700 text-white py-2 px-5 text-xs font-bold cursor-pointer transition-all shadow-sm"
                >
                  {submitting ? 'Saving...' : isEditing ? 'Update Section' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
