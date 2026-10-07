import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { 
  FiHelpCircle, 
  FiCheck, 
  FiPlus, 
  FiTrash2, 
  FiEdit2, 
  FiRefreshCw, 
  FiSearch, 
  FiUpload, 
  FiDownload, 
  FiBookOpen,
  FiAward,
  FiLayers
} from 'react-icons/fi';
import { questionService, academicService, teacherService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const BLOOM_COLORS = {
  'Remembering': 'bg-blue-50 text-blue-700 border-blue-200',
  'Understanding': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Applying': 'bg-amber-50 text-amber-700 border-amber-200',
  'Analyzing': 'bg-purple-50 text-purple-700 border-purple-200',
  'Evaluating': 'bg-rose-50 text-rose-700 border-rose-200',
  'Creating': 'bg-indigo-50 text-indigo-700 border-indigo-200'
};

export default function TeacherQuestions() {
  const { user } = useAuth();
  const initialGrade = String(user?.assigned_grade || user?.grade || '8');

  const [questions, setQuestions] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assignedGrades, setAssignedGrades] = useState([initialGrade]);
  const [loading, setLoading] = useState(true);

  const [bloomFilter, setBloomFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState(initialGrade);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [chapterFilter, setChapterFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    explanation: '',
    bloom_level: 'Understanding',
    grade: initialGrade,
    subject_id: '',
    category_id: '',
    chapter_id: '',
    difficulty: 'medium',
    marks: 1,
    topic: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [qRes, chRes, subRes, catRes, myClsRes] = await Promise.all([
        questionService.getAll({
          bloom_level: bloomFilter !== 'all' ? bloomFilter : undefined,
          grade: gradeFilter !== 'all' ? gradeFilter : undefined,
          search: search.trim() || undefined,
          limit: 300
        }),
        academicService.getChapters(),
        academicService.getSubjects(),
        academicService.getCategories().catch(() => ({ data: [] })),
        teacherService.getMyClasses().catch(() => ({ data: [] }))
      ]);

      const qList = qRes.data?.data?.questions || qRes.data?.data || qRes.data || [];
      const chList = chRes.data?.data || chRes.data || [];
      const subList = subRes.data?.data || subRes.data || [];
      const catList = catRes.data?.data || catRes.data || [];
      const myClasses = myClsRes.data?.data || myClsRes.data || [];

      // Extract teacher's assigned grades
      const tGrades = [...new Set(myClasses.map(c => String(c.grade || '')).filter(Boolean))];
      const finalGrades = tGrades.length > 0 ? tGrades : ['7'];
      setAssignedGrades(finalGrades);

      if (!finalGrades.includes(gradeFilter)) {
        setGradeFilter(finalGrades[0]);
      }

      setQuestions(Array.isArray(qList) ? qList : []);
      setChapters(Array.isArray(chList) ? chList : []);
      setSubjects(Array.isArray(subList) ? subList : []);
      setCategories(Array.isArray(catList) ? catList : []);
    } catch (err) {
      toast.error('Failed to load questions from database.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [bloomFilter, gradeFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    const targetGrade = gradeFilter !== 'all' ? gradeFilter : (assignedGrades[0] || initialGrade);
    const targetChaps = chapters.filter(c => String(c.grade) === String(targetGrade));
    const firstCh = targetChaps[0] || chapters[0];
    setFormData({
      question: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      explanation: '',
      bloom_level: 'Understanding',
      grade: String(targetGrade),
      subject_id: firstCh?.subject_id || subjects[0]?._id || '',
      category_id: firstCh?.category_id || '',
      chapter_id: firstCh?._id || '',
      difficulty: 'medium',
      marks: 1,
      topic: ''
    });
    setShowModal(true);
  };

  const openEditModal = (q) => {
    setIsEditing(true);
    setSelectedId(q._id);
    setFormData({
      question: q.question || '',
      option_a: q.option_a || '',
      option_b: q.option_b || '',
      option_c: q.option_c || '',
      option_d: q.option_d || '',
      correct_answer: q.correct_answer || 'A',
      explanation: q.explanation || '',
      bloom_level: q.bloom_level || 'Understanding',
      grade: q.grade?.toString() || '7',
      subject_id: q.subject_id || '',
      category_id: q.category_id || '',
      chapter_id: q.chapter_id || '',
      difficulty: q.difficulty || 'medium',
      marks: q.marks || 1,
      topic: q.topic || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.option_a || !formData.option_b) {
      toast.error('Question text and at least options A and B are required.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing) {
        await questionService.updateQuestion(selectedId, formData);
        toast.success('Question updated successfully!');
      } else {
        await questionService.createQuestion(formData);
        toast.success('Question saved to question bank!');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving question';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (q) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }
    try {
      await questionService.deleteQuestion(q._id);
      toast.success('Question removed from bank');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete question');
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
          toast.error('CSV file is empty or has only headers');
          return;
        }

        const parsed = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 6) {
            parsed.push({
              question: parts[0],
              option_a: parts[1],
              option_b: parts[2],
              option_c: parts[3] || '',
              option_d: parts[4] || '',
              correct_answer: parts[5]?.toUpperCase() || 'A',
              explanation: parts[6] || '',
              bloom_level: parts[7] || 'Understanding',
              grade: parts[8] || '7',
              difficulty: parts[9]?.toLowerCase() || 'medium',
              marks: 1
            });
          }
        }

        if (parsed.length === 0) {
          toast.error('No valid question rows found in CSV');
          return;
        }

        let added = 0;
        for (const item of parsed) {
          try {
            await questionService.createQuestion(item);
            added++;
          } catch {
            // continue parsing other rows
          }
        }

        toast.success(`Imported ${added} questions successfully!`);
        fetchData();
      } catch (err) {
        toast.error('Failed to parse and import CSV');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const downloadCSVTemplate = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      'Question,Option A,Option B,Option C,Option D,Correct Answer,Explanation,Bloom Level,Grade,Difficulty\n' +
      '"What turns red litmus blue?","Acid","Base","Salt","Water","B","Bases turn red litmus paper blue","Remembering","7","easy"';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'stemlearn_question_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter categories based on selected subject in modal
  const modalAvailableCategories = useMemo(() => {
    if (!formData.subject_id) return categories;
    return categories.filter(c => String(c.subject_id) === String(formData.subject_id));
  }, [categories, formData.subject_id]);

  // Filter chapters based on selected subject, category, and grade in modal
  const modalAvailableChapters = useMemo(() => {
    return chapters.filter(c => {
      const matchGrade = !formData.grade || String(c.grade) === String(formData.grade);
      const matchSub = !formData.subject_id || String(c.subject_id) === String(formData.subject_id);
      const matchCat = !formData.category_id || String(c.category_id) === String(formData.category_id);
      return matchGrade && matchSub && matchCat;
    });
  }, [chapters, formData.grade, formData.subject_id, formData.category_id]);

  // Filter categories for the page filter bar
  const filterCategories = useMemo(() => {
    if (subjectFilter === 'all') return categories;
    return categories.filter(c => String(c.subject_id) === String(subjectFilter));
  }, [categories, subjectFilter]);

  // Filter chapters for the page filter bar
  const filterChapters = useMemo(() => {
    return chapters.filter(c => {
      const matchGrade = gradeFilter === 'all' || String(c.grade) === String(gradeFilter);
      const matchSub = subjectFilter === 'all' || String(c.subject_id) === String(subjectFilter);
      const matchCat = categoryFilter === 'all' || String(c.category_id) === String(categoryFilter);
      return matchGrade && matchSub && matchCat;
    });
  }, [chapters, gradeFilter, subjectFilter, categoryFilter]);

  // Client-side multi-dimensional filtering (Subject, Category, Chapter, Grade, Bloom, Search)
  const displayQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchesSearch = !search.trim() || 
        q.question?.toLowerCase().includes(search.toLowerCase()) ||
        q.topic?.toLowerCase().includes(search.toLowerCase()) ||
        q.explanation?.toLowerCase().includes(search.toLowerCase());
      const matchesGrade = gradeFilter === 'all' || String(q.grade || '7') === String(gradeFilter);
      const matchesSub = subjectFilter === 'all' || String(q.subject_id || '') === String(subjectFilter);
      const matchesCat = categoryFilter === 'all' || String(q.category_id || '') === String(categoryFilter);
      const matchesChap = chapterFilter === 'all' || String(q.chapter_id || '') === String(chapterFilter);
      const matchesBloom = bloomFilter === 'all' || q.bloom_level === bloomFilter;
      return matchesSearch && matchesGrade && matchesSub && matchesCat && matchesChap && matchesBloom;
    });
  }, [questions, search, gradeFilter, subjectFilter, categoryFilter, chapterFilter, bloomFilter]);

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Item Repository & Question Bank
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FiHelpCircle className="text-emerald-600" />
            STEM Question Bank & Item Repository
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Author and manage manual assessment items classified by cognitive depth across Bloom&apos;s Taxonomy and Class {gradeFilter === 'all' ? 'STEM' : `${gradeFilter} STEM`} topics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={downloadCSVTemplate}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Download CSV Template"
          >
            <FiDownload className="w-4 h-4" />
            <span className="hidden sm:inline">CSV Template</span>
          </button>

          <label className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs">
            <FiUpload className="w-4 h-4" />
            <span className="hidden sm:inline">Import CSV</span>
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          </label>

          <button
            type="button"
            onClick={openCreateModal}
            className="stem-btn bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs rounded-xl"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* ─── Top Telemetry Banner ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg shrink-0">
            {questions.length}
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Questions</span>
            <strong className="text-slate-900 font-black text-sm block">Bank Items</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FiBookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Curriculum</span>
            <strong className="text-slate-900 font-black text-sm block">{gradeFilter === 'all' ? 'All Classes STEM' : `Class ${gradeFilter} STEM`}</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <FiAward className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Taxonomy Scale</span>
            <strong className="text-slate-900 font-black text-sm block">6 Bloom Levels</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FiLayers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Syllabus Chapters</span>
            <strong className="text-emerald-700 font-black text-sm block">{chapters.length} Chapters</strong>
          </div>
        </div>
      </div>

      {/* ─── Filter Tabs & Search ─── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search question text or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="stem-input pl-10 text-xs sm:text-sm w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0">Class:</span>
            {assignedGrades.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setGradeFilter(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
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

        {/* Second Row: Subject filter pills */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 mr-1">Subject:</span>
          <button
            type="button"
            onClick={() => {
              setSubjectFilter('all');
              setCategoryFilter('all');
              setChapterFilter('all');
            }}
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
              onClick={() => {
                setSubjectFilter(s._id);
                setCategoryFilter('all');
                setChapterFilter('all');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                subjectFilter === s._id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Third Row: Category filter pills */}
        {filterCategories.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-500 mr-1">Category:</span>
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('all');
                setChapterFilter('all');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                categoryFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {filterCategories.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => {
                  setCategoryFilter(c._id);
                  setChapterFilter('all');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  categoryFilter === c._id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Fourth Row: Chapter filter selector */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 mr-1">Chapter:</span>
          <select
            value={chapterFilter}
            onChange={(e) => setChapterFilter(e.target.value)}
            className="stem-input py-1 px-3 text-xs font-semibold bg-white border-slate-200"
          >
            <option value="all">-- All Chapters ({filterChapters.length}) --</option>
            {filterChapters.map((ch) => (
              <option key={ch._id} value={ch._id}>
                {ch.name} (Grade {ch.grade || '7'})
              </option>
            ))}
          </select>
          {chapterFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setChapterFilter('all')}
              className="text-slate-500 hover:text-rose-600 font-bold ml-1 cursor-pointer"
            >
              Clear Chapter Filter
            </button>
          )}
        </div>

        {/* Fifth Row: Bloom's Taxonomy Filters */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1">Bloom Level:</span>
          {['all', 'Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating'].map(lvl => (
            <button
              key={lvl}
              type="button"
              onClick={() => setBloomFilter(lvl)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                bloomFilter === lvl
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {lvl === 'all' ? 'All Levels' : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Question List ─── */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200">
          <FiRefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm font-medium">Loading questions from MongoDB...</p>
        </div>
      ) : displayQuestions.length === 0 ? (
        <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200">
          <FiHelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No questions match your filter</p>
          <p className="text-xs text-slate-400">Click &quot;Add Question&quot; to author items for this category or chapter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayQuestions.map((q) => {
            const bloomClass = BLOOM_COLORS[q.bloom_level] || 'bg-slate-100 text-slate-700 border-slate-200';
            const chName = chapters.find(c => c._id === q.chapter_id)?.name || q.chapter_name || 'Core Unit';

            return (
              <div
                key={q._id}
                className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Meta Top */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${bloomClass}`}>
                      {q.bloom_level || 'Understanding'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
                      Grade {q.grade || '7'}
                    </span>
                    {q.category_id && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {categories.find(c => String(c._id) === String(q.category_id))?.name || 'Category'}
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {chName}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      {q.difficulty || 'medium'} • {q.marks || 1} mark(s)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(q)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                      title="Edit Question"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(q)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete Question"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Prompt */}
                <div className="text-slate-900 font-bold text-sm sm:text-base">
                  {q.question}
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {[
                    { key: 'A', text: q.option_a },
                    { key: 'B', text: q.option_b },
                    { key: 'C', text: q.option_c },
                    { key: 'D', text: q.option_d },
                  ].filter(opt => opt.text).map((opt) => {
                    const isCorrect = q.correct_answer === opt.key;
                    return (
                      <div
                        key={opt.key}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                          isCorrect
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-bold shadow-2xs'
                            : 'bg-slate-50/50 border-slate-200/70 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {opt.key}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {isCorrect && (
                          <span className="text-emerald-600 flex items-center gap-1 text-[11px] font-bold">
                            <FiCheck className="w-3.5 h-3.5" />
                            Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                    <strong className="text-slate-800 font-bold mr-1">Explanation:</strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal: Author / Edit Manual Question ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                  Question Authoring
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {isEditing ? 'Edit Question Item' : 'Add New Question Item'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Question Prompt *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="State the problem clearly according to NCERT middle-school standards..."
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="stem-input text-xs sm:text-sm w-full"
                />
              </div>

              {/* Subject, Category & Chapter selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Subject *
                  </label>
                  <select
                    required
                    value={formData.subject_id}
                    onChange={(e) => {
                      const sid = e.target.value;
                      const matchingCats = categories.filter(c => String(c.subject_id) === String(sid));
                      const firstCatId = matchingCats[0]?._id || '';
                      const matchingChaps = chapters.filter(c => String(c.subject_id) === String(sid));
                      setFormData({
                        ...formData,
                        subject_id: sid,
                        category_id: firstCatId,
                        chapter_id: matchingChaps[0]?._id || ''
                      });
                    }}
                    className="stem-input text-xs sm:text-sm w-full font-semibold"
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
                    Category (Discipline)
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => {
                      const catId = e.target.value;
                      const matchingChaps = chapters.filter(c => String(c.category_id) === String(catId));
                      setFormData({
                        ...formData,
                        category_id: catId,
                        chapter_id: matchingChaps[0]?._id || formData.chapter_id
                      });
                    }}
                    className="stem-input text-xs sm:text-sm w-full"
                  >
                    <option value="">-- Select Category --</option>
                    {modalAvailableCategories.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.name}
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
                      const chId = e.target.value;
                      const ch = chapters.find(c => String(c._id) === String(chId));
                      setFormData({
                        ...formData,
                        chapter_id: chId,
                        category_id: ch?.category_id ? String(ch.category_id) : formData.category_id,
                        subject_id: ch?.subject_id ? String(ch.subject_id) : formData.subject_id,
                        grade: ch?.grade ? String(ch.grade) : formData.grade
                      });
                    }}
                    className="stem-input text-xs sm:text-sm w-full font-semibold text-emerald-800"
                  >
                    <option value="">-- Select Chapter Unit --</option>
                    {modalAvailableChapters.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.name} (Grade {c.grade || '7'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Option A *</label>
                  <input
                    type="text"
                    required
                    value={formData.option_a}
                    onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                    className="stem-input text-xs sm:text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Option B *</label>
                  <input
                    type="text"
                    required
                    value={formData.option_b}
                    onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                    className="stem-input text-xs sm:text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Option C</label>
                  <input
                    type="text"
                    value={formData.option_c}
                    onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
                    className="stem-input text-xs sm:text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Option D</label>
                  <input
                    type="text"
                    value={formData.option_d}
                    onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
                    className="stem-input text-xs sm:text-sm w-full"
                  />
                </div>
              </div>

              {/* Correct Answer, Bloom, Grade, Marks */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correct Answer</label>
                  <select
                    value={formData.correct_answer}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                    className="stem-input text-xs sm:text-sm font-bold text-emerald-700 w-full"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bloom Level</label>
                  <select
                    value={formData.bloom_level}
                    onChange={(e) => setFormData({ ...formData, bloom_level: e.target.value })}
                    className="stem-input text-xs sm:text-sm w-full"
                  >
                    <option value="Remembering">Remembering</option>
                    <option value="Understanding">Understanding</option>
                    <option value="Applying">Applying</option>
                    <option value="Analyzing">Analyzing</option>
                    <option value="Evaluating">Evaluating</option>
                    <option value="Creating">Creating</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Grade</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="stem-input text-xs sm:text-sm w-full font-bold text-emerald-800"
                  >
                    {assignedGrades.map((g) => (
                      <option key={g} value={g}>
                        Grade {g} (Assigned)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Marks (Points)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: Number(e.target.value) || 1 })}
                    className="stem-input text-xs sm:text-sm w-full font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pedagogical Explanation</label>
                <textarea
                  rows={2}
                  placeholder="Explain why the correct answer is valid for student learning..."
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="stem-input text-xs sm:text-sm w-full"
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
                  className="stem-btn stem-btn-primary py-2 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer"
                >
                  {submitting ? 'Saving Question...' : isEditing ? 'Update Question' : 'Save to Question Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
