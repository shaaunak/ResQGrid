import React from 'react';
import { IncidentSeverity, IncidentStatus } from '../types';

export const SeverityBadge: React.FC<{ severity: IncidentSeverity }> = ({ severity }) => {
  const styles: Record<IncidentSeverity, string> = {
    CRITICAL: 'bg-command-red/20 text-red-400 border-command-red/40',
    HIGH: 'bg-command-amber/20 text-amber-400 border-command-amber/40',
    MEDIUM: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    LOW: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${styles[severity] || styles.MEDIUM}`}
    >
      {severity}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: IncidentStatus }> = ({ status }) => {
  const styles: Record<IncidentStatus, string> = {
    REPORTED: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    VERIFIED: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    PRIORITIZED: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    ASSIGNED: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    ACCEPTED: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    RESOLVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    CLOSED: 'bg-slate-600/20 text-slate-400 border-slate-600/30',
    REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
    CANCELLED: 'bg-slate-700/20 text-slate-400 border-slate-700/30',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${styles[status] || styles.REPORTED}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
};

