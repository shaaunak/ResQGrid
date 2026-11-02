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
  Lock,
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
import { useAuth } from '../context/AuthContext';

export const AnalyticsPage: React.FC = () => {
  const { user, loginAsPersona } = useAuth();

  const { data: analytics, isLoading, error, refetch } = useQuery<any>({
    queryKey: ['analytics'],
    queryFn: () => apiRequest('/analytics'),
    refetchInterval: 10000,
    retry: 1,
  });

  if (error || (!isLoading && !analytics)) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center font-sans space-y-4">
        <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 text-app-primary flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-app-text">Operator Telemetry Authentication Required</h2>
        <p className="text-xs text-app-text-secondary leading-relaxed">
          Operational metrics and PostgreSQL audit logs require Operator or Coordinator credentials. Sign in below to load the live analytics stream.
        </p>
        <button
          onClick={async () => {
            await loginAsPersona('OPERATOR');
            refetch();
          }}
          className="px-4 py-2 bg-app-primary hover:bg-[#0E555A] text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          Sign In as Control Room Operator
        </button>
      </div>
    );
  }

  if (isLoading || !analytics) {
    return (
      <div className="max-w-6xl mx-auto p-8 text-center text-app-text-secondary font-mono text-xs">
        Aggregating operational telemetry from PostgreSQL database...
      </div>
    );
  }

  const kpis = analytics.kpis;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-app-border gap-2">
        <div>
          <h1 className="text-xl font-bold text-app-text flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-app-primary" />
            <span>Operational Analytics & Response Metrics</span>
          </h1>
          <p className="text-xs text-app-text-secondary font-mono mt-0.5">
            Real-time disaster resolution KPIs computed from relational database audit records.
          </p>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
        <div className="bg-white border border-app-border p-4 rounded-xl shadow-sm">
          <div className="text-app-text-secondary uppercase text-[10px] font-mono tracking-wider">Total Incidents</div>
          <div className="text-2xl font-bold text-app-text mt-1 font-mono">{kpis.total_incidents}</div>
          <div className="text-[10px] text-app-text-secondary mt-1">Recorded in system</div>
        </div>

        <div className="bg-white border border-app-border p-4 rounded-xl shadow-sm">
          <div className="text-app-text-secondary uppercase text-[10px] font-mono tracking-wider">Active Operations</div>
          <div className="text-2xl font-bold text-app-high mt-1 font-mono">{kpis.active_incidents}</div>
          <div className="text-[10px] text-app-text-secondary mt-1">Under active triage/dispatch</div>
        </div>

        <div className="bg-white border border-app-border p-4 rounded-xl shadow-sm">
          <div className="text-app-text-secondary uppercase text-[10px] font-mono tracking-wider">Critical Emergencies</div>
          <div className="text-2xl font-bold text-app-critical mt-1 font-mono">{kpis.critical_incidents}</div>
          <div className="text-[10px] text-app-text-secondary mt-1">High-priority life safety</div>
        </div>

        <div className="bg-white border border-app-border p-4 rounded-xl shadow-sm">
          <div className="text-app-text-secondary uppercase text-[10px] font-mono tracking-wider">Resolved Successfully</div>
          <div className="text-2xl font-bold text-app-low mt-1 font-mono">{kpis.resolved_incidents}</div>
          <div className="text-[10px] text-app-text-secondary mt-1">Missions completed</div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incidents by Severity */}
        <div className="bg-white border border-app-border rounded-xl p-5 shadow-sm space-y-3 font-sans text-xs">
          <span className="font-semibold text-app-text uppercase tracking-wider block pb-2 border-b border-app-border font-mono text-[11px]">
            Incidents Breakdown by Severity
          </span>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.incidents_by_severity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="severity" stroke="#64748B" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#18242B', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="count" fill="#146D73" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents by Category */}
        <div className="bg-white border border-app-border rounded-xl p-5 shadow-sm space-y-3 font-sans text-xs">
          <span className="font-semibold text-app-text uppercase tracking-wider block pb-2 border-b border-app-border font-mono text-[11px]">
            Incidents Breakdown by Category
          </span>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.incidents_by_category} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" stroke="#64748B" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis dataKey="category" type="category" stroke="#64748B" tick={{ fontSize: 9, fill: '#64748B' }} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#18242B', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="count" fill="#D77A34" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Depot Utilization Table */}
      <div className="bg-white border border-app-border rounded-xl p-5 shadow-sm space-y-3 font-sans text-xs">
        <span className="font-semibold text-app-text uppercase tracking-wider block pb-2 border-b border-app-border font-mono text-[11px]">
          Depot Resource Capacity & Utilization
        </span>
        <div className="space-y-3">
          {analytics.depot_utilization?.map((d: any) => (
            <div key={d.depot_name} className="space-y-1">
              <div className="flex justify-between text-app-text">
                <span className="font-semibold text-app-text">{d.depot_name}</span>
                <span className="font-mono text-app-text-secondary text-[11px]">
                  {d.reserved} Reserved / {d.total} Total ({d.utilization_pct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-app-border">
                <div
                  className="bg-app-primary h-full rounded-full"
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

