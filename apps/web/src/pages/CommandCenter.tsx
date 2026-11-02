import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Filter,
  RefreshCw,
  Search,
  Activity,
  Layers,
  ChevronDown,
  Clock,
  Sparkles,
  Box,
  Map as MapIcon,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { IncidentMap } from '../components/IncidentMap';
import { CommandCenter3D } from '../components/three/CommandCenter3D';
import { TriageDrawer } from '../components/TriageDrawer';
import { SeverityBadge, StatusBadge } from '../components/StatusBadge';
import { Incident, ResponseTeam, Depot, IncidentStatus, IncidentSeverity, IncidentCategory } from '../types';

export const CommandCenter: React.FC = () => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapMode, setMapMode] = useState<'2D' | '3D'>('2D');

  // Fetch Incidents (polling every 4 seconds)
  const {
    data: incidents = [],
    isLoading: loadingIncidents,
    refetch: refetchIncidents,
    isFetching,
  } = useQuery<Incident[]>({
    queryKey: ['incidents', statusFilter, severityFilter],
    queryFn: async () => {
      let queryParams = [];
      if (statusFilter !== 'ALL') queryParams.push(`status=${statusFilter}`);
      if (severityFilter !== 'ALL') queryParams.push(`severity=${severityFilter}`);
      const qs = queryParams.length ? `?${queryParams.join('&')}` : '';
      return apiRequest<Incident[]>(`/incidents${qs}`);
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

  // Filtered incidents for queue list
  const filteredIncidents = incidents.filter((inc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inc.title.toLowerCase().includes(q) ||
      inc.tracking_id.toLowerCase().includes(q) ||
      inc.address.toLowerCase().includes(q)
    );
  });

  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length;
  const activeCount = incidents.filter((i) => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(i.status)).length;

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-command-darkest overflow-hidden">
      {/* Top ECC Operational Bar */}
      <div className="h-12 bg-command-surface border-b border-command-border px-4 flex items-center justify-between text-xs font-mono select-none">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-white font-semibold">
            <Activity className="w-4 h-4 text-command-teal animate-pulse" />
            <span className="tracking-wide">Emergency Command Center (ECC)</span>
            <span className="px-2 py-0.5 rounded bg-command-card text-[10px] text-command-muted border border-command-border">
              MUMBAI GRID
            </span>
          </div>

          <div className="hidden lg:flex items-center space-x-3 text-[11px] text-command-muted">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-command-red" />
              <span>{criticalCount} CRITICAL</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-command-teal" />
              <span>{activeCount} ACTIVE DISPATCHES</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>{teams.filter((t) => t.status === 'AVAILABLE').length} UNITS READY</span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* 2D / 3D Visualization Switcher */}
          <div className="flex items-center bg-command-card border border-command-border rounded p-0.5 text-[11px] font-mono">
            <button
              onClick={() => setMapMode('2D')}
              className={`px-2.5 py-1 rounded flex items-center space-x-1 transition ${
                mapMode === '2D'
                  ? 'bg-command-teal text-white font-semibold shadow'
                  : 'text-command-muted hover:text-white'
              }`}
            >
              <MapIcon className="w-3 h-3" />
              <span>2D Map</span>
            </button>
            <button
              onClick={() => setMapMode('3D')}
              className={`px-2.5 py-1 rounded flex items-center space-x-1 transition ${
                mapMode === '3D'
                  ? 'bg-command-teal text-white font-semibold shadow'
                  : 'text-command-muted hover:text-white'
              }`}
            >
              <Box className="w-3 h-3" />
              <span>3D Tactical</span>
            </button>
          </div>

          <button
            onClick={() => refetchIncidents()}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-command-card hover:bg-command-border border border-command-border text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-command-teal' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Command Workspace: Left Queue | Center 2D/3D Map | Right Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Incident Queue Rail */}
        <div className="w-80 md:w-96 bg-command-surface/95 border-r border-command-border flex flex-col z-10 shadow-lg">
          {/* Queue Filters & Search */}
          <div className="p-3 border-b border-command-border space-y-2 bg-command-darkest/40">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <span>Incident Queue</span>
                <span className="text-command-teal bg-command-card px-1.5 py-0.2 rounded text-[10px]">
                  {filteredIncidents.length} shown
                </span>
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-command-muted absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search location, code or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-command-surface border border-command-border rounded text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-command-teal font-mono"
              />
            </div>

            {/* Filter Pills */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1 bg-command-card border border-command-border rounded text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="REPORTED">Reported</option>
                <option value="VERIFIED">Verified</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-2 py-1 bg-command-card border border-command-border rounded text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Urgencies</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Incident List */}
          <div className="flex-1 overflow-y-auto divide-y divide-command-border/40">
            {loadingIncidents ? (
              <div className="p-6 text-center text-command-muted font-mono text-xs">
                Syncing Mumbai incident grid...
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="p-6 text-center text-command-muted text-xs">No incidents match current filter criteria.</div>
            ) : (
              filteredIncidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-3 transition cursor-pointer ${
                      isSelected
                        ? 'bg-command-teal/15 border-l-4 border-command-teal'
                        : 'hover:bg-command-card/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-xs font-bold text-white tracking-wide">
                          {inc.tracking_id}
                        </span>
                        <SeverityBadge severity={inc.severity} />
                      </div>
                      <StatusBadge status={inc.status} />
                    </div>

                    <h3 className="text-xs font-medium text-slate-200 truncate mb-1">{inc.title}</h3>

                    <p className="text-[11px] text-command-muted line-clamp-2 leading-relaxed mb-2">
                      {inc.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="truncate max-w-[180px]">{inc.address.split(',')[0]}</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-command-teal font-semibold">
                          Score: {inc.priority_score.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center: Full-Screen Geographical Map (2D Leaflet or 3D Tactical Sphere) */}
        <div className="flex-1 h-full relative">
          {mapMode === '2D' ? (
            <IncidentMap
              incidents={incidents}
              teams={teams}
              depots={depots}
              selectedIncident={selectedIncident}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
            />
          ) : (
            <CommandCenter3D
              incidents={incidents}
              teams={teams}
              depots={depots}
              selectedIncident={selectedIncident}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
            />
          )}
        </div>

        {/* Right: Selected Incident & Triage Drawer */}
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
