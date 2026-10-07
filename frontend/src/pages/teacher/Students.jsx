import { useState, useEffect } from 'react';
import { teacherService } from '../../services/api';
import { FiUsers, FiSearch, FiRefreshCw, FiAward } from 'react-icons/fi';

export default function TeacherStudents() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchCohort = async () => {
    setLoading(true);
    try {
      const [studentsRes, classesRes] = await Promise.all([
        teacherService.getMyStudents(),
        teacherService.getMyClasses(),
      ]);

      const fetchedStudents = studentsRes.data?.data || [];
      let fetchedClasses = classesRes.data?.data || [];

      // If classes list is empty but students exist, infer unique classes from students
      if (fetchedClasses.length === 0 && fetchedStudents.length > 0) {
        const unique = {};
        fetchedStudents.forEach((st) => {
          if (st.grade) {
            const k = `${st.grade}-${st.division || 'A'}`;
            unique[k] = { grade: st.grade, division: st.division || 'A' };
          }
        });
        fetchedClasses = Object.values(unique);
      }

      setStudents(fetchedStudents);
      setClasses(fetchedClasses);
    } catch (err) {
      console.error('Failed to load teacher student cohort:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCohort();
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const nameMatch = s.full_name?.toLowerCase().includes(q);
    const idMatch = s.student_id?.toLowerCase().includes(q);
    const emailMatch = s.email?.toLowerCase().includes(q);
    const rollMatch = String(s.roll_number || s.roll_no || '').includes(q);
    const matchesSearch = !search || nameMatch || idMatch || emailMatch || rollMatch;

    const studentClassKey = `${String(s.grade || '').trim()}-${String(s.division || 'A').trim().toUpperCase()}`;
    const matchesClass =
      selectedClass === 'all' || studentClassKey === selectedClass.toUpperCase();
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <FiUsers className="w-8 h-8 text-emerald-600" />
          Student Roster
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review individual student details, assigned classes, roll numbers, academic ranks, and earned points.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search student by name, email, roll no, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="stem-input pl-10 text-xs sm:text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Filter Class:</span>
          <button
            type="button"
            onClick={() => setSelectedClass('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedClass === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Assigned ({students.length})
          </button>
          {classes.map((cls) => {
            const key = `${cls.grade}-${cls.division}`;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedClass(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedClass === key
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Grade {key}
              </button>
            );
          })}
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="min-h-[260px] flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200">
          <FiRefreshCw className="w-7 h-7 text-emerald-600 animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Loading student roster...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="min-h-[260px] flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center">
          <FiUsers className="w-10 h-10 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700">No Students Found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            {search
              ? 'No students matched your search criteria.'
              : 'No students enrolled yet in this assigned class.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Student Details</th>
                  <th className="py-4 px-6">Class</th>
                  <th className="py-4 px-6">Roll No</th>
                  <th className="py-4 px-6">Rank</th>
                  <th className="py-4 px-6">Points Earned</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* 1. Student Details */}
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                          {s.full_name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{s.full_name}</div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {s.student_id || s.email || s.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Class */}
                    <td className="py-4 px-6 text-xs text-slate-700 font-bold">
                      Grade {s.grade}-{s.division}
                    </td>

                    {/* 3. Roll No */}
                    <td className="py-4 px-6 text-xs text-slate-700 font-semibold">
                      #{s.roll_number || s.roll_no || '1'}
                    </td>

                    {/* 4. Rank */}
                    <td className="py-4 px-6 text-xs">
                      {s.rank === 1 || s.class_rank === 1 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-amber-800 bg-amber-50 border border-amber-200/80 shadow-2xs">
                          🥇 Rank #1
                        </span>
                      ) : s.rank === 2 || s.class_rank === 2 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-slate-700 bg-slate-100 border border-slate-200 shadow-2xs">
                          🥈 Rank #2
                        </span>
                      ) : s.rank === 3 || s.class_rank === 3 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-orange-800 bg-orange-50 border border-orange-200 shadow-2xs">
                          🥉 Rank #3
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-slate-700 bg-slate-100">
                          <FiAward className="w-3.5 h-3.5 text-slate-400" />
                          Rank #{s.class_rank || s.rank || '-'}
                        </span>
                      )}
                    </td>

                    {/* 5. Points Earned */}
                    <td className="py-4 px-6 text-xs font-black">
                      <span className="inline-flex items-center px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-black border border-emerald-200/60 shadow-2xs text-xs">
                        ⚡ {s.points || 0} Pts
                      </span>
                    </td>

                    {/* 6. Status */}
                    <td className="py-4 px-6 text-xs">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="capitalize">{s.status === 'active' || !s.status ? 'Active' : s.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
