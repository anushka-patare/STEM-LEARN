import { useState, useEffect } from 'react';
import { aiService, questionService, academicService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiCpu, FiZap, FiCheck, FiSave, FiRefreshCw, FiBookOpen, FiArrowRight } from 'react-icons/fi';

export default function TeacherAiGenerator() {
  const { user } = useAuth();
  const defaultGrade = String(user?.assigned_grade || user?.grade || '8');
  const [provider, setProvider] = useState('groq'); // 'groq' | 'gemini'
  const [subject, setSubject] = useState('Science');
  const [grade, setGrade] = useState(defaultGrade);
  const [chapter, setChapter] = useState('Acids, Bases & Salts');
  const [bloomLevel, setBloomLevel] = useState('Applying');
  const [count, setCount] = useState(3);
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    academicService.getChapters().then(res => {
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setChapters(list);
        setChapter(list[0].name);
      }
    }).catch(() => {});
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedQuestions([]);

    try {
      const res = await aiService.generateQuiz({
        provider,
        subject,
        grade,
        topic: chapter,
        bloom_level: bloomLevel,
        difficulty,
        num_questions: Number(count),
      });

      const qList = res.data?.data?.questions || res.data?.questions || [];
      if (Array.isArray(qList) && qList.length > 0) {
        setGeneratedQuestions(qList);
        toast.success(`Generated ${qList.length} questions via ${provider.toUpperCase()}!`);
      } else {
        toast.error('AI provider did not return any questions. Please try another topic or model.');
      }
    } catch (err) {
      console.error('Failed to generate AI questions:', err);
      toast.error(err.response?.data?.message || `Failed to generate questions via ${provider.toUpperCase()}. Please check API key configuration.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToBank = async () => {
    if (generatedQuestions.length === 0) return;

    try {
      setSaving(true);
      const matchedChapter = chapters.find(c => c.name.toLowerCase() === chapter.toLowerCase());
      const payload = {
        grade,
        chapter_id: matchedChapter?._id || '',
        subject_id: matchedChapter?.subject_id || '',
        questions: generatedQuestions.map(q => ({
          question: q.question,
          option_a: q.option_a || q.options?.[0] || '',
          option_b: q.option_b || q.options?.[1] || '',
          option_c: q.option_c || q.options?.[2] || '',
          option_d: q.option_d || q.options?.[3] || '',
          correct_answer: q.correct_answer || (q.correct_index !== undefined ? String.fromCharCode(65 + q.correct_index) : 'A'),
          explanation: q.explanation || '',
          bloom_level: q.bloom_level || bloomLevel,
          grade,
          difficulty,
          topic: chapter
        }))
      };

      await questionService.bulkCreate(payload);
      toast.success(`All ${generatedQuestions.length} questions successfully saved to MongoDB Question Bank!`);
    } catch (err) {
      toast.error('Failed to persist questions to Question Bank');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <FiCpu className="text-purple-600" />
          AI Question Authoring Studio
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Harness Groq LLaMA 3.3 and Google Gemini 2.5 Flash to generate NCERT-aligned Bloom taxonomy assessments in seconds.
        </p>
      </div>

      {/* Configuration Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        <form onSubmit={handleGenerate} className="space-y-5">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select AI Engine
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setProvider('groq')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  provider === 'groq'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    ⚡
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Groq LLaMA 3.3 70B</h4>
                    <p className="text-[11px] text-slate-500">Ultra low-latency inference (~280ms)</p>
                  </div>
                </div>
                {provider === 'groq' && <FiCheck className="w-5 h-5 text-emerald-600" />}
              </div>

              <div
                onClick={() => setProvider('gemini')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  provider === 'gemini'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-950 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    ✦
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Google Gemini 2.5 Flash</h4>
                    <p className="text-[11px] text-slate-500">Deep reasoning & Socratic distractor design</p>
                  </div>
                </div>
                {provider === 'gemini' && <FiCheck className="w-5 h-5 text-blue-600" />}
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="stem-input text-xs sm:text-sm"
              >
                <option value="Science">Science</option>
                <option value="Technology">Technology</option>
                <option value="Engineering">Engineering</option>
                <option value="Mathematics">Mathematics</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Grade
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="stem-input text-xs sm:text-sm"
              >
                <option value="6">Grade 6</option>
                <option value="7">Grade 7</option>
                <option value="8">Grade 8</option>
                <option value="9">Grade 9</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Bloom&apos;s Taxonomy Level
              </label>
              <select
                value={bloomLevel}
                onChange={(e) => setBloomLevel(e.target.value)}
                className="stem-input text-xs sm:text-sm"
              >
                <option value="Remembering">Remembering (Recall facts)</option>
                <option value="Understanding">Understanding (Explain concepts)</option>
                <option value="Applying">Applying (Use in new situations)</option>
                <option value="Analyzing">Analyzing (Draw connections)</option>
                <option value="Evaluating">Evaluating (Appraise arguments)</option>
                <option value="Creating">Creating (Synthesize designs)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Question Count
              </label>
              <select
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="stem-input text-xs sm:text-sm"
              >
                <option value={1}>1 Question</option>
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Chapter Unit or Specific STEM Topic
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acids, Bases & Salts"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              className="stem-input text-xs sm:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="stem-btn bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-8 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/30"
          >
            <FiZap className="w-4 h-4" />
            <span>{loading ? 'Synthesizing Questions with AI...' : 'Generate Calibrated Questions'}</span>
          </button>
        </form>
      </div>

      {/* Generated Questions Preview */}
      {generatedQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">
              Generated Questions Preview ({generatedQuestions.length})
            </h3>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveToBank}
              className="stem-btn bg-purple-600 hover:bg-purple-700 text-white py-2 px-5 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <FiSave className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving to Database...' : 'Save All to Question Bank'}</span>
            </button>
          </div>

          <div className="space-y-4">
            {generatedQuestions.map((q, idx) => {
              const options = [
                { key: 'A', text: q.option_a || q.options?.[0] },
                { key: 'B', text: q.option_b || q.options?.[1] },
                { key: 'C', text: q.option_c || q.options?.[2] },
                { key: 'D', text: q.option_d || q.options?.[3] },
              ].filter(o => o.text);

              const correct = q.correct_answer || (q.correct_index !== undefined ? String.fromCharCode(65 + q.correct_index) : 'A');

              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700">
                      Question #{idx + 1} • Bloom: {q.bloom_level || bloomLevel}
                    </span>
                    <span className="text-[10px] bg-slate-100 px-2.5 py-0.5 rounded-full text-slate-600 font-semibold">
                      Generated via {provider.toUpperCase()}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900">{q.question}</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {options.map((opt) => {
                      const isCorrect = correct === opt.key;
                      return (
                        <div
                          key={opt.key}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                              : 'bg-slate-50 border-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-400 font-bold">
                              {opt.key}.
                            </span>
                            <span>{opt.text}</span>
                          </div>
                          {isCorrect && (
                            <FiCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-600 border border-slate-100">
                      <strong className="text-slate-800">Pedagogical Rationale:</strong> {q.explanation}
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
