import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  FiFileText, 
  FiPlus, 
  FiTrash2, 
  FiEdit2, 
  FiSearch, 
  FiRefreshCw, 
  FiAward, 
  FiLayers, 
  FiBookOpen,
  FiList,
  FiGrid,
  FiX
} from 'react-icons/fi';
import { academicService } from '../../services/api';

const CLASS_OPTIONS = [
  { value: '6', label: 'Class 6 (Grade 6)' },
  { value: '7', label: 'Class 7 (Grade 7)' },
  { value: '8', label: 'Class 8 (Grade 8)' },
  { value: '9', label: 'Class 9 (Grade 9)' },
];

export default function AdminChapters() {
  const [chapters, setChapters] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & View Mode
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' (row view) | 'grid' (cards view)

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal Form State
  const [formData, setFormData] = useState({
    name: '',
    subject_id: '',
    category_id: '',
    grade: '7',
    order: 1,
    passing_score_pct: 70,
    description: '',
    status: 'active'
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [chRes, catRes, subRes] = await Promise.all([
        academicService.getChapters(),
        academicService.getCategories(),
        academicService.getSubjects()
      ]);

      const chList = chRes.data?.data || chRes.data || [];
      const catList = catRes.data?.data || catRes.data || [];
      const subList = subRes.data?.data || subRes.data || [];

      setChapters(Array.isArray(chList) ? chList : []);
      setCategories(Array.isArray(catList) ? catList : []);
      setSubjects(Array.isArray(subList) ? subList : []);
    } catch (err) {
      toast.error('Failed to load curriculum chapters bank.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Create Modal (Popup opens on Add)
  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    const firstCat = categories[0];
    setFormData({
      name: '',
      subject_id: firstCat?.subject_id || subjects[0]?._id || '',
      category_id: firstCat?._id || '',
      grade: '7',
      order: (chapters.length + 1),
      passing_score_pct: 70,
      description: '',
      status: 'active'
    });
    setShowModal(true);
  };

  // Open Edit Modal (Popup opens on Edit)
  const openEditModal = (ch) => {
    setIsEditing(true);
    setSelectedId(ch._id);
    setFormData({
      name: ch.name || '',
      subject_id: ch.subject_id || '',
      category_id: ch.category_id || '',
      grade: ch.grade ? String(ch.grade) : '7',
      order: ch.order || 1,
      passing_score_pct: ch.passing_score_pct || 70,
      description: ch.description || '',
      status: ch.status || 'active'
    });
    setShowModal(true);
  };

  const handleCategoryChange = (catId) => {
    const selected = categories.find(c => c._id === catId);
    setFormData(prev => ({
      ...prev,
      category_id: catId,
      subject_id: selected?.subject_id || prev.subject_id
    }));
  };

  // Modal Submit (Handles both Add & Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category_id) {
      toast.error('Chapter Name and Category are required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        subject_id: formData.subject_id,
        category_id: formData.category_id,
        grade: String(formData.grade || '7'),
        order: parseInt(formData.order) || 1,
        passing_score_pct: parseInt(formData.passing_score_pct) || 70,
        prerequisite_chapter_ids: [],
        description: formData.description.trim(),
        status: formData.status || 'active'
      };

      if (isEditing) {
        await academicService.updateChapter(selectedId, payload);
        toast.success(`Chapter "${payload.name}" updated successfully!`);
      } else {
        await academicService.createChapter(payload);
        toast.success(`Chapter "${payload.name}" created successfully!`);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving chapter unit';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (ch) => {
    if (!window.confirm(`Are you sure you want to delete chapter "${ch.name}"?`)) {
      return;
    }
    try {
      await academicService.deleteChapter(ch._id);
      toast.success(`Chapter "${ch.name}" removed.`);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete chapter');
    }
  };

  const filteredChapters = chapters.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (c.name || '').toLowerCase().includes(q) ||
      (c.subject_name || '').toLowerCase().includes(q) ||
      (c.category_name || '').toLowerCase().includes(q);
    const matchesGrade = gradeFilter === 'all' || String(c.grade || '7') === gradeFilter;
    const matchesSubject = subjectFilter === 'all' || c.subject_id === subjectFilter;
    return matchesSearch && matchesGrade && matchesSubject;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FiFileText className="text-purple-600" />
            Curriculum Chapters Bank
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Maintain middle-school syllabus chapter units (Grades 6–9), class sequencing, and mastery thresholds.
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
            title="Refresh chapters"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Primary Add Button -> OPENS POPUP MODAL */}
          <button
            type="button"
            onClick={openCreateModal}
            className="stem-btn bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Chapter Unit</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search chapters, categories, subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="stem-input pl-10 text-xs sm:text-sm w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500">Class:</span>
            {['all', '6', '7', '8', '9'].map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setGradeFilter(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  gradeFilter === g
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {g === 'all' ? 'All' : `Class ${g}`}
              </button>
            ))}
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500">Subject:</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="stem-input text-xs py-1.5"
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full font-bold text-xs shrink-0">
            {chapters.length} Chapters
          </span>
        </div>
      </div>

      {/* Main Content: Table (Row) View OR Grid (Cards) View */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200/80">
          <FiRefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
          <p className="text-sm font-medium">Loading chapter bank from database...</p>
        </div>
      ) : viewMode === 'table' ? (
        /* ════════════════════════════════════════════════════════════════
           ROW / TABLE VIEW (Clean table without inline row and without prerequisites)
           ════════════════════════════════════════════════════════════════ */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-5 w-20 text-center">Order</th>
                  <th className="py-4 px-5 w-32">Class</th>
                  <th className="py-4 px-5 w-52">Subject & Domain</th>
                  <th className="py-4 px-5 min-w-[280px]">Chapter Title</th>
                  <th className="py-4 px-5 w-32 text-center">Passing</th>
                  <th className="py-4 px-5 w-28 text-center">Quizzes</th>
                  <th className="py-4 px-5 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredChapters.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-slate-400">
                      <FiBookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-600 text-sm">No chapters found matching your query</p>
                      <p className="text-xs text-slate-400 mt-1 mb-4">Click below to create a new chapter via popup.</p>
                      <button
                        type="button"
                        onClick={openCreateModal}
                        className="stem-btn bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <FiPlus className="w-4 h-4" />
                        <span>Add Chapter Unit</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredChapters.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. Order */}
                      <td className="py-4 px-5 text-center font-mono text-slate-400 font-bold">
                        #{c.order || 1}
                      </td>

                      {/* 2. Class */}
                      <td className="py-4 px-5 font-bold">
                        <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/70 font-bold text-xs inline-block">
                          Class {c.grade || '7'}
                        </span>
                      </td>

                      {/* 3. Subject & Domain */}
                      <td className="py-4 px-5">
                        <div>
                          <span className="font-bold text-slate-800 text-xs">{c.subject_name || 'STEM'}</span>
                          <div className="text-[11px] text-purple-600 font-semibold">{c.category_name || 'General'}</div>
                        </div>
                      </td>

                      {/* 4. Chapter Title */}
                      <td className="py-4 px-5 font-bold text-slate-900 text-sm">
                        <div className="flex items-center gap-2">
                          <FiBookOpen className="w-4 h-4 text-purple-500 shrink-0" />
                          <span>{c.name}</span>
                        </div>
                        {c.description && (
                          <p className="text-[11px] text-slate-500 font-normal mt-0.5 line-clamp-1">
                            {c.description}
                          </p>
                        )}
                      </td>

                      {/* 5. Passing Score */}
                      <td className="py-4 px-5 text-center font-bold text-emerald-700">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg">
                          <FiAward className="w-3.5 h-3.5" />
                          {c.passing_score_pct || 70}%
                        </span>
                      </td>

                      {/* 6. Quizzes */}
                      <td className="py-4 px-5 text-center text-slate-600 font-semibold">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md text-xs">
                          {c.quiz_count || 0}
                        </span>
                      </td>

                      {/* 7. Actions (Edit & Delete) */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                            title="Edit Chapter Unit (Opens Popup)"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete Chapter"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChapters.map((c) => (
            <div
              key={c._id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-all gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60 font-bold text-xs">
                    Class {c.grade || '7'}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-400">
                    Order #{c.order || 1}
                  </span>
                </div>

                <div className="text-xs text-purple-600 font-bold uppercase tracking-wider">
                  {c.subject_name || 'STEM'} • {c.category_name || 'General'}
                </div>

                <h3 className="text-base font-black text-slate-900 leading-snug">
                  {c.name}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {c.description || 'Curriculum unit module for student learning progression.'}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                    <FiAward className="w-3.5 h-3.5" />
                    {c.passing_score_pct || 70}% Mastery
                  </span>
                  <span className="text-slate-500 font-semibold">
                    {c.quiz_count || 0} Quizzes
                  </span>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => openEditModal(c)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer text-xs font-bold inline-flex items-center gap-1"
                    title="Edit Chapter Unit"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-xs font-bold inline-flex items-center gap-1"
                    title="Delete Chapter"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          POPUP MODAL (USED FOR BOTH ADD AND EDIT)
          ════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FiBookOpen className="text-purple-600" />
                  {isEditing ? 'Edit Chapter Unit' : 'Add New Chapter Unit'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isEditing ? 'Update chapter configuration, class level, and mastery parameters.' : 'Create a new curriculum unit for the selected class and subject.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form id="chapterForm" onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
              {/* Section 1: Basic Information */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Chapter Unit Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Light, Shadows & Reflection"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="stem-input text-xs sm:text-sm font-semibold"
                />
              </div>

              {/* Section 2: Class & Category Hierarchy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Class Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="stem-input text-xs sm:text-sm font-bold text-purple-800"
                  >
                    {CLASS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Parent Curriculum Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="stem-input text-xs sm:text-sm font-medium"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.subject_name || 'STEM'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 3: Numerical Controls (Order & Mastery) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Syllabus Order Index
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    className="stem-input text-xs sm:text-sm font-mono font-bold"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Order position in student curriculum path.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Passing Mastery Threshold (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.passing_score_pct}
                      onChange={(e) => setFormData({ ...formData, passing_score_pct: parseInt(e.target.value) || 70 })}
                      className="stem-input text-xs sm:text-sm font-bold text-emerald-700 pr-10"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Minimum score required to master this chapter.</p>
                </div>
              </div>

              {/* Section 4: Description & Learning Goals */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description & Key Concept Objectives (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of learning goals, syllabus scope, and cognitive competencies..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="stem-input text-xs sm:text-sm leading-relaxed"
                />
              </div>
            </form>

            {/* Modal Sticky Footer - Always Visible */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="chapterForm"
                disabled={submitting}
                className="stem-btn bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-6 text-xs font-bold cursor-pointer shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Chapter Unit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
