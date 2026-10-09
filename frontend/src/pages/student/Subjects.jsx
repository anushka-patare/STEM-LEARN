import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { academicService, studentService } from '../../services/api';
import { FiCompass, FiCpu, FiPercent, FiBookOpen, FiArrowRight, FiCheckCircle, FiLayers } from 'react-icons/fi';

const SUBJECT_THEMES = {
  science: { icon: FiCompass, color: 'blue', desc: 'Investigate physics, chemistry, biological ecosystems, and natural phenomena.' },
  technology: { icon: FiCpu, color: 'purple', desc: 'Master algorithmic logic, conditional loops, variables, and modern computer systems.' },
  mathematics: { icon: FiPercent, color: 'emerald', desc: 'Develop deductive reasoning, algebraic formulas, geometry, and statistical analysis.' },
};

export default function StudentSubjects() {
  const [activeTab, setActiveTab] = useState('all');
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjectsAndChapters = async () => {
      try {
        setLoading(true);
        const [subRes, chRes] = await Promise.allSettled([
          academicService.getSubjects(),
          academicService.getChapters(),
        ]);

        const rawSubjects = subRes.status === 'fulfilled' ? (subRes.value.data?.data || subRes.value.data || []) : [];
        const rawChapters = chRes.status === 'fulfilled' ? (chRes.value.data?.data || chRes.value.data || []) : [];

        const validSubjects = Array.isArray(rawSubjects) ? rawSubjects : [];
        const validChapters = Array.isArray(rawChapters) ? rawChapters : [];

        // Map chapters by subject_id
        const mapped = validSubjects.map((sub) => {
          const subKey = (sub.name || '').toLowerCase();
          const matchedThemeKey = Object.keys(SUBJECT_THEMES).find(k => subKey.includes(k)) || 'science';
          const theme = SUBJECT_THEMES[matchedThemeKey];

          const subChapters = validChapters.filter(
            ch => ch.subject_id === sub._id || (ch.subject_name || '').toLowerCase() === subKey
          );

          return {
            id: sub._id,
            slug: matchedThemeKey,
            title: sub.name,
            discipline: sub.name,
            icon: theme.icon,
            color: theme.color,
            desc: sub.description || theme.desc,
            chaptersCount: subChapters.length,
            chapters: subChapters.map(c => c.name || c.title),
          };
        });

        setSubjects(mapped);
        setChapters(validChapters);
      } catch (err) {
        console.error('Failed to load student subjects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectsAndChapters();
  }, []);

  const filtered = activeTab === 'all' ? subjects : subjects.filter((s) => s.slug === activeTab || s.id === activeTab);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          STEM Subject Portfolios
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore the 4 core disciplines, check your chapter mastery, and launch subject quizzes.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All Subjects' },
          { id: 'science', label: 'Science' },
          { id: 'technology', label: 'Technology' },
          { id: 'mathematics', label: 'Mathematics' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of Subjects */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200/80">
          <div className="w-8 h-8 rounded-full border-3 border-blue-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-medium">Loading STEM subjects and syllabi...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200/80">
          <FiBookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No Subjects Found</p>
          <p className="text-xs text-slate-400">Curriculum subjects created by administrators will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((sub) => {
            const Icon = sub.icon || FiBookOpen;
            return (
              <div
                key={sub.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          sub.color === 'blue'
                            ? 'bg-blue-50 text-blue-600'
                            : sub.color === 'purple'
                            ? 'bg-purple-50 text-purple-600'
                            : sub.color === 'amber'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          STEM Discipline
                        </span>
                        <h3 className="text-xl font-bold text-slate-900">
                          {sub.title}
                        </h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900 px-3 py-1 bg-slate-100 rounded-full">
                        {sub.chaptersCount} Chapters
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {sub.desc}
                  </p>

                  {/* Chapters Preview */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Syllabus Units ({sub.chaptersCount}):
                    </div>
                    {sub.chapters && sub.chapters.length > 0 ? (
                      sub.chapters.slice(0, 5).map((ch, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                          <FiCheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{ch}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic py-1">No chapters added yet for this subject.</p>
                    )}
                    {sub.chapters && sub.chapters.length > 5 && (
                      <p className="text-[11px] text-blue-600 font-bold pt-1">
                        + {sub.chapters.length - 5} more chapters
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Link
                    to="/student/quizzes"
                    className="w-full stem-btn stem-btn-primary py-2.5 text-xs flex items-center justify-center gap-2"
                  >
                    <span>Practice {sub.discipline} Quizzes</span>
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
