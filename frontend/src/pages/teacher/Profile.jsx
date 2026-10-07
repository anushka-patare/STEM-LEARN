import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/api';
import { toast } from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiLock, FiSave, FiBookOpen, FiAward, FiCheckCircle } from 'react-icons/fi';
import ProfilePhotoManager from '../../components/ProfilePhotoManager';

export default function TeacherProfile() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile: '',
    teacher_id: '',
    subject_specialization: '',
    education: '',
    assigned_grade: '',
    assigned_division: '',
    assigned_subject: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  // Fetch fresh profile details from server on mount
  useEffect(() => {
    let isMounted = true;

    const fetchLiveProfile = async () => {
      try {
        const res = await profileService.getProfile();
        if (res.data?.success && res.data?.data && isMounted) {
          const p = res.data.data;
          const liveData = {
            full_name: p.full_name || p.name || user?.full_name || user?.name || '',
            email: p.email || user?.email || '',
            mobile: p.mobile || user?.mobile || '',
            teacher_id: p.teacher_id || user?.teacher_id || '',
            subject_specialization: p.subject_specialization || p.specialization || p.subject || user?.subject_specialization || '',
            education: p.education || p.qualification || user?.education || '',
            assigned_grade: p.assigned_grade || user?.assigned_grade || user?.grade || '',
            assigned_division: p.assigned_division || user?.assigned_division || user?.division || '',
            assigned_subject: p.assigned_subject || p.subject || user?.assigned_subject || '',
          };
          setFormData(liveData);
          if (updateUser) {
            updateUser({ ...p, ...liveData });
          }
        }
      } catch (err) {
        console.warn('Could not fetch live profile from API, fallback to current user state:', err);
        if (user && isMounted) {
          setFormData({
            full_name: user.full_name || user.name || '',
            email: user.email || '',
            mobile: user.mobile || '',
            teacher_id: user.teacher_id || '',
            subject_specialization: user.subject_specialization || user.specialization || user.subject || '',
            education: user.education || user.qualification || '',
            assigned_grade: user.assigned_grade || user.grade || '',
            assigned_division: user.assigned_division || user.division || '',
            assigned_subject: user.assigned_subject || user.subject || '',
          });
        }
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    };

    fetchLiveProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync if auth user updates
  useEffect(() => {
    if (user && loadingProfile) {
      setFormData((prev) => ({
        ...prev,
        full_name: prev.full_name || user.full_name || user.name || '',
        email: prev.email || user.email || '',
        mobile: prev.mobile || user.mobile || '',
        teacher_id: prev.teacher_id || user.teacher_id || '',
        subject_specialization: prev.subject_specialization || user.subject_specialization || user.specialization || '',
        education: prev.education || user.education || user.qualification || '',
        assigned_grade: prev.assigned_grade || user.assigned_grade || user.grade || '',
        assigned_division: prev.assigned_division || user.assigned_division || user.division || '',
        assigned_subject: prev.assigned_subject || user.assigned_subject || user.subject || '',
      }));
    }
  }, [user, loadingProfile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatePayload = {
        full_name: formData.full_name.trim(),
        mobile: formData.mobile.trim(),
        subject_specialization: formData.subject_specialization.trim(),
        education: formData.education.trim(),
      };
      const res = await profileService.updateProfile(updatePayload);
      if (res.data?.success) {
        if (res.data?.data && updateUser) {
          updateUser(res.data.data);
        }
        toast.success('Faculty profile updated successfully!');
      } else {
        toast.error(res.data?.message || 'Failed to update profile');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    setChangingPass(true);
    try {
      await profileService.changePassword(passwordData);
      toast.success('Faculty password changed successfully!');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Faculty Account Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your teacher faculty credentials and profile photo.
        </p>
      </div>

      {/* Official Teaching Assignment Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl p-6 border border-emerald-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FiBookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Official Teaching Assignment
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  <FiCheckCircle className="w-3 h-3 text-emerald-600" /> Admin Verified
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Class allocation & primary subject assigned by Administration
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-emerald-900 border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Class: {formData.assigned_grade ? `Grade ${formData.assigned_grade}` : 'Not Assigned'}
              {formData.assigned_division ? ` - Division ${formData.assigned_division}` : ''}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 text-white shadow-2xs">
              <FiAward className="w-3.5 h-3.5" />
              {formData.assigned_subject || formData.subject_specialization || 'Not Assigned'}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Photo Manager */}
      <ProfilePhotoManager role="teacher" />

      {/* Personal & Academic Details Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Faculty Information</h3>
            <p className="text-xs text-slate-500 mt-0.5">Edit your personal contact details and academic qualification.</p>
          </div>
          {loadingProfile && (
            <span className="text-xs text-emerald-600 font-semibold animate-pulse">
              Syncing latest data...
            </span>
          )}
        </div>

        <form onSubmit={handleUpdate} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="stem-input text-xs sm:text-sm"
                placeholder="Teacher Full Name"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                <span>Teacher ID</span>
                <span className="text-[10px] text-slate-400 font-normal lowercase">(read-only)</span>
              </label>
              <input
                type="text"
                disabled
                value={formData.teacher_id}
                className="stem-input text-xs sm:text-sm bg-slate-50 text-slate-700 font-mono font-semibold cursor-not-allowed border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                <span>Email Address</span>
                <span className="text-[10px] text-slate-400 font-normal lowercase">(official login)</span>
              </label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="stem-input text-xs sm:text-sm bg-slate-50 text-slate-600 cursor-not-allowed border-slate-200"
              />
              <p className="text-[11px] text-slate-400 mt-1">Official faculty email managed by administration</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Mobile Number
              </label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="e.g. 9876543210"
                className="stem-input text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Subject Specialization
              </label>
              <input
                type="text"
                value={formData.subject_specialization}
                onChange={(e) =>
                  setFormData({ ...formData, subject_specialization: e.target.value })
                }
                placeholder="e.g. Computer Science, Physics"
                className="stem-input text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Highest Education / Qualification
              </label>
              <input
                type="text"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                placeholder="e.g. MCS, M.Sc., B.Ed."
                className="stem-input text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="stem-btn bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-6 text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <FiSave className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Password Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <FiLock className="w-4 h-4 text-emerald-600" />
          <span>Change Faculty Password</span>
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={passwordData.current_password}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, current_password: e.target.value })
                }
                className="stem-input text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={passwordData.new_password}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, new_password: e.target.value })
                }
                className="stem-input text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={passwordData.confirm_password}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirm_password: e.target.value })
                }
                className="stem-input text-xs sm:text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={changingPass}
            className="stem-btn stem-btn-secondary py-2.5 px-6 text-xs flex items-center gap-2 border border-slate-300 cursor-pointer disabled:opacity-50"
          >
            <span>{changingPass ? 'Updating...' : 'Change Password'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
