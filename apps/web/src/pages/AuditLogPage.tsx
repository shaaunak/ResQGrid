import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ScrollText,
  Filter,
  Download,
  Search,
  User,
  Layers,
  Clock,
  RefreshCw,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { exportToCSV } from '../utils/chartTheme';

export const AuditLogPage: React.FC = () => {
  const [resourceFilter, setResourceFilter] = useState<string>('');
  const [actorFilter, setActorFilter] = useState<string>('');

  const { data: logs, isLoading, refetch, isFetching } = useQuery<any[]>({
    queryKey: ['audit-logs', resourceFilter, actorFilter],
    queryFn: () => {
      let url = '/intelligence/audit-logs?limit=100';
      if (resourceFilter) url += `&resource_type=${encodeURIComponent(resourceFilter)}`;
      if (actorFilter) url += `&actor_id=${encodeURIComponent(actorFilter)}`;
      return apiRequest(url);
    },
    refetchInterval: 5000,
  });

  const handleExportCSV = () => {
    if (!logs?.length) return;
    const headers = ['Timestamp', 'Action', 'Resource Type', 'Resource ID', 'Actor ID', 'Details', 'IP Address'];
    const rows = logs.map((l: any) => [
      l.created_at,
      l.action,
      l.resource_type,
      l.resource_id,
      l.actor_id || 'SYSTEM',
      JSON.stringify(l.details_json || {}),
      l.ip_address || '127.0.0.1',
    ]);
    exportToCSV('resqgrid_audit_trail', rows, headers);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-rq-border gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-rq-ink flex items-center space-x-2">
              <ScrollText className="w-5 h-5 text-rq-brand" />
              <span>Immutable Audit Trail & Transition Log</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
              ACID Compliant
            </span>
          </div>
          <p className="text-xs text-rq-muted mt-1 font-mono">
            Cryptographically sealed operational audit logs recording every state change, dispatch decision, and operator override.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-rq-border rounded-lg text-xs font-mono text-rq-ink shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-rq-brand ${isFetching ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#14284B] hover:bg-[#1E3A8A] text-white rounded-lg text-xs font-mono shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-rq-border rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-4 text-xs font-sans">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-rq-muted" />
          <span className="font-semibold text-rq-ink font-mono uppercase text-[11px]">Filters:</span>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-[11px] font-mono text-rq-muted">Entity Type:</label>
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="bg-rq-surface2 border border-rq-border rounded-lg px-2.5 py-1 text-xs font-mono text-rq-ink"
          >
            <option value="">All Entities</option>
            <option value="incident">Incident</option>
            <option value="assignment">Assignment</option>
            <option value="inventory">Inventory Stock</option>
            <option value="team">Response Team</option>
            <option value="user">User Account</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-[11px] font-mono text-rq-muted">Actor / User ID:</label>
          <input
            type="text"
            placeholder="Filter by Actor UUID..."
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="bg-rq-surface2 border border-rq-border rounded-lg px-2.5 py-1 text-xs font-mono text-rq-ink w-48"
          />
        </div>

        {(resourceFilter || actorFilter) && (
          <button
            onClick={() => {
              setResourceFilter('');
              setActorFilter('');
            }}
            className="text-[11px] font-mono text-rq-brand hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-rq-border rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-rq-border">
          <span className="font-semibold text-rq-ink text-xs uppercase font-mono tracking-wider">
            Audit Records Stream
          </span>
          <span className="text-[11px] font-mono text-rq-muted">
            Showing {logs?.length || 0} entries
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-rq-muted font-mono text-xs">
            Loading relational audit log stream...
          </div>
        ) : !logs?.length ? (
          <div className="p-8 text-center text-rq-muted font-mono text-xs">
            No audit records match the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-rq-border text-[11px] font-mono uppercase text-rq-muted">
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Entity Type</th>
                  <th className="py-2 px-3">Resource Target</th>
                  <th className="py-2 px-3">Actor</th>
                  <th className="py-2 px-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rq-border font-mono text-[11px]">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-rq-surface2 transition">
                    <td className="py-2.5 px-3 text-rq-muted whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded font-bold bg-blue-50 text-[#14284B] border border-blue-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-rq-ink font-semibold uppercase">{log.resource_type}</td>
                    <td className="py-2.5 px-3 text-rq-muted truncate max-w-[140px]" title={log.resource_id}>
                      {log.resource_id}
                    </td>
                    <td className="py-2.5 px-3 text-rq-muted truncate max-w-[120px]" title={log.actor_id || 'SYSTEM'}>
                      {log.actor_id ? log.actor_id.slice(0, 8) + '...' : 'SYSTEM'}
                    </td>
                    <td className="py-2.5 px-3 text-rq-muted max-w-[320px] truncate" title={JSON.stringify(log.details_json)}>
                      {JSON.stringify(log.details_json)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
