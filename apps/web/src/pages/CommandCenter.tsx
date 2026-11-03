import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Box,
  MapPin,
  Clock,
  Sparkles,
  Users,
  AlertTriangle,
  SlidersHorizontal,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { IncidentMap } from '../components/IncidentMap';
import { CommandCenter3D } from '../components/three/CommandCenter3D';
import { TriageDrawer } from '../components/TriageDrawer';
import { SeverityBadge, StatusBadge } from '../components/StatusBadge';
import { useUI } from '../context/UIContext';
import { Incident, ResponseTeam, Depot } from '../types';

export const CommandCenter: React.FC = () => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE_ONLY'); // OPEN incidents first by default
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapMode, setMapMode] = useState<'2D' | '3D'>('3D');
  const [savedView, setSavedView] = useState<'ALL' | 'UNASSIGNED' | 'CRITICAL_ONLY'>('ALL');

  const { density, setDensity } = useUI();

  // Fetch Incidents
  const {
    data: incidents = [],
    isLoading: loadingIncidents,
    refetch: refetchIncidents,
    isFetching,
  } = useQuery<Incident[]>({
    queryKey: ['incidents', statusFilter, severityFilter],
    queryFn: async () => {
      let queryParams = [];
      if (statusFilter !== 'ALL' && statusFilter !== 'ACTIVE_ONLY') {
        queryParams.push(`status=${statusFilter}`);
      }
      if (severityFilter !== 'ALL') {
        queryParams.push(`severity=${severityFilter}`);
      }
      const qs = queryParams.length ? `?${queryParams.join('&')}` : '';
      const data = await apiRequest<Incident[]>(`/incidents${qs}`);
      return data;
    },
    refetchInterval: 4000,
  });

  // Fetch Response Teams
  const { data: teams = [] } = useQuery<ResponseTeam[]>({
    queryKey: ['teams'],
    queryFn: () => apiRequest<ResponseTeam[]>('/teams'),
    refetchInterval: 6000,
  });

  // Fetch Depots
  const { data: depots = [] } = useQuery<Depot[]>({
    queryKey: ['depots'],
    queryFn: () => apiRequest<Depot[]>('/inventory/depots'),
  });

  // Real database-computed summary
  const { data: summaryMetrics } = useQuery<{
    critical_count: number;
    active_dispatches: number;
    squads_ready: number;
    total_teams: number;
    depots_count: number;
  }>({
    queryKey: ['operational-summary'],
    queryFn: () => apiRequest('/incidents/operational-summary'),
    refetchInterval: 4000,
  });

  // Filtered and sorted incidents for queue:
  // Show OPEN incidents first, sorted by priority and then waiting time (created_at asc).
  // Resolved incidents are hidden when statusFilter === 'ACTIVE_ONLY'.
  const filteredIncidents = incidents
    .filter((inc) => {
      // Hide resolved if in active queue view
      if (statusFilter === 'ACTIVE_ONLY' && inc.status === 'RESOLVED') return false;

      // Saved view filter
      if (savedView === 'UNASSIGNED' && inc.status !== 'REPORTED') return false;
      if (savedView === 'CRITICAL_ONLY' && inc.severity !== 'CRITICAL') return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.tracking_id.toLowerCase().includes(q) ||
        inc.address.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      // 1. Status priority: Open/Active first, Resolved last
      const isAResolved = a.status === 'RESOLVED';
      const isBResolved = b.status === 'RESOLVED';
      if (isAResolved !== isBResolved) return isAResolved ? 1 : -1;

      // 2. Score priority (higher score first)
      if (Math.abs(b.priority_score - a.priority_score) > 0.05) {
        return b.priority_score - a.priority_score;
      }

      // 3. Waiting time (older created_at has waited longer, so earlier date first)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  // Header counts matching filtered view criteria dynamically:
  const criticalCount = filteredIncidents.filter((i) => i.severity === 'CRITICAL').length;
  const activeCount = filteredIncidents.filter((i) =>
    ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(i.status)
  ).length;
  const squadsReadyCount = teams.filter((t) => t.status === 'AVAILABLE').length;

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-rq-bg text-rq-ink overflow-hidden font-sans">
      {/* Pinned Subheader: Operational Metrics & Controls */}
      <div className="h-12 bg-rq-surface border-b border-rq-border px-4 flex items-center justify-between text-xs select-none flex-shrink-0 z-10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-rq-ink font-semibold">
            <Activity className="w-4 h-4 text-rq-navy animate-pulse" />
            <span className="tracking-wide">Command Center</span>
            <span className="px-2 py-0.5 rounded bg-rq-surface-2 text-xs text-rq-muted border border-rq-border font-mono">
              MUMBAI DISPATCH GRID
            </span>
          </div>

          <div className="hidden lg:flex items-center space-x-2 text-xs font-mono">
            <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-red-50 text-[#C8201B] border border-red-200 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8201B] animate-ping" />
              <span>{criticalCount} CRITICAL</span>
            </span>
            <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-teal-50 text-[#14284B] border border-teal-200 dark:bg-teal-950/40 dark:border-teal-900 dark:text-teal-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14284B]" />
              <span>{activeCount} ACTIVE DISPATCHES</span>
            </span>
            <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-rq-surface-2 text-rq-muted border border-rq-border">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D5B]" />
              <span>{squadsReadyCount} SQUADS READY</span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* 2D / 3D Visualization Switcher */}
          <div className="flex items-center bg-rq-surface-2 border border-rq-border rounded-input p-0.5 text-xs font-sans">
            <button
              onClick={() => setMapMode('2D')}
              className={`px-2.5 py-1 rounded flex items-center space-x-1 transition ${
                mapMode === '2D'
                  ? 'bg-rq-surface text-rq-ink font-semibold shadow-subtle border border-rq-border'
                  : 'text-rq-muted hover:text-rq-ink'
              }`}
            >
              <span>2D Cartography</span>
            </button>
            <button
              onClick={() => setMapMode('3D')}
              className={`px-2.5 py-1 rounded flex items-center space-x-1 transition ${
                mapMode === '3D'
                  ? 'bg-rq-surface text-rq-navy font-semibold shadow-subtle border border-rq-border'
                  : 'text-rq-muted hover:text-rq-ink'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>3D Tactical Sphere</span>
            </button>
          </div>

          <button
            onClick={() => refetchIncidents()}
            className="p-1.5 rounded-md hover:bg-rq-surface-2 text-rq-muted hover:text-rq-ink border border-rq-border transition"
            title="Refresh Incident Feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Three-Pane Operations Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Pane: Incident Queue (340px) */}
        <div className="w-80 md:w-96 bg-rq-surface border-r border-rq-border flex flex-col h-full z-10 flex-shrink-0">
          {/* Controls & Saved Views */}
          <div className="p-3 border-b border-rq-border bg-rq-surface-2 space-y-2.5">
            {/* Saved View Tabs & Resolved Filter Chip */}
            <div className="flex items-center space-x-1 bg-rq-surface p-0.5 rounded-md border border-rq-border text-xs">
              <button
                onClick={() => {
                  setSavedView('ALL');
                  if (statusFilter === 'RESOLVED') setStatusFilter('ACTIVE_ONLY');
                }}
                className={`flex-1 py-1 rounded transition text-center font-medium ${
                  savedView === 'ALL' && statusFilter !== 'RESOLVED'
                    ? 'bg-rq-surface-2 text-rq-navy font-semibold'
                    : 'text-rq-muted'
                }`}
              >
                Open ({incidents.filter((i) => i.status !== 'RESOLVED').length})
              </button>
              <button
                onClick={() => {
                  setSavedView('UNASSIGNED');
                  if (statusFilter === 'RESOLVED') setStatusFilter('ACTIVE_ONLY');
                }}
                className={`flex-1 py-1 rounded transition text-center font-medium ${
                  savedView === 'UNASSIGNED' ? 'bg-rq-surface-2 text-rq-navy font-semibold' : 'text-rq-muted'
                }`}
              >
                Unassigned
              </button>
              <button
                onClick={() => {
                  setSavedView('CRITICAL_ONLY');
                  if (statusFilter === 'RESOLVED') setStatusFilter('ACTIVE_ONLY');
                }}
                className={`flex-1 py-1 rounded transition text-center font-medium ${
                  savedView === 'CRITICAL_ONLY' ? 'bg-rq-surface-2 text-red-600 font-semibold' : 'text-rq-muted'
                }`}
              >
                Critical
              </button>
              <button
                onClick={() => {
                  if (statusFilter === 'RESOLVED') {
                    setStatusFilter('ACTIVE_ONLY');
                  } else {
                    setStatusFilter('RESOLVED');
                    setSavedView('ALL');
                  }
                }}
                className={`flex-1 py-1 rounded transition text-center font-medium ${
                  statusFilter === 'RESOLVED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold'
                    : 'text-rq-muted hover:text-rq-ink'
                }`}
                title="Toggle viewing archived resolved incidents"
              >
                Resolved ({incidents.filter((i) => i.status === 'RESOLVED').length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-rq-muted absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search code, location, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-rq-surface border border-rq-border rounded-input text-xs text-rq-ink placeholder:text-rq-muted focus:outline-none focus:border-rq-navy"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 gap-1.5 text-xs font-sans">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1 bg-rq-surface border border-rq-border rounded text-rq-ink focus:outline-none focus:border-rq-navy text-xs"
              >
                <option value="ACTIVE_ONLY">Active Queue (Open)</option>
                <option value="ALL">All (Including Resolved)</option>
                <option value="RESOLVED">Resolved Only</option>
                <option value="REPORTED">Reported Only</option>
                <option value="VERIFIED">Verified Only</option>
                <option value="ASSIGNED">Assigned Only</option>
                <option value="IN_PROGRESS">In Progress Only</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-2 py-1 bg-rq-surface border border-rq-border rounded text-rq-ink focus:outline-none focus:border-rq-navy text-xs"
              >
                <option value="ALL">All Urgencies</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Incident Queue List */}
          <div className="flex-1 overflow-y-auto divide-y divide-rq-border">
            {loadingIncidents ? (
              <div className="p-4 space-y-3">
                <div className="h-16 rounded-card skeleton-shimmer" />
                <div className="h-16 rounded-card skeleton-shimmer" />
                <div className="h-16 rounded-card skeleton-shimmer" />
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="p-8 text-center text-xs text-rq-muted">
                No incidents match current filter criteria.
              </div>
            ) : (
              filteredIncidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-3 transition cursor-pointer relative ${
                      isSelected
                        ? 'bg-blue-50/60 dark:bg-slate-800/60 border-l-4 border-rq-navy shadow-subtle'
                        : 'hover:bg-rq-surface-2'
                    }`}
                  >
                    {/* Severity Colour Bar Indicator */}
                    <div
                      className={`absolute top-0 bottom-0 left-0 w-1 ${
                        inc.severity === 'CRITICAL'
                          ? 'bg-[#C8201B]'
                          : inc.severity === 'HIGH'
                          ? 'bg-[#E27D14]'
                          : inc.severity === 'MEDIUM'
                          ? 'bg-[#C9A100]'
                          : 'bg-[#2E7D5B]'
                      }`}
                    />

                    <div className="flex items-center justify-between mb-1 pl-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-xs font-bold text-rq-ink">
                          {inc.tracking_id}
                        </span>
                        <SeverityBadge severity={inc.severity} />
                        {inc.report_count && inc.report_count > 1 ? (
                          <span
                            className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-mono text-xs font-semibold border border-amber-300 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300"
                            title={`${inc.report_count} citizen reports merged into this incident`}
                          >
                            {inc.report_count} reports
                          </span>
                        ) : null}
                      </div>
                      <StatusBadge status={inc.status} />
                    </div>

                    <h3 className="text-xs font-semibold text-rq-ink truncate mb-1 pl-1">
                      {inc.title}
                    </h3>

                    <p className="text-xs text-rq-muted line-clamp-2 leading-relaxed mb-2 pl-1">
                      {inc.description}
                    </p>

                    <div className="flex items-center justify-between text-xs font-mono text-rq-muted pl-1">
                      <span className="truncate max-w-[160px]">{inc.address.split(',')[0]}</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-rq-navy font-bold">
                          Score: {inc.priority_score.toFixed(0)}
                        </span>
                      </div>
                    </div>

                    {/* Mini Priority Bar */}
                    <div className="mt-1.5 pl-1 w-full bg-rq-border h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-rq-navy h-full rounded-full"
                        style={{ width: `${Math.min(100, inc.priority_score)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center: Geographical Map (2D or 3D) */}
        <div className="flex-1 h-full relative">
          {mapMode === '2D' ? (
            <IncidentMap
              incidents={filteredIncidents}
              teams={teams}
              depots={depots}
              selectedIncident={selectedIncident}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
            />
          ) : (
            <CommandCenter3D
              incidents={filteredIncidents}
              teams={teams}
              depots={depots}
              selectedIncident={selectedIncident}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
            />
          )}
        </div>

        {/* Right Pane: Incident Detail & Triage Drawer */}
        {selectedIncident && (
          <TriageDrawer
            incident={selectedIncident}
            onClose={() => setSelectedIncident(null)}
            onIncidentUpdated={() => {
              refetchIncidents();
            }}
          />
        )}
      </div>
    </div>
  );
};
