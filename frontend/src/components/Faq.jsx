import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

export default function Faq() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: 'What is the primary scientific objective of STEMLearn?',
      a: 'The platform empirically investigates how leaderboard motivation structures (individual competitive vs. collaborative team squads) influence STEM mastery, persistence, test anxiety, and participation among middle-school students (Grades 6, 7, and 8).',
    },
    {
      q: 'Are the quiz questions different between Competitive and Collaborative groups?',
      a: 'No. To ensure academic rigor and prevent confounding variables, both groups receive 100% identical questions, identical difficulty weights, equal time limits, and the exact same 60% passing threshold.',
    },
    {
      q: 'How does team scoring work in Collaborative Mode?',
      a: 'Teachers can configure one of three team scoring equations: Arithmetic Average of squad members, Cumulative Sum, or Top-N performers. This allows research into mitigating the "free rider" social loafing effect.',
    },
    {
      q: 'How does the anti-cheat fullscreen system protect research validity?',
      a: 'During quiz sessions, the platform enforces browser fullscreen lock, monitors tab-switch and window-blur events, and issues live warnings. Repeated violations trigger automatic quiz submission to prevent unauthorized external searching.',
    },
    {
      q: 'How does the AI assistant guide students without giving answers?',
      a: 'The system utilizes Groq LLaMA 3.3 and Google Gemini configured with Socratic prompting rules. Instead of giving direct multiple-choice solutions, it provides conceptual scaffolding, analogies, and guiding questions tailored to middle-school reading levels.',
    },
    {
      q: 'How do educators and researchers export experimental findings?',
      a: 'Authorized faculty members can navigate to the Research Data section in the Teacher portal to view descriptive metrics (Mean, Standard Deviation) and download anonymized CSV datasets pre-formatted for one-way ANOVA calculations.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="stem-container max-w-4xl">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
            Got Questions?
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-slate-600">
            Learn more about our educational research principles, leaderboard algorithms, and classroom deployment.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/90 overflow-hidden transition-all bg-slate-50/50"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <div
                    className={`w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-blue-50 text-blue-600' : 'text-slate-400'
                    }`}
                  >
                    <FiChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
