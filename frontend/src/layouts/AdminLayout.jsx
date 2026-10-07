import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import {
  FiHome,
  FiUsers,
  FiUserCheck,
  FiLayers,
  FiGrid,
  FiFolder,
  FiFileText,
  FiShield,
  FiSettings,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiLayout
} from 'react-icons/fi';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { to: '/admin/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/admin/teachers', icon: FiUserCheck, label: 'Teacher Management' },
    { to: '/admin/students', icon: FiUsers, label: 'Student Management' },
    { to: '/admin/classes', icon: FiLayers, label: 'Class Management' },
    { to: '/admin/subjects', icon: FiGrid, label: 'Subject Management' },
    { to: '/admin/categories', icon: FiFolder, label: 'Category Management' },
    { to: '/admin/chapters', icon: FiFileText, label: 'Chapter Management' },
    { to: '/admin/other-pages', icon: FiLayout, label: 'Other Pages' },
    { to: '/admin/login-logs', icon: FiShield, label: 'Security & Login Logs' },
    { to: '/admin/settings', icon: FiSettings, label: 'System Settings' },
    { to: '/admin/profile', icon: FiUser, label: 'Admin Profile' },
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
        className={`fixed lg:sticky top-0 z-50 h-screen w-64 bg-slate-950 text-slate-300 flex flex-col justify-between transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col min-h-0 flex-1">
          {/* Logo & Brand */}
          <div className="h-[72px] px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                A
              </div>
              <div>
                <span className="font-extrabold text-white text-base tracking-tight">
                  STEM<span className="text-purple-400">Learn</span>
                </span>
                <span className="text-[10px] text-purple-300 block font-semibold">Administration</span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Badge */}
          <div className="p-3.5 mx-3 my-3 rounded-2xl bg-purple-950/40 border border-purple-800/40 space-y-1.5 shrink-0">
            <div className="flex items-center gap-3">
              <Avatar
                src={user?.profile_photo?.thumbnail_url || user?.photo}
                name={user?.full_name || 'System Admin'}
                size="md"
                role="admin"
              />
              <div className="overflow-hidden">
                <div className="text-sm font-bold text-white truncate">
                  {user?.full_name || 'System Admin'}
                </div>
                <div className="text-[11px] text-purple-300 font-medium">
                  @{user?.username || 'admin'}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-3 py-2 space-y-1 overflow-y-auto flex-1">
            <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
              System Governance
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
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
        <div className="p-4 border-t border-slate-900 space-y-2 shrink-0">
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
            <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
              System Administration
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-purple-200">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              Admin Active
            </div>
            <Link
              to="/admin/profile"
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors"
              title="Go to Admin Profile"
            >
              <Avatar
                src={user?.profile_photo?.thumbnail_url || user?.photo}
                name={user?.full_name || 'Admin'}
                size="sm"
                role="admin"
              />
            </Link>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
