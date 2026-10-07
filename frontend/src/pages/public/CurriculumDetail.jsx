import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBook,
  FiCompass,
  FiCpu,
  FiTool,
  FiPercent,
  FiClock,
  FiCheckCircle,
  FiArrowRight,
  FiLayers
} from 'react-icons/fi';
import { pageService } from '../../services/api';

export default function CurriculumDetail() {
  const [activeGrade, setActiveGrade] = useState('7');
  const [activeSubject, setActiveSubject] = useState('all');
  const [content, setContent] = useState({
    badge: 'Standardized Academic Blueprint',
    title: 'Middle School STEM Curriculum',
    subtitle: 'Structured across Grades 6, 7, and 8. Mapped directly to national middle-school science and mathematics syllabi to ensure experimental validity.',
    pedagogy_title: 'Experimental Alignment & Pedagogy',
    pedagogy_p1: "Every quiz item in STEMLearn is calibrated for difficulty, cognitive level (Bloom's Taxonomy), and chapter learning objectives. Both competitive individual students and collaborative team squads receive identical question banks.",
    grade6_overview: 'Grade 6 lays fundamental conceptual ground in natural sciences, arithmetic operations, basic algebra, geometric structures, and introductory computing.',
    grade7_overview: 'Grade 7 expands into thermal physics, chemical transformations, rational numbers, algebraic expressions, environmental biology, and algorithmic logic.',
    grade8_overview: 'Grade 8 advances to cellular microbiology, force and pressure, linear equations, mensuration, data handling, and scientific problem-solving.',
  });

  useEffect(() => {
    const loadCurriculumContent = async () => {
      try {
        const res = await pageService.getPageContent('curriculum');
        if (res.data?.success && res.data.data) {
          setContent((prev) => ({ ...prev, ...res.data.data }));
        }
      } catch (e) {
        // Fallback
      }
    };
    loadCurriculumContent();
  }, []);

  const curriculumData = [
    // ─── SCIENCE ───
    {
      id: 'sci-6',
      grade: '6',
      subject: 'science',
      subjectTitle: 'Science',
      icon: FiCompass,
      color: 'blue',
      title: 'Foundations of Natural Science',
      chapters: [
        { name: 'Components of Food & Balanced Diet', hours: '4 hrs', questions: 25 },
        { name: 'Fibre to Fabric & Material Properties', hours: '3 hrs', questions: 20 },
        { name: 'Motion, Measurement of Distances', hours: '5 hrs', questions: 30 },
        { name: 'Light, Shadows & Reflection Optics', hours: '4 hrs', questions: 25 },
        { name: 'Electricity & Simple Circuits', hours: '5 hrs', questions: 35 },
      ],
    },
    {
      id: 'sci-7',
      grade: '7',
      subject: 'science',
      subjectTitle: 'Science',
      icon: FiCompass,
      color: 'blue',
      title: 'Physical & Biological Transformations',
      chapters: [
        { name: 'Nutrition in Organisms & Metabolism', hours: '5 hrs', questions: 30 },
        { name: 'Heat, Thermal Equilibrium & Conduction', hours: '4 hrs', questions: 25 },
        { name: 'Acids, Bases, Salts & Indicators', hours: '5 hrs', questions: 35 },
        { name: 'Physical & Chemical Changes', hours: '4 hrs', questions: 30 },
        { name: 'Respiration & Transportation in Plants/Animals', hours: '6 hrs', questions: 40 },
        { name: 'Light, Mirrors & Lens Systems', hours: '5 hrs', questions: 35 },
      ],
    },
    {
      id: 'sci-8',
      grade: '8',
      subject: 'science',
      subjectTitle: 'Science',
      icon: FiCompass,
      color: 'blue',
      title: 'Advanced Natural & Molecular Science',
      chapters: [
        { name: 'Crop Production & Modern Agriculture', hours: '4 hrs', questions: 25 },
        { name: 'Microorganisms: Friend and Foe', hours: '5 hrs', questions: 35 },
        { name: 'Synthetic Materials & Polymers', hours: '4 hrs', questions: 30 },
        { name: 'Combustion, Flame & Fuel Efficiency', hours: '5 hrs', questions: 35 },
        { name: 'Cell Structure, Organelles & Functions', hours: '6 hrs', questions: 45 },
        { name: 'Force, Pressure & Friction Dynamics', hours: '6 hrs', questions: 40 },
      ],
    },

    // ─── TECHNOLOGY ───
    {
      id: 'tech-6',
      grade: '6',
      subject: 'technology',
      subjectTitle: 'Technology',
      icon: FiCpu,
      color: 'purple',
      title: 'Computational Logic & Safe Computing',
      chapters: [
        { name: 'Algorithmic Thinking & Flowcharts', hours: '4 hrs', questions: 25 },
        { name: 'Visual Block Coding Fundamentals', hours: '6 hrs', questions: 40 },
        { name: 'Hardware Components & Peripherals', hours: '3 hrs', questions: 20 },
        { name: 'Safe Internet Habits & Digital Identity', hours: '3 hrs', questions: 20 },
      ],
    },
    {
      id: 'tech-7',
      grade: '7',
      subject: 'technology',
      subjectTitle: 'Technology',
      icon: FiCpu,
      color: 'purple',
      title: 'Structured Code & Data Logic',
      chapters: [
        { name: 'Loops, Conditional Branching & Patterns', hours: '5 hrs', questions: 35 },
        { name: 'Variables, Data Types & Memory', hours: '4 hrs', questions: 30 },
        { name: 'Introduction to Python Syntax', hours: '6 hrs', questions: 45 },
        { name: 'Cyber Hygiene & Avoiding Phishing', hours: '3 hrs', questions: 20 },
      ],
    },
    {
      id: 'tech-8',
      grade: '8',
      subject: 'technology',
      subjectTitle: 'Technology',
      icon: FiCpu,
      color: 'purple',
      title: 'Modern Software & AI Literacy',
      chapters: [
        { name: 'Modular Programming with Functions', hours: '5 hrs', questions: 35 },
        { name: 'Data Visualization & Spreadsheets', hours: '4 hrs', questions: 30 },
        { name: 'Foundations of Artificial Intelligence', hours: '6 hrs', questions: 40 },
        { name: 'Network Topologies & Cloud Basics', hours: '4 hrs', questions: 25 },
      ],
    },

    // ─── ENGINEERING ───
    {
      id: 'eng-6',
      grade: '6',
      subject: 'engineering',
      subjectTitle: 'Engineering',
      icon: FiTool,
      color: 'amber',
      title: 'Mechanical Principles & Simple Machines',
      chapters: [
        { name: 'Levers, Fulcrums & Mechanical Advantage', hours: '4 hrs', questions: 30 },
        { name: 'Pulleys, Gears & Torque Transmission', hours: '4 hrs', questions: 30 },
        { name: 'Structural Stability & Truss Bridges', hours: '5 hrs', questions: 35 },
      ],
    },
    {
      id: 'eng-7',
      grade: '7',
      subject: 'engineering',
      subjectTitle: 'Engineering',
      icon: FiTool,
      color: 'amber',
      title: 'Applied Physics & Electromechanics',
      chapters: [
        { name: 'Electromagnets, Motors & Dynamos', hours: '5 hrs', questions: 35 },
        { name: 'Hydraulic Systems & Fluid Power', hours: '4 hrs', questions: 30 },
        { name: 'Solar Panels & Energy Storage', hours: '4 hrs', questions: 25 },
      ],
    },
    {
      id: 'eng-8',
      grade: '8',
      subject: 'engineering',
      subjectTitle: 'Engineering',
      icon: FiTool,
      color: 'amber',
      title: 'Robotics & Control Automation',
      chapters: [
        { name: 'Sensors (Ultrasonic, IR, Temperature)', hours: '5 hrs', questions: 35 },
        { name: 'Microcontroller Logic & Inputs/Outputs', hours: '6 hrs', questions: 40 },
        { name: 'Kinematics & Robotic Actuation', hours: '5 hrs', questions: 35 },
      ],
    },

    // ─── MATHEMATICS ───
    {
      id: 'math-6',
      grade: '6',
      subject: 'mathematics',
      subjectTitle: 'Mathematics',
      icon: FiPercent,
      color: 'emerald',
      title: 'Integers, Fractions & Spatial Shapes',
      chapters: [
        { name: 'Knowing Our Numbers, Estimation & BODMAS', hours: '4 hrs', questions: 30 },
        { name: 'Integers, Number Line & Absolute Value', hours: '5 hrs', questions: 35 },
        { name: 'Fractions & Decimals in Real Life', hours: '5 hrs', questions: 35 },
        { name: 'Basic Geometrical Angles & Polygons', hours: '4 hrs', questions: 30 },
        { name: 'Data Handling, Bar Graphs & Pictographs', hours: '4 hrs', questions: 25 },
      ],
    },
    {
      id: 'math-7',
      grade: '7',
      subject: 'mathematics',
      subjectTitle: 'Mathematics',
      icon: FiPercent,
      color: 'emerald',
      title: 'Algebraic Expressions & Geometric Proofs',
      chapters: [
        { name: 'Fractions, Decimals & Operations', hours: '5 hrs', questions: 35 },
        { name: 'Simple Linear Equations in One Variable', hours: '6 hrs', questions: 45 },
        { name: 'Lines, Angles & Triangle Theorems', hours: '5 hrs', questions: 35 },
        { name: 'Ratios, Proportions & Percentages', hours: '5 hrs', questions: 35 },
        { name: 'Perimeter, Area & Circle Circumference', hours: '5 hrs', questions: 35 },
      ],
    },
    {
      id: 'math-8',
      grade: '8',
      subject: 'mathematics',
      subjectTitle: 'Mathematics',
      icon: FiPercent,
      color: 'emerald',
      title: 'Rational Arithmetic, Algebra & Statistics',
      chapters: [
        { name: 'Rational Numbers & Field Properties', hours: '5 hrs', questions: 35 },
        { name: 'Linear Equations in One Variable & Word Problems', hours: '6 hrs', questions: 45 },
        { name: 'Understanding Quadrilaterals & Geometry', hours: '5 hrs', questions: 35 },
        { name: 'Square Roots, Cube Roots & Exponents', hours: '5 hrs', questions: 40 },
        { name: 'Data Handling, Frequency Distribution & Probability', hours: '5 hrs', questions: 35 },
      ],
    },
  ];

  const filteredCurriculum = curriculumData.filter((item) => {
    const matchesGrade = item.grade === activeGrade;
    const matchesSubject = activeSubject === 'all' || item.subject === activeSubject;
    return matchesGrade && matchesSubject;
  });

  return (
    <div className="w-full py-16 lg:py-24 bg-slate-50">
      <div className="stem-container">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
            {content.badge}
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            {content.title}
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            {content.subtitle}
          </p>

          {/* Active Grade Overview Card */}
          <div className="mt-6 p-5 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-left max-w-3xl mx-auto shadow-xs flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
              G{activeGrade}
            </div>
            <div>
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Grade {activeGrade} Curriculum Scope & Focus
              </h4>
              <p className="text-sm text-blue-800 mt-1 leading-relaxed">
                {activeGrade === '6' ? content.grade6_overview : activeGrade === '7' ? content.grade7_overview : content.grade8_overview}
              </p>
            </div>
          </div>

          {/* Grade Selector Tabs */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-3">
            {['6', '7', '8'].map((grade) => (
              <button
                key={grade}
                type="button"
                onClick={() => setActiveGrade(grade)}
                className={`px-6 py-2.5 rounded-2xl text-sm font-extrabold transition-all cursor-pointer ${
                  activeGrade === grade
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Grade {grade} Curriculum
              </button>
            ))}
          </div>

          {/* Subject Filter Pills */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: 'All Disciplines' },
              { id: 'science', label: 'Science' },
              { id: 'technology', label: 'Technology' },
              { id: 'engineering', label: 'Engineering' },
              { id: 'mathematics', label: 'Mathematics' },
            ].map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setActiveSubject(sub.id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubject === sub.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        </div>

        {/* Experimental Alignment & Pedagogy */}
        {content.pedagogy_p1 && (
          <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm max-w-4xl mx-auto flex flex-col sm:flex-row items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FiLayers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {content.pedagogy_title || 'Experimental Alignment & Pedagogy'}
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {content.pedagogy_p1}
              </p>
            </div>
          </div>
        )}

        {/* Units Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {filteredCurriculum.map((unit) => {
            const Icon = unit.icon;
            return (
              <div
                key={unit.id}
                className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          unit.color === 'blue'
                            ? 'bg-blue-50 text-blue-600'
                            : unit.color === 'purple'
                            ? 'bg-purple-50 text-purple-600'
                            : unit.color === 'amber'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                          Grade {unit.grade} • {unit.subjectTitle}
                        </span>
                        <h3 className="text-xl font-bold text-slate-900">
                          {unit.title}
                        </h3>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                      {unit.chapters.length} Chapters
                    </span>
                  </div>

                  {/* Chapters List */}
                  <div className="space-y-3 mt-6 border-t border-slate-100 pt-5">
                    {unit.chapters.map((ch, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 pr-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-800">{ch.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <FiClock className="w-3 h-3 text-slate-400" />
                            {ch.hours}
                          </span>
                          <span className="text-blue-600 font-bold">
                            {ch.questions} Qs
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500 font-medium">
                    Passing threshold: <strong>60%</strong>
                  </div>
                  <Link
                    to="/student/register"
                    className="stem-btn stem-btn-primary py-2 px-4 text-xs flex items-center gap-2"
                  >
                    <span>Start Practice Quiz</span>
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-bold">Looking to assign quizzes as an educator?</h3>
            <p className="text-slate-400 text-sm max-w-xl">
              Teacher accounts have access to customize question sequences, adjust squad weighting, and configure competitive vs. collaborative sections.
            </p>
          </div>
          <Link
            to="/teacher/login"
            className="stem-btn bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-6 text-sm font-bold whitespace-nowrap"
          >
            <span>Teacher Faculty Portal</span>
            <FiArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
