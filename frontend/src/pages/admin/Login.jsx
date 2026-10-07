import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiUser, FiLock, FiArrowRight, FiShield, FiArrowLeft, FiAlertTriangle, FiEye, FiEyeOff } from 'react-icons/fi';

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const id = identifier.trim();
    const pw = password;

    if (!id && !pw) {
      const msg = 'Please enter administrator username and password';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    if (!id) {
      const msg = 'Please enter administrator username or email';
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
      const res = await login(id, pw, 'admin');
      if (res?.success) {
        toast.success(`Authenticated: Welcome Administrator!`);
        navigate('/admin/dashboard');
      } else {
        const msg = res?.message || 'Invalid username or password';
        setErrorMsg(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid username or password';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">

        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-purple-900/50">
            A
          </div>
          <div>
            <span className="font-extrabold text-white text-2xl tracking-tight">
              STEM<span className="text-purple-400">Learn</span>
            </span>
            <span className="text-[10px] text-purple-300 block font-bold uppercase tracking-wider">
              System Administration
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-800/50 py-1.5 px-3 rounded-full mx-auto w-fit">
          <FiShield className="w-3.5 h-3.5" />
          <span>Restricted Superuser Portal</span>
        </div>

        <h2 className="mt-4 text-center text-2xl font-black text-white tracking-tight">
          Superuser Authorization
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Enter administrative username and password to access platform governance, faculty approvals, and system telemetry.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/90 py-8 px-6 shadow-2xl rounded-3xl border border-slate-800 sm:px-10 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div className="w-full bg-rose-950/50 border border-rose-800/60 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 text-left animate-fade-in">
                <FiAlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Administrator Username or Email
              </label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  required
                  placeholder="e.g. admin or admin@stemlearn.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-hidden focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-10 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-hidden focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-900/50 hover:shadow-purple-900/70 disabled:opacity-50 transition-all cursor-pointer mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate Session</span>
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-500/40 py-2.5 px-5 rounded-xl transition-all duration-200 shadow-sm"
          >
            <FiArrowLeft className="w-4 h-4 text-purple-400" />
            <span>Back to Public Website</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
