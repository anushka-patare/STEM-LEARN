import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiLayout,
  FiHome,
  FiInfo,
  FiBookOpen,
  FiMail,
  FiLayers,
  FiSave,
  FiRefreshCw,
  FiExternalLink,
  FiCheckCircle,
  FiEdit3,
  FiGlobe,
  FiAward,
  FiZap,
  FiUserPlus
} from 'react-icons/fi';
import { pageService, leaderboardService } from '../../services/api';

export default function AdminOtherPages() {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Quick points adjustment tool
  const [adjustStudentId, setAdjustStudentId] = useState('');
  const [adjustPointsVal, setAdjustPointsVal] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const [pagesData, setPagesData] = useState({
    home: {},
    about: {},
    leaderboard: {},
    contact: {},
    footer: {},
  });

  const fetchAllPages = async () => {
    try {
      setLoading(true);
      const res = await pageService.getAllPages();
      if (res.data?.success && res.data.data) {
        setPagesData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load page contents.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPages();
  }, []);

  const handleFieldChange = (pageKey, field, value) => {
    setPagesData((prev) => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        [field]: value,
      },
    }));
  };

  const handleSavePage = async (pageKey) => {
    try {
      setSaving(true);
      const dataToSave = pagesData[pageKey] || {};
      const res = await pageService.updatePageContent(pageKey, dataToSave);
      toast.success(res.data?.message || `${pageKey.toUpperCase()} content saved successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update page content');
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustStudentPoints = async (e) => {
    e.preventDefault();
    if (!adjustStudentId || !adjustPointsVal) {
      toast.error('Please enter student ID/username and points');
      return;
    }
    try {
      setAdjusting(true);
      const res = await leaderboardService.adjustPoints(adjustStudentId, adjustPointsVal);
      toast.success(res.data?.message || 'Points updated successfully!');
      setAdjustStudentId('');
      setAdjustPointsVal('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to adjust points');
    } finally {
      setAdjusting(false);
    }
  };

  const tabs = [
    { id: 'home', label: 'Home Page', icon: FiHome, path: '/' },
    { id: 'about', label: 'About Page', icon: FiInfo, path: '/about' },
    { id: 'leaderboard', label: 'Leaderboard & Top 10', icon: FiAward, path: '/leaderboard' },
    { id: 'footer', label: 'Footer Section', icon: FiLayers, path: '/' },
  ];

  const currentContent = pagesData[activeTab] || {};

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FiLayout className="text-purple-600" />
            Page Content Management (Other Pages)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Edit text, headings, statistics, contact details, and footer attributes across all public platform pages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAllPages}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Reload content"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200/80">
          <FiRefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
          <p className="text-sm font-medium">Loading page configurations...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Action Toolbar for Current Tab */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-800">
                Editing: <span className="text-purple-600 uppercase">{activeTab}</span> Page
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <a
                href={tabs.find((t) => t.id === activeTab)?.path || '/'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors border border-slate-200"
              >
                <span>Live Preview</span>
                <FiExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => handleSavePage(activeTab)}
                disabled={saving}
                className="stem-btn bg-purple-600 hover:bg-purple-700 text-white py-2 px-5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <FiSave className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save & Publish Page'}</span>
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 1: HOME PAGE EDITOR                                  */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'home' && (
            <div className="space-y-6 animate-fade-in">
              {/* Hero Section */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FiGlobe className="w-4 h-4 text-purple-600" />
                  <span>Hero Banner Section</span>
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Hero Badge Text
                    </label>
                    <input
                      type="text"
                      value={currentContent.hero_badge || ''}
                      onChange={(e) => handleFieldChange('home', 'hero_badge', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="e.g. Middle School STEM Research Study • Grades 6, 7 & 8"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Title Prefix
                      </label>
                      <input
                        type="text"
                        value={currentContent.hero_title_prefix || ''}
                        onChange={(e) => handleFieldChange('home', 'hero_title_prefix', e.target.value)}
                        className="stem-input text-xs sm:text-sm"
                        placeholder="Competitive vs."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Title Highlight Word
                      </label>
                      <input
                        type="text"
                        value={currentContent.hero_title_highlight || ''}
                        onChange={(e) => handleFieldChange('home', 'hero_title_highlight', e.target.value)}
                        className="stem-input text-xs sm:text-sm"
                        placeholder="Collaborative"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Title Suffix
                      </label>
                      <input
                        type="text"
                        value={currentContent.hero_title_suffix || ''}
                        onChange={(e) => handleFieldChange('home', 'hero_title_suffix', e.target.value)}
                        className="stem-input text-xs sm:text-sm"
                        placeholder="STEM Learning"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Hero Subtitle Description
                    </label>
                    <textarea
                      rows={3}
                      value={currentContent.hero_subtitle || ''}
                      onChange={(e) => handleFieldChange('home', 'hero_subtitle', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Evaluating how individual rank-based motivation compares..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Primary CTA Button Text
                      </label>
                      <input
                        type="text"
                        value={currentContent.hero_btn_primary || ''}
                        onChange={(e) => handleFieldChange('home', 'hero_btn_primary', e.target.value)}
                        className="stem-input text-xs sm:text-sm"
                        placeholder="Start Student Journey"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Secondary CTA Button Text
                      </label>
                      <input
                        type="text"
                        value={currentContent.hero_btn_secondary || ''}
                        onChange={(e) => handleFieldChange('home', 'hero_btn_secondary', e.target.value)}
                        className="stem-input text-xs sm:text-sm"
                        placeholder="Explore Curriculum"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Key Statistics & Research Benchmarks</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Stat 1 */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">Stat Card 1</span>
                    <input
                      type="text"
                      value={currentContent.stats_cohorts_value || ''}
                      onChange={(e) => handleFieldChange('home', 'stats_cohorts_value', e.target.value)}
                      placeholder="Grades 6–8"
                      className="stem-input text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={currentContent.stats_cohorts_label || ''}
                      onChange={(e) => handleFieldChange('home', 'stats_cohorts_label', e.target.value)}
                      placeholder="Target Cohorts"
                      className="stem-input text-xs"
                    />
                    <textarea
                      rows={2}
                      value={currentContent.stats_cohorts_desc || ''}
                      onChange={(e) => handleFieldChange('home', 'stats_cohorts_desc', e.target.value)}
                      placeholder="Description"
                      className="stem-input text-xs"
                    />
                  </div>

                  {/* Stat 2 */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Stat Card 2</span>
                    <input
                      type="text"
                      value={currentContent.stats_pillars_value || ''}
                      onChange={(e) => handleFieldChange('home', 'stats_pillars_value', e.target.value)}
                      placeholder="4 Core Pillars"
                      className="stem-input text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={currentContent.stats_pillars_label || ''}
                      onChange={(e) => handleFieldChange('home', 'stats_pillars_label', e.target.value)}
                      placeholder="STEM Disciplines"
                      className="stem-input text-xs"
                    />
                    <textarea
                      rows={2}
                      value={currentContent.stats_pillars_desc || ''}
                      onChange={(e) => handleFieldChange('home', 'stats_pillars_desc', e.target.value)}
                      placeholder="Description"
                      className="stem-input text-xs"
                    />
                  </div>

                  {/* Stat 3 */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Stat Card 3</span>
                    <input
                      type="text"
                      value={currentContent.stats_modes_value || ''}
                      onChange={(e) => handleFieldChange('home', 'stats_modes_value', e.target.value)}
                      placeholder="Dual Modes"
                      className="stem-input text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={currentContent.stats_modes_label || ''}
                      onChange={(e) => handleFieldChange('home', 'stats_modes_label', e.target.value)}
                      placeholder="Research Conditions"
                      className="stem-input text-xs"
                    />
                    <textarea
                      rows={2}
                      value={currentContent.stats_modes_desc || ''}
                      onChange={(e) => handleFieldChange('home', 'stats_modes_desc', e.target.value)}
                      placeholder="Description"
                      className="stem-input text-xs"
                    />
                  </div>

                  {/* Stat 4 */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Stat Card 4</span>
                    <input
                      type="text"
                      value={currentContent.stats_rigor_value || ''}
                      onChange={(e) => handleFieldChange('home', 'stats_rigor_value', e.target.value)}
                      placeholder="ANOVA Ready"
                      className="stem-input text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={currentContent.stats_rigor_label || ''}
                      onChange={(e) => handleFieldChange('home', 'stats_rigor_label', e.target.value)}
                      placeholder="Evaluation Rigor"
                      className="stem-input text-xs"
                    />
                    <textarea
                      rows={2}
                      value={currentContent.stats_rigor_desc || ''}
                      onChange={(e) => handleFieldChange('home', 'stats_rigor_desc', e.target.value)}
                      placeholder="Description"
                      className="stem-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom CTA Banner */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
                <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
                  Bottom Call-To-Action (CTA) Banner
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CTA Badge</label>
                    <input
                      type="text"
                      value={currentContent.cta_badge || ''}
                      onChange={(e) => handleFieldChange('home', 'cta_badge', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Ready to Discover Your STEM Potential?"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CTA Title</label>
                    <input
                      type="text"
                      value={currentContent.cta_title || ''}
                      onChange={(e) => handleFieldChange('home', 'cta_title', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Start Exploring STEM with Your Classmates Today"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CTA Subtitle</label>
                    <textarea
                      rows={2}
                      value={currentContent.cta_subtitle || ''}
                      onChange={(e) => handleFieldChange('home', 'cta_subtitle', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Solve exciting science and math challenges..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 2: ABOUT PAGE EDITOR                                 */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
                <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
                  About Page Hero & Problem Statement
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={currentContent.badge || ''}
                      onChange={(e) => handleFieldChange('about', 'badge', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="About the Academic Research"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Main Heading</label>
                    <input
                      type="text"
                      value={currentContent.title || ''}
                      onChange={(e) => handleFieldChange('about', 'title', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="STEMLearn Research Initiative"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subtitle</label>
                    <textarea
                      rows={2}
                      value={currentContent.subtitle || ''}
                      onChange={(e) => handleFieldChange('about', 'subtitle', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Evaluating the Effectiveness of Competitive vs. Collaborative Leaderboards..."
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase">Problem Statement Paragraphs</h4>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Section Title</label>
                    <input
                      type="text"
                      value={currentContent.context_title || ''}
                      onChange={(e) => handleFieldChange('about', 'context_title', e.target.value)}
                      className="stem-input text-xs sm:text-sm font-bold"
                      placeholder="Research Context & Problem Statement"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Paragraph 1</label>
                    <textarea
                      rows={3}
                      value={currentContent.context_p1 || ''}
                      onChange={(e) => handleFieldChange('about', 'context_p1', e.target.value)}
                      className="stem-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Paragraph 2</label>
                    <textarea
                      rows={3}
                      value={currentContent.context_p2 || ''}
                      onChange={(e) => handleFieldChange('about', 'context_p2', e.target.value)}
                      className="stem-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Paragraph 3</label>
                    <textarea
                      rows={3}
                      value={currentContent.context_p3 || ''}
                      onChange={(e) => handleFieldChange('about', 'context_p3', e.target.value)}
                      className="stem-input text-xs"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase">Core Research Objectives</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((num) => (
                      <div key={num} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase">
                          Objective {num}
                        </label>
                        <input
                          type="text"
                          value={currentContent[`objective_${num}_title`] || ''}
                          onChange={(e) => handleFieldChange('about', `objective_${num}_title`, e.target.value)}
                          placeholder={`Objective ${num} Title`}
                          className="stem-input text-xs font-bold"
                        />
                        <textarea
                          rows={2}
                          value={currentContent[`objective_${num}_desc`] || ''}
                          onChange={(e) => handleFieldChange('about', `objective_${num}_desc`, e.target.value)}
                          placeholder="Description"
                          className="stem-input text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 3: LEADERBOARD & HALL OF FAME EDITOR                   */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* Card 1: Page Identity & Titles */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <FiAward className="text-amber-500" />
                    Leaderboard & Hall of Fame Page Branding
                  </h3>
                  <a
                    href="/leaderboard"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline"
                  >
                    <span>View Live Leaderboard</span>
                    <FiExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Page Badge Text</label>
                    <input
                      type="text"
                      value={currentContent.badge || ''}
                      onChange={(e) => handleFieldChange('leaderboard', 'badge', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Live Academic Telemetry & Rankings"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Main Heading</label>
                    <input
                      type="text"
                      value={currentContent.title || ''}
                      onChange={(e) => handleFieldChange('leaderboard', 'title', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="STEMLearn Hall of Fame & Leaderboards"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subtitle</label>
                    <textarea
                      rows={2}
                      value={currentContent.subtitle || ''}
                      onChange={(e) => handleFieldChange('leaderboard', 'subtitle', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Celebrating top middle-school students, class toppers, and collaborative STEM squads across Grades 6, 7 & 8."
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Spotlight Banner Settings */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
                <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <FiZap className="text-amber-500" />
                  Spotlight Announcement Banner
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Spotlight Badge</label>
                    <input
                      type="text"
                      value={currentContent.spotlight_badge || ''}
                      onChange={(e) => handleFieldChange('leaderboard', 'spotlight_badge', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="★ Academic Spotlight"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Spotlight Title</label>
                    <input
                      type="text"
                      value={currentContent.spotlight_title || ''}
                      onChange={(e) => handleFieldChange('leaderboard', 'spotlight_title', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Middle School STEM Excellence Showcase"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Spotlight Announcement Text</label>
                    <textarea
                      rows={2}
                      value={currentContent.spotlight_text || ''}
                      onChange={(e) => handleFieldChange('leaderboard', 'spotlight_text', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Rankings update in real-time as students solve calibrated quizzes..."
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Section Titles & Descriptions */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
                <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
                  Leaderboard Section Descriptions
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Top 10 Section Title</label>
                    <input
                      type="text"
                      value={currentContent.top10_title || ''}
                      onChange={(e) => handleFieldChange('leaderboard', 'top10_title', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Global Top 10 Scholars"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Top 10 Description</label>
                    <input
                      type="text"
                      value={currentContent.top10_desc || ''}
                      onChange={(e) => handleFieldChange('leaderboard', 'top10_desc', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="The highest-performing students across all participating middle school divisions."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Class-wise Section Title</label>
                    <input
                      type="text"
                      value={currentContent.classwise_title || ''}
                      onChange={(e) => handleFieldChange('leaderboard', 'classwise_title', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Class & Division Toppers"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Class-wise Description</label>
                    <input
                      type="text"
                      value={currentContent.classwise_desc || ''}
                      onChange={(e) => handleFieldChange('leaderboard', 'classwise_desc', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Top ranking students segmented by Grade 6, Grade 7, and Grade 8 cohorts."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Squads Section Title</label>
                    <input
                      type="text"
                      value={currentContent.teamwise_title || ''}
                      onChange={(e) => handleFieldChange('leaderboard', 'teamwise_title', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Collaborative STEM Squads"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Squads Description</label>
                    <input
                      type="text"
                      value={currentContent.teamwise_desc || ''}
                      onChange={(e) => handleFieldChange('leaderboard', 'teamwise_desc', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Team-based leaderboard evaluating cooperative synergy, joint quizzes, and squad points."
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Scoring Rules Title</label>
                    <input
                      type="text"
                      value={currentContent.rules_title || ''}
                      onChange={(e) => handleFieldChange('leaderboard', 'rules_title', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Leaderboard Fairness & Scoring Rules"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Scoring Policy Description</label>
                    <textarea
                      rows={2}
                      value={currentContent.rules_p1 || ''}
                      onChange={(e) => handleFieldChange('leaderboard', 'rules_p1', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Scoring is governed by calibrated quiz difficulty, completion speed, and anti-cheat checks."
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Quick Points Adjustment & Override (Admin Tool) */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                    <FiZap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      Admin Quick Points Adjustment Tool
                    </h3>
                    <p className="text-xs text-slate-300">
                      Instantly adjust, bonus, or override points for any student by Student ID or Username.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAdjustStudentPoints} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Student ID or Username</label>
                    <input
                      type="text"
                      value={adjustStudentId}
                      onChange={(e) => setAdjustStudentId(e.target.value)}
                      placeholder="e.g. sagar or student3"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">New Total Points</label>
                    <input
                      type="number"
                      value={adjustPointsVal}
                      onChange={(e) => setAdjustPointsVal(e.target.value)}
                      placeholder="e.g. 450"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={adjusting}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {adjusting ? 'Updating...' : 'Update Points'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 4: CONTACT US EDITOR                                  */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'contact' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
                <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
                  Contact Us Details & Support Channels
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Page Badge</label>
                    <input
                      type="text"
                      value={currentContent.badge || ''}
                      onChange={(e) => handleFieldChange('contact', 'badge', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Inquiries & Collaboration"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Page Title</label>
                    <input
                      type="text"
                      value={currentContent.title || ''}
                      onChange={(e) => handleFieldChange('contact', 'title', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Contact STEMLearn"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subtitle</label>
                    <textarea
                      rows={2}
                      value={currentContent.subtitle || ''}
                      onChange={(e) => handleFieldChange('contact', 'subtitle', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department Name</label>
                    <input
                      type="text"
                      value={currentContent.dept_name || ''}
                      onChange={(e) => handleFieldChange('contact', 'dept_name', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sub-Department / Lab</label>
                    <input
                      type="text"
                      value={currentContent.sub_dept || ''}
                      onChange={(e) => handleFieldChange('contact', 'sub_dept', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Campus / Building Address</label>
                    <input
                      type="text"
                      value={currentContent.address || ''}
                      onChange={(e) => handleFieldChange('contact', 'address', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City, State & Postal Code</label>
                    <input
                      type="text"
                      value={currentContent.city_state || ''}
                      onChange={(e) => handleFieldChange('contact', 'city_state', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Official Research Email</label>
                    <input
                      type="email"
                      value={currentContent.email || ''}
                      onChange={(e) => handleFieldChange('contact', 'email', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Support Contact Phone</label>
                    <input
                      type="text"
                      value={currentContent.phone || ''}
                      onChange={(e) => handleFieldChange('contact', 'phone', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Operating Hours</label>
                    <input
                      type="text"
                      value={currentContent.hours || ''}
                      onChange={(e) => handleFieldChange('contact', 'hours', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Response Time Notice</label>
                    <input
                      type="text"
                      value={currentContent.response_time || ''}
                      onChange={(e) => handleFieldChange('contact', 'response_time', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 5: FOOTER EDITOR                                      */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === 'footer' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
                <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
                  Global Public Footer Content
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Brand Main Title</label>
                    <input
                      type="text"
                      value={currentContent.brand_title || ''}
                      onChange={(e) => handleFieldChange('footer', 'brand_title', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="STEMLearn"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Brand Subtitle / Tagline</label>
                    <input
                      type="text"
                      value={currentContent.brand_subtitle || ''}
                      onChange={(e) => handleFieldChange('footer', 'brand_subtitle', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Grades 6 – 8 Educational Research"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Brand Overview Description</label>
                    <textarea
                      rows={3}
                      value={currentContent.brand_desc || ''}
                      onChange={(e) => handleFieldChange('footer', 'brand_desc', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Badge 1 Label</label>
                    <input
                      type="text"
                      value={currentContent.badge_curriculum || ''}
                      onChange={(e) => handleFieldChange('footer', 'badge_curriculum', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Curriculum Aligned"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Badge 2 Label</label>
                    <input
                      type="text"
                      value={currentContent.badge_anticheat || ''}
                      onChange={(e) => handleFieldChange('footer', 'badge_anticheat', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="Anti-Cheat Secured"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Badge 3 Label</label>
                    <input
                      type="text"
                      value={currentContent.badge_ai || ''}
                      onChange={(e) => handleFieldChange('footer', 'badge_ai', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                      placeholder="AI Augmented"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Research Contact Department</label>
                    <input
                      type="text"
                      value={currentContent.dept_name || ''}
                      onChange={(e) => handleFieldChange('footer', 'dept_name', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={currentContent.email || ''}
                      onChange={(e) => handleFieldChange('footer', 'email', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={currentContent.phone || ''}
                      onChange={(e) => handleFieldChange('footer', 'phone', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Copyright Line</label>
                    <input
                      type="text"
                      value={currentContent.copyright || ''}
                      onChange={(e) => handleFieldChange('footer', 'copyright', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Controlled Study Bottom Badge</label>
                    <input
                      type="text"
                      value={currentContent.study_note || ''}
                      onChange={(e) => handleFieldChange('footer', 'study_note', e.target.value)}
                      className="stem-input text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Action Footer */}
          <div className="flex items-center justify-end pt-4">
            <button
              type="button"
              onClick={() => handleSavePage(activeTab)}
              disabled={saving}
              className="stem-btn bg-purple-600 hover:bg-purple-700 text-white py-3 px-8 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-purple-600/30 transition-all disabled:opacity-50"
            >
              <FiSave className="w-4 h-4" />
              <span>{saving ? 'Publishing Changes...' : `Save & Publish ${activeTab.toUpperCase()} Changes`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
