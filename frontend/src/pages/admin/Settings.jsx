import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  FiSettings, 
  FiShield, 
  FiCpu, 
  FiSave, 
  FiRefreshCw, 
  FiClock, 
  FiSliders,
  FiLock,
  FiMonitor,
  FiCopy,
  FiSlash,
  FiAlertTriangle,
  FiCheckCircle
} from 'react-icons/fi';
import { adminService } from '../../services/api';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdvancedSecurity, setShowAdvancedSecurity] = useState(true);

  const [settings, setSettings] = useState({
    anti_cheat_limit: 3,
    passing_percentage: 70,
    jwt_expiry_hours: 24,
    enforce_fullscreen: true,
    detect_tab_switch: true,
    disable_copy_paste: true,
    disable_right_click: true,
    block_devtools: true,
    single_session_lock: true,
    inactivity_timeout_mins: 30,
    shuffle_questions: true,
    groq_model: 'llama-3.3-70b-versatile',
    gemini_model: 'gemini-2.5-flash',
    primary_ai_provider: 'gemini',
    fallback_ai_provider: 'groq',
    student_ai_enabled: true,
    daily_student_request_limit: 30,
    allow_student_registration: true,
    team_scoring_method: 'average',
    gemini_api_key: '',
    groq_api_key: ''
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const resSettings = await adminService.getSettings();
      const d = resSettings.data?.data || resSettings.data || {};
      setSettings(prev => ({
        ...prev,
        ...d,
        gemini_api_key: d.gemini_api_key || '',
        groq_api_key: d.groq_api_key || ''
      }));
    } catch (err) {
      toast.error('Failed to load system settings from server.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await adminService.updateSettings(settings);
      toast.success('System settings & anti-cheat parameters updated successfully!');
      fetchSettings();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error updating settings';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FiSettings className="text-purple-600" />
            System Environment Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage dual AI endpoints, student assistant limits, and anti-cheat security policies.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSettings}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          title="Reload settings"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200/80">
          <FiRefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
          <p className="text-sm font-medium">Loading configuration parameters...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* AI Providers Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FiCpu className="w-5 h-5 text-purple-600" />
                <span>Dual AI Engine & Failover Orchestration</span>
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="student_ai_enabled"
                  checked={settings.student_ai_enabled}
                  onChange={(e) => setSettings({ ...settings, student_ai_enabled: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
                <label htmlFor="student_ai_enabled" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Enable AI Tutor for Students
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Google Gemini Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">Google Gemini AI</span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {settings.primary_ai_provider === 'gemini' ? 'Primary' : 'Fallback'}
                  </span>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1 font-semibold">Gemini Model Identifier</label>
                  <input
                    type="text"
                    value={settings.gemini_model || 'gemini-2.5-flash'}
                    onChange={(e) => setSettings({ ...settings, gemini_model: e.target.value })}
                    className="stem-input text-xs"
                    placeholder="gemini-2.5-flash"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1 font-semibold">API Key Override (Optional)</label>
                  <input
                    type="password"
                    value={settings.gemini_api_key || ''}
                    onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                    className="stem-input text-xs"
                    placeholder="Leave blank to use .env GEMINI_API_KEY"
                  />
                </div>
              </div>

              {/* Groq Cloud Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">Groq Cloud AI (Llama 3.3)</span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    {settings.primary_ai_provider === 'groq' ? 'Primary' : 'Fallback'}
                  </span>
                </div>
                <div>
                  <label className="text-slate-500 block mb-1 font-semibold">Groq Model Identifier</label>
                  <input
                    type="text"
                    value={settings.groq_model || 'llama-3.3-70b-versatile'}
                    onChange={(e) => setSettings({ ...settings, groq_model: e.target.value })}
                    className="stem-input text-xs"
                    placeholder="llama-3.3-70b-versatile"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1 font-semibold">API Key Override (Optional)</label>
                  <input
                    type="password"
                    value={settings.groq_api_key || ''}
                    onChange={(e) => setSettings({ ...settings, groq_api_key: e.target.value })}
                    className="stem-input text-xs"
                    placeholder="Leave blank to use .env GROQ_API_KEY"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Primary AI Engine
                </label>
                <select
                  value={settings.primary_ai_provider}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    primary_ai_provider: e.target.value,
                    fallback_ai_provider: e.target.value === 'gemini' ? 'groq' : 'gemini'
                  })}
                  className="stem-input text-xs sm:text-sm"
                >
                  <option value="gemini">Google Gemini (Default)</option>
                  <option value="groq">Groq Cloud (Llama 3.3)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Daily AI Calls Per Student
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={settings.daily_student_request_limit}
                  onChange={(e) => setSettings({ ...settings, daily_student_request_limit: parseInt(e.target.value) || 30 })}
                  className="stem-input text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Squad Scoring Aggregation
                </label>
                <select
                  value={settings.team_scoring_method || 'average'}
                  onChange={(e) => setSettings({ ...settings, team_scoring_method: e.target.value })}
                  className="stem-input text-xs sm:text-sm"
                >
                  <option value="average">Cohort Average (Standard ANOVA)</option>
                  <option value="sum">Cumulative Total Points</option>
                  <option value="top_three">Top 3 Student Average</option>
                </select>
              </div>
            </div>
          </div>

          {/* Anti-Cheat & Security Evaluation Parameters */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                  <FiShield className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Anti-Cheat & Security Evaluation Parameters
                  </h3>
                  <p className="text-xs text-slate-500">
                    Proctoring thresholds, evaluation cutoffs, and session authorization tokens.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvancedSecurity(!showAdvancedSecurity)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all cursor-pointer border border-purple-200 self-start sm:self-auto"
              >
                <FiSliders className="w-3.5 h-3.5" />
                <span>{showAdvancedSecurity ? 'Hide Advance Settings' : 'Show Advance Settings'}</span>
              </button>
            </div>

            {/* Core Thresholds */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Max Anti-Cheat Flags
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.anti_cheat_limit}
                  onChange={(e) =>
                    setSettings({ ...settings, anti_cheat_limit: Number(e.target.value) })
                  }
                  className="stem-input text-xs sm:text-sm"
                />
                <span className="text-[10px] text-slate-400">Auto-submits assessment on limit breach</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Default Pass Cutoff (%)
                </label>
                <input
                  type="number"
                  min="40"
                  max="100"
                  value={settings.passing_percentage}
                  onChange={(e) =>
                    setSettings({ ...settings, passing_percentage: Number(e.target.value) })
                  }
                  className="stem-input text-xs sm:text-sm"
                />
                <span className="text-[10px] text-slate-400">Mastery benchmark for concept unlocks</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  JWT Session Lifetime (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={settings.jwt_expiry_hours || 24}
                  onChange={(e) =>
                    setSettings({ ...settings, jwt_expiry_hours: Number(e.target.value) })
                  }
                  className="stem-input text-xs sm:text-sm"
                />
                <span className="text-[10px] text-slate-400">Active bearer token authentication validity</span>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allow_student_registration}
                  onChange={(e) =>
                    setSettings({ ...settings, allow_student_registration: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <span>Allow open middle-school student self-registration (Grades 6, 7, 8, 9)</span>
              </label>
            </div>

            {/* ─── ADVANCE ANTI-CHEAT & PROCTORING CONTROLS ─── */}
            {showAdvancedSecurity && (
              <div className="pt-2 border-t border-slate-100 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                      Advance Settings
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      High-Integrity Exam Proctoring & Telemetry Controls
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Enforce Fullscreen */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/60 border border-slate-200 transition-all flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="enforce_fullscreen"
                      checked={settings.enforce_fullscreen ?? true}
                      onChange={(e) => setSettings({ ...settings, enforce_fullscreen: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="enforce_fullscreen" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                        <FiMonitor className="w-3.5 h-3.5 text-blue-600" />
                        <span>Enforce Fullscreen During Quizzes</span>
                      </label>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Requires students to take quizzes in dedicated fullscreen mode. Minimizing or exiting window raises a violation flag.
                      </p>
                    </div>
                  </div>

                  {/* Detect Tab Switches */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/60 border border-slate-200 transition-all flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="detect_tab_switch"
                      checked={settings.detect_tab_switch ?? true}
                      onChange={(e) => setSettings({ ...settings, detect_tab_switch: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="detect_tab_switch" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                        <FiAlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <span>Strict Tab Switch & Blur Telemetry</span>
                      </label>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Tracks document visibility changes and window blur events when students switch to other tabs or applications.
                      </p>
                    </div>
                  </div>

                  {/* Disable Copy/Paste */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/60 border border-slate-200 transition-all flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="disable_copy_paste"
                      checked={settings.disable_copy_paste ?? true}
                      onChange={(e) => setSettings({ ...settings, disable_copy_paste: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="disable_copy_paste" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                        <FiCopy className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Disable Clipboard Copy & Paste</span>
                      </label>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Blocks clipboard hotkeys (Ctrl+C, Ctrl+V) preventing copying of assessment questions or pasting outside answers.
                      </p>
                    </div>
                  </div>

                  {/* Disable Right-Click */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/60 border border-slate-200 transition-all flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="disable_right_click"
                      checked={settings.disable_right_click ?? true}
                      onChange={(e) => setSettings({ ...settings, disable_right_click: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="disable_right_click" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                        <FiSlash className="w-3.5 h-3.5 text-rose-500" />
                        <span>Disable Right-Click Context Menu</span>
                      </label>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Prevents context menu access to inspect elements, copy image sources, or open search options during evaluations.
                      </p>
                    </div>
                  </div>

                  {/* Block DevTools Shortcuts */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/60 border border-slate-200 transition-all flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="block_devtools"
                      checked={settings.block_devtools ?? true}
                      onChange={(e) => setSettings({ ...settings, block_devtools: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="block_devtools" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                        <FiLock className="w-3.5 h-3.5 text-purple-600" />
                        <span>Block Developer Tools & F12</span>
                      </label>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Intercepts browser shortcuts (F12, Ctrl+Shift+I, Ctrl+U, PrintScreen) to block inspection and source examination.
                      </p>
                    </div>
                  </div>

                  {/* Single Session Lock */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/60 border border-slate-200 transition-all flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="single_session_lock"
                      checked={settings.single_session_lock ?? true}
                      onChange={(e) => setSettings({ ...settings, single_session_lock: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="single_session_lock" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                        <FiCheckCircle className="w-3.5 h-3.5 text-teal-600" />
                        <span>Enforce Single Concurrent Session</span>
                      </label>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Enforces token versioning. Any new login from another device or browser will invalidate preceding active sessions.
                      </p>
                    </div>
                  </div>

                  {/* Randomize Questions */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/60 border border-slate-200 transition-all flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="shuffle_questions"
                      checked={settings.shuffle_questions ?? true}
                      onChange={(e) => setSettings({ ...settings, shuffle_questions: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="shuffle_questions" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                        <FiSliders className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Randomize Questions & Options</span>
                      </label>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Dynamically shuffles question and answer sequence per student attempt to prevent peer answer-copying.
                      </p>
                    </div>
                  </div>

                  {/* Inactivity Auto Logout Timeout */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <div className="space-y-0.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FiClock className="w-3.5 h-3.5 text-slate-600" />
                        <span>Inactivity Auto-Logout (Minutes)</span>
                      </label>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Time of zero user activity before automatically locking and invalidating active portal tokens.
                      </p>
                    </div>
                    <div className="pt-2">
                      <input
                        type="number"
                        min="5"
                        max="180"
                        value={settings.inactivity_timeout_mins || 30}
                        onChange={(e) => setSettings({ ...settings, inactivity_timeout_mins: Number(e.target.value) })}
                        className="stem-input text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="stem-btn bg-purple-600 hover:bg-purple-700 text-white py-3 px-8 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-purple-600/30 transition-all"
            >
              <FiSave className="w-4 h-4" />
              <span>{saving ? 'Saving System Settings...' : 'Save System Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
