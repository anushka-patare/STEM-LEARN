import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiHelpCircle,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiLayers,
  FiCompass,
  FiChevronDown,
  FiChevronUp,
  FiPlusCircle,
  FiList,
  FiTrendingUp
} from 'react-icons/fi';

export default function TeacherLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Check if current route is part of quiz or question management
  const isQuizRoute =
    location.pathname.startsWith('/teacher/quizzes') ||
    location.pathname.startsWith('/teacher/questions');

  const [quizzesDropdownOpen, setQuizzesDropdownOpen] = useState(isQuizRoute);

  useEffect(() => {
    if (isQuizRoute) {
      setQuizzesDropdownOpen(true);
    }
  }, [isQuizRoute]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { to: '/teacher/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/teacher/classes', icon: FiLayers, label: 'My Classes' },
    { to: '/teacher/students', icon: FiUsers, label: 'Students' },
    { to: '/teacher/learning-paths', icon: FiCompass, label: 'Learning Paths' },
    // Quizzes dropdown item
    {
      isDropdown: true,
      key: 'quizzes-section',
      icon: FiFileText,
      label: 'Quizzes & Tests',
      children: [
        {
          to: '/teacher/quizzes',
          icon: FiList,
          label: 'All Quizzes',
          exact: true
        },
        {
          to: '/teacher/quizzes/create',
          icon: FiPlusCircle,
          label: 'Add Manual Quiz'
        },
        {
          to: '/teacher/questions',
          icon: FiHelpCircle,
          label: 'Question Bank'
        }
      ]
    },
    { to: '/teacher/performance', icon: FiTrendingUp, label: 'Student Performance' },
    { to: '/teacher/teams', icon: FiUsers, label: 'Student Teams' },
    { to: '/teacher/profile', icon: FiUser, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ─── Mobile Sidebar Overlay ─── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`fixed lg:sticky top-0 z-50 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Logo & Brand */}
          <div className="h-[72px] px-6 flex items-center justify-between border-b border-slate-800">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                T
              </div>
              <div>
                <span className="font-extrabold text-white text-base tracking-tight">
                  STEM<span className="text-emerald-400">Learn</span>
                </span>
                <span className="text-[10px] text-emerald-300 block font-semibold">Teacher Portal</span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Teacher Mini Profile */}
          <div className="p-3.5 mx-3 my-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center gap-3">
              <Avatar
                src={user?.profile_photo?.thumbnail_url || user?.photo}
                name={user?.full_name || 'Faculty Member'}
                size="md"
                role="teacher"
              />
              <div className="overflow-hidden">
                <div className="text-sm font-bold text-white truncate">
                  {user?.full_name || 'Faculty Member'}
                </div>
                <div className="text-[11px] text-emerald-300 font-medium">
                  {user?.subject_specialization || 'STEM Instructor'}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-3 py-2 space-y-1 max-h-[calc(100vh-230px)] overflow-y-auto">
            {navItems.map((item) => {
              if (item.isDropdown) {
                return (
                  <div key={item.key} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setQuizzesDropdownOpen(!quizzesDropdownOpen)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isQuizRoute
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <div className="text-slate-400">
                        {quizzesDropdownOpen ? (
                          <FiChevronUp className="w-4 h-4" />
                        ) : (
                          <FiChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {/* Submenu Dropdown */}
                    {quizzesDropdownOpen && (
                      <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-800 ml-4">
                        {item.children.map((child) => {
                          const SubIcon = child.icon;
                          const isChildActive = child.to.includes('?')
                            ? location.pathname + location.search === child.to
                            : location.pathname === child.to && !location.search.includes('action=create');

                          return (
                            <Link
                              key={child.to}
                              to={child.to}
                              onClick={() => setMobileSidebarOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                isChildActive
                                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                              }`}
                            >
                              <SubIcon className="w-3.5 h-3.5 shrink-0" />
                              <span>{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-[72px] bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Portal</span>
              <div className="text-sm font-extrabold text-slate-800">Middle-School STEM Management</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/teacher/profile"
              className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-100 transition-colors"
            >
              <Avatar
                src={user?.profile_photo?.thumbnail_url || user?.photo}
                name={user?.full_name || 'Faculty Member'}
                size="sm"
                role="teacher"
              />
              <span className="text-xs font-bold text-slate-700 hidden sm:inline">
                {user?.full_name || 'Faculty Member'}
              </span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
