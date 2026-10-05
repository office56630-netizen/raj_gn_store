import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, RefreshCw, Calendar, Terminal, User } from 'lucide-react';
import { AuditLogItem, api } from '../services/api.ts';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 35, pages: 1 });

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.auditLogs.getAll({
        search,
        action: selectedAction,
        page,
        limit: 35,
      });
      setLogs(res.data.logs);
      setActions(res.data.actions);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [search, selectedAction]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">System Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log of administrative transactions, customer impersonations, and security events.
          </p>
        </div>

        <button
          onClick={() => fetchLogs(pagination.page)}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer self-start sm:self-auto"
          title="Reload Audit Logs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description, admin name, target ID..."
            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700"
        >
          <option value="all">All Audit Actions</option>
          {actions.map((act) => (
            <option key={act} value={act}>
              {act}
            </option>
          ))}
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Initiator / Role</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Description of Operation</th>
                <th className="py-3 px-4">Target ID</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                    No audit records matching query.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900">{log.userName}</span>
                      <span className="text-[10px] text-slate-400 block capitalize">{log.userRole}</span>
                    </td>

                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          log.action.includes('Delete')
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : log.action.includes('Credit')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.action.includes('Debit')
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : log.action.includes('Accessed')
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 font-sans text-slate-700 max-w-[340px]">
                      {log.description}
                    </td>

                    <td className="py-2.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {log.targetId || '—'}
                    </td>

                    <td className="py-2.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-sans">
          <div>Showing {logs.length} of {pagination.total} audit entries</div>
          <div className="flex items-center gap-1 font-mono">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
              className="px-2.5 py-1 border border-slate-200 rounded bg-white text-slate-700 disabled:opacity-40 cursor-pointer"
            >
              Prev
            </button>
            <span className="px-2">
              {pagination.page} / {pagination.pages || 1}
            </span>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => fetchLogs(pagination.page + 1)}
              className="px-2.5 py-1 border border-slate-200 rounded bg-white text-slate-700 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
