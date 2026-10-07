import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { academicService, studentService, learningPathService } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  FiCompass,
  FiBookOpen,
  FiLayers,
  FiCheckCircle,
  FiSearch,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiFolder,
  FiActivity,
  FiPlay,
  FiArrowRight,
  FiAward,
  FiCheck
} from 'react-icons/fi';

export default function StudentLearning() {
  const { user } = useAuth();

  // Extract student's enrolled grade
  const studentGrade = useMemo(() => {
    const raw = String(user?.grade || user?.assigned_grade || '7').replace(/\D/g, '');
    return raw || '7';
  }, [user]);

  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedTopics, setCollapsedTopics] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subsRes, catsRes, chapsRes, quizzesRes, pathsRes] = await Promise.all([
        academicService.getSubjects(),
        academicService.getCategories(),
        academicService.getChapters({ grade: studentGrade }),
        studentService.getQuizzes().catch(() => ({ data: { data: { quizzes: [] } } })),
        learningPathService.getAll({ grade: studentGrade }).catch(() => ({ data: { data: [] } }))
      ]);

      const subList = subsRes.data?.data || subsRes.data || [];
      const catList = catsRes.data?.data || catsRes.data || [];
      const chapList = chapsRes.data?.data || chapsRes.data || [];
      const rawQuizzes = quizzesRes.data?.data?.quizzes || quizzesRes.data?.data || quizzesRes.data || [];
      const pathList = pathsRes.data?.data || pathsRes.data || [];

      setSubjects(Array.isArray(subList) ? subList : []);
      setCategories(Array.isArray(catList) ? catList : []);
      setChapters(Array.isArray(chapList) ? chapList : []);
      setQuizzes(Array.isArray(rawQuizzes) ? rawQuizzes : []);
      setLearningPaths(Array.isArray(pathList) ? pathList : []);
    } catch (err) {
      console.error('Failed to load student curriculum:', err);
      toast.error(`Failed to load Class ${studentGrade} curriculum data`);
    } finally {
      setLoading(false);
    }
  }, [studentGrade]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Quiz completion info per chapter
  const getChapterQuizInfo = useCallback(
    (chapterId) => {
      const chQuizzes = quizzes.filter((q) => String(q.chapter_id || '') === String(chapterId));
      const passedCount = chQuizzes.filter((q) => q.passed || q.status === 'completed').length;
      const isCompleted = chQuizzes.length > 0 && passedCount === chQuizzes.length;
      const hasPassedAny = passedCount > 0;
      return {
        totalCount: chQuizzes.length,
        passedCount,
        isCompleted,
        hasPassedAny,
        firstQuiz: chQuizzes[0] || null
      };
    },
    [quizzes]
  );

  // Curriculum hierarchical tree strictly for student's grade: Subject -> Topics -> Chapters
  const curriculumHierarchy = useMemo(() => {
    const activeChapters = chapters.filter((c) => String(c.grade) === String(studentGrade));

    // Build subjects map
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

    // Register categories under subjects
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

    // Distribute chapters into topics
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

    // Keep only subjects that have active chapters for student's grade
    return Object.values(subjectMap)
      .map((s) => {
        const activeTopics = Object.values(s.topics).filter((t) => t.chapters.length > 0);
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
  }, [chapters, subjects, categories, studentGrade]);

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
              Class {studentGrade} Exclusive Curriculum
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Student Learning Pathway
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FiCompass className="w-8 h-8 text-emerald-600 shrink-0" />
            Class {studentGrade} STEM Learning Pathways
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Structured hierarchy of Class {studentGrade} Middle-School Curriculum: <strong>Subjects</strong> ➔ <strong>Core Topics</strong> ➔ <strong>Unit Chapters</strong> with passing criteria and interactive quizzes.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            title={`Refresh Class ${studentGrade} Curriculum`}
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <Link
            to="/student/quizzes"
            className="stem-btn stem-btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
          >
            <FiPlay className="w-4 h-4" />
            <span>Browse All Quizzes</span>
          </Link>
        </div>
      </div>

      {/* ─── Top Telemetry Banner ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg shrink-0">
            {studentGrade}
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Grade</span>
            <strong className="text-slate-900 font-black text-sm block">Class {studentGrade} Only</strong>
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
            placeholder={`Search Class ${studentGrade} topics or chapters...`}
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
          <span className="text-sm font-semibold text-slate-600">Loading Class {studentGrade} Curriculum Hierarchy...</span>
        </div>
      ) : filteredHierarchy.length === 0 ? (
        <div className="min-h-[260px] flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center">
          <FiLayers className="w-12 h-12 text-slate-300" />
          <h3 className="text-base font-bold text-slate-700">No Class {studentGrade} Modules Found</h3>
          <p className="text-xs text-slate-500 max-w-md">
            {searchQuery
              ? `No Class ${studentGrade} topics or chapters matched "${searchQuery}".`
              : `No syllabus units found for Class ${studentGrade} in this selection.`}
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
                          Grade {studentGrade} Curriculum
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Comprehensive Class {studentGrade} syllabus covering {subject.activeTopics.length} Core Academic Topics.
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
                                Class {studentGrade} Core Topic • {chaptersCount} Syllabus {chaptersCount === 1 ? 'Unit' : 'Units'}
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
                            {topic.chapters.map((ch, idx) => {
                              const quizInfo = getChapterQuizInfo(ch._id);

                              return (
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
                                        {quizInfo.isCompleted && (
                                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-300">
                                            <FiCheck className="w-3 h-3 text-emerald-700" />
                                            Mastered
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-500 mt-1 max-w-xl">
                                        {ch.description || `Standard Middle-School Class ${studentGrade} syllabus chapter with foundational concepts and evaluation.`}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Right: Chapter Metrics & Student Actions */}
                                  <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-xs pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex-wrap">
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

                                    {/* Interactive Action for Student */}
                                    <Link
                                      to={`/student/quizzes?chapter_id=${ch._id}`}
                                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                    >
                                      <span>{quizInfo.isCompleted ? 'Review Chapter' : 'Practice Chapter'}</span>
                                      <FiArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                  </div>
                                </div>
                              );
                            })}
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
    </div>
  );
}
