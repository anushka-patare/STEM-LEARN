import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  FiMail,
  FiLock,
  FiArrowRight,
  FiBookOpen,
  FiArrowLeft,
  FiShield,
  FiKey,
  FiUserPlus,
  FiCheckCircle,
  FiUser,
  FiAward,
  FiPhone,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiX
} from 'react-icons/fi';
import ForgotPasswordModal from '../../components/ForgotPasswordModal';

export default function TeacherLogin() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Register Form State
  const [regData, setRegData] = useState({
    full_name: '',
    username: '',
    email: '',
    mobile: '',
    qualification: '',
    subject_specialization: 'Science',
    password: '',
    confirm_password: '',
  });
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const id = identifier.trim();
    const pw = password;

    if (!id && !pw) {
      const msg = 'Please enter your faculty username and password';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    if (!id) {
      const msg = 'Please enter your faculty username or email';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    if (!pw) {
      const msg = 'Please enter your password';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      const res = await login(id, pw, 'teacher');
      if (res?.success) {
        toast.success(`Welcome, Professor ${res.user?.full_name || 'Faculty'}!`);
        navigate('/teacher/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid username or password';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherRegister = async (e) => {
    e.preventDefault();
    if (!regData.full_name.trim() || !regData.username.trim() || !regData.email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (regData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (regData.password !== regData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    setRegSubmitting(true);
    try {
      const res = await authService.teacherRegister({
        full_name: regData.full_name.trim(),
        username: regData.username.trim().toLowerCase(),
        email: regData.email.trim().toLowerCase(),
        password: regData.password,
        mobile: regData.mobile.trim(),
        education: regData.qualification.trim(),
        subject: regData.subject_specialization,
      });

      if (res.data?.success) {
        setRegSuccess(true);
        toast.success('Registration submitted! Awaiting administrator approval.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Faculty registration failed');
    } finally {
      setRegSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-400 mb-6 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back to Public Website</span>
        </Link>

        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-900/50">
            T
          </div>
          <div>
            <span className="font-extrabold text-white text-2xl tracking-tight">
              STEM<span className="text-emerald-400">Learn</span>
            </span>
            <span className="text-[10px] text-emerald-300 block font-bold uppercase tracking-wider">
              Faculty Portal
            </span>
          </div>
        </div>

        <h2 className="mt-6 text-center text-2xl font-black text-white tracking-tight">
          Teacher Faculty Access
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Sign in with your username / employee ID and password to manage classes, quizzes, and live tests.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/90 py-8 px-6 shadow-2xl rounded-3xl border border-slate-800 sm:px-10 backdrop-blur-md">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {errorMsg && (
              <div className="w-full bg-rose-950/50 border border-rose-800/60 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 text-left animate-fade-in">
                <FiAlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Faculty Username or Email
              </label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  required
                  placeholder="e.g. teacher or teacher@stemlearn.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your faculty password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-10 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 hover:shadow-emerald-900/60 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Teacher Portal</span>
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400 mb-3">New faculty member or institutional teacher?</p>
            <button
              type="button"
              onClick={() => {
                setRegSuccess(false);
                setShowRegisterModal(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <FiUserPlus className="w-4 h-4" />
              <span>Apply for Teacher Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />

      {/* Teacher Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>

            {!regSuccess ? (
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <FiUserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Teacher Self-Registration</h3>
                    <p className="text-xs text-slate-400">Applications are reviewed by the school administrator.</p>
                  </div>
                </div>

                <form onSubmit={handleTeacherRegister} className="space-y-3 pt-2 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Preeti Deshmukh"
                      value={regData.full_name}
                      onChange={(e) => setRegData({ ...regData, full_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                        Username *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. preeti_stem"
                        value={regData.username}
                        onChange={(e) => setRegData({ ...regData, username: e.target.value.toLowerCase() })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                        Institutional Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="preeti@college.edu"
                        value={regData.email}
                        onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                        Subject Specialization
                      </label>
                      <select
                        value={regData.subject_specialization}
                        onChange={(e) => setRegData({ ...regData, subject_specialization: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Science">Science (Physics/Chem/Bio)</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Technology">Technology & Coding</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                        Highest Qualification
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. M.Sc., B.Ed."
                        value={regData.qualification}
                        onChange={(e) => setRegData({ ...regData, qualification: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                        Password (min 8) *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Min 8 characters"
                        value={regData.password}
                        onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1 uppercase tracking-wider">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Re-enter password"
                        value={regData.confirm_password}
                        onChange={(e) => setRegData({ ...regData, confirm_password: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowRegisterModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={regSubmitting}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50"
                    >
                      {regSubmitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <FiCheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Registration Submitted!</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  Your faculty registration has been received with status <strong>Pending</strong>. You will receive an email once the institution administrator reviews and approves your account.
                </p>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                >
                  Return to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
