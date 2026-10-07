import { FiStar } from 'react-icons/fi';

export default function Testimonials() {
  const testimonials = [
    {
      quote:
        'Being in a squad for Grade 7 Science changed how our table works together. When someone struggled with electric circuits, we explained it so our team score would go up!',
      author: 'Priya Deshmukh',
      role: 'Student, Grade 7 (Collaborative Cohort)',
      school: 'St. Xavier’s High School',
      rating: 5,
    },
    {
      quote:
        'The ability to test competitive individual leaderboards against collaborative squad scoring with the exact same question bank gave us unprecedented empirical clarity.',
      author: 'Dr. Ramesh Kulkarni',
      role: 'Professor of Educational Technology',
      school: 'College of Engineering & Education',
      rating: 5,
    },
    {
      quote:
        'The anti-cheat fullscreen lock and Groq AI question generator saved me hours of test prep each week while keeping student excitement sky high.',
      author: 'Meera Sen',
      role: 'Head STEM Coordinator & Teacher',
      school: 'Delhi Public School',
      rating: 5,
    },
  ];

  return (
    <section className="py-20 bg-slate-50 relative overflow-hidden">
      <div className="stem-container">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
            User Feedback
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Voices from Classrooms & Research Labs
          </h2>
          <p className="text-base text-slate-600">
            Hear from the students, educators, and researchers driving modern educational gamification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <FiStar key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic mb-6">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                  {t.author.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{t.author}</h4>
                  <p className="text-[11px] text-blue-600 font-medium">{t.role}</p>
                  <p className="text-[10px] text-slate-400">{t.school}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
