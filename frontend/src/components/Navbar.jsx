import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiMenu,
  FiX,
  FiChevronDown,
  FiUser,
  FiAward,
  FiArrowRight,
  FiBookOpen,
  FiCpu
} from 'react-icons/fi';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const { user, isStudent, isTeacher, isAdmin } = useAuth();

  const getDashboardLink = () => {
    if (isStudent) return '/student/dashboard';
    if (isTeacher) return '/teacher/dashboard';
    if (isAdmin) return '/admin/dashboard';
    return '/student/login';
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About Us' },
    { to: '/leaderboard', label: 'Leaderboard & Top 10' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="stem-container">
        <div className="flex items-center justify-between h-20">
          {/* ─── Brand Logo ─── */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 text-xl tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                STEM<span className="text-blue-600">Learn</span>
              </span>
              <span className="text-[10px] text-slate-700 font-semibold tracking-wider uppercase mt-1">
                Middle School STEM Platform
              </span>
            </div>
          </Link>

          {/* ─── Desktop Navigation Links ─── */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'text-blue-600 bg-blue-50/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* ─── Desktop Right Actions ─── */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <Link
                to={getDashboardLink()}
                className="stem-btn stem-btn-primary py-2.5 px-5 text-sm flex items-center gap-2"
              >
                <FiUser className="w-4 h-4" />
                <span>My Dashboard ({user.full_name?.split(' ')[0] || 'User'})</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                {/* Login Dropdown (Student & Teacher only. Admin is strictly hidden) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 text-sm font-semibold transition-all shadow-xs"
                  >
                    <span>Sign In</span>
                    <FiChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        loginDropdownOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'
                      }`}
                    />
                  </button>

                  {loginDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setLoginDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                        <Link
                          to="/student/login"
                          onClick={() => setLoginDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <FiAward className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">Student Login</div>
                            <div className="text-xs text-slate-700">Quizzes & Leaderboard</div>
                          </div>
                        </Link>
                        <Link
                          to="/teacher/login"
                          onClick={() => setLoginDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 font-medium transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                            <FiBookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">Teacher Login</div>
                            <div className="text-xs text-slate-700">Classes & Research</div>
                          </div>
                        </Link>
                      </div>
                    </>
                  )}
                </div>

                <Link
                  to="/student/register"
                  className="stem-btn stem-btn-primary py-2.5 px-5 text-sm flex items-center gap-2 shadow-md shadow-blue-500/20"
                >
                  <span>Student Sign Up</span>
                  <FiArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* ─── Mobile Menu Toggle ─── */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Mobile Dropdown Menu ─── */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 pt-3 pb-6 space-y-3 animate-in fade-in duration-200">
          <nav className="space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'text-blue-600 bg-blue-50 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            {user ? (
              <Link
                to={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full stem-btn stem-btn-primary py-3 text-center justify-center flex items-center gap-2"
              >
                <FiUser className="w-4 h-4" />
                <span>My Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/student/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50"
                >
                  <FiAward className="w-4 h-4 text-blue-600" />
                  <span>Student Sign In</span>
                </Link>
                <Link
                  to="/teacher/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50"
                >
                  <FiBookOpen className="w-4 h-4 text-purple-600" />
                  <span>Teacher Faculty Sign In</span>
                </Link>
                <Link
                  to="/student/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full stem-btn stem-btn-primary py-3 text-center justify-center flex items-center gap-2"
                >
                  <span>Student Register</span>
                  <FiArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
