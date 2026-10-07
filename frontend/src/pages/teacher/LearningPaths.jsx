import { useState, useEffect, useMemo, useCallback } from 'react';
import { learningPathService, academicService, teacherService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  FiCompass,
  FiBookOpen,
  FiLayers,
  FiCheckCircle,
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiCpu,
  FiFolder,
  FiFileText,
  FiAward,
  FiActivity,
  FiShield
} from 'react-icons/fi';

export default function TeacherLearningPaths() {
  const { user } = useAuth();

  // Resolve assigned grade from user object or assigned classes
  const initialGrade = useMemo(() => {
    if (user?.assigned_grade) return String(user.assigned_grade);
    if (user?.grade) return String(user.grade);
    if (Array.isArray(user?.assigned_classes) && user.assigned_classes.length > 0) {
      const match = String(user.assigned_classes[0]).match(/\d+/);
      if (match) return match[0];
    }
    return '8';
  }, [user]);

  const [activeGrade, setActiveGrade] = useState(initialGrade);
  const [assignedGrades, setAssignedGrades] = useState([initialGrade]);

  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedTopics, setCollapsedTopics] = useState({});

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPath, setNewPath] = useState({
    title: '',
    grade: initialGrade,
    subject_id: '',
    category_id: '',
    chapter_id: '',
    description: '',
    passing_percentage: 70
  });

  const fetchData = useCallback(async (targetGrade = activeGrade) => {
    setLoading(true);
    try {
      const [subsRes, catsRes, chapsRes, pathsRes, myClsRes] = await Promise.all([
        academicService.getSubjects(),
        academicService.getCategories(),
        academicService.getChapters({ grade: targetGrade }),
        learningPathService.getAll({ grade: targetGrade }).catch(() => ({ data: { data: [] } })),
        teacherService.getMyClasses().catch(() => ({ data: { data: [] } }))
      ]);

      const myClasses = myClsRes.data?.data || myClsRes.data || [];
      const extractedGrades = [...new Set(myClasses.map((c) => String(c.grade || '')).filter(Boolean))];
      const teacherAssigned = user?.assigned_grade ? String(user.assigned_grade) : null;
      const combined = [...new Set([...(teacherAssigned ? [teacherAssigned] : []), ...extractedGrades])];
      const validGrades = combined.length > 0 ? combined : [String(targetGrade)];

      setAssignedGrades(validGrades);

      setSubjects(subsRes.data?.data || []);
      setCategories(catsRes.data?.data || []);
      setChapters(chapsRes.data?.data || []);
      setLearningPaths(pathsRes.data?.data || []);
    } catch (err) {
      console.error(`Failed to load Class ${targetGrade} learning paths data:`, err);
      toast.error(`Failed to load Class ${targetGrade} curriculum data`);
    } finally {
      setLoading(false);
    }
  }, [activeGrade, user]);

  useEffect(() => {
    if (initialGrade) {
      setActiveGrade(initialGrade);
      setNewPath((prev) => ({ ...prev, grade: initialGrade }));
      fetchData(initialGrade);
    }
  }, [initialGrade, fetchData]);

  const handleGradeChange = (newGrade) => {
    setActiveGrade(newGrade);
    setNewPath((prev) => ({ ...prev, grade: newGrade }));
    fetchData(newGrade);
  };

  // Grade-specific hierarchical tree: Subject -> Topics -> Chapters
  const curriculumHierarchy = useMemo(() => {
    // 1. Strictly chapters for the active grade
    const activeChapters = chapters.filter((c) => String(c.grade) === String(activeGrade));

    // 2. Build subjects map
    const subjectMap = {};
    subjects.forEach((s) => {
      subjectMap[String(s._id)] = {
        _id: String(s._id),
        name: s.name,
        code: s.code || 'STEM',
        description: s.description || '',
        topics: {},
        totalChapters: 0
      };
    });

    // 3. Register categories under subjects
    categories.forEach((cat) => {
      const sId = String(cat.subject_id || '');
      if (subjectMap[sId]) {
        subjectMap[sId].topics[String(cat._id)] = {
          _id: String(cat._id),
          name: cat.name,
          description: cat.description || '',
          chapters: []
        };
      }
    });

    // 4. Distribute active chapters into topics
    activeChapters.forEach((ch) => {
      const sId = String(ch.subject_id || '');
      let subj = subjectMap[sId];
      if (!subj && ch.subject_name) {
        subj = Object.values(subjectMap).find(
          (s) => s.name?.toLowerCase() === ch.subject_name?.toLowerCase()
        );
      }
      if (!subj) {
        const cat = categories.find((c) => String(c._id) === String(ch.category_id));
        if (cat && cat.subject_id && subjectMap[String(cat.subject_id)]) {
          subj = subjectMap[String(cat.subject_id)];
        }
      }

      if (subj) {
        const cId = String(ch.category_id || 'general');
        if (!subj.topics[cId]) {
          subj.topics[cId] = {
            _id: cId,
            name: ch.category_name || 'General Core Topic',
            description: '',
            chapters: []
          };
        }
        subj.topics[cId].chapters.push(ch);
        subj.totalChapters += 1;
      }
    });

    // 5. Keep only subjects with active chapters
    return Object.values(subjectMap)
      .map((s) => {
        const activeTopics = Object.values(s.topics).filter(
          (t) => t.chapters.length > 0
        );
        activeTopics.forEach((t) => {
          t.chapters.sort((a, b) => (a.order || 0) - (b.order || 0));
        });
        return {
          ...s,
          activeTopics,
          totalChapters: activeTopics.reduce((acc, t) => acc + t.chapters.length, 0)
        };
      })
      .filter((s) => s.totalChapters > 0);
  }, [chapters, subjects, categories, activeGrade]);

  // Overall totals
  const totalStats = useMemo(() => {
    const totalSubs = curriculumHierarchy.length;
    const totalTopics = curriculumHierarchy.reduce((acc, s) => acc + s.activeTopics.length, 0);
    const totalChaps = curriculumHierarchy.reduce((acc, s) => acc + s.totalChapters, 0);
    return { totalSubs, totalTopics, totalChaps };
  }, [curriculumHierarchy]);

  // Filtered hierarchy by Subject and Search query
  const filteredHierarchy = useMemo(() => {
    return curriculumHierarchy
      .filter((s) => {
        if (selectedSubjectFilter === 'all') return true;
        return s._id === selectedSubjectFilter;
      })
      .map((s) => {
        if (!searchQuery.trim()) return s;
        const q = searchQuery.toLowerCase();

        const matchingTopics = s.activeTopics
          .map((t) => {
            const topicMatches = t.name.toLowerCase().includes(q);
            const matchingChapters = t.chapters.filter(
              (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.description && c.description.toLowerCase().includes(q))
            );
            if (topicMatches) {
              return t;
            }
            if (matchingChapters.length > 0) {
              return { ...t, chapters: matchingChapters };
            }
            return null;
          })
          .filter(Boolean);

        return {
          ...s,
          activeTopics: matchingTopics,
          totalChapters: matchingTopics.reduce((acc, t) => acc + t.chapters.length, 0)
        };
      })
      .filter((s) => s.activeTopics.length > 0);
  }, [curriculumHierarchy, selectedSubjectFilter, searchQuery]);

  const toggleTopicCollapse = (topicId) => {
    setCollapsedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  const handleCreatePath = async (e) => {
    e.preventDefault();
    if (!newPath.title || !newPath.subject_id) {
      toast.error('Title and Subject are required');
      return;
    }
    try {
      await learningPathService.createLearningPath({
        ...newPath,
        grade: String(activeGrade)
      });
      toast.success(`Class ${activeGrade} learning pathway created successfully`);
      setShowCreateModal(false);
      setNewPath({
        title: '',
        grade: String(activeGrade),
        subject_id: '',
        category_id: '',
        chapter_id: '',
        description: '',
        passing_percentage: 70
      });
      fetchData(activeGrade);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create learning path');
    }
  };

  // Helper styles for subject badges and icons
  const getSubjectTheme = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('science')) {
      return {
        gradient: 'from-emerald-600 to-teal-700',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        topicBadge: 'bg-emerald-100/70 text-emerald-900',
        icon: '🔬',
        accentBorder: 'border-emerald-200/90'
      };
    }
    if (n.includes('math')) {
      return {
        gradient: 'from-blue-600 to-indigo-700',
        badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
        topicBadge: 'bg-blue-100/70 text-blue-900',
        icon: '📐',
        accentBorder: 'border-blue-200/90'
      };
    }
    if (n.includes('tech')) {
      return {
        gradient: 'from-purple-600 to-violet-700',
        badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
        topicBadge: 'bg-purple-100/70 text-purple-900',
        icon: '💻',
        accentBorder: 'border-purple-200/90'
      };
    }
    return {
      gradient: 'from-amber-600 to-orange-700',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      topicBadge: 'bg-amber-100/70 text-amber-900',
      icon: '⚙️',
      accentBorder: 'border-amber-200/90'
    };
  };

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Class {activeGrade} Exclusive Curriculum
            </span>

            {/* If assigned to multiple grades, show grade pills */}
            {assignedGrades.length > 1 && (
              <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {assignedGrades.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGradeChange(g)}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      String(activeGrade) === String(g)
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Grade {g}
                  </button>
                ))}
              </div>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FiCompass className="w-8 h-8 text-emerald-600 shrink-0" />
            Class {activeGrade} STEM Learning Pathways
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Structured hierarchy of Class {activeGrade} Middle-School Curriculum: <strong>Subjects</strong> ➔ <strong>Core Topics</strong> ➔ <strong>Unit Chapters</strong> with passing criteria and diagnostic quiz counts.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={() => fetchData(activeGrade)}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            title={`Refresh Class ${activeGrade} Curriculum`}
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="stem-btn stem-btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>New Class {activeGrade} Pathway</span>
          </button>
        </div>
      </div>

      {/* ─── Top Telemetry Banner ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg shrink-0">
            {activeGrade}
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Grade</span>
            <strong className="text-slate-900 font-black text-sm block">Class {activeGrade} Only</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FiBookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">STEM Subjects</span>
            <strong className="text-slate-900 font-black text-sm block">{totalStats.totalSubs} Subjects</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <FiFolder className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Academic Topics</span>
            <strong className="text-slate-900 font-black text-sm block">{totalStats.totalTopics} Core Topics</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FiLayers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Chapters</span>
            <strong className="text-emerald-700 font-black text-sm block">{totalStats.totalChaps} Chapters</strong>
          </div>
        </div>
      </div>

      {/* ─── Search & Subject Filter Bar ─── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder={`Search Class ${activeGrade} topics or chapters...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="stem-input pl-10 text-xs sm:text-sm w-full"
          />
        </div>

        {/* Subject Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 mr-1">Subject:</span>
          <button
            type="button"
            onClick={() => setSelectedSubjectFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedSubjectFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Subjects ({totalStats.totalChaps})
          </button>
          {curriculumHierarchy.map((s) => (
            <button
              key={s._id}
              type="button"
              onClick={() => setSelectedSubjectFilter(s._id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedSubjectFilter === s._id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {s.name} ({s.totalChapters})
            </button>
          ))}
        </div>
      </div>

      {/* ─── Main Hierarchy Display ─── */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200">
          <FiRefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-600">Loading Class {activeGrade} Curriculum Hierarchy...</span>
        </div>
      ) : filteredHierarchy.length === 0 ? (
        <div className="min-h-[260px] flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center">
          <FiLayers className="w-12 h-12 text-slate-300" />
          <h3 className="text-base font-bold text-slate-700">No Class {activeGrade} Modules Found</h3>
          <p className="text-xs text-slate-500 max-w-md">
            {searchQuery
              ? `No Class ${activeGrade} topics or chapters matched "${searchQuery}".`
              : `No syllabus units found for Class ${activeGrade} in this selection.`}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredHierarchy.map((subject) => {
            const theme = getSubjectTheme(subject.name);

            return (
              <div
                key={subject._id}
                className={`bg-white rounded-3xl border ${theme.accentBorder} shadow-xs overflow-hidden transition-all`}
              >
                {/* ─── Level 1: Subject Header ─── */}
                <div className="p-6 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${theme.gradient} text-white flex items-center justify-center text-2xl shadow-sm shrink-0`}>
                      {theme.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          {subject.name}
                        </h2>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                          {subject.code}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Grade {activeGrade} Curriculum
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Comprehensive Class {activeGrade} syllabus covering {subject.activeTopics.length} Core Academic Topics.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:self-center">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chapters in Subject</span>
                      <strong className="text-emerald-700 font-black text-base block">
                        {subject.totalChapters} Chapters
                      </strong>
                    </div>
                  </div>
                </div>

                {/* ─── Level 2 & 3: Topics & Chapters ─── */}
                <div className="p-6 space-y-6">
                  {subject.activeTopics.map((topic) => {
                    const isCollapsed = Boolean(collapsedTopics[topic._id]);
                    const chaptersCount = topic.chapters.length;

                    return (
                      <div
                        key={topic._id}
                        className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden hover:border-slate-300 transition-colors"
                      >
                        {/* Topic Header with prominent Chapter Count */}
                        <div
                          onClick={() => toggleTopicCollapse(topic._id)}
                          className="p-4 sm:p-5 bg-slate-50/50 hover:bg-slate-100/60 cursor-pointer flex items-center justify-between gap-4 border-b border-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                              <FiFolder className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2.5">
                                <h3 className="text-base font-black text-slate-900">
                                  {topic.name}
                                </h3>
                                {/* Highlighted Chapter Count */}
                                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-xs border border-emerald-200">
                                  <FiLayers className="w-3.5 h-3.5" />
                                  {chaptersCount} {chaptersCount === 1 ? 'Chapter' : 'Chapters'}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-medium">
                                Class {activeGrade} Core Topic • {chaptersCount} Syllabus {chaptersCount === 1 ? 'Unit' : 'Units'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                              {isCollapsed ? 'Show Chapters' : 'Hide Chapters'}
                            </span>
                            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                              {isCollapsed ? <FiChevronDown className="w-4 h-4" /> : <FiChevronUp className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {/* Level 3: Chapters List Inside Topic */}
                        {!isCollapsed && (
                          <div className="divide-y divide-slate-100">
                            {topic.chapters.map((ch, idx) => (
                              <div
                                key={ch._id}
                                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                              >
                                {/* Left: Chapter Number, Name & Description */}
                                <div className="flex items-start sm:items-center gap-3.5">
                                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200/80">
                                    0{idx + 1}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                                        {ch.name}
                                      </h4>
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                                        Unit #{ch.order || idx + 1}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                                      {ch.description || `Standard Middle-School Class ${activeGrade} syllabus chapter with foundational concepts and evaluation.`}
                                    </p>
                                  </div>
                                </div>

                                {/* Right: Chapter Metrics */}
                                <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-xs pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                                  {/* Passing Criteria */}
                                  <div className="px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-emerald-800 font-bold flex items-center gap-1.5">
                                    <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Pass Score: {ch.passing_score_pct || 70}%</span>
                                  </div>

                                  {/* Quizzes Count */}
                                  <div className="px-3 py-1.5 rounded-xl bg-blue-50/70 border border-blue-200/70 text-blue-800 font-bold flex items-center gap-1.5">
                                    <FiActivity className="w-3.5 h-3.5 text-blue-600" />
                                    <span>
                                      {ch.quiz_count ? `${ch.quiz_count} Quizzes` : 'Formative Quiz'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal: Create New Learning Path ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                  Class {activeGrade} Curriculum
                </span>
                <h3 className="text-lg font-black text-slate-900">Create Class {activeGrade} Pathway</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePath} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Pathway Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. Class ${activeGrade} Physics: Sound & Force Pathway`}
                  value={newPath.title}
                  onChange={(e) => setNewPath({ ...newPath, title: e.target.value })}
                  className="stem-input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Grade
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`Grade ${activeGrade} (Class ${activeGrade})`}
                    className="stem-input w-full text-xs bg-slate-100 text-slate-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Subject *
                  </label>
                  <select
                    required
                    value={newPath.subject_id}
                    onChange={(e) =>
                      setNewPath({ ...newPath, subject_id: e.target.value, category_id: '', chapter_id: '' })
                    }
                    className="stem-input w-full text-xs"
                  >
                    <option value="">Select Subject</option>
                    {curriculumHierarchy.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.totalChapters} Chapters)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Topic selection */}
              {newPath.subject_id && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Core Topic
                  </label>
                  <select
                    value={newPath.category_id}
                    onChange={(e) =>
                      setNewPath({ ...newPath, category_id: e.target.value, chapter_id: '' })
                    }
                    className="stem-input w-full text-xs"
                  >
                    <option value="">All Topics in Subject</option>
                    {curriculumHierarchy
                      .find((s) => s._id === newPath.subject_id)
                      ?.activeTopics.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name} ({t.chapters.length} Chapters)
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Dynamic Chapter selection */}
              {newPath.category_id && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Target Chapter
                  </label>
                  <select
                    value={newPath.chapter_id}
                    onChange={(e) => setNewPath({ ...newPath, chapter_id: e.target.value })}
                    className="stem-input w-full text-xs"
                  >
                    <option value="">Full Topic Sequence</option>
                    {curriculumHierarchy
                      .find((s) => s._id === newPath.subject_id)
                      ?.activeTopics.find((t) => t._id === newPath.category_id)
                      ?.chapters.map((ch) => (
                        <option key={ch._id} value={ch._id}>
                          {ch.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Passing Score Requirement (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={newPath.passing_percentage}
                  onChange={(e) =>
                    setNewPath({ ...newPath, passing_percentage: parseInt(e.target.value) || 70 })
                  }
                  className="stem-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Outline the learning sequence and syllabus outcomes..."
                  value={newPath.description}
                  onChange={(e) => setNewPath({ ...newPath, description: e.target.value })}
                  className="stem-input w-full text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="stem-btn py-2 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="stem-btn stem-btn-primary py-2 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer"
                >
                  Save Pathway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
