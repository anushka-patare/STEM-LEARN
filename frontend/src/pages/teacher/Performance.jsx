import { useState, useEffect } from 'react';
import { teacherService } from '../../services/api';
import {
  FiTrendingUp,
  FiAward,
  FiUser,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiBookOpen,
  FiSearch,
  FiBarChart2,
  FiEye,
  FiRefreshCw,
  FiPrinter,
  FiX,
  FiTarget,
  FiActivity,
  FiLayers,
  FiStar,
  FiCheck,
  FiAlertCircle
} from 'react-icons/fi';

export default function TeacherPerformance() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all'); // 'all', 'high', 'pass', 'attention'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [studentReport, setStudentReport] = useState(null);
  const [activeSubjectFilter, setActiveSubjectFilter] = useState('all');

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await teacherService.getPerformanceOverview();
      if (res.data?.success) {
        setOverview(res.data.data.summary);
        setStudents(res.data.data.students || []);
      }
    } catch (err) {
      console.error('Failed to load performance overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleOpenReport = async (student) => {
    setSelectedStudent(student);
    setReportLoading(true);
    setStudentReport(null);
    setActiveSubjectFilter('all');
    try {
      const res = await teacherService.getStudentDetailedPerformance(student._id);
      if (res.data?.success) {
        setStudentReport(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load student performance report:', err);
    } finally {
      setReportLoading(false);
    }
  };

  const handleCloseReport = () => {
    setSelectedStudent(null);
    setStudentReport(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter solo students
  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    const nameMatch = s.full_name?.toLowerCase().includes(q);
    const emailMatch = s.email?.toLowerCase().includes(q);
    const idMatch = s.student_id?.toLowerCase().includes(q);
    const rollMatch = String(s.roll_number || s.roll_no || '').includes(q);
    const matchesSearch = !search || nameMatch || emailMatch || idMatch || rollMatch;

    if (!matchesSearch) return false;

    if (scoreFilter === 'high') return s.avg_score >= 80;
    if (scoreFilter === 'pass') return s.avg_score >= 70 && s.avg_score < 80;
    if (scoreFilter === 'attention') return s.avg_score < 70 && s.tests_taken > 0;
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
              <FiTrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Student Academic Performance
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Comprehensive solo student academic tracking, rankings, points, and test-wise performance analytics.
              </p>
            </div>
          </div>
        </div>

        {overview && (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
              <FiLayers className="w-3.5 h-3.5 text-emerald-600" />
              Assigned Class: {overview.assigned_class_name || 'Grade 7-A'}
            </span>
            <button
              onClick={fetchOverview}
              className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
              title="Refresh Performance"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* ─── Top Performance Summary Cards ─── */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Solo Students */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
              <FiUser className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{overview.total_students || 0}</div>
              <div className="text-xs font-semibold text-slate-500">Solo Students Enrolled</div>
            </div>
          </div>

          {/* Card 2: Class Average Score */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              <FiActivity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{overview.class_avg_score || 0}%</div>
              <div className="text-xs font-semibold text-slate-500">Class Average Score</div>
            </div>
          </div>

          {/* Card 3: Tests Passed / Taken */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
              <FiCheckCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">
                {overview.total_tests_passed} <span className="text-xs font-normal text-slate-400">/ {overview.total_tests_taken}</span>
              </div>
              <div className="text-xs font-semibold text-slate-500">
                Tests Passed ({overview.class_pass_rate}%)
              </div>
            </div>
          </div>

          {/* Card 4: Total Points Earned */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
              <FiStar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">
                {Number(overview.total_class_points || 0).toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-slate-500">Class Points Accumulated</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Search & Filters Bar ─── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search student by name, roll no, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="stem-input pl-10 text-xs sm:text-sm w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">Filter By Mastery:</span>
          <button
            type="button"
            onClick={() => setScoreFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              scoreFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Students ({students.length})
          </button>
          <button
            type="button"
            onClick={() => setScoreFilter('high')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              scoreFilter === 'high'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Mastered (&ge;80%)
          </button>
          <button
            type="button"
            onClick={() => setScoreFilter('pass')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              scoreFilter === 'pass'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            Proficient (70-79%)
          </button>
          <button
            type="button"
            onClick={() => setScoreFilter('attention')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              scoreFilter === 'attention'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Needs Practice (&lt;70%)
          </button>
        </div>
      </div>

      {/* ─── Solo Students Performance Roster Table ─── */}
      {loading ? (
        <div className="min-h-[280px] flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200">
          <FiRefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="text-xs font-bold text-slate-500">Loading student performance records...</span>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="min-h-[260px] flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center">
          <FiUser className="w-10 h-10 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700">No Students Found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            {search ? 'No students matched your search criteria.' : 'No students found in this assigned class cohort.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6 text-center w-24">Class Rank</th>
                  <th className="py-4 px-6">Roll No</th>
                  <th className="py-4 px-6">Solo Student Profile</th>
                  <th className="py-4 px-6">Class</th>
                  <th className="py-4 px-6 text-right">Points Earned</th>
                  <th className="py-4 px-6 text-center">Tests Taken / Passed</th>
                  <th className="py-4 px-6">Average Score</th>
                  <th className="py-4 px-6 text-center">Performance Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* 1. Class Rank */}
                    <td className="py-4 px-6 text-center">
                      {s.class_rank === 1 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-black text-amber-800 bg-amber-50 border border-amber-300 shadow-2xs text-xs">
                          🥇 #1
                        </span>
                      ) : s.class_rank === 2 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-black text-slate-700 bg-slate-100 border border-slate-300 shadow-2xs text-xs">
                          🥈 #2
                        </span>
                      ) : s.class_rank === 3 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-black text-orange-800 bg-orange-50 border border-orange-300 shadow-2xs text-xs">
                          🥉 #3
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-slate-600 bg-slate-100 text-xs">
                          #{s.class_rank || '-'}
                        </span>
                      )}
                    </td>

                    {/* 2. Roll No */}
                    <td className="py-4 px-6 font-bold text-slate-800 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                        #{String(s.roll_number || s.roll_no || '1').padStart(2, '0')}
                      </span>
                    </td>

                    {/* 3. Student Profile */}
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                          {s.full_name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{s.full_name}</div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {s.student_id || s.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 4. Class */}
                    <td className="py-4 px-6 text-xs text-slate-700 font-bold">
                      Grade {s.grade}-{s.division || 'A'}
                    </td>

                    {/* 5. Points Earned */}
                    <td className="py-4 px-6 text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">
                        <FiStar className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
                        {Number(s.points || 0).toLocaleString()} pts
                      </span>
                    </td>

                    {/* 6. Tests Taken / Passed */}
                    <td className="py-4 px-6 text-center text-xs">
                      <div className="font-bold text-slate-800">
                        {s.tests_passed} / {s.tests_taken} Passed
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {s.pass_rate}% Pass Rate
                      </div>
                    </td>

                    {/* 7. Average Score */}
                    <td className="py-4 px-6 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              s.avg_score >= 80
                                ? 'bg-emerald-500'
                                : s.avg_score >= 70
                                ? 'bg-blue-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, s.avg_score || 0)}%` }}
                          />
                        </div>
                        <span className="font-extrabold text-slate-800">{s.avg_score}%</span>
                      </div>
                    </td>

                    {/* 8. Action: View Report */}
                    <td className="py-4 px-6 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenReport(s)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                      >
                        <FiBarChart2 className="w-3.5 h-3.5" />
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── DETAILED PERFORMANCE REPORT MODAL / DRAWER ─── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black flex items-center justify-center text-base shadow-sm">
                  {selectedStudent.full_name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black tracking-tight">{selectedStudent.full_name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Roll #{selectedStudent.roll_number}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      Grade {selectedStudent.grade}-{selectedStudent.division || 'A'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Academic Performance & Subject Test Report • {selectedStudent.student_id}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-all"
                  title="Print Report Card"
                >
                  <FiPrinter className="w-3.5 h-3.5" />
                  Print Report
                </button>
                <button
                  type="button"
                  onClick={handleCloseReport}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1">
              {reportLoading ? (
                <div className="min-h-[350px] flex flex-col items-center justify-center gap-3">
                  <FiRefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                  <span className="text-xs font-bold text-slate-500">Generating student analytics report...</span>
                </div>
              ) : !studentReport ? (
                <div className="min-h-[250px] flex flex-col items-center justify-center text-center p-8">
                  <FiAlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                  <h3 className="font-bold text-slate-800 text-sm">Report Unavailable</h3>
                  <p className="text-xs text-slate-500">Could not retrieve test records for this student.</p>
                </div>
              ) : (
                <>
                  {/* 1. Student Summary KPI Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                      <div className="text-xs font-semibold text-slate-400">Class Rank</div>
                      <div className="text-xl font-black text-slate-900 mt-0.5">
                        #{studentReport.student?.class_rank || 1}
                      </div>
                    </div>
                    <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-100 text-center">
                      <div className="text-xs font-semibold text-purple-600">Points Earned</div>
                      <div className="text-xl font-black text-purple-900 mt-0.5">
                        {Number(studentReport.summary?.total_points_earned || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100 text-center">
                      <div className="text-xs font-semibold text-emerald-600">Average Score</div>
                      <div className="text-xl font-black text-emerald-900 mt-0.5">
                        {studentReport.summary?.average_score_percentage}%
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-100 text-center">
                      <div className="text-xs font-semibold text-blue-600">Tests Passed</div>
                      <div className="text-xl font-black text-blue-900 mt-0.5">
                        {studentReport.summary?.tests_passed} / {studentReport.summary?.total_tests_taken}
                      </div>
                    </div>
                    <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-100 text-center">
                      <div className="text-xs font-semibold text-amber-600">Pass Rate</div>
                      <div className="text-xl font-black text-amber-900 mt-0.5">
                        {studentReport.summary?.pass_rate_percentage}%
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                      <div className="text-xs font-semibold text-slate-400">Total Test Time</div>
                      <div className="text-lg font-black text-slate-900 mt-0.5">
                        {studentReport.summary?.formatted_total_time}
                      </div>
                    </div>
                  </div>

                  {/* 2. Visualizations Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Visual 1: Subject Mastery Performance Chart */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <FiTarget className="w-4 h-4 text-emerald-600" />
                          <h3 className="font-extrabold text-sm text-slate-900">Subject Mastery Breakdown</h3>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">Cutoff: 70%</span>
                      </div>

                      <div className="space-y-4">
                        {studentReport.subject_mastery?.map((sm) => (
                          <div key={sm.subject_name} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full inline-block"
                                  style={{ backgroundColor: sm.color }}
                                />
                                {sm.subject_name} ({sm.code})
                              </span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    sm.mastery_level === 'Mastered'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : sm.mastery_level === 'Proficient'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {sm.mastery_level}
                                </span>
                                <span className="font-black text-slate-900">{sm.average_score}%</span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                              {/* 70% indicator mark */}
                              <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-slate-300 z-10" />
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(100, sm.average_score)}%`,
                                  backgroundColor: sm.color
                                }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>
                                {sm.tests_passed} of {sm.tests_taken} Tests Passed ({sm.pass_ratio}%)
                              </span>
                              <span className="font-bold text-purple-600">+{sm.total_points} pts</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Visual 2: Test Progression & Benchmark Line Chart */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <FiActivity className="w-4 h-4 text-blue-600" />
                          <h3 className="font-extrabold text-sm text-slate-900">
                            Test Progress vs 70% Cutoff Benchmark
                          </h3>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          70% Passing Threshold
                        </span>
                      </div>

                      {/* Visual Bar Graph */}
                      <div className="h-44 flex items-end gap-3 pt-6 pb-2 px-2 relative border-b border-slate-200">
                        {/* 70% threshold dashed line */}
                        <div
                          className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-400 pointer-events-none z-10"
                          style={{ bottom: '70%' }}
                        >
                          <span className="absolute -top-3 right-0 text-[10px] font-black text-emerald-600 bg-emerald-50 px-1 rounded">
                            Pass Cutoff 70%
                          </span>
                        </div>

                        {studentReport.timeline?.map((item, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                            {/* Bar Tooltip on Hover */}
                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-md whitespace-nowrap z-20 pointer-events-none">
                              {item.quiz_title}: {item.score_percentage}% {item.passed ? '✅ Passed' : '❌ Failed'}
                            </div>

                            {/* Bar score percentage text */}
                            <span className="text-[10px] font-black text-slate-700 mb-1">
                              {item.score_percentage}%
                            </span>

                            {/* Vertical Bar */}
                            <div
                              className={`w-full max-w-[36px] rounded-t-lg transition-all ${
                                item.passed
                                  ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-xs'
                                  : 'bg-gradient-to-t from-rose-600 to-red-400'
                              }`}
                              style={{ height: `${Math.min(100, item.score_percentage)}%` }}
                            />

                            {/* Label */}
                            <div className="text-[10px] font-bold text-slate-500 mt-2 truncate w-full text-center">
                              {item.label}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Passed (&ge;70%)
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Failed (&lt;70%)
                          </span>
                        </div>
                        <span>Sequential Tests Taken</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Detailed Subject & Test-Wise Report Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                          <FiBookOpen className="w-4 h-4 text-emerald-600" />
                          Subject & Test-Wise Detailed Breakdown
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Granular test scores, marks, chapters, status, and points awarded.
                        </p>
                      </div>

                      {/* Subject Filter Tabs */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveSubjectFilter('all')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeSubjectFilter === 'all'
                              ? 'bg-slate-900 text-white'
                              : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          All ({studentReport.test_history?.length})
                        </button>
                        {studentReport.subject_mastery?.map((sm) => (
                          <button
                            key={sm.subject_name}
                            type="button"
                            onClick={() => setActiveSubjectFilter(sm.subject_name)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              activeSubjectFilter === sm.subject_name
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            {sm.subject_name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Subject & Category</th>
                            <th className="py-3 px-4">Chapter</th>
                            <th className="py-3 px-4">Test Title & Label</th>
                            <th className="py-3 px-4 text-center">Score / Marks</th>
                            <th className="py-3 px-4 text-center">Percentage</th>
                            <th className="py-3 px-4 text-center">Status</th>
                            <th className="py-3 px-4 text-right">Points</th>
                            <th className="py-3 px-4">Time Spent</th>
                            <th className="py-3 px-4">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {studentReport.test_history
                            ?.filter(
                              (t) =>
                                activeSubjectFilter === 'all' ||
                                t.subject_name.toLowerCase() === activeSubjectFilter.toLowerCase()
                            )
                            .map((t) => (
                              <tr key={t.attempt_id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4">
                                  <span className="font-bold text-slate-900">{t.subject_name}</span>
                                  <span className="text-slate-400 block text-[10px]">{t.category_name}</span>
                                </td>
                                <td className="py-3 px-4 font-semibold text-slate-700">
                                  {t.chapter_name}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900">{t.test_label}</div>
                                  <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                                    {t.quiz_title}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center font-bold text-slate-800">
                                  {t.score} / {t.total_marks}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`font-black text-xs ${
                                      t.passed ? 'text-emerald-700' : 'text-rose-600'
                                    }`}
                                  >
                                    {t.score_percentage}%
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  {t.passed ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      <FiCheck className="w-3 h-3 text-emerald-600" />
                                      PASSED
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[10px] bg-rose-100 text-rose-800 border border-rose-200">
                                      <FiX className="w-3 h-3 text-rose-600" />
                                      FAILED
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {t.points_earned > 0 ? (
                                    <span className="font-black text-purple-700">
                                      +{t.points_earned} pts
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-bold">0 pts</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-slate-600">
                                  {Math.floor(t.time_taken_seconds / 60)}m {t.time_taken_seconds % 60}s
                                </td>
                                <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                  {t.formatted_date}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={handleCloseReport}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
