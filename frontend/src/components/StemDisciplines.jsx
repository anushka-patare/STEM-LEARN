import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCompass,
  FiCpu,
  FiPercent,
  FiArrowRight,
  FiCheckCircle,
  FiBook
} from 'react-icons/fi';

export default function StemDisciplines() {
  const [selectedGrade, setSelectedGrade] = useState('7');

  const disciplines = [
    {
      id: 'science',
      title: 'Science',
      icon: FiCompass,
      color: 'blue',
      badgeBg: 'bg-blue-100 text-blue-800',
      tagline: 'Physics, Chemistry & Biology Explorations',
      desc: 'Hands-on exploration of natural phenomena, molecular structures, energy transfers, and biological ecosystems.',
      grades: {
        '6': ['Food Components & Nutrition', 'Fibre to Fabric', 'Motion & Measurement', 'Light, Shadows & Reflections'],
        '7': ['Nutrition in Plants & Animals', 'Heat & Temperature', 'Acids, Bases & Salts', 'Respiration in Organisms'],
        '8': ['Crop Production & Management', 'Microorganisms: Friend & Foe', 'Combustion & Flame', 'Cell Structure & Functions'],
      },
    },
    {
      id: 'technology',
      title: 'Technology',
      icon: FiCpu,
      color: 'purple',
      badgeBg: 'bg-purple-100 text-purple-800',
      tagline: 'Coding, Data & Computational Systems',
      desc: 'Mastering algorithmic thinking, safe digital exploration, programming fundamentals, and modern data structures.',
      grades: {
        '6': ['Introduction to Algorithms', 'Visual Block Programming', 'Computer Hardware & Peripherals', 'Safe Internet Navigation'],
        '7': ['Loops & Conditional Logic', 'Variables & Data Types', 'Digital Footprints & Privacy', 'Introduction to Python Basics'],
        '8': ['Functions & Modular Code', 'Data Analysis with Spreadsheets', 'Cybersecurity Fundamentals', 'Artificial Intelligence Basics'],
      },
    },
    {
      id: 'mathematics',
      title: 'Mathematics',
      icon: FiPercent,
      color: 'emerald',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      tagline: 'Logic, Algebra, Geometry & Statistics',
      desc: 'Developing deductive reasoning, mathematical modeling, spatial geometry, and empirical data interpretation.',
      grades: {
        '6': ['Knowing Our Numbers & Factors', 'Integers & Fractions', 'Basic Geometrical Ideas', 'Data Handling & Pictographs'],
        '7': ['Fractions and Decimals', 'Simple Linear Equations', 'Lines, Angles & Triangles', 'Comparing Quantities & Percentages'],
        '8': ['Rational Numbers', 'Linear Equations in One Variable', 'Understanding Quadrilaterals', 'Data Handling & Probability'],
      },
    },
  ];

  return (
    <section className="py-20 bg-slate-50 relative overflow-hidden">
      <div className="stem-container">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
            Interdisciplinary Curriculum
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Core STEM Disciplines
          </h2>
          <p className="text-base text-slate-600">
            Carefully curated middle-school curriculum units with equated difficulty, Bloom-taxonomy cognitive levels, and interactive quiz challenges.
          </p>

          {/* Grade Selector Tabs */}
          <div className="pt-4 flex items-center justify-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-2">Filter Grade:</span>
            {['6', '7', '8'].map((grade) => (
              <button
                key={grade}
                type="button"
                onClick={() => setSelectedGrade(grade)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  selectedGrade === grade
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-105'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Grade {grade}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {disciplines.map((d) => {
            const Icon = d.icon;
            const currentGradeChapters = d.grades[selectedGrade] || [];

            return (
              <div
                key={d.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-slate-300 hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        d.color === 'blue'
                          ? 'bg-blue-50 text-blue-600'
                          : d.color === 'purple'
                          ? 'bg-purple-50 text-purple-600'
                          : d.color === 'amber'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-emerald-50 text-emerald-600'
                      } group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${d.badgeBg}`}>
                      Grade {selectedGrade}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {d.title}
                  </h3>
                  <div className="text-xs font-semibold text-slate-500 mb-3">
                    {d.tagline}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {d.desc}
                  </p>

                  {/* Sample Chapters for current grade */}
                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Grade {selectedGrade} Units:
                    </div>
                    {currentGradeChapters.map((ch, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <FiCheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{ch}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100">
                  <Link
                    to="/leaderboard"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-bold transition-all"
                  >
                    <span>View Top Scholars</span>
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-12 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <FiBook className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Want to see the top performing students and squads?
              </h4>
              <p className="text-xs text-slate-500">
                Explore real-time rankings across Grade 6, 7 & 8 with competitive and collaborative leaderboards.
              </p>
            </div>
          </div>
          <Link
            to="/leaderboard"
            className="stem-btn stem-btn-primary py-2.5 px-5 text-xs whitespace-nowrap"
          >
            Explore Hall of Fame
          </Link>
        </div>
      </div>
    </section>
  );
}
