import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentService, quizService } from '../../services/api';
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiInbox,
  FiArrowRight,
  FiRotateCcw,
  FiEye,
  FiX,
  FiAward
} from 'react-icons/fi';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Review State
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [attemptDetail, setAttemptDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await studentService.getResults();
        const raw = res.data?.data !== undefined ? res.data.data : res.data;
        if (Array.isArray(raw)) {
          setResults(raw);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error('Failed to load quiz results:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const handleOpenReview = async (attempt) => {
    setSelectedAttempt(attempt);
    setLoadingDetail(true);
    setAttemptDetail(null);
    try {
      const res = await quizService.getAttemptResult(attempt._id);
      const data = res.data?.data || res.data || {};
      setAttemptDetail(data);
    } catch (err) {
      console.warn('Failed to load attempt details:', err);
      // Fallback to basic attempt summary
      setAttemptDetail(attempt);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseReview = () => {
    setSelectedAttempt(null);
    setAttemptDetail(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          My Quiz Results & Attempt History
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review your quiz scores, time metrics, and accuracy benchmarks across all completed STEM assessments.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold">Loading quiz results...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <FiInbox className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Assessment Results Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            You haven't submitted any quizzes yet. Completed tests will appear here with question-by-question metrics.
          </p>
          <Link
            to="/student/quizzes"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <span>Start a Quiz</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Quiz Title</th>
                  <th className="py-4 px-6">Subject</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Time Spent</th>
                  <th className="py-4 px-6">Accuracy & Score</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Points</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r, index) => {
                  const scoreVal = r.score ?? r.total_score ?? 0;
                  const totalMarks = r.total_marks ?? r.max_marks ?? r.total_questions ?? 0;
                  const totalQs = r.total_questions || totalMarks || 0;
                  const correctCount = r.correct_answers !== undefined ? r.correct_answers : null;
                  const pct = Math.round(
                    r.score_percentage ??
                    r.percentage ??
                    r.accuracy ??
                    (totalMarks > 0 ? (scoreVal / totalMarks) * 100 : 0)
                  );
                  const isPassed = r.passed !== undefined ? r.passed : pct >= 70;
                  const dateStr = r.submitted_at
                    ? new Date(r.submitted_at).toLocaleDateString()
                    : r.date || 'Recent';
                  const rawTime = r.time_taken_seconds ?? r.time_taken ?? 0;
                  const timeSpentStr = rawTime > 0
                    ? `${Math.floor(rawTime / 60)}m ${rawTime % 60}s`
                    : r.time_spent || '1m';

                  return (
                    <tr key={r._id || index} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        <div>{r.quiz_title || r.title || 'STEM Quiz'}</div>
                        {(r.chapter_name || r.chapter) && (
                          <div className="text-[11px] text-slate-400 font-normal">
                            Chapter: {r.chapter_name || r.chapter}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 font-medium">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 font-bold">
                          {r.subject_name || r.subject || 'STEM'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500">{dateStr}</td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <FiClock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{timeSpentStr}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-900 block">
                          {correctCount !== null ? `${correctCount}/${totalQs} Correct` : `${scoreVal}/${totalMarks}`}
                        </span>
                        <span className="text-xs text-purple-700 font-semibold block">
                          {pct}% Score
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {isPassed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <FiXCircle className="w-3.5 h-3.5" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right font-black text-emerald-600">
                        +{r.points_earned ?? r.points ?? 0}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenReview(r)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all border border-purple-200 cursor-pointer shadow-xs"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>

                          {r.quiz_id && (
                            <Link
                              to={`/student/quiz/${r.quiz_id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-xs"
                            >
                              <FiRotateCcw className="w-3.5 h-3.5" />
                              <span>Retake</span>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Detailed Review Modal ─── */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div>
                <span className="text-[10px] uppercase font-black text-purple-600 tracking-wider block">
                  Assessment Performance Review
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  {selectedAttempt.quiz_title || 'STEM Quiz'}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                  <span>Subject: <strong>{selectedAttempt.subject_name || 'STEM'}</strong></span>
                  <span>•</span>
                  <span>
                    Score:{' '}
                    <strong className={selectedAttempt.passed ? 'text-emerald-600' : 'text-rose-600'}>
                      {selectedAttempt.correct_answers ?? selectedAttempt.score ?? 0}/{selectedAttempt.total_questions || selectedAttempt.total_marks || 0} (
                      {Math.round(selectedAttempt.score_percentage ?? selectedAttempt.percentage ?? 0)}%)
                    </strong>
                  </span>
                  <span>•</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                    selectedAttempt.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedAttempt.passed ? 'Passed 🎉' : 'Failed ❌'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseReview}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Question Breakdown */}
            <div className="p-6 overflow-y-auto space-y-4">
              {loadingDetail ? (
                <div className="py-16 text-center text-slate-500">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs font-semibold">Loading question breakdown...</p>
                </div>
              ) : attemptDetail?.questions && attemptDetail.questions.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                    <span>
                      {selectedAttempt.passed
                        ? 'Full solutions & explanations are available below.'
                        : 'Review your submitted answers. Correct answers are hidden until you pass.'}
                    </span>
                    <span className="font-bold text-purple-700">
                      Total: {attemptDetail.questions.length} Questions
                    </span>
                  </div>

                  {attemptDetail.questions.map((q, idx) => {
                    const isPassedAttempt = Boolean(selectedAttempt.passed);
                    const optLabels = [
                      { key: 'A', text: q.option_a },
                      { key: 'B', text: q.option_b },
                      { key: 'C', text: q.option_c },
                      { key: 'D', text: q.option_d }
                    ].filter((o) => o.text);

                    return (
                      <div
                        key={q._id || idx}
                        className={`p-4 rounded-2xl border transition-all ${
                          q.is_correct
                            ? 'bg-emerald-50/20 border-emerald-200'
                            : 'bg-rose-50/30 border-rose-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-start gap-2">
                            <span
                              className={`w-5 h-5 rounded-md text-[11px] font-black flex items-center justify-center shrink-0 ${
                                q.is_correct ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                              {q.question || q.question_text}
                            </h4>
                          </div>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                              q.is_correct
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {q.is_correct ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs">
                          {optLabels.map((opt) => {
                            const isCorrectOpt = isPassedAttempt && Boolean(q.correct_answer && opt.key === q.correct_answer);
                            const isSelectedOpt = opt.key === q.student_answer;

                            let optStyle = 'bg-white border-slate-200 text-slate-700';
                            if (isCorrectOpt) {
                              optStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold ring-1 ring-emerald-300';
                            } else if (isSelectedOpt && q.is_correct) {
                              optStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                            } else if (isSelectedOpt && !q.is_correct) {
                              optStyle = 'bg-rose-50 border-rose-400 text-rose-900 font-bold';
                            }

                            return (
                              <div
                                key={opt.key}
                                className={`p-2.5 rounded-xl border flex items-center justify-between ${optStyle}`}
                              >
                                <span className="flex items-center gap-1.5">
                                  <span className="font-bold">{opt.key}.</span>
                                  <span>{opt.text}</span>
                                </span>
                                {isCorrectOpt && (
                                  <span className="text-[10px] uppercase font-black text-emerald-700 px-1.5 py-0.5 rounded bg-emerald-100">
                                    Correct
                                  </span>
                                )}
                                {isSelectedOpt && (
                                  <span
                                    className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${
                                      q.is_correct ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
                                    }`}
                                  >
                                    Your Choice
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation if passed */}
                        {isPassedAttempt && q.explanation && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900">
                            <strong className="font-black text-purple-950 block mb-0.5">
                              Explanation:
                            </strong>
                            <p className="leading-relaxed">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-xs font-medium">
                    Question breakdown is not available for this legacy attempt.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <button
                type="button"
                onClick={handleCloseReview}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>

              {selectedAttempt.quiz_id && (
                <Link
                  to={`/student/quiz/${selectedAttempt.quiz_id}`}
                  className="stem-btn bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 text-xs font-bold flex items-center gap-2 rounded-xl shadow-xs cursor-pointer"
                >
                  <FiRotateCcw className="w-3.5 h-3.5" />
                  <span>Retake This Exam</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
