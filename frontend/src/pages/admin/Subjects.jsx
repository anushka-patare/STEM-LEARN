import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  FiGrid,
  FiList,
  FiCompass, 
  FiCpu, 
  FiTool, 
  FiPercent, 
  FiPlus, 
  FiTrash2, 
  FiEdit2, 
  FiRefreshCw, 
  FiBookOpen,
  FiFolder,
  FiSearch,
  FiX
} from 'react-icons/fi';
import { academicService } from '../../services/api';

const DEFAULT_ICONS = {
  'Science': FiCompass,
  'Technology': FiCpu,
  'Engineering': FiTool,
  'Mathematics': FiPercent,
};

const DEFAULT_COLORS = {
  'Science': 'blue',
  'Technology': 'purple',
  'Engineering': 'amber',
  'Mathematics': 'emerald',
};

const getColorClass = (name) => {
  const color = DEFAULT_COLORS[name] || 'purple';
  if (color === 'blue') return 'bg-blue-50 text-blue-600 border border-blue-200/60';
  if (color === 'amber') return 'bg-amber-50 text-amber-600 border border-amber-200/60';
  if (color === 'emerald') return 'bg-emerald-50 text-emerald-600 border border-emerald-200/60';
  return 'bg-purple-50 text-purple-600 border border-purple-200/60';
};

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' (row) | 'grid' (cards)

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Quick Add Row State
  const [quickAdding, setQuickAdding] = useState(false);
  const [newRowData, setNewRowData] = useState({
    code: '',
    name: '',
    description: '',
  });

  // Modal Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    grade: '',
    icon: '📚',
    status: 'active'
  });

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await academicService.getSubjects();
      const list = res.data?.data || res.data || [];
      setSubjects(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Failed to load subjects from database');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      grade: '',
      icon: '📚',
      status: 'active'
    });
    setShowModal(true);
  };

  const openEditModal = (s) => {
    setIsEditing(true);
    setSelectedId(s._id);
    setFormData({
      name: s.name || '',
      code: s.code || (s.name ? s.name.substring(0, 4).toUpperCase() : ''),
      description: s.description || '',
      grade: s.grade || '',
      icon: s.icon || '📚',
      status: s.status || 'active'
    });
    setShowModal(true);
  };

  // Submit via Modal
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing) {
        await academicService.updateSubject(selectedId, formData);
        toast.success(`Subject "${formData.name}" updated!`);
      } else {
        await academicService.createSubject(formData);
        toast.success(`Subject "${formData.name}" added to curriculum!`);
      }
      setShowModal(false);
      fetchSubjects();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving subject';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit via Inline Quick Add Row
  const handleQuickAddSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newRowData.name.trim()) {
      toast.error('Please enter a subject name');
      return;
    }

    try {
      setQuickAdding(true);
      const code = newRowData.code.trim() || newRowData.name.trim().substring(0, 4).toUpperCase();
      const payload = {
        name: newRowData.name.trim(),
        code: code.toUpperCase(),
        description: newRowData.description.trim(),
        status: 'active'
      };

      await academicService.createSubject(payload);
      toast.success(`Subject "${payload.name}" added in row!`);
      setNewRowData({ code: '', name: '', description: '' });
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add subject');
    } finally {
      setQuickAdding(false);
    }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Are you sure you want to delete subject "${s.name}"? This will affect linked categories.`)) {
      return;
    }
    try {
      await academicService.deleteSubject(s._id);
      toast.success(`Subject "${s.name}" deleted`);
      fetchSubjects();
    } catch (err) {
      toast.error('Failed to delete subject');
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const q = searchTerm.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.code || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FiBookOpen className="text-purple-600" />
            STEM Subject Taxonomies
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Core interdisciplinary branches defined across middle-school NCERT standards (Grades 6–9).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-white text-purple-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table (Row) View"
            >
              <FiList className="w-4 h-4" />
              <span className="hidden md:inline">Row View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-white text-purple-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Cards (Grid) View"
            >
              <FiGrid className="w-4 h-4" />
              <span className="hidden md:inline">Grid View</span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchSubjects}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh subjects"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="stem-btn bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add New Subject</span>
          </button>
        </div>
      </div>

      {/* Search and summary bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by subject name, code, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="stem-input pl-10 text-xs sm:text-sm w-full"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>Total Branches:</span>
          <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold">
            {subjects.length} Subjects
          </span>
        </div>
      </div>

      {/* Main Content: Table (Row) View OR Grid (Cards) View */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200/80">
          <FiRefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
          <p className="text-sm font-medium">Loading subjects...</p>
        </div>
      ) : viewMode === 'table' ? (
        /* ════════════════════════════════════════════════════════════════
           ROW / TABLE VIEW WITH INLINE QUICK ADD ROW
           ════════════════════════════════════════════════════════════════ */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6 w-32">Subject Code</th>
                  <th className="py-4 px-6 min-w-[220px]">Subject Name</th>
                  <th className="py-4 px-6 min-w-[280px]">Taxonomy Description</th>
                  <th className="py-4 px-6 w-44">Linked Categories</th>
                  <th className="py-4 px-6 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {/* ─── INLINE QUICK ADD ROW ─── */}
                <tr className="bg-purple-50/40 border-b-2 border-purple-100/80 transition-colors">
                  <td className="py-3 px-6">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="CODE (e.g. AI)"
                      value={newRowData.code}
                      onChange={(e) => setNewRowData({ ...newRowData, code: e.target.value.toUpperCase() })}
                      className="w-24 px-2.5 py-1.5 bg-white rounded-xl text-xs font-mono font-bold text-slate-800 border border-purple-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500 uppercase placeholder:text-slate-400"
                    />
                  </td>
                  <td className="py-3 px-6">
                    <input
                      type="text"
                      required
                      placeholder="+ Add Subject Name (e.g. Robotics & AI)"
                      value={newRowData.name}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAddSubmit(e);
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewRowData(prev => ({
                          ...prev,
                          name: val,
                          code: prev.code || (val.length >= 3 ? val.substring(0, 4).toUpperCase() : prev.code)
                        }));
                      }}
                      className="w-full px-3 py-1.5 bg-white rounded-xl text-xs font-bold text-slate-900 border border-purple-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500 placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </td>
                  <td className="py-3 px-6">
                    <input
                      type="text"
                      placeholder="Subject description or curriculum scope..."
                      value={newRowData.description}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAddSubmit(e);
                      }}
                      onChange={(e) => setNewRowData({ ...newRowData, description: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white rounded-xl text-xs text-slate-700 border border-purple-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500 placeholder:text-slate-400"
                    />
                  </td>
                  <td className="py-3 px-6 text-slate-400 text-[11px] font-semibold italic">
                    New Subject
                  </td>
                  <td className="py-3 px-6 text-right">
                    <button
                      type="button"
                      onClick={handleQuickAddSubmit}
                      disabled={quickAdding || !newRowData.name.trim()}
                      className="stem-btn bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-50"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                      <span>{quickAdding ? 'Adding...' : 'Add Row'}</span>
                    </button>
                  </td>
                </tr>

                {/* ─── EXISTING SUBJECT ROWS ─── */}
                {filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-slate-400">
                      <FiBookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-600 text-sm">No subjects found matching your query</p>
                      <p className="text-xs text-slate-400 mt-0.5">Use the quick add row above to create a new subject.</p>
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((s) => {
                    const Icon = DEFAULT_ICONS[s.name] || FiBookOpen;
                    return (
                      <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Subject Code */}
                        <td className="py-4 px-6 font-mono font-bold text-xs">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 font-mono font-bold tracking-wider">
                            [{s.code || (s.name ? s.name.substring(0, 4).toUpperCase() : 'STEM')}]
                          </span>
                        </td>

                        {/* 2. Subject Name & Icon */}
                        <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getColorClass(s.name)}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-black text-slate-900">{s.name}</span>
                          </div>
                        </td>

                        {/* 3. Taxonomy Description */}
                        <td className="py-4 px-6 text-slate-600 text-xs leading-relaxed max-w-md">
                          {s.description || 'Core middle-school curriculum module.'}
                        </td>

                        {/* 4. Linked Categories Count */}
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200/60 px-2.5 py-1 rounded-full font-bold text-xs">
                            <FiFolder className="w-3.5 h-3.5 text-purple-600" />
                            {s.category_count || 0} Categories
                          </span>
                        </td>

                        {/* 5. Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(s)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                              title="Edit Subject"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(s)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Delete Subject"
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
      ) : (
        /* ════════════════════════════════════════════════════════════════
           GRID / CARDS VIEW
           ════════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSubjects.map((s) => {
            const Icon = DEFAULT_ICONS[s.name] || FiBookOpen;

            return (
              <div
                key={s._id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs flex items-start justify-between gap-4 transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${getColorClass(s.name)}`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-400 font-mono">
                        [{s.code || (s.name ? s.name.substring(0, 4).toUpperCase() : 'STEM')}]
                      </span>
                      <span className="text-xs font-bold text-slate-500 inline-flex items-center gap-1">
                        <FiFolder className="w-3.5 h-3.5 text-purple-500" />
                        {s.category_count || 0} Categories
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{s.name}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {s.description || 'Interdisciplinary middle-school curriculum module.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(s)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                    title="Edit Subject"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Subject"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          CREATE / EDIT SUBJECT MODAL
          ════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">
                {isEditing ? 'Edit Subject Taxonomy' : 'Add New Subject Taxonomy'}
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
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science"
                    value={formData.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        name: val,
                        code: prev.code || (val.length >= 3 ? val.substring(0, 4).toUpperCase() : prev.code)
                      }));
                    }}
                    className="stem-input text-xs sm:text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. COMP"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="stem-input text-xs sm:text-sm uppercase font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Scope of curriculum taxonomy and learning competencies..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="stem-input text-xs sm:text-sm resize-none"
                />
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
                  {submitting ? 'Saving...' : isEditing ? 'Update Subject' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
