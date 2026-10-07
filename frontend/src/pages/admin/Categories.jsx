import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  FiFolder, 
  FiPlus, 
  FiTrash2, 
  FiEdit2, 
  FiRefreshCw, 
  FiBookOpen,
  FiSearch,
  FiList,
  FiGrid,
  FiLayers
} from 'react-icons/fi';
import { academicService } from '../../services/api';

const getSubjectBadgeColor = (name = '') => {
  const n = (name || '').toLowerCase();
  if (n.includes('sci')) return 'bg-blue-50 text-blue-700 border-blue-200/70';
  if (n.includes('tech')) return 'bg-purple-50 text-purple-700 border-purple-200/70';
  if (n.includes('eng')) return 'bg-amber-50 text-amber-700 border-amber-200/70';
  if (n.includes('math')) return 'bg-emerald-50 text-emerald-700 border-emerald-200/70';
  return 'bg-indigo-50 text-indigo-700 border-indigo-200/70';
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' (row view) | 'grid' (cards view)

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Quick Add Row State
  const [quickAdding, setQuickAdding] = useState(false);
  const [newRowData, setNewRowData] = useState({
    name: '',
    subject_id: '',
    description: '',
  });

  // Modal Form State
  const [formData, setFormData] = useState({
    name: '',
    subject_id: '',
    description: '',
    status: 'active'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, subRes] = await Promise.all([
        academicService.getCategories(),
        academicService.getSubjects()
      ]);

      const catList = catRes.data?.data || catRes.data || [];
      const subList = subRes.data?.data || subRes.data || [];

      const loadedCats = Array.isArray(catList) ? catList : [];
      const loadedSubs = Array.isArray(subList) ? subList : [];

      setCategories(loadedCats);
      setSubjects(loadedSubs);

      // Pre-select first subject for quick add row if not selected
      setNewRowData(prev => ({
        ...prev,
        subject_id: prev.subject_id || (loadedSubs[0]?._id || '')
      }));
    } catch (err) {
      toast.error('Failed to load curriculum categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    setFormData({
      name: '',
      subject_id: subjects[0]?._id || '',
      description: '',
      status: 'active'
    });
    setShowModal(true);
  };

  const openEditModal = (c) => {
    setIsEditing(true);
    setSelectedId(c._id);
    setFormData({
      name: c.name || '',
      subject_id: c.subject_id || '',
      description: c.description || '',
      status: c.status || 'active'
    });
    setShowModal(true);
  };

  // Submit via Modal
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.subject_id) {
      toast.error('Category Name and Parent Subject are required.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing) {
        await academicService.updateCategory(selectedId, formData);
        toast.success(`Category "${formData.name}" updated!`);
      } else {
        await academicService.createCategory(formData);
        toast.success(`Category "${formData.name}" created!`);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving category';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit via Inline Quick Add Row
  const handleQuickAddSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newRowData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    const targetSubjectId = newRowData.subject_id || subjects[0]?._id;
    if (!targetSubjectId) {
      toast.error('Please select a parent subject');
      return;
    }

    try {
      setQuickAdding(true);
      const payload = {
        name: newRowData.name.trim(),
        subject_id: targetSubjectId,
        description: newRowData.description.trim(),
        status: 'active'
      };

      await academicService.createCategory(payload);
      toast.success(`Category "${payload.name}" added in row!`);
      setNewRowData(prev => ({
        ...prev,
        name: '',
        description: '',
        subject_id: targetSubjectId // retain subject for rapid multi-category entry
      }));
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add category');
    } finally {
      setQuickAdding(false);
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Are you sure you want to delete category "${c.name}"? This may impact associated chapters.`)) {
      return;
    }
    try {
      await academicService.deleteCategory(c._id);
      toast.success(`Category "${c.name}" deleted.`);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  const filteredCategories = categories.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      (c.name || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q) ||
      (c.subject_name || '').toLowerCase().includes(q);
    const matchesSubject = selectedSubjectFilter === 'all' || c.subject_id === selectedSubjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FiFolder className="text-purple-600" />
            Curriculum Category Sub-domains
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cluster chapters into cognitive STEM domains for diagnostic tracking and prerequisite structuring.
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
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh categories"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="stem-btn bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <FiPlus className="w-4 h-4" />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search category, subject, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="stem-input pl-10 text-xs sm:text-sm w-full"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 shrink-0">Filter Subject:</label>
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="stem-input text-xs sm:text-sm py-1.5"
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full font-bold text-xs shrink-0">
            {categories.length} Categories
          </span>
        </div>
      </div>

      {/* Main Content: Table (Row) View OR Grid (Cards) View */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200/80">
          <FiRefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
          <p className="text-sm font-medium">Loading categories...</p>
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
                  <th className="py-4 px-6 w-48">Parent Subject</th>
                  <th className="py-4 px-6 min-w-[220px]">Category Subdomain</th>
                  <th className="py-4 px-6 min-w-[280px]">Curriculum Description</th>
                  <th className="py-4 px-6 w-40">Linked Chapters</th>
                  <th className="py-4 px-6 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {/* ─── INLINE QUICK ADD ROW ─── */}
                <tr className="bg-purple-50/40 border-b-2 border-purple-100/80 transition-colors">
                  <td className="py-3 px-6">
                    <select
                      value={newRowData.subject_id}
                      onChange={(e) => setNewRowData({ ...newRowData, subject_id: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-xl text-xs font-bold text-slate-800 border border-purple-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    >
                      {subjects.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-6">
                    <input
                      type="text"
                      required
                      placeholder="+ Add Category Name (e.g. Electromagnetism)"
                      value={newRowData.name}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAddSubmit(e);
                      }}
                      onChange={(e) => setNewRowData({ ...newRowData, name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white rounded-xl text-xs font-bold text-slate-900 border border-purple-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500 placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </td>
                  <td className="py-3 px-6">
                    <input
                      type="text"
                      placeholder="Subdomain details, scope & learning objectives..."
                      value={newRowData.description}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAddSubmit(e);
                      }}
                      onChange={(e) => setNewRowData({ ...newRowData, description: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white rounded-xl text-xs text-slate-700 border border-purple-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500 placeholder:text-slate-400"
                    />
                  </td>
                  <td className="py-3 px-6 text-slate-400 text-[11px] font-semibold italic">
                    New Domain
                  </td>
                  <td className="py-3 px-6 text-right">
                    <button
                      type="button"
                      onClick={handleQuickAddSubmit}
                      disabled={quickAdding || !newRowData.name.trim() || !newRowData.subject_id}
                      className="stem-btn bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-50"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                      <span>{quickAdding ? 'Adding...' : 'Add Row'}</span>
                    </button>
                  </td>
                </tr>

                {/* ─── EXISTING CATEGORY ROWS ─── */}
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-slate-400">
                      <FiFolder className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-600 text-sm">No categories found matching your query</p>
                      <p className="text-xs text-slate-400 mt-0.5">Use the quick add row above to create a new category.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Parent Subject */}
                      <td className="py-4 px-6 font-bold text-xs">
                        <span className={`px-2.5 py-1 rounded-lg border font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 ${getSubjectBadgeColor(c.subject_name)}`}>
                          <FiBookOpen className="w-3 h-3" />
                          {c.subject_name || 'STEM'}
                        </span>
                      </td>

                      {/* 2. Category Name & Icon */}
                      <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0">
                            <FiFolder className="w-4 h-4" />
                          </div>
                          <span className="font-black text-slate-900">{c.name}</span>
                        </div>
                      </td>

                      {/* 3. Curriculum Description */}
                      <td className="py-4 px-6 text-slate-600 text-xs leading-relaxed max-w-md">
                        {c.description || 'Interdisciplinary middle-school domain module.'}
                      </td>

                      {/* 4. Linked Chapters Count */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full font-bold text-xs">
                          <FiLayers className="w-3.5 h-3.5 text-purple-600" />
                          {c.chapter_count || 0} Chapters
                        </span>
                      </td>

                      {/* 5. Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════
           GRID / CARDS VIEW
           ════════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((c) => (
            <div
              key={c._id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex items-center justify-between hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <FiFolder className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border inline-block mb-1 ${getSubjectBadgeColor(c.subject_name)}`}>
                    {c.subject_name || 'STEM'}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 truncate" title={c.name}>
                    {c.name}
                  </h4>
                  <span className="text-xs text-slate-500 font-medium inline-flex items-center gap-1 mt-0.5">
                    <FiLayers className="w-3 h-3 text-purple-500" />
                    {c.chapter_count || 0} Chapters
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => openEditModal(c)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                  title="Edit Category"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Delete Category"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          CREATE / EDIT CATEGORY MODAL
          ════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">
              {isEditing ? 'Edit Category Domain' : 'Add New Category'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Parent Subject
                </label>
                <select
                  required
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="stem-input text-xs sm:text-sm"
                >
                  <option value="">-- Select Parent Subject --</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electromagnetism & Circuits"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="stem-input text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Subdomain details and learning objectives..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="stem-input text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="stem-btn bg-purple-600 hover:bg-purple-700 text-white py-2 px-5 text-xs font-bold cursor-pointer"
                >
                  {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
