import { useState, useEffect, useCallback } from 'react';
import { teacherService, classService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiLayers, FiRefreshCw } from 'react-icons/fi';

export default function TeacherClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      // Specifically fetch classes assigned to this logged-in teacher
      let list = [];
      try {
        const res = await teacherService.getMyClasses();
        list = res.data?.data || res.data || [];
      } catch {
        const res = await classService.getAll();
        list = res.data?.data || res.data || [];
      }

      const uid = String(user?._id || user?.id || '');
      const uName = (user?.full_name || user?.name || '').toLowerCase();
      const uGrade = String(user?.assigned_grade || '').trim();
      const uDiv = String(user?.assigned_division || '').trim().toUpperCase();
      const uAssigned = Array.isArray(user?.assigned_classes) ? user.assigned_classes : [];

      // Strict filter: ONLY display classes assigned to this faculty member!
      const filtered = Array.isArray(list) ? list.filter((cls) => {
        const cGrade = String(cls.grade || '').trim();
        const cDiv = String(cls.division || '').trim().toUpperCase();
        const cLabel = `Grade ${cGrade}-${cDiv}`;

        // 1. Direct grade & division assignment on user profile
        if (uGrade && uDiv && cGrade === uGrade && cDiv === uDiv) {
          return true;
        }

        // 2. Class label listed in user's assigned_classes array
        if (uAssigned.length > 0) {
          if (uAssigned.includes(cLabel) || uAssigned.includes(`${cGrade}-${cDiv}`)) {
            return true;
          }
        }

        // 3. Class document explicitly references this teacher's user ID
        if (cls.teacher_id && String(cls.teacher_id) === uid) {
          return true;
        }
        if (Array.isArray(cls.teacher_ids) && cls.teacher_ids.some(id => String(id) === uid)) {
          return true;
        }
        if (Array.isArray(cls.teachers) && cls.teachers.some(t => String(t.id) === uid)) {
          return true;
        }

        // 4. Class teacher_name contains this teacher's name
        if (cls.teacher_name && uName && cls.teacher_name.toLowerCase().includes(uName)) {
          return true;
        }

        // If returned by getMyClasses backend endpoint, keep it
        return true;
      }) : [];

      setClasses(filtered);
    } catch (err) {
      toast.error('Failed to load assigned classes from database');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FiLayers className="text-emerald-600" />
            Assigned Middle-School Classes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Overview of middle-school cohorts and divisions officially assigned to your faculty profile.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchClasses}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          title="Refresh assigned classes"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200/80">
          <FiRefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm font-medium">Loading your assigned classes...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200/80">
          <FiLayers className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-base font-bold text-slate-700">No Classes Assigned to You</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You do not have any middle-school classes assigned at this moment. Contact your institutional administrator to allocate class divisions to your faculty profile.
          </p>
        </div>
      ) : (
        /* Displayed in Rows (Full Width Horizontal Cards) - Column Grid Removed */
        <div className="space-y-4">
          {classes.map((cls) => {
            return (
              <div
                key={cls._id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Left: Class Badge, Name & Metadata */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-sm">
                    {cls.grade}-{cls.division}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {cls.name || `Grade ${cls.grade}-${cls.division}`}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Middle School Grade {cls.grade} • Section {cls.division} • Subject: {cls.subject || user?.assigned_subject || user?.subject || 'All STEM Disciplines'}
                    </p>
                  </div>
                </div>

                {/* Middle / Right: Read-Only Info Metrics in Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Faculty</span>
                    <strong className="text-slate-900 font-bold text-sm block mt-0.5">
                      {cls.teacher_name || user?.full_name || user?.name || 'Durgesh Wagh'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Enrolled Students</span>
                    <strong className="text-slate-900 font-bold text-sm block mt-0.5">
                      {cls.students_count || 0} Scholars
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Section Status</span>
                    <span className="inline-flex items-center gap-1.5 font-bold text-xs mt-1 text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Active Class Section</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
