import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Shield,
  Truck,
  Box,
  LayoutDashboard,
  Activity,
  FileText,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useUI } from '../context/UIContext';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
import { Incident, ResponseTeam, Depot } from '../types';

export const CommandPalette: React.FC = () => {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUI();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const { data: incidents = [] } = useQuery<Incident[]>({
    queryKey: ['incidents'],
    queryFn: () => apiRequest<Incident[]>('/incidents'),
    enabled: commandPaletteOpen,
  });

  const { data: teams = [] } = useQuery<ResponseTeam[]>({
    queryKey: ['teams'],
    queryFn: () => apiRequest<ResponseTeam[]>('/teams'),
    enabled: commandPaletteOpen,
  });

  const { data: depots = [] } = useQuery<Depot[]>({
    queryKey: ['depots'],
    queryFn: () => apiRequest<Depot[]>('/inventory/depots'),
    enabled: commandPaletteOpen,
  });

  if (!commandPaletteOpen) return null;

  const q = query.toLowerCase();

  const navigationItems = [
    { title: 'Operations Overview', path: '/', icon: LayoutDashboard, category: 'Navigation' },
    { title: 'Command Center Map', path: '/command', icon: MapPin, category: 'Navigation' },
    { title: 'Citizen Emergency Portal', path: '/citizen', icon: Shield, category: 'Navigation' },
    { title: 'Incident Tracking', path: '/track', icon: Search, category: 'Navigation' },
    { title: 'Field Responder Dispatch', path: '/responder', icon: Truck, category: 'Navigation' },
    { title: 'Relief Inventory & Depots', path: '/inventory', icon: Box, category: 'Navigation' },
    { title: 'Scenario Commander (3D)', path: '/scenarios', icon: Sparkles, category: 'Navigation' },
    { title: 'Operational Analytics & KPIs', path: '/analytics', icon: Activity, category: 'Navigation' },
    { title: 'Cloud Infrastructure & Health', path: '/health', icon: FileText, category: 'Navigation' },
  ].filter((item) => item.title.toLowerCase().includes(q));

  const filteredIncidents = incidents
    .filter(
      (inc) =>
        inc.tracking_id.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.address.toLowerCase().includes(q)
    )
    .slice(0, 4);

  const filteredTeams = teams
    .filter((t) => t.name.toLowerCase().includes(q) || t.team_type.toLowerCase().includes(q))
    .slice(0, 3);

  const filteredDepots = depots
    .filter((d) => d.name.toLowerCase().includes(q) || d.location_name.toLowerCase().includes(q))
    .slice(0, 3);

  const handleSelect = (path: string) => {
    navigate(path);
    setCommandPaletteOpen(false);
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl bg-rq-surface dark:bg-rq-surface border border-rq-border rounded-card shadow-floating overflow-hidden text-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center px-4 py-3 border-b border-rq-border bg-rq-surface-2">
          <Search className="w-4 h-4 text-rq-muted mr-3 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, incident (e.g. INC-1042), squad or depot..."
            className="w-full bg-transparent text-rq-ink placeholder:text-rq-muted focus:outline-none text-sm"
          />
          <span className="px-1.5 py-0.5 text-xs font-mono text-rq-muted bg-rq-surface border border-rq-border rounded">
            ESC
          </span>
        </div>

        {/* Results Container */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-3">
          {/* Navigation */}
          {navigationItems.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-semibold text-rq-muted uppercase tracking-wider">
                Pages & Portals
              </div>
              <div className="space-y-0.5">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleSelect(item.path)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-rq-surface-2 transition text-rq-ink group text-left"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className="w-4 h-4 text-rq-muted group-hover:text-rq-ink" />
                        <span className="font-medium text-xs">{item.title}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-rq-muted opacity-0 group-hover:opacity-100 transition" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Incidents */}
          {filteredIncidents.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-semibold text-rq-muted uppercase tracking-wider">
                Active Incidents
              </div>
              <div className="space-y-0.5">
                {filteredIncidents.map((inc) => (
                  <button
                    key={inc.id}
                    onClick={() => handleSelect(`/track?code=${inc.tracking_id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-rq-surface-2 transition text-rq-ink group text-left"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="font-mono text-xs font-semibold text-rq-navy">
                        {inc.tracking_id}
                      </span>
                      <span className="text-xs truncate">{inc.title}</span>
                    </div>
                    <span className="text-xs font-mono text-rq-muted flex-shrink-0 ml-2">
                      Score: {inc.priority_score.toFixed(0)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Response Teams */}
          {filteredTeams.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-semibold text-rq-muted uppercase tracking-wider">
                Rescue Squads
              </div>
              <div className="space-y-0.5">
                {filteredTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleSelect('/responder')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-rq-surface-2 transition text-rq-ink group text-left"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Truck className="w-4 h-4 text-rq-muted" />
                      <span className="text-xs truncate">{team.name}</span>
                    </div>
                    <span className="text-xs font-mono text-rq-muted flex-shrink-0 ml-2">
                      {team.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Depots */}
          {filteredDepots.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-semibold text-rq-muted uppercase tracking-wider">
                Relief Depots
              </div>
              <div className="space-y-0.5">
                {filteredDepots.map((depot) => (
                  <button
                    key={depot.id}
                    onClick={() => handleSelect('/inventory')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-rq-surface-2 transition text-rq-ink group text-left"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Box className="w-4 h-4 text-rq-muted" />
                      <span className="text-xs truncate">{depot.name}</span>
                    </div>
                    <span className="text-xs font-mono text-rq-muted flex-shrink-0 ml-2">
                      {depot.depot_type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {navigationItems.length === 0 &&
            filteredIncidents.length === 0 &&
            filteredTeams.length === 0 && (
              <div className="py-8 text-center text-xs text-rq-muted">
                No matching results found for "{query}".
              </div>
            )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 bg-rq-surface-2 border-t border-rq-border flex items-center justify-between text-xs text-rq-muted font-mono">
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>ResQGrid Dispatch Core</span>
        </div>
      </div>
    </div>
  );
};

