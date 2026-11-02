import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  CheckCircle,
  Radio,
  FileQuestion,
  Users,
} from 'lucide-react';
import { IncidentSeverity, IncidentStatus } from '../types';

export const SeverityBadge: React.FC<{ severity: IncidentSeverity; showIcon?: boolean }> = ({
  severity,
  showIcon = true,
}) => {
  switch (severity) {
    case 'CRITICAL':
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-pill text-[11px] font-medium bg-red-50 text-[#C8201B] border border-red-200 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-400">
          {showIcon && <AlertCircle className="w-3 h-3 flex-shrink-0" />}
          <span>Critical</span>
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-pill text-[11px] font-medium bg-orange-50 text-[#E27D14] border border-orange-200 dark:bg-orange-950/40 dark:border-orange-900/60 dark:text-orange-400">
          {showIcon && <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
          <span>High</span>
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-pill text-[11px] font-medium bg-amber-50 text-[#C9A100] border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-yellow-400">
          {showIcon && <Info className="w-3 h-3 flex-shrink-0" />}
          <span>Medium</span>
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-pill text-[11px] font-medium bg-emerald-50 text-[#2E7D5B] border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-400">
          {showIcon && <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
          <span>Low</span>
        </span>
      );
  }
};

export const StatusBadge: React.FC<{ status: IncidentStatus }> = ({ status }) => {
  switch (status) {
    case 'REPORTED':
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-pill text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
          <Clock className="w-3 h-3" />
          <span>Reported</span>
        </span>
      );
    case 'VERIFIED':
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-pill text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-300">
          <CheckCircle className="w-3 h-3" />
          <span>Verified</span>
        </span>
      );
    case 'ASSIGNED':
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-pill text-[11px] font-medium bg-teal-50 text-[#14284B] border border-teal-200 dark:bg-teal-950/40 dark:border-teal-900 dark:text-teal-300">
          <Users className="w-3 h-3" />
          <span>Assigned</span>
        </span>
      );
    case 'IN_PROGRESS':
    case 'ACCEPTED':
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-pill text-[11px] font-medium bg-amber-50 text-[#E27D14] border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300">
          <Radio className="w-3 h-3 animate-pulse" />
          <span>In Progress</span>
        </span>
      );
    case 'RESOLVED':
    case 'CLOSED':
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-pill text-[11px] font-medium bg-emerald-50 text-[#2E7D5B] border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
          <CheckCircle2 className="w-3 h-3" />
          <span>Resolved</span>
        </span>
      );
    case 'REJECTED':
    default:
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-pill text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
          <FileQuestion className="w-3 h-3" />
          <span>Declined</span>
        </span>
      );
  }
};
