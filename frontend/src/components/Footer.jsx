import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiLock,
  FiMail,
  FiPhone,
  FiMapPin,
  FiBook,
  FiAward,
  FiShield,
  FiCpu,
  FiCheckCircle
} from 'react-icons/fi';
import { pageService } from '../services/api';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [content, setContent] = useState({
    brand_title: 'STEMLearn',
    brand_subtitle: 'Grades 6 – 8 Educational Research',
    brand_desc: 'An evidence-based middle school STEM platform designed to evaluate learning efficacy across competitive individual leaderboards and collaborative squad-based learning dynamics.',
    badge_curriculum: 'Curriculum Aligned',
    badge_anticheat: 'Anti-Cheat Secured',
    badge_ai: 'AI Augmented',
    dept_name: 'Department of Computer Science & Engineering',
    email: 'research@stemlearn.edu',
    phone: '+91 98765 43210',
    copyright: 'STEMLearn Research Project. Middle School STEM Learning Assessment.',
    study_note: 'Grades 6–8 Controlled Study',
  });

  useEffect(() => {
    const loadFooter = async () => {
      try {
        const res = await pageService.getPageContent('footer');
        if (res.data?.success && res.data.data) {
          setContent((prev) => ({ ...prev, ...res.data.data }));
        }
      } catch (e) {
        // Fallback to default
      }
    };
    loadFooter();
  }, []);

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="stem-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          {/* ─── Column 1: Brand & Research Summary ─── */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                S
              </div>
              <div>
                <span className="font-extrabold text-white text-xl tracking-tight">
                  {content.brand_title?.slice(0, 4) || 'STEM'}
                  <span className="text-blue-400">
                    {content.brand_title?.slice(4) || 'Learn'}
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                  {content.brand_subtitle}
                </span>
              </div>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed pr-4">
              {content.brand_desc}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60">
                <FiCheckCircle className="w-3.5 h-3.5 text-blue-400" />
                {content.badge_curriculum}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                <FiShield className="w-3.5 h-3.5 text-emerald-400" />
                {content.badge_anticheat}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/60">
                <FiCpu className="w-3.5 h-3.5 text-purple-400" />
                {content.badge_ai}
              </span>
            </div>
          </div>

          {/* ─── Column 2: Navigation ─── */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors">
                  About the Study
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-slate-400 hover:text-white transition-colors">
                  Hall of Fame & Top 10
                </Link>
              </li>
              <li>
                <Link to="/research" className="text-slate-400 hover:text-white transition-colors">
                  Research & Methodology
                </Link>
              </li>
            </ul>
          </div>

          {/* ─── Column 3: Portals & Access ─── */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Access Portals
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/student/login" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-2">
                  <FiAward className="w-3.5 h-3.5 text-blue-400" />
                  <span>Student Sign In</span>
                </Link>
              </li>
              <li>
                <Link to="/student/register" className="text-slate-400 hover:text-blue-400 transition-colors">
                  Student Registration
                </Link>
              </li>
              <li>
                <Link to="/teacher/login" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-2">
                  <FiBook className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Teacher Faculty Portal</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* ─── Column 4: Contact & Integrity ─── */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Research Contact
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <FiMapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>{content.dept_name}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <FiMail className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{content.email}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <FiPhone className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{content.phone}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── Bottom Sub-footer ─── */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {currentYear} {content.copyright}
          </div>

          <div className="flex items-center gap-6">
            <span>{content.study_note}</span>
            <span className="text-slate-700">•</span>
            <Link
              to="/admin/login"
              className="text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1 group"
              title="System Administration"
            >
              <FiLock className="w-3 h-3 group-hover:text-purple-400 transition-colors" />
              <span className="text-[11px]">Admin Access</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
