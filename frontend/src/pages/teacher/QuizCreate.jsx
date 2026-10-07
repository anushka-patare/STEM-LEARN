import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiBookOpen,
  FiLayers,
  FiAward,
  FiShield,
  FiCheck,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiHelpCircle,
  FiSave,
  FiSend,
  FiRefreshCw,
  FiZap
} from 'react-icons/fi';
import {
  quizService,
  academicService,
  questionService,
  classService,
  teacherService
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const BLOOM_COLORS = {
  'Remembering': 'bg-blue-50 text-blue-700 border-blue-200',
  'Understanding': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Applying': 'bg-amber-50 text-amber-700 border-amber-200',
  'Analyzing': 'bg-purple-50 text-purple-700 border-purple-200',
  'Evaluating': 'bg-rose-50 text-rose-700 border-rose-200',
  'Creating': 'bg-indigo-50 text-indigo-700 border-indigo-200'
};

export default function TeacherQuizCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Read query params if navigated from "+ Add Test"
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const defaultTeacherGrade = String(user?.assigned_grade || user?.grade || '8');
  const qpGrade = searchParams.get('grade') || defaultTeacherGrade;
  const qpSubId = searchParams.get('subject_id') || '';
  const qpCatId = searchParams.get('category_id') || '';
  const qpChapId = searchParams.get('chapter_id') || '';
  const qpSeq = searchParams.get('sequence_number') || '1';

  // ─── Data states ───
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assignedGrades, setAssignedGrades] = useState([qpGrade]);
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);

  // ─── Form Fields ───
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState(qpGrade);
  const [subjectId, setSubjectId] = useState(qpSubId);
  const [categoryId, setCategoryId] = useState(qpCatId);
  const [chapterId, setChapterId] = useState(qpChapId);
  const [sequenceNumber, setSequenceNumber] = useState(Number(qpSeq) || 1);
  const [classId, setClassId] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [manualMarks, setManualMarks] = useState('');
  const [passingPercentage, setPassingPercentage] = useState(70);
  const [mode, setMode] = useState('both');

  // Anti-cheat / Security
  const [requireFullscreen, setRequireFullscreen] = useState(true);
  const [tabSwitchDetection, setTabSwitchDetection] = useState(true);
  const [maxViolations, setMaxViolations] = useState(3);

  // Selected questions: Set of question._id
  const [selectedQuestionIds, setSelectedQuestionIds] = useState(new Set());

  // Search & chapter filter for question bank browsing
  const [questionSearch, setQuestionSearch] = useState('');
  const [collapsedChapters, setCollapsedChapters] = useState({});

  // ─── Fetch Master Data ───
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [subRes, catRes, chapRes, clsRes, qRes, myClsRes] = await Promise.all([
        academicService.getSubjects().catch(() => ({ data: [] })),
        academicService.getCategories().catch(() => ({ data: [] })),
        academicService.getChapters().catch(() => ({ data: [] })),
        classService.getAll().catch(() => ({ data: [] })),
        questionService.getAll({ limit: 300 }).catch(() => ({ data: [] })),
        teacherService.getMyClasses().catch(() => ({ data: [] }))
      ]);

      const subList = subRes.data?.data || subRes.data || [];
      const catList = catRes.data?.data || catRes.data || [];
      const chapList = chapRes.data?.data || chapRes.data || [];
      const clsList = clsRes.data?.data || clsRes.data || [];
      const qList = qRes.data?.data?.questions || qRes.data?.data || qRes.data || [];
      const myClasses = myClsRes.data?.data || myClsRes.data || [];

      // Extract teacher's assigned grades
      const tGrades = [...new Set(myClasses.map(c => String(c.grade || '')).filter(Boolean))];
      const finalGrades = tGrades.length > 0 ? tGrades : ['7'];
      setAssignedGrades(finalGrades);

      if (!finalGrades.includes(grade)) {
        setGrade(finalGrades[0]);
      }

      setSubjects(Array.isArray(subList) ? subList : []);
      setCategories(Array.isArray(catList) ? catList : []);
      setChapters(Array.isArray(chapList) ? chapList : []);
      setClasses(Array.isArray(clsList) ? clsList : []);
      setAllQuestions(Array.isArray(qList) ? qList : []);

      // Auto-set first Science or first subject if available and not specified in query params
      if (subList.length > 0 && !subjectId && !qpSubId) {
        const scienceSub = subList.find(s => s.name?.toLowerCase().includes('science')) || subList[0];
        setSubjectId(scienceSub._id);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      toast.error('Failed to load curriculum data.');
    } finally {
      setLoading(false);
    }
  }, [grade, qpSubId, subjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Categories filtered by chosen Subject
  const filteredCategories = useMemo(() => {
    if (!subjectId) return categories;
    return categories.filter(c => String(c.subject_id) === String(subjectId));
  }, [categories, subjectId]);

  // Filtered chapters for current Grade, Subject & Category
  const relevantChapters = useMemo(() => {
    return chapters.filter(ch => {
      const matchGrade = !grade || String(ch.grade) === String(grade);
      const matchSub = !subjectId || String(ch.subject_id) === String(subjectId);
      const matchCat = !categoryId || String(ch.category_id) === String(categoryId);
      return matchGrade && matchSub && matchCat;
    });
  }, [chapters, grade, subjectId, categoryId]);

  // Questions grouped by chapter
  const questionsByChapter = useMemo(() => {
    const map = {};
    // Ensure all relevant chapters have an entry
    relevantChapters.forEach(ch => {
      map[ch._id] = {
        chapter: ch,
        questions: []
      };
    });

    allQuestions.forEach(q => {
      const qChapId = String(q.chapter_id || '');
      const matchGrade = !grade || String(q.grade || '7') === String(grade);
      const matchSub = !subjectId || String(q.subject_id || '') === String(subjectId);
      const matchSearch = !questionSearch.trim() || 
        q.question?.toLowerCase().includes(questionSearch.toLowerCase()) ||
        q.topic?.toLowerCase().includes(questionSearch.toLowerCase());

      if (map[qChapId] && matchGrade && matchSub && matchSearch) {
        map[qChapId].questions.push(q);
      }
    });

    return map;
  }, [relevantChapters, allQuestions, grade, subjectId, questionSearch]);

  // Total calculated marks from selected questions
  const autoCalculatedMarks = useMemo(() => {
    let sum = 0;
    allQuestions.forEach(q => {
      if (selectedQuestionIds.has(q._id)) {
        sum += Number(q.marks || 1);
      }
    });
    return sum;
  }, [allQuestions, selectedQuestionIds]);

  const effectiveMarks = manualMarks !== '' ? Number(manualMarks) : autoCalculatedMarks || (selectedQuestionIds.size || 10);

  // Selected count per chapter
  const chapterSelectionSummary = useMemo(() => {
    const summary = [];
    relevantChapters.forEach(ch => {
      const chQuestions = questionsByChapter[ch._id]?.questions || [];
      const selectedCount = chQuestions.filter(q => selectedQuestionIds.has(q._id)).length;
      if (selectedCount > 0) {
        summary.push({
          chapterName: ch.name,
          chapterId: ch._id,
          selectedCount,
          totalAvailable: chQuestions.length
        });
      }
    });
    return summary;
  }, [relevantChapters, questionsByChapter, selectedQuestionIds]);

  // Toggle single question
  const toggleQuestion = (qId) => {
    setSelectedQuestionIds(prev => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  // Quick selection helper for a specific chapter (e.g. Select 5, Select 4, Select All, Clear)
  const handleQuickSelect = (chapterId, count) => {
    const chQuestions = questionsByChapter[chapterId]?.questions || [];
    setSelectedQuestionIds(prev => {
      const next = new Set(prev);
      if (count === 'all') {
        chQuestions.forEach(q => next.add(q._id));
      } else if (count === 'none') {
        chQuestions.forEach(q => next.delete(q._id));
      } else {
        // Select first `count` questions
        chQuestions.slice(0, count).forEach(q => next.add(q._id));
      }
      return next;
    });
  };

  // Collapse / expand chapter accordion
  const toggleChapterCollapse = (chapId) => {
    setCollapsedChapters(prev => ({
      ...prev,
      [chapId]: !prev[chapId]
    }));
  };

  // Handle form submission
  const handleSaveQuiz = async (status = 'published') => {
    if (!title.trim()) {
      toast.error('Please enter a Quiz Title.');
      return;
    }

    if (selectedQuestionIds.size === 0) {
      toast.error('Please select at least one question from the Question Bank.');
      return;
    }

    const questionIdsArray = Array.from(selectedQuestionIds);
    const selectedChap = chapters.find(c => String(c._id) === String(chapterId)) || relevantChapters[0] || chapters[0];
    const targetChapterId = chapterId || selectedChap?._id || '';
    const targetSubjectId = subjectId || selectedChap?.subject_id || '';
    const targetCategoryId = categoryId || selectedChap?.category_id || '';

    const payload = {
      title: title.trim(),
      description: description.trim(),
      grade: String(grade),
      subject_id: targetSubjectId,
      category_id: targetCategoryId,
      chapter_id: targetChapterId,
      sequence_number: Number(sequenceNumber) || 1,
      class_id: classId || '',
      difficulty,
      duration_minutes: Number(durationMinutes) || 15,
      total_marks: Number(effectiveMarks) || questionIdsArray.length,
      passing_percentage: Number(passingPercentage) || 70,
      mode,
      status, // 'published' (Active) or 'draft' (Deactive)
      selected_questions: questionIdsArray,
      question_ids: questionIdsArray,
      security_settings: {
        require_fullscreen: requireFullscreen,
        tab_switch_detection: tabSwitchDetection,
        window_focus_detection: true,
        refresh_protection: true,
        copy_protection: true,
        paste_protection: true,
        right_click_disabled: true,
        max_violations: Number(maxViolations) || 3,
        violation_action: 'auto_submit'
      }
    };

    try {
      setSubmitting(true);
      await quizService.createQuiz(payload);
      toast.success(
        status === 'published'
          ? `Quiz "${title}" published and activated successfully!`
          : `Quiz "${title}" saved as draft (deactivated)!`
      );
      navigate('/teacher/quizzes');
    } catch (err) {
      console.error('Failed to create manual quiz:', err);
      const msg = err.response?.data?.message || 'Failed to save quiz. Please check all fields.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 space-y-4">
        <FiRefreshCw className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-slate-600 font-bold text-sm">Loading Curriculum & Question Bank...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* ─── Top Header Bar ─── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-4 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/teacher/quizzes')}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              title="Back to Quizzes"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Manual Quiz Authoring
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">•</span>
                <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
                  Full Screen Builder
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Author New Manual Quiz
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSaveQuiz('draft')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <FiSave className="w-4 h-4 text-slate-500" />
              Save as Draft (Deactive)
            </button>
            <button
              type="button"
              disabled={submitting || selectedQuestionIds.size === 0}
              onClick={() => handleSaveQuiz('published')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md hover:shadow-emerald-200 disabled:opacity-50"
            >
              <FiSend className="w-4 h-4" />
              Publish & Activate Quiz
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* ─── Step 1: Assessment Info & Curriculum Mapping ─── */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                1
              </span>
              <h2 className="font-bold text-slate-900 text-base">
                Assessment Details & Curriculum Mapping
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">Step 1 of 2</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Title */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Quiz Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Grade 7 STEM Comprehensive Assessment — Unit 1 & 2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="stem-input w-full text-sm font-semibold"
                required
              />
            </div>

            {/* Grade Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Grade Level <span className="text-rose-500">*</span>
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="stem-input w-full text-sm font-bold text-emerald-800"
              >
                {assignedGrades.map((g) => (
                  <option key={g} value={g}>
                    Grade {g} (Assigned Class)
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Quiz Description / Instructions
              </label>
              <textarea
                rows={2}
                placeholder="Provide student instructions, topics covered, and evaluation criteria..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="stem-input w-full text-xs sm:text-sm"
              />
            </div>

            {/* Subject Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Subject <span className="text-rose-500">*</span>
              </label>
              <select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setCategoryId('');
                  setChapterId('');
                }}
                className="stem-input w-full text-sm font-semibold"
              >
                <option value="">-- All STEM Subjects --</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Subject Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setChapterId('');
                }}
                className="stem-input w-full text-sm"
              >
                <option value="">-- All Categories (Physics, Chemistry, etc.) --</option>
                {filteredCategories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter Unit Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Chapter Unit <span className="text-rose-500">*</span>
              </label>
              <select
                value={chapterId}
                onChange={(e) => {
                  const cid = e.target.value;
                  setChapterId(cid);
                  const chDoc = chapters.find(c => String(c._id) === String(cid));
                  if (chDoc) {
                    if (chDoc.subject_id) setSubjectId(chDoc.subject_id);
                    if (chDoc.category_id) setCategoryId(chDoc.category_id);
                  }
                }}
                className="stem-input w-full text-sm font-semibold"
                required
              >
                <option value="">-- Select Chapter Unit --</option>
                {relevantChapters.map((c) => (
                  <option key={c._id} value={c._id}>
                    Chapter {c.order || 1}: {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Sequence Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Test Sequence Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={sequenceNumber}
                onChange={(e) => setSequenceNumber(Number(e.target.value))}
                className="stem-input w-full text-sm font-bold text-emerald-800"
                placeholder="1 for Test 1, 2 for Test 2..."
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Labels this assessment as &quot;Test {sequenceNumber}&quot; under the chapter
              </span>
            </div>

            {/* Target Class */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Assign to Class
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="stem-input w-full text-sm font-semibold text-slate-700"
              >
                <option value="">-- Available to All Class {grade} Sections --</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} (Grade {c.grade || '7'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ─── Step 2: Timing, Marks & Evaluation Parameters ─── */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-black text-xs">
                2
              </span>
              <h2 className="font-bold text-slate-900 text-base">
                Assignment Time & Marking Scheme 
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">Evaluation Settings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Duration (Minutes) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                <FiClock className="inline mr-1 text-slate-400" />
                Duration (Minutes)
              </label>
              <div className="space-y-1.5">
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="stem-input w-full text-sm font-bold text-slate-900"
                />
                <div className="flex gap-1">
                  {[10, 15, 20, 30, 45].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMinutes(m)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        Number(durationMinutes) === m
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Marks */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                <FiAward className="inline mr-1 text-slate-400" />
                Total Marks
              </label>
              <div className="space-y-1.5">
                <input
                  type="number"
                  min="1"
                  max="500"
                  placeholder={`Auto: ${autoCalculatedMarks || selectedQuestionIds.size}`}
                  value={manualMarks}
                  onChange={(e) => setManualMarks(e.target.value)}
                  className="stem-input w-full text-sm font-bold text-emerald-800"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>From selection: <strong>{autoCalculatedMarks} pts</strong></span>
                  {manualMarks !== '' && (
                    <button
                      type="button"
                      onClick={() => setManualMarks('')}
                      className="text-purple-600 hover:underline cursor-pointer font-bold"
                    >
                      Auto-sync
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Passing % */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Passing Percentage
              </label>
              <input
                type="number"
                min="30"
                max="100"
                value={passingPercentage}
                onChange={(e) => setPassingPercentage(e.target.value)}
                className="stem-input w-full text-sm font-bold text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Standard mastery is 70%
              </span>
            </div>

            {/* Pedagogy Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Pedagogical Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="stem-input w-full text-sm font-semibold text-purple-800"
              >
                <option value="both">Both (Competitive & Collaborative)</option>
                <option value="competitive">Competitive Solo Ranking</option>
                <option value="collaborative">Collaborative Squads</option>
              </select>
            </div>
          </div>

          {/* Security & Anti-Cheat */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs">
            <span className="font-bold text-slate-700 uppercase flex items-center gap-1.5">
              <FiShield className="text-emerald-600 w-4 h-4" />
              Assessment Integrity:
            </span>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={requireFullscreen}
                onChange={(e) => setRequireFullscreen(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              Enforce Fullscreen
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={tabSwitchDetection}
                onChange={(e) => setTabSwitchDetection(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              Tab Switch Detection
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Max Violations:</span>
              <select
                value={maxViolations}
                onChange={(e) => setMaxViolations(Number(e.target.value))}
                className="stem-input py-1 px-2 text-xs font-bold w-16"
              >
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="5">5</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── Step 3: Question Bank - Chapter-wise Manual Selection ─── */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xs">
                  3
                </span>
                <h2 className="font-bold text-slate-900 text-lg">
                  Manual Question Bank Selection (Chapter-wise)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Select questions manually chapter-by-chapter (e.g. 5 questions from Chapter 1, 4 questions from Chapter 2).
              </p>
            </div>

            {/* Search inside question bank */}
            <div className="relative w-full md:w-72">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search questions by keyword..."
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                className="stem-input pl-10 text-xs w-full"
              />
            </div>
          </div>

          {/* Chapter Wise Accordion List */}
          {relevantChapters.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <FiBookOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No chapters match your selection</p>
              <p className="text-xs text-slate-400">Try choosing a different Subject or Grade level above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {relevantChapters.map((ch, idx) => {
                const chData = questionsByChapter[ch._id] || { chapter: ch, questions: [] };
                const chQuestions = chData.questions;
                const selectedCount = chQuestions.filter(q => selectedQuestionIds.has(q._id)).length;
                const isCollapsed = !!collapsedChapters[ch._id];

                return (
                  <div
                    key={ch._id}
                    className={`rounded-2xl border transition-all ${
                      selectedCount > 0
                        ? 'border-emerald-300 bg-emerald-50/20 shadow-2xs'
                        : 'border-slate-200/90 bg-white'
                    }`}
                  >
                    {/* Chapter Header */}
                    <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/60 rounded-t-2xl border-b border-slate-100">
                      <div
                        className="flex items-center gap-3 cursor-pointer select-none"
                        onClick={() => toggleChapterCollapse(ch._id)}
                      >
                        <button
                          type="button"
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          {isCollapsed ? <FiChevronDown className="w-5 h-5" /> : <FiChevronUp className="w-5 h-5" />}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-wide">
                              Chapter {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {ch.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>Grade {ch.grade || '7'}</span>
                            <span>•</span>
                            <span>{chQuestions.length} Questions in Bank</span>
                          </div>
                        </div>
                      </div>

                      {/* Chapter Quick Actions & Counters */}
                      <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                            selectedCount > 0
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          <FiCheck className="w-3.5 h-3.5" />
                          {selectedCount} Selected
                        </span>

                        {/* Quick Selection Buttons */}
                        {chQuestions.length > 0 && (
                          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                            {chQuestions.length >= 5 && (
                              <button
                                type="button"
                                onClick={() => handleQuickSelect(ch._id, 5)}
                                className="px-2 py-1 rounded-lg font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition-colors"
                                title="Select first 5 questions"
                              >
                                Select 5
                              </button>
                            )}
                            {chQuestions.length >= 4 && (
                              <button
                                type="button"
                                onClick={() => handleQuickSelect(ch._id, 4)}
                                className="px-2 py-1 rounded-lg font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition-colors"
                                title="Select first 4 questions"
                              >
                                Select 4
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleQuickSelect(ch._id, 'all')}
                              className="px-2 py-1 rounded-lg font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition-colors"
                            >
                              All ({chQuestions.length})
                            </button>
                            {selectedCount > 0 && (
                              <button
                                type="button"
                                onClick={() => handleQuickSelect(ch._id, 'none')}
                                className="px-2 py-1 rounded-lg font-bold text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chapter Question Items */}
                    {!isCollapsed && (
                      <div className="p-4 sm:p-5 space-y-3">
                        {chQuestions.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl">
                            No questions found in question bank for this chapter.
                          </div>
                        ) : (
                          chQuestions.map((q, qIndex) => {
                            const isSelected = selectedQuestionIds.has(q._id);
                            const bloomClass = BLOOM_COLORS[q.bloom_level] || 'bg-slate-100 text-slate-700 border-slate-200';

                            return (
                              <div
                                key={q._id}
                                onClick={() => toggleQuestion(q._id)}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer select-none space-y-3 ${
                                  isSelected
                                    ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/40'
                                }`}
                              >
                                {/* Header with Checkbox & Meta */}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <div className="pt-0.5">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}} // Handled by parent div
                                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                      />
                                    </div>
                                    <div>
                                      <div className="text-xs font-bold text-slate-500">
                                        Q{qIndex + 1}.
                                      </div>
                                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                                        {q.question}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${bloomClass}`}>
                                      {q.bloom_level || 'Understanding'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                                      {q.marks || 1} mark
                                    </span>
                                  </div>
                                </div>

                                {/* Options Grid Preview */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7 pt-1">
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
                                        className={`p-2 rounded-xl text-xs flex items-center justify-between border ${
                                          isCorrect
                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                            : 'bg-slate-50/70 border-slate-200 text-slate-700'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                          }`}>
                                            {opt.key}
                                          </span>
                                          <span className="truncate">{opt.text}</span>
                                        </div>
                                        {isCorrect && (
                                          <span className="text-emerald-700 text-[10px] font-bold flex items-center gap-0.5">
                                            <FiCheck className="w-3 h-3" /> Correct
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Pedagogical Explanation Preview */}
                                {q.explanation && (
                                  <div className="pl-7 text-[11px] text-slate-500 italic">
                                    💡 <strong>Explanation:</strong> {q.explanation}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Sticky Bottom Summary & Floating Action Bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-8 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Live counters & Breakdown */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-bold text-emerald-900">
                {selectedQuestionIds.size} Questions Selected
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl font-bold text-slate-700">
              <FiAward className="text-emerald-600 w-3.5 h-3.5" />
              <span>{effectiveMarks} Total Marks</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl font-bold text-slate-700">
              <FiClock className="text-purple-600 w-3.5 h-3.5" />
              <span>{durationMinutes} Minutes</span>
            </div>

            {/* Chapter Breakdown Pills */}
            <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto max-w-md">
              {chapterSelectionSummary.map(cs => (
                <span
                  key={cs.chapterId}
                  className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg text-[11px] font-semibold flex-shrink-0"
                >
                  {cs.chapterName}: <strong className="text-emerald-700">{cs.selectedCount}</strong>
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 justify-end">
            <button
              type="button"
              onClick={() => navigate('/teacher/quizzes')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSaveQuiz('draft')}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={submitting || selectedQuestionIds.size === 0}
              onClick={() => handleSaveQuiz('published')}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md hover:shadow-emerald-200 disabled:opacity-50 flex items-center gap-2"
            >
              <FiCheckCircle className="w-4 h-4" />
              {submitting ? 'Saving Assessment...' : 'Publish & Activate Quiz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
