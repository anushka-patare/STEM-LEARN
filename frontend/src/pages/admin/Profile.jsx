import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  FiShield, 
  FiLock, 
  FiSave, 
  FiUser, 
  FiMail, 
  FiEye, 
  FiEyeOff, 
  FiCheckCircle, 
  FiKey, 
  FiAtSign 
} from 'react-icons/fi';
import ProfilePhotoManager from '../../components/ProfilePhotoManager';
import { authService } from '../../services/api';

export default function AdminProfile() {
  const { user, updateUser, fetchUser } = useAuth();

  // Profile data
  const [profileData, setProfileData] = useState({
    username: '',
    full_name: '',
    email: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password data
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || 'admin',
        full_name: user.full_name || user.name || 'System Administrator',
        email: user.email || 'admin@stemlearn.com',
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const cleanUsername = profileData.username.trim().toLowerCase();
    if (!cleanUsername) {
      toast.error('Username cannot be empty');
      return;
    }
    if (cleanUsername.length < 3) {
      toast.error('Username must be at least 3 characters long');
      return;
    }

    try {
      setSavingProfile(true);
      const res = await authService.updateProfile({
        username: cleanUsername,
        full_name: profileData.full_name.trim(),
        name: profileData.full_name.trim(),
        email: profileData.email.trim(),
      });
      if (res.data?.success) {
        toast.success('Administrator username and profile updated successfully!');
        if (updateUser) {
          updateUser(res.data.data);
        }
        if (fetchUser) {
          fetchUser();
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update admin profile';
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.current_password === passwordData.new_password) {
      toast.error('New password cannot be identical to current password');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await authService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      toast.success(res.data?.message || 'Administrator root password changed successfully!');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password. Please verify your current password.';
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <FiUser className="text-purple-600" />
          Superuser Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your system username, root access credentials, profile avatar, and governance identity.
        </p>
      </div>

      {/* Profile Photo Manager */}
      <ProfilePhotoManager role="admin" />

      {/* Superuser Clearance Notice */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs text-purple-950 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-purple-800">
            <FiShield className="w-4 h-4" />
            <span>Highest Clearance Active (Root Superuser)</span>
          </div>
          <p>
            This administrative account holds unrestricted access across all student rosters, faculty appointments, question banks, class assignments, and security audit logs.
          </p>
        </div>
      </div>

      {/* ─── 1. USERNAME & PROFILE DETAILS CARD ─── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
              <FiAtSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Administrator Identity & Username
              </h3>
              <p className="text-xs text-slate-500">
                Change your login username and display information across the administration dashboard.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            <FiCheckCircle className="w-3.5 h-3.5 text-purple-600" />
            Super Administrator
          </span>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Username Field */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Admin Login Username <span className="text-purple-600 font-normal lowercase">(used to log into portal)</span>
              </label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  placeholder="e.g. admin or superadmin"
                  className="stem-input pl-10 text-xs sm:text-sm font-semibold text-slate-800"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter your unique identifier (min. 3 characters). You will use this username to sign into the superuser portal.
              </p>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Display Name
              </label>
              <input
                type="text"
                required
                value={profileData.full_name}
                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                placeholder="System Administrator"
                className="stem-input text-xs sm:text-sm"
              />
            </div>

            {/* Registered Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="admin@stemlearn.com"
                  className="stem-input pl-10 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="stem-btn bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-6 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-purple-600/30 transition-all"
            >
              <FiSave className="w-4 h-4" />
              <span>{savingProfile ? 'Updating Profile...' : 'Save Profile & Username'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ─── 2. UPDATE ROOT PASSWORD CARD ─── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg">
              <FiLock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Update Root Superuser Password
              </h3>
              <p className="text-xs text-slate-500">
                Verify current administrative credentials to update the master access password.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={passwordData.current_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, current_password: e.target.value })
                  }
                  placeholder="Enter current password"
                  className="stem-input pl-10 pr-10 text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showCurrent ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                New Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={passwordData.new_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, new_password: e.target.value })
                  }
                  placeholder="Min. 6 characters"
                  className="stem-input pl-10 pr-10 text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showNew ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={passwordData.confirm_password}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirm_password: e.target.value })
                  }
                  placeholder="Re-enter new password"
                  className="stem-input pl-10 pr-10 text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showConfirm ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="stem-btn bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-6 text-xs font-bold cursor-pointer transition-all shadow-xs"
            >
              <FiKey className="w-4 h-4" />
              <span>{savingPassword ? 'Changing Password...' : 'Update Root Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
