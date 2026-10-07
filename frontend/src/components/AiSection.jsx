import { FiCpu, FiZap, FiCheckCircle, FiHelpCircle, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function AiSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="stem-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Info Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <FiCpu className="w-3.5 h-3.5 text-blue-400" />
              Dual AI Engine Architecture
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Intelligent STEM Tutoring with{' '}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Groq & Gemini
              </span>
            </h2>

            <p className="text-slate-300 text-base leading-relaxed">
              Middle-school learners require adaptive scaffolding rather than static answer keys. Our hybrid AI backend utilizes Groq LLaMA 3.3 for sub-second inference and Google Gemini for rich Socratic conceptual reasoning.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shrink-0 mt-0.5 text-blue-300">
                  <FiZap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Socratic Student Guidance</h4>
                  <p className="text-xs text-slate-400">
                    Provides progressive hints tailored to Grade 6–8 comprehension without revealing the final answer prematurely.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center shrink-0 mt-0.5 text-purple-300">
                  <FiCheckCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Automated Teacher Question Authoring</h4>
                  <p className="text-xs text-slate-400">
                    Generates Bloom-classified MCQs mapped directly to NCERT curriculum topics, complete with distractor rationales.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/student/register"
                className="stem-btn bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-6 text-sm font-bold inline-flex items-center gap-2 shadow-lg shadow-blue-500/30"
              >
                <span>Experience AI Study Partner</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Interactive Preview */}
          <div className="lg:col-span-6">
            <div className="bg-slate-800/90 rounded-3xl p-6 border border-slate-700/80 shadow-2xl backdrop-blur-md space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-slate-900 font-bold text-xs">
                    AI
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">STEM Socratic Assistant</div>
                    <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Powered by Groq LLaMA 3.3
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  Grade 7 Physics
                </span>
              </div>

              {/* Student Query */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700 text-xs text-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Student Asked:
                </div>
                "Why does a heavy metal ship float on water while a small iron nail sinks?"
              </div>

              {/* AI Socratic Response */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-800/60 text-xs space-y-2">
                <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FiHelpCircle className="w-3.5 h-3.5" />
                  <span>Socratic Guiding Question (Hint 1 of 2):</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Great question! Think about what's inside the ship. Even though the ship is made of heavy iron, it's mostly hollow and filled with <strong className="text-white">air</strong>.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] text-cyan-200">
                  💡 <strong>Think about it:</strong> How does the average density of the hollow ship (iron + air) compare with the density of the dense, solid nail?
                </div>
              </div>

              {/* Distractor Validation Card */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Bloom Level: <strong>Applying</strong></span>
                <span className="text-emerald-400 font-semibold">Latency: ~280ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
