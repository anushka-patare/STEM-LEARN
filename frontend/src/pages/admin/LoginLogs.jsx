import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  FiShield, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiLock, 
  FiClock, 
  FiRefreshCw, 
  FiDownload, 
  FiSearch,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { adminService } from '../../services/api';

export default function AdminLoginLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 25,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      };

      const res = await adminService.getLoginLogs(params);
      const d = res.data?.data || res.data || {};
      const list = d.logs || (Array.isArray(d) ? d : []);
      setLogs(list);
      setTotalPages(d.pages || 1);
      setTotalCount(d.total || list.length);
    } catch (err) {
      toast.error('Failed to load login audit logs from MongoDB.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, statusFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Delete All Logs
  const handleDeleteAllLogs = async () => {
    if (totalCount === 0 && logs.length === 0) {
      toast.error('No logs to delete');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ALL (${totalCount}) login audit logs? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setClearing(true);
      const res = await adminService.clearLoginLogs();
      toast.success(res.data?.message || 'All login audit logs successfully deleted!');
      setPage(1);
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear login logs');
    } finally {
      setClearing(false);
    }
  };

  // Delete Single Log
  const handleDeleteSingleLog = async (id) => {
    if (!window.confirm('Delete this login log entry?')) return;
    try {
      await adminService.deleteLoginLog(id);
      toast.success('Log entry deleted');
      fetchLogs();
    } catch (err) {
      toast.error('Failed to delete log entry');
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.error('No logs to export');
      return;
    }
    const headers = ['User Account', 'Email', 'Role', 'Event', 'Client IP', 'Timestamp', 'Status'];
    const rows = logs.map(l => [
      `"${(l.user_name || l.name || (l.role === 'admin' ? 'Super Admin' : 'User')).replace(/"/g, '""')}"`,
      l.email || l.user || (l.role === 'admin' ? 'admin@stemlearn.com' : 'unknown'),
      l.role || 'unknown',
      `"${(l.event || (l.login_status === 'success' ? 'Session Authorization' : 'Authentication Failure')).replace(/"/g, '""')}"`,
      l.ip_address || l.ip || '127.0.0.1',
      l.created_at || l.login_time || '',
      l.login_status || l.status || 'success'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stemlearn_login_audit_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Login audit CSV exported!');
  };

  // Filter logs by search term locally for real-time responsiveness
  const filteredLogs = logs.filter(log => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const email = (log.email || log.user || '').toLowerCase();
    const name = (log.user_name || log.name || '').toLowerCase();
    const ip = (log.ip_address || log.ip || '').toLowerCase();
    const role = (log.role || '').toLowerCase();
    return email.includes(term) || name.includes(term) || ip.includes(term) || role.includes(term);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FiShield className="text-purple-600" />
            Security Audits & Authentication Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time security telemetry monitoring OTP attempts, passwords, client IPs, and role authorizations ({totalCount} recorded events).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchLogs}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh logs"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="stem-btn bg-slate-800 hover:bg-slate-900 text-white py-2.5 px-4 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {/* Delete All Logs Button */}
          <button
            type="button"
            onClick={handleDeleteAllLogs}
            disabled={clearing || totalCount === 0}
            className="stem-btn bg-rose-600 hover:bg-rose-700 text-white py-2.5 px-4 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-all disabled:opacity-50"
            title="Delete all login audit records permanently"
          >
            <FiTrash2 className="w-4 h-4" />
            <span>{clearing ? 'Deleting...' : 'Delete All Logs'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by email, name, IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="stem-input pl-10 text-xs sm:text-sm w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600">Role:</span>
            {['', 'student', 'teacher', 'admin'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRoleFilter(r);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === r
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {r === '' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600">Status:</span>
            {['', 'success', 'failed', 'blocked'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === s
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FiRefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
            <p className="text-sm font-medium">Querying authentication telemetry...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FiShield className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No login events recorded</p>
            <p className="text-xs text-slate-400">Events will appear here automatically when users authenticate.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6 min-w-[220px]">User Account</th>
                  <th className="py-4 px-6 w-28">Role</th>
                  <th className="py-4 px-6 min-w-[200px]">Event Type / Description</th>
                  <th className="py-4 px-6 w-36">Client IP Address</th>
                  <th className="py-4 px-6 w-44">Timestamp</th>
                  <th className="py-4 px-6 text-center w-32">Security State</th>
                  <th className="py-4 px-6 text-right w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.map((log) => {
                  const status = log.login_status || log.status || 'success';
                  const role = log.role || 'user';
                  const name = log.user_name || log.name || (role === 'admin' ? 'Super Admin' : 'User Account');
                  const email = log.email || log.user || (role === 'admin' ? 'admin@stemlearn.com' : 'User');

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. User Account (Proper Name & Email, Never Unknown User) */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs uppercase shrink-0 border ${
                            role === 'admin' 
                              ? 'bg-purple-100 text-purple-700 border-purple-200' 
                              : role === 'teacher' 
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                              : 'bg-blue-100 text-blue-700 border-blue-200'
                          }`}>
                            {(name || email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">
                              {name}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono truncate">
                              {email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Role */}
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                            role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : role === 'teacher'
                              ? 'bg-emerald-100 text-emerald-800'
                              : role === 'student'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {role}
                        </span>
                      </td>

                      {/* 3. Event Description */}
                      <td className="py-4 px-6 text-slate-700 font-semibold">
                        {log.event || (status === 'success' ? 'Session Authorization' : 'Authentication Failure')}
                      </td>

                      {/* 4. IP Address */}
                      <td className="py-4 px-6 text-slate-500 font-mono">
                        {log.ip_address || log.ip || '127.0.0.1'}
                      </td>

                      {/* 5. Timestamp */}
                      <td className="py-4 px-6 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <FiClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {log.created_at || log.login_time ? new Date(log.created_at || log.login_time).toLocaleString() : 'Recent'}
                          </span>
                        </div>
                      </td>

                      {/* 6. Security State */}
                      <td className="py-4 px-6 text-center">
                        {status === 'success' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            Success
                          </span>
                        )}
                        {status === 'failed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                            <FiLock className="w-3.5 h-3.5" />
                            Failed
                          </span>
                        )}
                        {status === 'blocked' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                            <FiAlertTriangle className="w-3.5 h-3.5" />
                            Locked
                          </span>
                        )}
                      </td>

                      {/* 7. Action: Delete single log */}
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteSingleLog(log._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete this log entry"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing Page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span> ({totalCount} entries)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-2 rounded-xl border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white cursor-pointer"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white cursor-pointer"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
