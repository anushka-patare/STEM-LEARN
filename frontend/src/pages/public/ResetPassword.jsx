import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/api';
import { toast } from 'react-hot-toast';
import { FiLock, FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff, FiArrowLeft, FiUser, FiKey } from 'react-icons/fi';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(Boolean(token));
  const [tokenValid, setTokenValid] = useState(false);
  const [isDirectMode, setIsDirectMode] = useState(!token);
  const [errorMessage, setErrorMessage] = useState('');

  // Fields
  const [identifier, setIdentifier] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setIsDirectMode(true);
      return;
    }

    const checkToken = async () => {
      try {
        const res = await authService.verifyResetToken(token);
        if (res.data?.success) {
          setTokenValid(true);
          setIsDirectMode(false);
        }
      } catch (err) {
        setTokenValid(false);
        setIsDirectMode(true); // Fallback to direct credentials mode
        setErrorMessage(
          err.response?.data?.message || 'Password reset link is invalid or has expired.'
        );
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isDirectMode) {
      const id = identifier.trim();
      if (!id) {
        toast.error('Please enter your username or registered email');
        return;
      }
      if (!currentPassword) {
        toast.error('Please enter your current password');
        return;
      }
      if (!password) {
        toast.error('Please enter your new password');
        return;
      }
      if (password.length < 6) {
        toast.error('New password must be at least 6 characters long');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('New password and confirm password do not match');
        return;
      }
      if (currentPassword === password) {
        toast.error('New password cannot be identical to current password');
        return;
      }

      setSubmitting(true);
      try {
        const res = await authService.resetPasswordDirect({
          identifier: id,
          current_password: currentPassword,
          new_password: password,
          confirm_password: confirmPassword
        });
        toast.success(res.data?.message || 'Password updated successfully!');
        setResetSuccess(true);
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to update password. Please check your credentials.';
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    } else {
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      setSubmitting(true);
      try {
        const res = await authService.resetPassword({ token, password });
        toast.success(res.data?.message || 'Password updated successfully!');
        setResetSuccess(true);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to reset password');
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Verifying secure reset token...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
        <div className="text-center mb-6">
          <Link to="/" className="inline-block text-2xl font-black text-slate-900 tracking-tight mb-2">
            STEM<span className="text-blue-600">Learn</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-800">
            {isDirectMode ? 'Update Account Password' : 'Set New Password'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isDirectMode 
              ? 'Verify your current credentials to securely establish a new password.' 
              : 'Enter your new account password below.'}
          </p>
        </div>

        {resetSuccess ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <FiCheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Password Changed Successfully!</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your password has been updated. You can now log into your portal with your new credentials.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/student/login"
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors text-center"
              >
                Go to Student Login
              </Link>
              <Link
                to="/teacher/login"
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors text-center"
              >
                Go to Teacher Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isDirectMode && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Username or Registered Email
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. student1, teacher, or registered email"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showCurrentPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                New Password (min 6 characters)
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              {submitting ? 'Updating Password...' : 'Save New Password'}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors"
              >
                <FiArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
