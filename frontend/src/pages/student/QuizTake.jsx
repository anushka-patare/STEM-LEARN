import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  FiClock,
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiFlag,
  FiAward,
  FiMaximize,
  FiCheck,
  FiXCircle,
  FiBookOpen,
  FiArrowRight,
  FiRefreshCw,
  FiLock,
  FiPlay,
  FiSlash,
  FiRotateCcw
} from 'react-icons/fi';
import { quizService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function QuizTake() {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [attemptId, setAttemptId] = useState(null);
  const [quizInfo, setQuizInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(600);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultsData, setResultsData] = useState(null);
  const [terminatedReason, setTerminatedReason] = useState('');

  const containerRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const fullscreenWasActiveRef = useRef(false);

  // Fullscreen Helpers
  const requestAppFullscreen = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      }
      setIsFullscreen(true);
      fullscreenWasActiveRef.current = true;
      setTimeout(() => {
        setExamStarted(true);
      }, 500);
      return true;
    } catch (err) {
      console.warn('Fullscreen request blocked or not allowed:', err);
      setExamStarted(true);
      return false;
    }
  };

  const exitAppFullscreen = async () => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Exit fullscreen failed:', err);
    }
    setIsFullscreen(false);
    fullscreenWasActiveRef.current = false;
  };

  // Initialize Quiz Attempt
  const initAttempt = useCallback(async () => {
    try {
      setLoading(true);
      const res = await quizService.startAttempt(quizId);
      const attemptData = res.data?.data || {};

      setAttemptId(attemptData._id);
      setQuizInfo(attemptData);

      const qs = attemptData.questions || [];
      setQuestions(qs);

      // Restore previously saved answers if resuming
      if (attemptData.answers && typeof attemptData.answers === 'object') {
        setAnswers(attemptData.answers);
      }

      // Calculate initial time left from expires_at
      if (attemptData.expires_at) {
        const remaining = Math.max(0, Math.floor((new Date(attemptData.expires_at).getTime() - Date.now()) / 1000));
        setTimeLeft(remaining > 15 ? remaining : (attemptData.duration_minutes || 15) * 60);
      } else {
        setTimeLeft((attemptData.duration_minutes || 15) * 60);
      }

      // Keep examStarted false until student clicks Enter Fullscreen
      setIsFullscreen(Boolean(document.fullscreenElement || document.webkitFullscreenElement));
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to start assessment.';
      toast.error(msg);
      console.error(err);
      navigate('/student/quizzes');
    } finally {
      setLoading(false);
    }
  }, [quizId, navigate]);

  useEffect(() => {
    initAttempt();
  }, [initAttempt]);

  // Try Again Handler (Unlimited attempts supported)
  const handleTryAgain = async () => {
    setSubmitted(false);
    setExamStarted(false);
    setResultsData(null);
    setTerminatedReason('');
    setAnswers({});
    setFlagged({});
    setCurrentIdx(0);
    isSubmittingRef.current = false;
    await initAttempt();
  };

  // Submit Handler
  const handleSubmitQuiz = useCallback(async (forcedReason = null) => {
    if (isSubmittingRef.current || submitted) return;
    isSubmittingRef.current = true;
    setSubmitting(true);

    if (forcedReason) {
      setTerminatedReason(forcedReason);
      toast.error(forcedReason, { duration: 6000 });
    }

    try {
      // Automatic exit from fullscreen upon submit as requested
      await exitAppFullscreen();

      const res = await quizService.submit(attemptId, answers);
      const resData = res.data?.data || {};

      setResultsData(resData);
      setSubmitted(true);
      if (!forcedReason) {
        toast.success('Assessment completed and submitted!');
      }
    } catch (err) {
      console.error('Submit error:', err);
      // Fallback display so page never crashes into white screen
      setResultsData({
        score: 0,
        score_percentage: 0,
        total_questions: questions.length,
        correct_answers: 0,
        passed: false,
        points_earned: 0
      });
      setSubmitted(true);
      toast.error('Exam submitted. Reviewing recorded answers.');
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, answers, submitted, questions.length]);

  // Local 1-second countdown timer
  useEffect(() => {
    if (!attemptId || submitted || !examStarted) return;

    countdownTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          handleSubmitQuiz('Time limit expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [attemptId, submitted, examStarted, handleSubmitQuiz]);

  // Heartbeat loop (every 5 seconds)
  useEffect(() => {
    if (!attemptId || submitted || !examStarted) return;

    heartbeatTimerRef.current = setInterval(async () => {
      try {
        const hbRes = await quizService.heartbeat(attemptId);
        const hbData = hbRes.data || {};

        if (hbData.time_remaining_seconds !== undefined) {
          setTimeLeft(hbData.time_remaining_seconds);
        }

        if (hbData.status === 'submitted') {
          clearInterval(heartbeatTimerRef.current);
          handleSubmitQuiz('Time expired on server');
        }
      } catch (err) {
        console.warn('Heartbeat synchronization error', err);
      }
    }, 5000);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [attemptId, submitted, examStarted, handleSubmitQuiz]);

  // Anti-Cheat & Fullscreen Integrity Enforcement
  useEffect(() => {
    if (!examStarted || submitted) return;

    // 1. Fullscreen change detection (Esc key in browser triggers exit fullscreen!)
    const handleFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(isFull);
      if (isFull) {
        fullscreenWasActiveRef.current = true;
      } else if (fullscreenWasActiveRef.current && !isSubmittingRef.current && !submitted && examStarted) {
        handleSubmitQuiz('Exam auto-ended: Fullscreen mode exited (Escape key pressed)');
      }
    };

    // 2. Visibility change (tab switch or browser minimize)
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmittingRef.current && !submitted && examStarted) {
        handleSubmitQuiz('Exam auto-ended: Browser tab switched or minimized');
      }
    };

    // 3. Keydown listener (Escape key or copy shortcuts)
    const handleKeyDown = (e) => {
      // Escape key directly
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        handleSubmitQuiz('Exam auto-ended: Escape key pressed');
        return false;
      }

      // Prohibited shortcuts (Ctrl/Cmd + C, V, X, A, U, P, S)
      if (
        (e.ctrlKey || e.metaKey) &&
        ['c', 'v', 'x', 'a', 'u', 'p', 's'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        toast.error(`Shortcut Ctrl+${e.key.toUpperCase()} is disabled during the exam!`);
        return false;
      }

      // F12 or DevTools inspection
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
        handleSubmitQuiz('Exam auto-ended: Developer tools inspection detected');
        return false;
      }

      // PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        toast.error('Screenshots are disabled during examination!');
        return false;
      }
    };

    // 4. Disable copy, cut, paste, context menu, and text drag
    const handleCopy = (e) => {
      e.preventDefault();
      toast.error('Copying text is strictly disabled!');
      return false;
    };
    const handleCut = (e) => {
      e.preventDefault();
      return false;
    };
    const handlePaste = (e) => {
      e.preventDefault();
      return false;
    };
    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.error('Right-click is disabled during the exam!');
      return false;
    };
    const handleSelectStart = (e) => {
      e.preventDefault();
      return false;
    };
    const handleDragStart = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, [examStarted, submitted, handleSubmitQuiz]);

  // Option select with autosave
  const handleSelectOption = (questionId, optionKey) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey
    }));

    if (attemptId) {
      quizService.saveAnswer(attemptId, questionId, optionKey).catch((err) => {
        console.warn('Autosave background sync error', err);
      });
    }
  };

  const toggleFlag = (questionId) => {
    setFlagged((prev) => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIdx] || null;
  const answeredCount = Object.keys(answers).length;

  // ─── 1. Loading State ───
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <FiRefreshCw className="w-10 h-10 animate-spin text-purple-600" />
        <p className="text-sm font-bold text-slate-700">Initializing Secure Examination Environment...</p>
        <p className="text-xs text-slate-400">Verifying session tokens and anti-cheat locks.</p>
      </div>
    );
  }

  // ─── 2. Submitted Results View (Fullscreen Exited) ───
  if (submitted && resultsData) {
    const passed = resultsData.passed;
    const solutions = resultsData.question_solutions || [];

    return (
      <div className="max-w-4xl mx-auto py-8 space-y-8 animate-fade-in px-4">
        {/* Main Result Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xl text-center space-y-6">
          <div
            className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center ${
              passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
            }`}
          >
            {passed ? <FiAward className="w-10 h-10" /> : <FiXCircle className="w-10 h-10" />}
          </div>

          <div>
            <span
              className={`text-xs font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full ${
                passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {passed ? 'Mastery Benchmark Achieved 🎉' : 'Benchmark Not Met (Retry Required)'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
              {resultsData.quiz_title || quizInfo?.quiz_title || 'Assessment Results'}
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 max-w-lg mx-auto">
              {passed
                ? 'Congratulations! You passed the test. Review the complete question solutions below or proceed to the next unit.'
                : 'You scored below the passing threshold. Question solutions are hidden until passing score is achieved. You have unlimited attempts — review your notes and try again!'}
            </p>
            {terminatedReason && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center justify-center gap-2 max-w-lg mx-auto">
                <FiAlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{terminatedReason}</span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 max-w-lg mx-auto">
            <div>
              <div className={`text-2xl font-black ${passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                {resultsData.score_percentage || 0}%
              </div>
              <div className="text-[11px] font-bold text-slate-500">Score Achieved</div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">
                {resultsData.correct_answers || 0}/{resultsData.total_questions || questions.length}
              </div>
              <div className="text-[11px] font-bold text-slate-500">Correct Answers</div>
            </div>
            <div>
              <div className="text-2xl font-black text-purple-600">
                {passed ? `+${resultsData.points_earned || 0}` : '0'}
              </div>
              <div className="text-[11px] font-bold text-slate-500">Points Awarded</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {/* Try Again Button: Always available (unlimited attempts) */}
            <button
              type="button"
              onClick={handleTryAgain}
              className="stem-btn bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 text-xs font-bold flex items-center justify-center gap-2 rounded-2xl shadow-md cursor-pointer"
            >
              <FiRotateCcw className="w-4 h-4" />
              <span>Try Again (Unlimited Attempts)</span>
            </button>

            {/* Next Button: Only if passed! */}
            {passed && (
              resultsData.next_quiz_id ? (
                <Link
                  to={`/student/quiz/${resultsData.next_quiz_id}`}
                  className="stem-btn bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 text-xs font-bold flex items-center justify-center gap-2 rounded-2xl shadow-md cursor-pointer"
                >
                  <span>Next Assessment: {resultsData.next_quiz_title || 'Next Test'}</span>
                  <FiArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/student/learning"
                  className="stem-btn bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 text-xs font-bold flex items-center justify-center gap-2 rounded-2xl shadow-md cursor-pointer"
                >
                  <FiBookOpen className="w-4 h-4" />
                  <span>Next: Resume Learning Path</span>
                  <FiArrowRight className="w-4 h-4" />
                </Link>
              )
            )}

            <Link
              to="/student/quizzes"
              className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Back to Quizzes List</span>
            </Link>
          </div>
        </div>

        {/* ─── Question Breakdown Review (Shown for both Pass and Fail) ─── */}
        {solutions.length > 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FiCheckCircle className={`w-5 h-5 ${passed ? 'text-emerald-600' : 'text-purple-600'}`} />
                  <span>
                    {passed
                      ? 'Complete Questions & Solutions Review'
                      : `Question Breakdown Review (${resultsData.correct_answers || 0}/${resultsData.total_questions || questions.length} Correct)`}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {passed
                    ? 'Examine detailed explanations, solutions, and concepts for all assessment questions.'
                    : 'Review your submitted answers below. Correct answer keys are locked until passing score is achieved. Try again to master this test!'}
                </p>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
                  passed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {passed ? 'Solutions Unlocked 🎉' : 'Answers Hidden (Retry to Master)'}
              </span>
            </div>

            <div className="space-y-6">
              {solutions.map((sol, sIdx) => {
                const optLabels = [
                  { key: 'A', text: sol.option_a },
                  { key: 'B', text: sol.option_b },
                  { key: 'C', text: sol.option_c },
                  { key: 'D', text: sol.option_d }
                ].filter((o) => o.text);

                return (
                  <div
                    key={sol.question_id || sIdx}
                    className={`p-5 rounded-2xl border transition-all ${
                      sol.is_correct
                        ? 'bg-emerald-50/20 border-emerald-200'
                        : 'bg-rose-50/30 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                            sol.is_correct ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          }`}
                        >
                          {sIdx + 1}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
                          {sol.question}
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shrink-0 ${
                          sol.is_correct
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sol.is_correct ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    {/* Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
                      {optLabels.map((opt) => {
                        const isCorrectOpt = passed && Boolean(sol.correct_answer && opt.key === sol.correct_answer);
                        const isSelectedOpt = opt.key === sol.student_answer;

                        let optStyle = 'bg-white border-slate-200 text-slate-700';
                        if (isCorrectOpt) {
                          optStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold ring-1 ring-emerald-300';
                        } else if (isSelectedOpt && sol.is_correct) {
                          optStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                        } else if (isSelectedOpt && !sol.is_correct) {
                          optStyle = 'bg-rose-50 border-rose-400 text-rose-900 font-bold';
                        }

                        return (
                          <div
                            key={opt.key}
                            className={`p-3 rounded-xl border flex items-center justify-between ${optStyle}`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="font-bold">{opt.key}.</span>
                              <span>{opt.text}</span>
                            </span>
                            {isCorrectOpt && (
                              <span className="text-[10px] uppercase font-black text-emerald-700 px-1.5 py-0.5 rounded bg-emerald-100">
                                Correct Answer
                              </span>
                            )}
                            {isSelectedOpt && (
                              <span
                                className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${
                                  sol.is_correct
                                    ? 'text-emerald-700 bg-emerald-100'
                                    : 'text-rose-700 bg-rose-100'
                                }`}
                              >
                                {sol.is_correct ? 'Your Choice (Correct)' : 'Your Choice (Incorrect)'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Solution Explanation if passed */}
                    {passed && sol.explanation && (
                      <div className="mt-3.5 p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900">
                        <strong className="font-black text-purple-950 block mb-1">
                          Explanation / Solution:
                        </strong>
                        <p className="leading-relaxed">{sol.explanation}</p>
                      </div>
                    )}

                    {/* Hint / Guidance when failed and incorrect */}
                    {!passed && !sol.is_correct && (
                      <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-amber-50/70 border border-amber-200 text-[11px] text-amber-800 font-medium">
                        💡 Incorrect response. Correct answer is hidden. Review your notes and try again!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── 3. Fullscreen Launch Gate (Before Entering Fullscreen Exam) ───
  if (!examStarted && !submitted) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xl space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl shrink-0">
              <FiShield className="w-7 h-7" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-200">
                Anti-Cheat Lockdown Protocol
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {quizInfo?.quiz_title || 'STEM Assessment'}
              </h2>
            </div>
          </div>

          {/* Test Specs */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Questions</span>
              <strong className="text-slate-800 font-black text-sm">{questions.length} Items</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Duration</span>
              <strong className="text-slate-800 font-black text-sm">{Math.ceil(timeLeft / 60)} Minutes</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Passing Score</span>
              <strong className="text-emerald-700 font-black text-sm">{quizInfo?.passing_percentage || 70}%</strong>
            </div>
          </div>

          {/* Strict Anti-Cheat Rules Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
              Examination Integrity Instructions:
            </h4>
            <div className="space-y-2 text-xs text-slate-600 bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80">
              <div className="flex items-start gap-2.5">
                <FiMaximize className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Full Screen Lockdown:</strong> The exam will expand to full screen. All browser tabs, address bars, and external windows will be hidden.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <FiSlash className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>No Copying or Right-Click:</strong> Text selection, copying, and right-clicking are strictly disabled during the exam.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <FiAlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero-Tolerance Auto End:</strong> Pressing <strong>Escape (Esc)</strong>, exiting fullscreen, switching tabs, or minimizing the browser will <strong>instantly auto-end and submit the exam</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Automatic Fullscreen Exit:</strong> When you submit the assessment (or when time expires), fullscreen mode will automatically exit and display your results.
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <Link
              to="/student/quizzes"
              className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors w-full sm:w-auto text-center"
            >
              Cancel & Return
            </Link>

            <button
              type="button"
              onClick={requestAppFullscreen}
              className="stem-btn bg-purple-600 hover:bg-purple-700 text-white py-3.5 px-7 text-xs font-extrabold flex items-center justify-center gap-2 rounded-2xl shadow-lg shadow-purple-600/30 cursor-pointer w-full sm:w-auto"
            >
              <FiMaximize className="w-4 h-4" />
              <span>Enter Fullscreen & Begin Exam</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── 4. Fullscreen Proctored Exam Interface ───
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-slate-50 flex flex-col overflow-y-auto select-none p-4 sm:p-8"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {/* Dynamic Watermark overlay */}
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden opacity-[0.035] flex items-center justify-center">
        <div className="rotate-[-25deg] text-3xl sm:text-5xl font-black tracking-widest text-slate-900 uppercase text-center space-y-8">
          <div>{user?.name || user?.full_name || 'STUDENT EXPLORER'}</div>
          <div>ID: {user?.student_id || user?._id?.slice(-8) || 'STEM-STU'}</div>
          <div>SESSION: {attemptId?.slice(-6)}</div>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto space-y-6">
        {/* Top Controls Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 block">
              {quizInfo?.mode === 'collaborative'
                ? 'Collaborative Squad Mission'
                : 'Competitive Individual Assessment'}
            </span>
            <h2 className="text-lg font-black text-slate-900">
              {quizInfo?.quiz_title || 'STEM Assessment'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Fullscreen indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
              <FiShield className="w-4 h-4 text-purple-600" />
              <span>Fullscreen Lock: Active</span>
            </div>

            {/* Countdown Clock */}
            <div
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-mono text-sm font-black border ${
                timeLeft < 180
                  ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              <FiClock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Main Examination Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Area */}
          <div className="lg:col-span-3 space-y-6">
            {currentQ ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center">
                      {currentIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Question {currentIdx + 1} of {questions.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleFlag(currentQ._id)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                      flagged[currentQ._id]
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <FiFlag className="w-3.5 h-3.5" />
                    <span>{flagged[currentQ._id] ? 'Flagged for Review' : 'Flag Question'}</span>
                  </button>
                </div>

                {/* Question Text */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                  {currentQ.question}
                </h3>

                {/* Options */}
                <div className="space-y-3 pt-2">
                  {[
                    { key: 'A', text: currentQ.option_a },
                    { key: 'B', text: currentQ.option_b },
                    { key: 'C', text: currentQ.option_c },
                    { key: 'D', text: currentQ.option_d }
                  ]
                    .filter((opt) => opt.text)
                    .map((opt) => {
                      const isSelected = answers[currentQ._id] === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => handleSelectOption(currentQ._id, opt.key)}
                          className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-400/30'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-purple-50/50 hover:border-purple-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                                isSelected
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-white border border-slate-300 text-slate-600'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                          {isSelected && <FiCheck className="w-5 h-5 text-purple-600 shrink-0" />}
                        </button>
                      );
                    })}
                </div>

                {/* Navigation Footer */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx((prev) => prev - 1)}
                    className="stem-btn bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {currentIdx < questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentIdx((prev) => prev + 1)}
                        className="stem-btn bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Next Question</span>
                        <FiChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => {
                          if (window.confirm('Are you ready to submit your exam responses?')) {
                            handleSubmitQuiz();
                          }
                        }}
                        className="stem-btn bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-6 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/30"
                      >
                        <span>{submitting ? 'Submitting...' : 'Complete & Submit'}</span>
                        <FiCheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center text-slate-500 space-y-4">
                <FiAlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
                <h3 className="text-base font-bold text-slate-700">No Questions Available</h3>
                <p className="text-xs text-slate-400">Questions are being configured for this assessment.</p>
                <button
                  type="button"
                  onClick={() => handleSubmitQuiz('No questions')}
                  className="stem-btn bg-purple-600 text-white py-2 px-5 text-xs font-bold"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Question Navigator Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                Question Navigator ({answeredCount}/{questions.length} answered)
              </h4>

              <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1">
                {questions.map((q, idx) => {
                  const isAnswered = Boolean(answers[q._id]);
                  const isCurrent = idx === currentIdx;
                  const isFlag = Boolean(flagged[q._id]);

                  return (
                    <button
                      key={q._id}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer relative ${
                        isCurrent
                          ? 'ring-2 ring-purple-600 ring-offset-1 bg-purple-600 text-white'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                      {isFlag && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] font-bold text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-300" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-300" />
                  <span>Unanswered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-amber-400" />
                  <span>Flagged for Review</span>
                </div>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  if (window.confirm('Are you ready to submit your exam responses? Fullscreen will be exited.')) {
                    handleSubmitQuiz();
                  }
                }}
                className="w-full mt-4 stem-btn bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>{submitting ? 'Submitting...' : 'Submit Assessment'}</span>
                <FiCheckCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
