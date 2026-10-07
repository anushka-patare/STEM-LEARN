import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  FiArrowLeft,
  FiMail,
  FiLock,
  FiUser,
  FiHash,
  FiPhone,
  FiCompass,
  FiCpu,
  FiTool,
  FiPercent,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
  FiHelpCircle
} from 'react-icons/fi';

import ForgotPasswordModal from '../../components/ForgotPasswordModal';
import studentLoginImg from '../../assets/images/student_login.png';
import studentRegisterImg from '../../assets/images/student_register.png';

export default function StudentAuth({ initialMode = 'login' }) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'register');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Sync state if route changes
  useEffect(() => {
    setIsSignUp(location.pathname.includes('register'));
  }, [location.pathname]);

  // Sign In Form State
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState('');

  // Sign Up Form State
  const [signUpData, setSignUpData] = useState({
    full_name: '',
    username: '',
    grade: '7',
    division: 'A',
    roll_no: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);

  // Password matching helpers
  const hasTypedConfirm = signUpData.confirmPassword.length > 0;
  const passwordsMatch =
    signUpData.password.length > 0 &&
    signUpData.confirmPassword.length > 0 &&
    signUpData.password === signUpData.confirmPassword;
  const passwordsMismatch =
    hasTypedConfirm && signUpData.password !== signUpData.confirmPassword;

  const toggleMode = (targetSignUp) => {
    setIsSignUp(targetSignUp);
    if (targetSignUp) {
      navigate('/student/register', { replace: true });
    } else {
      navigate('/student/login', { replace: true });
    }
  };

  // Handle Password Sign In Submit
  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInError('');

    const id = signInIdentifier.trim();
    const pw = signInPassword;

    if (!id && !pw) {
      const msg = 'Please enter your username and password';
      setSignInError(msg);
      toast.error(msg);
      return;
    }
    if (!id) {
      const msg = 'Please enter your username or email';
      setSignInError(msg);
      toast.error(msg);
      return;
    }
    if (!pw) {
      const msg = 'Please enter your password';
      setSignInError(msg);
      toast.error(msg);
      return;
    }

    setSignInLoading(true);
    try {
      const res = await login('student', {
        username: id,
        password: pw
      });
      const user = res?.user || res;
      toast.success(`Welcome back, ${user?.full_name || 'Student'}!`);
      navigate('/student/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid username or password';
      setSignInError(msg);
      toast.error(msg);
    } finally {
      setSignInLoading(false);
    }
  };

  // Handle Sign Up Submit
  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!signUpData.full_name.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!signUpData.username.trim() || signUpData.username.length < 3) {
      toast.error('Username must be at least 3 characters long');
      return;
    }
    if (!signUpData.email.trim()) {
      toast.error('Please enter your email (for password recovery)');
      return;
    }

    if (!signUpData.password || !signUpData.confirmPassword) {
      toast.error('Please enter and confirm your password');
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (signUpData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setSignUpLoading(true);
    try {
      const res = await register({
        full_name: signUpData.full_name.trim(),
        username: signUpData.username.trim().toLowerCase(),
        grade: String(signUpData.grade),
        division: signUpData.division,
        email: signUpData.email.trim().toLowerCase(),
        password: signUpData.password,
        mobile: signUpData.mobile ? signUpData.mobile.trim() : '',
        roll_number: signUpData.roll_no ? signUpData.roll_no.trim() : '',
        role: 'student',
      });
      const user = res?.user || res;
      toast.success(`Welcome to STEMLearn, ${user?.full_name || 'Student'}!`);
      navigate('/student/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed. Please check your details.');
    } finally {
      setSignUpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/50 to-indigo-100/40 flex flex-col justify-center items-center p-3 sm:p-6 lg:p-8 relative selection:bg-blue-600 selection:text-white">
      {/* Decorative Glow Orbs */}
      <div className="absolute top-12 left-12 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 right-12 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header / Back Button & Mobile Switcher */}
      <div className="w-full max-w-[1080px] flex items-center justify-between mb-4 z-10 px-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 bg-white/90 hover:bg-white px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-xs transition-all hover:shadow-sm"
        >
          <FiArrowLeft className="w-4 h-4 text-blue-600" />
          <span>Back to Home</span>
        </Link>

        {/* Mobile Segmented Toggle (Only on screens < md) */}
        <div className="flex md:hidden bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => toggleMode(false)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !isSignUp
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => toggleMode(true)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isSignUp
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* ─── Main Double Slider Container ─── */}
      <div
        className={`auth-slider-container ${
          isSignUp ? 'right-panel-active' : ''
        }`}
      >
        {/* ─── 1. SIGN IN FORM CONTAINER ─── */}
        <div
          className={`form-container sign-in-container ${
            isSignUp ? 'hidden md:flex' : 'flex'
          } w-full md:w-1/2 h-full flex-col justify-center items-center px-6 py-8 sm:px-12 sm:py-12 lg:px-14`}
        >
          {/* Mobile Student Avatar Header */}
          <div className="md:hidden flex flex-col items-center mb-2">
            <img
              src={studentLoginImg}
              alt="Student"
              className="h-28 w-auto object-contain drop-shadow-xl"
            />
          </div>

          <form
            onSubmit={handleSignIn}
            className="w-full max-w-md flex flex-col items-center text-center space-y-4"
          >
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Student Sign In
            </h1>

            {/* Middle-school STEM Badge Icons */}
            <div className="flex items-center gap-3 my-1">
              <span className="w-10 h-10 rounded-full border border-blue-100 bg-blue-50/80 flex items-center justify-center text-blue-600 shadow-xs hover:scale-110 transition-transform" title="Science">
                <FiCompass className="w-4 h-4" />
              </span>
              <span className="w-10 h-10 rounded-full border border-purple-100 bg-purple-50/80 flex items-center justify-center text-purple-600 shadow-xs hover:scale-110 transition-transform" title="Technology">
                <FiCpu className="w-4 h-4" />
              </span>
              <span className="w-10 h-10 rounded-full border border-amber-100 bg-amber-50/80 flex items-center justify-center text-amber-600 shadow-xs hover:scale-110 transition-transform" title="Engineering">
                <FiTool className="w-4 h-4" />
              </span>
              <span className="w-10 h-10 rounded-full border border-emerald-100 bg-emerald-50/80 flex items-center justify-center text-emerald-600 shadow-xs hover:scale-110 transition-transform" title="Mathematics">
                <FiPercent className="w-4 h-4" />
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Enter your student username or roll number and password
            </p>

            {signInError && (
              <div className="w-full bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 text-left animate-fade-in">
                <FiAlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{signInError}</span>
              </div>
            )}

            <div className="w-full space-y-3.5 pt-1 text-left">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Username / Roll No / Email
                </label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. student1 or student1@stemlearn.com"
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/90 hover:bg-slate-100/90 focus:bg-white rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600/30 border border-slate-200/90 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type={showSignInPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-slate-50/90 hover:bg-slate-100/90 focus:bg-white rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600/30 border border-slate-200/90 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showSignInPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4 text-blue-600" />}
                  </button>
                </div>
              </div>



              <button
                type="submit"
                disabled={signInLoading}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold uppercase py-3 rounded-xl shadow-lg shadow-blue-500/25 text-xs tracking-wider cursor-pointer disabled:opacity-50 transition-all"
              >
                {signInLoading ? 'AUTHENTICATING...' : 'SIGN IN TO PORTAL'}
              </button>
            </div>
          </form>
        </div>

        {/* ─── 2. SIGN UP FORM CONTAINER ─── */}
        <div
          className={`form-container sign-up-container ${
            !isSignUp ? 'hidden md:flex' : 'flex'
          } w-full md:w-1/2 h-full flex-col justify-center items-center px-6 py-6 sm:px-10 sm:py-8 overflow-y-auto`}
        >
          <form
            onSubmit={handleSignUp}
            className="w-full max-w-md flex flex-col items-center text-center space-y-3"
          >
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Create Student Account
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Join Grades 6–9 STEM Learning & Gamified Quizzes
            </p>

            <div className="w-full space-y-2.5 text-left text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={signUpData.full_name}
                    onChange={(e) => setSignUpData({ ...signUpData, full_name: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. aarav6"
                    value={signUpData.username}
                    onChange={(e) => setSignUpData({ ...signUpData, username: e.target.value.toLowerCase() })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Email (for reset) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="aarav@school.edu"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Grade (6–9) *
                  </label>
                  <select
                    value={signUpData.grade}
                    onChange={(e) => setSignUpData({ ...signUpData, grade: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="6">Grade 6</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Division *
                  </label>
                  <select
                    value={signUpData.division}
                    onChange={(e) => setSignUpData({ ...signUpData, division: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="A">Div A</option>
                    <option value="B">Div B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Roll No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 15"
                    value={signUpData.roll_no}
                    onChange={(e) => setSignUpData({ ...signUpData, roll_no: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Password (min 8) *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 characters"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={signUpData.confirmPassword}
                    onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                    className={`w-full px-3 py-2 bg-slate-50 rounded-xl border text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                      passwordsMismatch ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={signUpLoading}
                className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold uppercase py-2.5 rounded-xl shadow-md text-xs tracking-wider cursor-pointer disabled:opacity-50 transition-all"
              >
                {signUpLoading ? 'REGISTERING...' : 'CREATE ACCOUNT'}
              </button>
            </div>
          </form>
        </div>

        {/* ─── 3. OVERLAY CONTAINER (DESKTOP SLIDER) ─── */}
        <div className="overlay-container hidden md:block">
          <div className="overlay">
            {/* Left Overlay Panel */}
            <div className="overlay-panel overlay-left">
              <h1 className="text-3xl font-black text-white">Welcome Back!</h1>
              <p className="text-xs text-blue-100 max-w-xs mt-2 mb-6">
                Already registered? Sign in with your student username or roll number to continue your STEM learning path.
              </p>
              <button
                type="button"
                onClick={() => toggleMode(false)}
                className="py-2.5 px-8 rounded-xl border-2 border-white text-white font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-blue-700 transition-all shadow-md cursor-pointer"
              >
                Sign In
              </button>
            </div>

            {/* Right Overlay Panel */}
            <div className="overlay-panel overlay-right">
              <h1 className="text-3xl font-black text-white">Join STEMLearn!</h1>
              <p className="text-xs text-blue-100 max-w-xs mt-2 mb-6">
                Discover interactive science quizzes, programming pathways, and collaborative team missions.
              </p>
              <button
                type="button"
                onClick={() => toggleMode(true)}
                className="py-2.5 px-8 rounded-xl border-2 border-white text-white font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-blue-700 transition-all shadow-md cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </div>
  );
}
