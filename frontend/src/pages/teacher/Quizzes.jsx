import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  FiFileText, 
  FiPlus, 
  FiPlusCircle,
  FiClock, 
  FiCheckCircle, 
  FiTrash2, 
  FiEdit2, 
  FiRefreshCw, 
  FiEye, 
  FiEyeOff, 
  FiShield, 
  FiAward,
  FiSearch,
  FiBookOpen,
  FiLayers,
  FiFolder,
  FiChevronRight,
  FiList,
  FiGrid
} from 'react-icons/fi';
import { quizService, academicService, classService, teacherService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function TeacherQuizzes() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const initialGrade = String(user?.assigned_grade || user?.grade || '8');

  const [quizzes, setQuizzes] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignedGrades, setAssignedGrades] = useState([initialGrade]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState(initialGrade);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('curriculum'); // 'curriculum' or 'table'

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    category_id: '',
    chapter_id: '',
    grade: initialGrade,
    difficulty: 'medium',
    duration_minutes: 15,
    total_marks: 10,
    passing_percentage: 70,
    sequence_number: 1,
    randomize_questions: false,
    mode: 'both',
    require_fullscreen: true,
    tab_switch_detection: true,
    max_violations: 3,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [qRes, chRes, subRes, catRes, clsRes, myClsRes] = await Promise.all([
        quizService.getQuizzes().catch((err) => {
          console.error('Quiz fetch failed:', err);
          return { data: { data: { quizzes: [] } } };
        }),
        academicService.getChapters().catch((err) => {
          console.error('Chapters fetch failed:', err);
          return { data: [] };
        }),
        academicService.getSubjects().catch((err) => {
          console.error('Subjects fetch failed:', err);
          return { data: [] };
        }),
        academicService.getCategories().catch(() => ({ data: [] })),
        classService.getAll().catch(() => ({ data: [] })),
        teacherService.getMyClasses().catch(() => ({ data: [] }))
      ]);

      const qList = qRes?.data?.data?.quizzes || qRes?.data?.data || qRes?.data || [];
      const chList = chRes?.data?.data || chRes?.data || [];
      const subList = subRes?.data?.data || subRes?.data || [];
      const catList = catRes?.data?.data || catRes?.data || [];
      const clsList = clsRes?.data?.data || clsRes?.data || [];
      const myClasses = myClsRes?.data?.data || myClsRes?.data || [];

      // Extract teacher's assigned grades
      const tGrades = [...new Set(myClasses.map(c => String(c.grade || '')).filter(Boolean))];
      const finalGrades = tGrades.length > 0 ? tGrades : ['7'];
      setAssignedGrades(finalGrades);

      // Default gradeFilter to teacher's primary assigned grade
      if (!finalGrades.includes(gradeFilter)) {
        setGradeFilter(finalGrades[0]);
      }

      setQuizzes(Array.isArray(qList) ? qList : []);
      setChapters(Array.isArray(chList) ? chList : []);
      setSubjects(Array.isArray(subList) ? subList : []);
      setCategories(Array.isArray(catList) ? catList : []);
      setClasses(Array.isArray(clsList) ? clsList : []);
    } catch (err) {
      console.error('Unexpected error loading data:', err);
      toast.error('Unable to load quizzes. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [gradeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = useCallback(() => {
    setIsEditing(false);
    setSelectedId(null);
    const targetGrade = assignedGrades[0] || '7';
    const c7Chaps = chapters.filter(c => String(c.grade) === String(targetGrade));
    const firstCh = c7Chaps[0] || chapters[0];
    setFormData({
      title: '',
      description: '',
      subject_id: firstCh?.subject_id || subjects[0]?._id || '',
      category_id: firstCh?.category_id || '',
      chapter_id: firstCh?._id || '',
      grade: targetGrade,
      difficulty: 'medium',
      duration_minutes: 15,
      total_marks: 10,
      passing_percentage: 70,
      sequence_number: 1,
      randomize_questions: false,
      mode: 'both',
      require_fullscreen: true,
      tab_switch_detection: true,
      max_violations: 3,
    });
    setShowModal(true);
  }, [chapters, subjects, assignedGrades]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setIsEditing(false);
    setSelectedId(null);
    if (location.search.includes('action=create')) {
      navigate('/teacher/quizzes', { replace: true });
    }
  }, [location.search, navigate]);

  // Automatically navigate to full-screen create page if requested
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'create') {
      navigate('/teacher/quizzes/create', { replace: true });
    }
  }, [location.search, navigate]);

  const openEditModal = (q) => {
    setIsEditing(true);
    setSelectedId(q._id);
    const sec = q.security_settings || {};
    setFormData({
      title: q.title || '',
      description: q.description || '',
      subject_id: q.subject_id || '',
      category_id: q.category_id || '',
      chapter_id: q.chapter_id || '',
      grade: q.grade?.toString() || assignedGrades[0] || '7',
      difficulty: q.difficulty || 'medium',
      duration_minutes: q.duration_minutes || 15,
      total_marks: q.total_marks || 10,
      passing_percentage: q.passing_percentage || 70,
      sequence_number: q.sequence_number || 1,
      randomize_questions: !!q.randomize_questions,
      mode: q.mode || 'both',
      require_fullscreen: sec.require_fullscreen !== false,
      tab_switch_detection: sec.tab_switch_detection !== false,
      max_violations: sec.max_violations || 3,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.chapter_id) {
      toast.error('Quiz Title and Chapter Unit are required');
      return;
    }

    const payload = {
      ...formData,
      security_settings: {
        require_fullscreen: formData.require_fullscreen,
        tab_switch_detection: formData.tab_switch_detection,
        window_focus_detection: true,
        refresh_protection: true,
        copy_protection: true,
        paste_protection: true,
        right_click_disabled: true,
        max_violations: formData.max_violations,
        violation_action: 'auto_submit'
      }
    };

    try {
      setSubmitting(true);
      if (isEditing) {
        await quizService.updateQuiz(selectedId, payload);
        toast.success(`Assessment "${formData.title}" updated successfully!`);
      } else {
        await quizService.createQuiz(payload);
        toast.success(`Manual quiz "${formData.title}" created successfully!`);
      }
      closeModal();
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving quiz';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (q) => {
    try {
      const res = await quizService.toggleStatus(q._id);
      const isNowPublished = res.data?.status === 'published';
      toast.success(
        res.data?.message || (isNowPublished ? 'Quiz Activated (Published)' : 'Quiz Deactivated (Draft)')
      );
      fetchData();
    } catch (err) {
      toast.error('Failed to change quiz status');
    }
  };

  const handleDelete = async (q) => {
    if (!window.confirm(`Are you sure you want to delete quiz "${q.title}"?`)) {
      return;
    }
    try {
      await quizService.deleteQuiz(q._id);
      toast.success('Assessment deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete quiz');
    }
  };

  // Dynamically filter chapters based on selected subject and grade in modal
  const modalAvailableChapters = useMemo(() => {
    const filtered = chapters.filter(c => {
      const matchesGrade = !formData.grade || String(c.grade) === String(formData.grade);
      const matchesSubject = !formData.subject_id || String(c.subject_id) === String(formData.subject_id);
      return matchesGrade && matchesSubject;
    });
    if (filtered.length > 0) return filtered;
    return chapters.filter(c => !formData.grade || String(c.grade) === String(formData.grade));
  }, [chapters, formData.grade, formData.subject_id]);

  // Overall and filtered lists for current grade
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(q => {
      const matchesSearch = (q.title || '').toLowerCase().includes(search.toLowerCase());
      const matchesGrade = String(q.grade) === String(gradeFilter);
      const matchesSubject = subjectFilter === 'all' || String(q.subject_id) === String(subjectFilter);
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchesSearch && matchesGrade && matchesSubject && matchesStatus;
    });
  }, [quizzes, search, gradeFilter, subjectFilter, statusFilter]);

  // Telemetry counts for target grade
  const telemetry = useMemo(() => {
    const gradeQuizzes = quizzes.filter(q => String(q.grade) === String(gradeFilter));
    const total = gradeQuizzes.length;
    const published = gradeQuizzes.filter(q => q.status === 'published').length;
    const drafts = gradeQuizzes.filter(q => q.status !== 'published').length;
    return { total, published, drafts };
  }, [quizzes, gradeFilter]);

  // Hierarchical structure: Subject -> Category -> Chapter -> Tests
  const hierarchicalData = useMemo(() => {
    // Filter subjects by subjectFilter if not 'all'
    const targetSubjects = subjectFilter === 'all' 
      ? subjects 
      : subjects.filter(s => String(s._id) === String(subjectFilter));

    // Get grade chapters
    const gradeChapters = chapters.filter(ch => String(ch.grade) === String(gradeFilter));

    return targetSubjects.map(sub => {
      const subId = String(sub._id);
      // Find all chapters under this subject for current grade
      const subChapters = gradeChapters
        .filter(ch => String(ch.subject_id) === subId)
        .sort((a, b) => (Number(a.order) || 1) - (Number(b.order) || 1));

      // Group chapters by category
      const categoriesMap = {};
      subChapters.forEach(ch => {
        const catId = String(ch.category_id || 'general');
        if (!categoriesMap[catId]) {
          const catDoc = categories.find(c => String(c._id) === catId);
          categoriesMap[catId] = {
            category_id: catId,
            category_name: catDoc?.name || 'General Category',
            chapters: []
          };
        }

        // Find tests for this chapter
        const chId = String(ch._id);
        const chQuizzes = quizzes
          .filter(q => String(q.chapter_id) === chId && String(q.grade) === String(gradeFilter))
          .sort((a, b) => (Number(a.sequence_number) || 1) - (Number(b.sequence_number) || 1));

        categoriesMap[catId].chapters.push({
          chapter: ch,
          quizzes: chQuizzes
        });
      });

      return {
        subject: sub,
        categories: Object.values(categoriesMap)
      };
    }).filter(s => s.categories.length > 0);
  }, [subjects, chapters, categories, quizzes, gradeFilter, subjectFilter]);

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Manual Authoring & Scheduling
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Grade {gradeFilter} Assigned
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FiFileText className="text-emerald-600" />
            Quizzes & Assessments Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Author and assign manual STEM tests for Grade {gradeFilter} organized by Subject, Category, and Chapters.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('curriculum')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'curriculum'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FiLayers className="w-3.5 h-3.5" />
              <span>Curriculum View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FiList className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
            title="Refresh assessments"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => navigate('/teacher/quizzes/create')}
            className="stem-btn bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs rounded-xl"
          >
            <FiPlusCircle className="w-4 h-4" />
            <span>Add Manual Quiz</span>
          </button>
        </div>
      </div>

      {/* ─── Top Telemetry Metrics ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg shrink-0">
            {gradeFilter}
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Class</span>
            <strong className="text-slate-900 font-black text-sm block">Grade {gradeFilter} Only</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FiFileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Tests</span>
            <strong className="text-slate-900 font-black text-sm block">{telemetry.total} Tests</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Tests</span>
            <strong className="text-emerald-700 font-black text-sm block">{telemetry.published} Active</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FiClock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deactive Tests</span>
            <strong className="text-amber-700 font-black text-sm block">{telemetry.drafts} Deactive</strong>
          </div>
        </div>
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search assessments by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="stem-input pl-10 text-xs sm:text-sm w-full"
            />
          </div>

          {/* Assigned Grade display: Only show teacher's assigned grades (hide other classes) */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 mr-1">Class:</span>
            {assignedGrades.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGradeFilter(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  gradeFilter === g
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Grade {g} (Assigned)
              </button>
            ))}
          </div>
        </div>

        {/* Second Filter Row: Subject & Status */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500 mr-1">Subject:</span>
            <button
              type="button"
              onClick={() => setSubjectFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                subjectFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Subjects
            </button>
            {subjects.map((s) => (
              <button
                key={s._id}
                type="button"
                onClick={() => setSubjectFilter(s._id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  subjectFilter === s._id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Status:</span>
            {[
              { id: 'all', label: 'All Quizzes' },
              { id: 'published', label: 'Active' },
              { id: 'draft', label: 'Deactive' }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  statusFilter === st.id ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200/90 shadow-xs">
          <FiRefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm font-medium">Loading assessments from database...</p>
        </div>
      ) : viewMode === 'curriculum' ? (
        /* ─── CURRICULUM HIERARCHY VIEW: Subject -> Category -> Chapter -> Tests ─── */
        <div className="space-y-8">
          {hierarchicalData.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200/90 shadow-xs">
              <FiBookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No chapters or assessments found for Grade {gradeFilter}</p>
              <p className="text-xs text-slate-400">Click &quot;Add Manual Quiz&quot; above to create your first test.</p>
            </div>
          ) : (
            hierarchicalData.map(({ subject, categories: subCategories }) => (
              <div key={subject._id} className="space-y-6">
                {/* Subject Header */}
                <div className="flex items-center gap-3 pb-2 border-b-2 border-emerald-500/20">
                  <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {subject.name}
                  </h2>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                    {subject.code || 'STEM'}
                  </span>
                </div>

                {/* Categories */}
                {subCategories.map(cat => (
                  <div key={cat.category_id} className="space-y-4 pl-0 sm:pl-4">
                    {/* Category Header */}
                    <div className="flex items-center gap-2 text-slate-800">
                      <FiFolder className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-slate-800">
                        Category: {cat.category_name}
                      </h3>
                      <span className="text-xs text-slate-400">
                        ({cat.chapters.length} {cat.chapters.length === 1 ? 'Chapter' : 'Chapters'})
                      </span>
                    </div>

                    {/* Chapters under Category */}
                    <div className="grid grid-cols-1 gap-5">
                      {cat.chapters.map(({ chapter, quizzes: chQuizzes }) => (
                        <div
                          key={chapter._id}
                          className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden transition-all hover:border-slate-300"
                        >
                          {/* Chapter Banner */}
                          <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                                Ch {chapter.order || 1}
                              </span>
                              <div>
                                <h4 className="font-black text-slate-900 text-base">
                                  Chapter {chapter.order || 1}: {chapter.name}
                                </h4>
                                <span className="text-xs text-slate-400 font-medium">
                                  {chQuizzes.length} {chQuizzes.length === 1 ? 'Test Created' : 'Tests Created'}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                navigate(
                                  `/teacher/quizzes/create?subject_id=${subject._id}&category_id=${cat.category_id}&chapter_id=${chapter._id}&grade=${gradeFilter}&sequence_number=${chQuizzes.length + 1}`
                                );
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
                            >
                              <FiPlus className="w-3.5 h-3.5" />
                              <span>Add Test {chQuizzes.length + 1}</span>
                            </button>
                          </div>

                          {/* Tests inside Chapter */}
                          <div className="p-4 sm:p-6">
                            {chQuizzes.length === 0 ? (
                              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                                No tests created for this chapter yet.{' '}
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigate(
                                      `/teacher/quizzes/create?subject_id=${subject._id}&category_id=${cat.category_id}&chapter_id=${chapter._id}&grade=${gradeFilter}&sequence_number=1`
                                    );
                                  }}
                                  className="text-emerald-600 font-bold hover:underline ml-1"
                                >
                                  Create Test 1
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {chQuizzes.map((q, idx) => (
                                  <div
                                    key={q._id}
                                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                                  >
                                    <div className="flex items-start sm:items-center gap-3">
                                      {/* Test Sequence Badge */}
                                      <span className="w-16 text-center py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-xs shrink-0">
                                        Test {q.sequence_number || idx + 1}
                                      </span>

                                      <div>
                                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                          <span>{q.title}</span>
                                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                                            q.status === 'published'
                                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                              : 'bg-amber-50 text-amber-700 border-amber-200'
                                          }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                              q.status === 'published' ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
                                            }`} />
                                            {q.status === 'published' ? 'Active' : 'Deactive'}
                                          </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500">
                                          <span>
                                            <strong className="text-slate-700">
                                              {q.question_count || q.questions_count || (Array.isArray(q.question_ids) ? q.question_ids.length : 0)}
                                            </strong> Questions
                                          </span>
                                          <span>•</span>
                                          <span className="flex items-center gap-1">
                                            <FiClock className="w-3 h-3 text-slate-400" />
                                            {q.duration_minutes || 15} mins
                                          </span>
                                          <span>•</span>
                                          <span>
                                            Pass: <strong className="text-emerald-700">{q.passing_percentage || 70}%</strong>
                                          </span>
                                          <span>•</span>
                                          <span>
                                            Marks: <strong className="text-slate-700">{q.total_marks || 10}</strong>
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Test Actions */}
                                    <div className="flex items-center gap-2 self-end md:self-center">
                                      {/* Toggle Active / Deactive */}
                                      {q.status === 'published' ? (
                                        <button
                                          type="button"
                                          onClick={() => handleToggleStatus(q)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer font-bold text-xs"
                                          title="Deactivate assessment (Move to Draft)"
                                        >
                                          <FiEyeOff className="w-3 h-3 text-amber-600" />
                                          <span>Deactivate</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleToggleStatus(q)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer font-bold text-xs"
                                          title="Activate assessment (Publish to Students)"
                                        >
                                          <FiCheckCircle className="w-3 h-3 text-emerald-600" />
                                          <span>Activate</span>
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => openEditModal(q)}
                                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer border border-purple-200"
                                        title="Edit Assessment"
                                      >
                                        <FiEdit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDelete(q)}
                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200"
                                        title="Delete Assessment"
                                      >
                                        <FiTrash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      ) : (
        /* ─── TABULAR LIST VIEW ─── */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          {filteredQuizzes.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <FiBookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No assessments found</p>
              <p className="text-xs text-slate-400">Click &quot;Add Manual Quiz&quot; above to author and schedule your first assessment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Quiz Title & Test</th>
                    <th className="py-4 px-6">Grade & Chapter</th>
                    <th className="py-4 px-6">Questions</th>
                    <th className="py-4 px-6">Duration</th>
                    <th className="py-4 px-6">Passing %</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredQuizzes.map((q) => (
                    <tr key={q._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black text-[10px]">
                            Test {q.sequence_number || 1}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{q.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                          Mode: <span className="font-semibold text-purple-600 capitalize">{q.mode || 'both'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-700">
                        <div className="font-bold text-emerald-700">Grade {q.grade || '7'}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{q.chapter_name || 'Curriculum Chapter'}</div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-700 font-black">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                          {q.question_count || q.questions_count || (Array.isArray(q.question_ids) ? q.question_ids.length : 0)} Questions
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg font-bold">
                          <FiClock className="w-3.5 h-3.5 text-slate-400" />
                          {q.duration_minutes || 15} mins
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs font-bold text-emerald-700">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          <FiAward className="w-3.5 h-3.5 text-emerald-600" />
                          {q.passing_percentage || 70}%
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-[11px] border ${
                          q.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            q.status === 'published' ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
                          }`} />
                          {q.status === 'published' ? 'Active' : 'Deactive'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {q.status === 'published' ? (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(q)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer font-bold text-xs shadow-2xs"
                              title="Deactivate assessment (Move to Draft)"
                            >
                              <FiEyeOff className="w-3.5 h-3.5 text-amber-600" />
                              <span>Deactivate</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(q)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer font-bold text-xs shadow-2xs"
                              title="Activate assessment (Publish to Students)"
                            >
                              <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Activate</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditModal(q)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer border border-purple-200"
                            title="Edit Assessment"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(q)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200"
                            title="Delete Assessment"
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
        </div>
      )}

      {/* ─── Modal: Author / Edit Manual Quiz ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                  Manual Quiz Authoring
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {isEditing ? 'Edit STEM Assessment' : 'Author New Manual Quiz'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electric Circuits & Current Assessment"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="stem-input text-xs sm:text-sm w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Grade
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="stem-input text-xs sm:text-sm w-full"
                  >
                    {assignedGrades.map(g => (
                      <option key={g} value={g}>
                        Grade {g} (Assigned)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Test Sequence Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={formData.sequence_number}
                    onChange={(e) => setFormData({ ...formData, sequence_number: Number(e.target.value) })}
                    className="stem-input text-xs sm:text-sm w-full font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Subject *
                  </label>
                  <select
                    required
                    value={formData.subject_id}
                    onChange={(e) => {
                      const sid = e.target.value;
                      const matchingChaps = chapters.filter(c => String(c.subject_id) === String(sid));
                      setFormData({
                        ...formData,
                        subject_id: sid,
                        chapter_id: matchingChaps[0]?._id || ''
                      });
                    }}
                    className="stem-input text-xs sm:text-sm w-full"
                  >
                    <option value="">-- Select Subject --</option>
                    {subjects.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Chapter Unit *
                  </label>
                  <select
                    required
                    value={formData.chapter_id}
                    onChange={(e) => {
                      const ch = chapters.find(c => c._id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        chapter_id: e.target.value,
                        subject_id: ch?.subject_id || formData.subject_id,
                        category_id: ch?.category_id || formData.category_id
                      });
                    }}
                    className="stem-input text-xs sm:text-sm w-full"
                  >
                    <option value="">-- Select Chapter Unit --</option>
                    {modalAvailableChapters.map(c => (
                      <option key={c._id} value={c._id}>
                        Chapter {c.order || 1}: {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Duration (Mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                    className="stem-input text-xs sm:text-sm w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: Number(e.target.value) })}
                    className="stem-input text-xs sm:text-sm w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Passing %
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.passing_percentage}
                    onChange={(e) => setFormData({ ...formData, passing_percentage: Number(e.target.value) })}
                    className="stem-input text-xs sm:text-sm w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="stem-input text-xs sm:text-sm w-full"
                  >
                    <option value="easy">Easy (Foundational)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="hard">Hard (Advanced)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Participation Mode
                  </label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    className="stem-input text-xs sm:text-sm w-full"
                  >
                    <option value="both">Both Solo & Squad</option>
                    <option value="competitive">Competitive Solo</option>
                    <option value="collaborative">Collaborative Squad</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Outline topics covered and instructions for students..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="stem-input text-xs sm:text-sm w-full"
                />
              </div>

              {/* Anti-Cheat Settings */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <FiShield className="text-emerald-600" />
                  <span>Anti-Cheat Lockdown Parameters</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.require_fullscreen}
                      onChange={(e) => setFormData({ ...formData, require_fullscreen: e.target.checked })}
                      className="rounded text-emerald-600"
                    />
                    <span>Fullscreen Mandate</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.tab_switch_detection}
                      onChange={(e) => setFormData({ ...formData, tab_switch_detection: e.target.checked })}
                      className="rounded text-emerald-600"
                    />
                    <span>Tab Switch Detection</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="stem-btn py-2 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="stem-btn stem-btn-primary py-2 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer"
                >
                  {submitting ? 'Saving Assessment...' : isEditing ? 'Update Assessment' : 'Create Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
