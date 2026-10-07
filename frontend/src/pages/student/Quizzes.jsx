import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { studentService, academicService } from '../../services/api';
import {
  FiFileText,
  FiClock,
  FiAward,
  FiPlay,
  FiCheckCircle,
  FiLock,
  FiUnlock,
  FiSearch,
  FiRefreshCw,
  FiBookOpen,
  FiLayers,
  FiZap,
  FiFolder,
  FiCheck,
  FiRotateCcw
} from 'react-icons/fi';

export default function StudentQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const [qRes, subRes] = await Promise.all([
        studentService.getQuizzes().catch((err) => {
          console.error('Student quizzes fetch failed:', err);
          return { data: { data: { quizzes: [], hierarchy: [] } } };
        }),
        academicService.getSubjects().catch(() => ({ data: [] }))
      ]);

      const qData = qRes.data?.data || {};
      const qList = qData.quizzes || (Array.isArray(qData) ? qData : []);
      const hList = qData.hierarchy || [];
      const subList = subRes.data?.data || (Array.isArray(subRes.data) ? subRes.data : []);

      setQuizzes(Array.isArray(qList) ? qList : []);
      setHierarchy(Array.isArray(hList) ? hList : []);
      setSubjects(Array.isArray(subList) ? subList : []);
    } catch (err) {
      toast.error('Failed to load published STEM quizzes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  // Overall student progression metrics
  const telemetry = useMemo(() => {
    const total = quizzes.length;
    const passed = quizzes.filter(q => q.passed).length;
    const locked = quizzes.filter(q => q.is_locked).length;
    const points = quizzes.reduce((acc, q) => acc + (Number(q.points_earned) || 0), 0);
    return { total, passed, locked, points };
  }, [quizzes]);

  // Filtered hierarchy based on subject selection and search query
  const filteredHierarchy = useMemo(() => {
    const targetSubjects = selectedSubject === 'all'
      ? hierarchy
      : hierarchy.filter(s => String(s.subject_id) === String(selectedSubject));

    if (!search.trim()) {
      return targetSubjects;
    }

    const query = search.toLowerCase();

    return targetSubjects.map(sub => {
      const filteredCategories = sub.categories.map(cat => {
        const filteredChapters = cat.chapters.map(ch => {
          const matchingQuizzes = ch.quizzes.filter(q => 
            q.title?.toLowerCase().includes(query) ||
            q.chapter_name?.toLowerCase().includes(query) ||
            cat.category_name?.toLowerCase().includes(query)
          );
          return {
            ...ch,
            quizzes: matchingQuizzes
          };
        }).filter(ch => ch.quizzes.length > 0 || ch.chapter_name?.toLowerCase().includes(query));

        return {
          ...cat,
          chapters: filteredChapters
        };
      }).filter(cat => cat.chapters.length > 0);

      return {
        ...sub,
        categories: filteredCategories
      };
    }).filter(sub => sub.categories.length > 0);
  }, [hierarchy, selectedSubject, search]);

  return (
    <div className="space-y-8">
      {/* ─── Top Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
              Curriculum Sequential Progression
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Exam Unlocking Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FiFileText className="text-purple-600" />
            Curriculum Tests & Assessments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Unit progression workflow: <strong>Chapter 1 Test 1 is unlocked by default</strong>. Pass each exam to earn points and unlock the next test!
          </p>
        </div>

        <button
          type="button"
          onClick={fetchQuizzes}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors self-start sm:self-auto cursor-pointer shadow-xs"
          title="Refresh assessments"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
        </button>
      </div>

      {/* ─── Telemetry Metrics ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black shrink-0">
            <FiLayers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Tests</span>
            <strong className="text-slate-900 font-black text-sm block">{telemetry.total} Tests</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tests Passed</span>
            <strong className="text-emerald-700 font-black text-sm block">{telemetry.passed} Cleared</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FiLock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Locked Tests</span>
            <strong className="text-amber-700 font-black text-sm block">{telemetry.locked} Locked</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FiZap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Points Earned</span>
            <strong className="text-indigo-700 font-black text-sm block">+{telemetry.points} Pts</strong>
          </div>
        </div>
      </div>

      {/* ─── Search & Subject Filter Bar ─── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by test, category, or chapter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="stem-input pl-10 text-xs sm:text-sm w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setSelectedSubject('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedSubject === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Subjects
          </button>
          {subjects.map((sub) => {
            const subQuizzes = quizzes.filter(q => String(q.subject_id) === String(sub._id));
            const subPassed = subQuizzes.filter(q => q.passed).length;
            return (
              <button
                key={sub._id}
                type="button"
                onClick={() => setSelectedSubject(sub._id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedSubject === sub._id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{sub.name}</span>
                {subQuizzes.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    selectedSubject === sub._id ? 'bg-purple-800 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {subPassed}/{subQuizzes.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── MAIN CONTENT: HIERARCHICAL CURRICULUM TREE ─── */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200/80">
          <FiRefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
          <p className="text-sm font-medium">Checking curriculum unlock status and student points...</p>
        </div>
      ) : filteredHierarchy.length === 0 ? (
        <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200/80">
          <FiBookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No active assessments found</p>
          <p className="text-xs text-slate-400">Your teachers will schedule curriculum assessments here for your class.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {filteredHierarchy.map((sub) => (
            <div key={sub.subject_id} className="space-y-6">
              {/* Subject Banner */}
              <div className="flex items-center gap-3 pb-2.5 border-b-2 border-purple-500/20">
                <span className="w-3.5 h-3.5 rounded-full bg-purple-600 shrink-0"></span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {sub.subject_name}
                </h2>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 uppercase">
                  {sub.subject_code || 'STEM'}
                </span>
              </div>

              {/* Categories */}
              {sub.categories.map((cat) => (
                <div key={cat.category_id} className="space-y-5 pl-0 sm:pl-4">
                  {/* Category Header */}
                  <div className="flex items-center gap-2 text-slate-800">
                    <FiFolder className="w-4 h-4 text-purple-600" />
                    <h3 className="font-extrabold text-base tracking-tight text-slate-800">
                      Category: {cat.category_name}
                    </h3>
                  </div>

                  {/* Chapters under Category */}
                  <div className="space-y-6">
                    {cat.chapters.map((ch) => {
                      const allPassed = ch.quizzes.length > 0 && ch.quizzes.every(q => q.passed);
                      return (
                        <div
                          key={ch.chapter_id}
                          className={`rounded-3xl border transition-all ${
                            ch.is_locked
                              ? 'bg-slate-50/70 border-slate-200/60 opacity-85'
                              : 'bg-white border-slate-200/90 shadow-xs'
                          }`}
                        >
                          {/* Chapter Banner */}
                          <div className={`px-6 py-4 rounded-t-3xl border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            ch.is_locked
                              ? 'bg-slate-100/80 border-slate-200 text-slate-500'
                              : allPassed
                              ? 'bg-emerald-50/70 border-emerald-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                                ch.is_locked
                                  ? 'bg-slate-200 text-slate-500'
                                  : allPassed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {ch.is_locked ? <FiLock className="w-4 h-4" /> : `Ch ${ch.order || 1}`}
                              </span>
                              <div>
                                <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                                  <span>Chapter {ch.order || 1}: {ch.chapter_name}</span>
                                  {allPassed && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      Chapter Mastered ✅
                                    </span>
                                  )}
                                </h4>
                                {ch.is_locked ? (
                                  <span className="text-xs text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                                    <FiLock className="w-3 h-3 text-amber-600" />
                                    {ch.lock_reason || 'Complete previous chapter tests to unlock'}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400 font-medium">
                                    {ch.quizzes.length} {ch.quizzes.length === 1 ? 'Assessment' : 'Assessments'} in this unit
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Tests under Chapter */}
                          <div className="p-4 sm:p-6">
                            {ch.quizzes.length === 0 ? (
                              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                                No assessments currently published for this unit.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {ch.quizzes.map((quiz) => {
                                  const isLocked = quiz.is_locked;
                                  const isPassed = quiz.passed;

                                  return (
                                    <div
                                      key={quiz._id}
                                      className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                                        isLocked
                                          ? 'bg-slate-50/80 border-slate-200/90 shadow-none'
                                          : isPassed
                                          ? 'bg-white border-emerald-300 shadow-2xs hover:shadow-md ring-1 ring-emerald-200'
                                          : 'bg-white border-purple-200 shadow-2xs hover:shadow-md ring-1 ring-purple-100'
                                      }`}
                                    >
                                      <div>
                                        {/* Badges Row */}
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                          {/* Test Sequence Badge */}
                                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                                            isLocked
                                              ? 'bg-slate-200 text-slate-600'
                                              : isPassed
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : 'bg-purple-100 text-purple-800'
                                          }`}>
                                            Test {quiz.sequence_number || 1}
                                          </span>

                                          {/* Status Badge */}
                                          {isLocked ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-200 text-slate-600 border border-slate-300">
                                              <FiLock className="w-3 h-3 text-slate-500" />
                                              Locked
                                            </span>
                                          ) : isPassed ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                              <FiCheckCircle className="w-3 h-3 text-emerald-600" />
                                              Passed ({quiz.highest_score}%)
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                              <FiUnlock className="w-3 h-3 text-emerald-600" />
                                              Unlocked
                                            </span>
                                          )}
                                        </div>

                                        {/* Quiz Title */}
                                        <h5 className={`font-bold text-sm mb-1 line-clamp-2 ${
                                          isLocked ? 'text-slate-500' : 'text-slate-900'
                                        }`}>
                                          {quiz.title}
                                        </h5>

                                        {/* Lock Reason if locked */}
                                        {isLocked && (
                                          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 font-semibold mb-3 flex items-start gap-1.5">
                                            <FiLock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                            <span>{quiz.lock_reason || 'Pass prerequisite exam to unlock'}</span>
                                          </div>
                                        )}

                                        {/* Points badge if passed */}
                                        {isPassed && (
                                          <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-900 font-bold mb-3 flex items-center justify-between">
                                            <span className="flex items-center gap-1">
                                              <FiAward className="w-3.5 h-3.5 text-emerald-600" />
                                              Best Score: {quiz.highest_score}%
                                            </span>
                                            <span className="text-emerald-700 font-black">
                                              +{quiz.points_earned} Points
                                            </span>
                                          </div>
                                        )}

                                        {/* Meta attributes */}
                                        <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-center mb-4 text-[10px]">
                                          <div>
                                            <span className="text-slate-400 block">Questions</span>
                                            <span className="font-bold text-slate-700">{quiz.question_count || 10}</span>
                                          </div>
                                          <div>
                                            <span className="text-slate-400 block">Duration</span>
                                            <span className="font-bold text-slate-700">{quiz.duration_minutes || 15}m</span>
                                          </div>
                                          <div>
                                            <span className="text-slate-400 block">Pass</span>
                                            <span className="font-bold text-emerald-700">{quiz.passing_percentage || 70}%</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Action Button */}
                                      <div className="pt-2 border-t border-slate-100">
                                        {isLocked ? (
                                          <button
                                            type="button"
                                            disabled
                                            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200"
                                          >
                                            <FiLock className="w-3.5 h-3.5" />
                                            <span>Locked (Prerequisite Needed)</span>
                                          </button>
                                        ) : isPassed ? (
                                          <Link
                                            to={`/student/quiz/${quiz._id}`}
                                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                                          >
                                            <FiRotateCcw className="w-3.5 h-3.5" />
                                            <span>Retake Exam (Improve Score)</span>
                                          </Link>
                                        ) : (
                                          <Link
                                            to={`/student/quiz/${quiz._id}`}
                                            className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                                          >
                                            <FiPlay className="w-3.5 h-3.5" />
                                            <span>Start Anti-Cheat Exam</span>
                                          </Link>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
