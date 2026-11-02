import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  Clock,
  ShieldAlert,
  Boxes,
  Users,
  Download,
  CheckCircle2,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { apiRequest } from '../api/client';

export const AnalyticsPage: React.FC = () => {
  const { data: analytics, isLoading } = useQuery<any>({
    queryKey: ['analytics'],
    queryFn: () => apiRequest('/analytics'),
    refetchInterval: 10000,
  });

  if (isLoading || !analytics) {
    return (
      <div className="max-w-6xl mx-auto p-8 text-center text-command-muted font-mono text-xs">
        Aggregating operational telemetry from PostgreSQL database...
      </div>
    );
  }

  const kpis = analytics.kpis;
  const SEVERITY_COLORS = ['#CF4B4B', '#E7A645', '#3b82f6', '#64748b'];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-command-border gap-2">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-command-teal" />
            <span>Operational Analytics & Response Metrics</span>
          </h1>
          <p className="text-xs text-command-muted font-mono mt-0.5">
            Real-time disaster resolution KPIs computed from relational database audit records.
          </p>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
        <div className="bg-command-surface border border-command-border p-4 rounded-lg">
          <div className="text-command-muted uppercase text-[10px]">Total Incidents</div>
          <div className="text-2xl font-bold text-white mt-1">{kpis.total_incidents}</div>
          <div className="text-[10px] text-slate-400 mt-1">Recorded in system</div>
        </div>

        <div className="bg-command-surface border border-command-border p-4 rounded-lg">
          <div className="text-command-muted uppercase text-[10px]">Active Operations</div>
          <div className="text-2xl font-bold text-command-amber mt-1">{kpis.active_incidents}</div>
          <div className="text-[10px] text-command-amber/80 mt-1">Under active triage/dispatch</div>
        </div>

        <div className="bg-command-surface border border-command-border p-4 rounded-lg">
          <div className="text-command-muted uppercase text-[10px]">Critical Emergencies</div>
          <div className="text-2xl font-bold text-command-red mt-1">{kpis.critical_incidents}</div>
          <div className="text-[10px] text-red-400/80 mt-1">High-priority life safety</div>
        </div>

        <div className="bg-command-surface border border-command-border p-4 rounded-lg">
          <div className="text-command-muted uppercase text-[10px]">Resolved Successfully</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{kpis.resolved_incidents}</div>
          <div className="text-[10px] text-emerald-400/80 mt-1">Missions completed</div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incidents by Severity */}
        <div className="bg-command-surface border border-command-border rounded-lg p-5 shadow-xl space-y-3 font-mono text-xs">
          <span className="font-semibold text-white uppercase tracking-wider block pb-2 border-b border-command-border/60">
            Incidents Breakdown by Severity
          </span>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.incidents_by_severity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e4566" />
                <XAxis dataKey="severity" stroke="#8e9eb3" tick={{ fontSize: 10, fill: '#8e9eb3' }} />
                <YAxis stroke="#8e9eb3" tick={{ fontSize: 10, fill: '#8e9eb3' }} />
                <Tooltip contentStyle={{ backgroundColor: '#142235', borderColor: '#2e4566', color: '#fff' }} />
                <Bar dataKey="count" fill="#137C82" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents by Category */}
        <div className="bg-command-surface border border-command-border rounded-lg p-5 shadow-xl space-y-3 font-mono text-xs">
          <span className="font-semibold text-white uppercase tracking-wider block pb-2 border-b border-command-border/60">
            Incidents Breakdown by Category
          </span>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.incidents_by_category} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2e4566" />
                <XAxis type="number" stroke="#8e9eb3" tick={{ fontSize: 10, fill: '#8e9eb3' }} />
                <YAxis dataKey="category" type="category" stroke="#8e9eb3" tick={{ fontSize: 9, fill: '#8e9eb3' }} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#142235', borderColor: '#2e4566', color: '#fff' }} />
                <Bar dataKey="count" fill="#E7A645" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Depot Utilization Table */}
      <div className="bg-command-surface border border-command-border rounded-lg p-5 shadow-xl space-y-3 font-mono text-xs">
        <span className="font-semibold text-white uppercase tracking-wider block pb-2 border-b border-command-border/60">
          Depot Resource Capacity & Utilization
        </span>
        <div className="space-y-3">
          {analytics.depot_utilization?.map((d: any) => (
            <div key={d.depot_name} className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span className="font-semibold text-white">{d.depot_name}</span>
                <span>
                  {d.reserved} Reserved / {d.total} Total ({d.utilization_pct}%)
                </span>
              </div>
              <div className="w-full bg-command-darkest h-2 rounded-full overflow-hidden border border-command-border/50">
                <div
                  className="bg-command-teal h-full rounded-full"
                  style={{ width: `${Math.min(100, d.utilization_pct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

