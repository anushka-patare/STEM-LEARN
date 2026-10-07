import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/api';
import { toast } from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiLock, FiCheckCircle, FiShield, FiSave } from 'react-icons/fi';
import ProfilePhotoManager from '../../components/ProfilePhotoManager';

export default function StudentProfile() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile: '',
    student_id: '',
    grade: '7',
    division: 'A',
    roll_no: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        student_id: user.student_id || 'STU-1029',
        grade: user.grade || '7',
        division: user.division || 'A',
        roll_no: user.roll_no || user.roll_number || '1',
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profileService.updateProfile(formData);
      toast.success('Student profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPass(true);
    try {
      await profileService.changePassword(passwordData);
      toast.success('Password updated successfully!');
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
          My Student Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your personal middle-school student profile and photo.
        </p>
      </div>

      {/* Profile Photo Manager */}
      <ProfilePhotoManager role="student" />

      {/* Main Profile Info Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="stem-input text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Student ID
              </label>
              <input
                type="text"
                disabled
                value={formData.student_id}
                className="stem-input text-xs sm:text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="stem-input text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Number
              </label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="stem-input text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Grade
              </label>
              <input
                type="text"
                disabled
                value={`Grade ${formData.grade}`}
                className="stem-input text-xs sm:text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Division
              </label>
              <input
                type="text"
                disabled
                value={`Division ${formData.division}`}
                className="stem-input text-xs sm:text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Roll Number
              </label>
              <input
                type="text"
                disabled
                value={formData.roll_no}
                className="stem-input text-xs sm:text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="stem-btn stem-btn-primary py-2.5 px-6 text-xs flex items-center gap-2 cursor-pointer"
            >
              <FiSave className="w-4 h-4" />
              <span>{saving ? 'Updating...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Password Reset Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <FiLock className="w-4 h-4 text-blue-600" />
            <span>Update Account Password</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Ensure your password is at least 6 characters with a combination of letters and numbers.
          </p>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                className="stem-input text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                className="stem-input text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                className="stem-input text-xs sm:text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={changingPass}
            className="stem-btn stem-btn-secondary py-2.5 px-6 text-xs flex items-center gap-2 border border-slate-300 cursor-pointer"
          >
            <span>{changingPass ? 'Updating...' : 'Change Password'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
