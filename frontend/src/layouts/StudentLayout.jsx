import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import {
  FiHome,
  FiBook,
  FiFileText,
  FiBarChart2,
  FiAward,
  FiUsers,
  FiTrendingUp,
  FiCpu,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiZap,
  FiChevronDown,
  FiChevronUp,
  FiList,
  FiKey,
  FiShield,
  FiVideo
} from 'react-icons/fi';

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isTeamRoute = location.pathname.startsWith('/student/team');
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(true);

  useEffect(() => {
    if (isTeamRoute) {
      setTeamDropdownOpen(true);
    }
  }, [isTeamRoute]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { to: '/student/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/student/learning', icon: FiBook, label: 'Learning Paths' },
    { to: '/student/quizzes', icon: FiFileText, label: 'My Quizzes' },
    { to: '/student/results', icon: FiBarChart2, label: 'My Results' },
    { to: '/student/leaderboard', icon: FiAward, label: 'Leaderboard' },
    // ─── My Squad Team Dropdown Menu in Side Navbar ───
    {
      isDropdown: true,
      key: 'squad-teams-dropdown',
      icon: FiUsers,
      label: 'My Squad Team',
      children: [
        {
          to: '/student/team?view=all_squads',
          icon: FiList,
          label: 'All Squad Teams',
          viewKey: 'all_squads'
        },
        {
          to: '/student/team?view=join_team',
          icon: FiKey,
          label: 'Join Team',
          viewKey: 'join_team'
        },
        {
          to: '/student/team?view=my_squad',
          icon: FiShield,
          label: 'My Squad Team',
          viewKey: 'my_squad'
        }
      ]
    },
    { to: '/student/progress', icon: FiTrendingUp, label: 'My Progress' },
    { to: '/student/videos', icon: FiVideo, label: 'Video Lessons' },
    { to: '/student/ai-assistant', icon: FiCpu, label: 'AI Study Assistant' },
    { to: '/student/profile', icon: FiUser, label: 'Profile' },
  ];

  const currentView = new URLSearchParams(location.search).get('view') || 'my_squad';

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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                S
              </div>
              <div>
                <span className="font-extrabold text-white text-base tracking-tight">
                  STEM<span className="text-cyan-400">Learn</span>
                </span>
                <span className="text-[10px] text-cyan-300 block font-semibold">Student Portal</span>
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

          {/* Student Mini Profile Info */}
          <div className="p-3.5 mx-3 my-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center gap-3">
              <Avatar
                src={user?.profile_photo?.thumbnail_url || user?.photo}
                name={user?.full_name || 'Student Explorer'}
                size="md"
                role="student"
              />
              <div className="overflow-hidden">
                <div className="text-sm font-bold text-white truncate">
                  {user?.full_name || 'Student Explorer'}
                </div>
                <div className="text-[11px] text-cyan-300 font-medium">
                  Grade {user?.grade || '7'}-{user?.division || 'A'}
                </div>
              </div>
            </div>
          </div>

          {/* Nav Items List */}
          <nav className="px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)]">
            {navItems.map((item) => {
              if (item.isDropdown) {
                return (
                  <div key={item.key} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        isTeamRoute
                          ? 'bg-purple-950/60 text-purple-300 border border-purple-800/40'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 shrink-0 text-purple-400" />
                        <span>{item.label}</span>
                      </div>
                      <div className="text-slate-400">
                        {teamDropdownOpen ? (
                          <FiChevronUp className="w-4 h-4" />
                        ) : (
                          <FiChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {/* Submenu Dropdown in Side Navbar */}
                    {teamDropdownOpen && (
                      <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-purple-800/60 ml-4 animate-fade-in">
                        {item.children.map((child) => {
                          const SubIcon = child.icon;
                          const isChildActive = isTeamRoute && currentView === child.viewKey;

                          return (
                            <Link
                              key={child.to}
                              to={child.to}
                              onClick={() => setMobileSidebarOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                isChildActive
                                  ? 'bg-purple-600 text-white font-bold shadow-xs'
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
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-600/30 border border-rose-500/20 transition cursor-pointer"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content Container ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-[72px] bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Student Learning Command Center
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak & Points Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
              <FiZap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>5 Quiz Streak</span>
            </div>

            <Link
              to="/student/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 transition"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                {user?.full_name?.charAt(0) || 'S'}
              </div>
              <span className="text-xs font-bold text-slate-700 hidden md:inline">
                {user?.full_name?.split(' ')[0] || 'Profile'}
              </span>
            </Link>
          </div>
        </header>

        {/* Main Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
