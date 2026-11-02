import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Truck,
  Clock,
  Box,
  ArrowUpRight,
  Shield,
  Activity,
  ChevronRight,
  CheckCircle,
  MapPin,
  ExternalLink,
  Flame,
  Waves,
  Building2,
  Wind,
  Plus,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { TacticalCityScene } from '../components/three/TacticalCityScene';
import { SeverityBadge, StatusBadge } from '../components/StatusBadge';
import { Incident, ResponseTeam } from '../types';

export const OverviewPage: React.FC = () => {
  // Real Operational Summary computed from database
  const { data: summary } = useQuery<{
    critical_count: number;
    active_dispatches: number;
    squads_ready: number;
    total_teams: number;
    depots_count: number;
  }>({
    queryKey: ['operational-summary'],
    queryFn: () => apiRequest('/incidents/operational-summary'),
    refetchInterval: 5000,
  });

  const { data: incidents = [] } = useQuery<Incident[]>({
    queryKey: ['incidents'],
    queryFn: () => apiRequest<Incident[]>('/incidents'),
  });

  const { data: teams = [] } = useQuery<ResponseTeam[]>({
    queryKey: ['teams'],
    queryFn: () => apiRequest<ResponseTeam[]>('/teams'),
  });

  // Animated counters
  const [criticalDisplay, setCriticalDisplay] = useState(0);
  const [dispatchesDisplay, setDispatchesDisplay] = useState(0);
  const [squadsDisplay, setSquadsDisplay] = useState(0);

  const targetCritical = summary?.critical_count ?? 2;
  const targetDispatches = summary?.active_dispatches ?? 4;
  const targetSquads = summary?.squads_ready ?? 5;

  useEffect(() => {
    const timer = setTimeout(() => {
      setCriticalDisplay(targetCritical);
      setDispatchesDisplay(targetDispatches);
      setSquadsDisplay(targetSquads);
    }, 100);
    return () => clearTimeout(timer);
  }, [targetCritical, targetDispatches, targetSquads]);

  // Needs attention candidates
  const unassignedCritical = incidents.filter(
    (i) => i.severity === 'CRITICAL' && i.status === 'REPORTED'
  );

  return (
    <div className="min-h-full flex flex-col bg-rq-bg text-rq-ink font-sans pb-16">
      {/* Top Banner / Hero Area */}
      <div className="border-b border-rq-border bg-rq-surface px-6 lg:px-10 py-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Big Headline & Live Metric Counters */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-pill bg-rq-surface-2 border border-rq-border text-xs text-rq-muted">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-rq-ink">Operations Active</span>
              <span>• Mumbai Metropolitan Region</span>
            </div>

            <div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight text-rq-ink leading-[1.1] mb-3">
                Intelligent emergency coordination across dynamic disaster theatres.
              </h1>
              <p className="text-sm sm:text-base text-rq-muted max-w-xl leading-relaxed">
                Multi-role triage, explainable AI priority scoring, and concurrent resource allocation across urban floods, building collapses, fires, and cyclones.
              </p>
            </div>

            {/* Live Counters with Sparkline Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-rq-surface-2 p-3.5 rounded-card border border-rq-border">
                <div className="flex items-center justify-between text-xs text-rq-muted mb-1">
                  <span>Critical Incidents</span>
                  <AlertCircle className="w-3.5 h-3.5 text-[#C8201B]" />
                </div>
                <div className="font-mono text-2xl font-bold tabular-nums text-rq-ink">
                  {criticalDisplay}
                </div>
                <div className="mt-1 flex items-center text-[10px] text-rq-muted">
                  <span className="text-[#C8201B] font-semibold mr-1">Immediate</span> triage required
                </div>
              </div>

              <div className="bg-rq-surface-2 p-3.5 rounded-card border border-rq-border">
                <div className="flex items-center justify-between text-xs text-rq-muted mb-1">
                  <span>Active Dispatches</span>
                  <Activity className="w-3.5 h-3.5 text-[#14284B]" />
                </div>
                <div className="font-mono text-2xl font-bold tabular-nums text-rq-ink">
                  {dispatchesDisplay}
                </div>
                <div className="mt-1 flex items-center text-[10px] text-rq-muted">
                  <span>Across 3 operational hubs</span>
                </div>
              </div>

              <div className="bg-rq-surface-2 p-3.5 rounded-card border border-rq-border">
                <div className="flex items-center justify-between text-xs text-rq-muted mb-1">
                  <span>Squads Ready</span>
                  <Truck className="w-3.5 h-3.5 text-[#2E7D5B]" />
                </div>
                <div className="font-mono text-2xl font-bold tabular-nums text-rq-ink">
                  {squadsDisplay}
                </div>
                <div className="mt-1 flex items-center text-[10px] text-rq-muted">
                  <span>100% capacity ready</span>
                </div>
              </div>

              <div className="bg-rq-surface-2 p-3.5 rounded-card border border-rq-border">
                <div className="flex items-center justify-between text-xs text-rq-muted mb-1">
                  <span>Median Response</span>
                  <Clock className="w-3.5 h-3.5 text-rq-muted" />
                </div>
                <div className="font-mono text-2xl font-bold tabular-nums text-rq-ink">
                  18.5m
                </div>
                <div className="mt-1 flex items-center text-[10px] text-emerald-600 font-medium">
                  <span>-2.1m vs baseline</span>
                </div>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/command"
                className="px-4 py-2 bg-rq-navy hover:bg-[#0E1D36] text-white text-xs font-semibold rounded-md shadow-subtle flex items-center space-x-2 transition"
              >
                <span>Open Command Center</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/citizen"
                className="px-4 py-2 bg-rq-surface-2 hover:bg-rq-border/40 text-rq-ink border border-rq-border text-xs font-semibold rounded-md transition flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-rq-muted" />
                <span>Submit Emergency Report</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Hero 3D Mini Tactical Scene */}
          <div className="lg:col-span-5 h-[340px] rounded-card border border-rq-border bg-slate-900 overflow-hidden relative shadow-floating">
            <TacticalCityScene
              waterLevel={1.4}
              showRadar={true}
            />
            <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-mono text-white flex items-center space-x-1.5 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>3D MUMBAI DIGITAL TWIN</span>
            </div>
            <Link
              to="/scenarios"
              className="absolute bottom-3 right-3 px-2.5 py-1 bg-white/90 hover:bg-white text-slate-900 rounded text-[11px] font-medium shadow-subtle flex items-center space-x-1 transition"
            >
              <span>Explore Scenarios</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Body: Needs Your Attention & Live Activity Feed */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 w-full space-y-8">
        {/* Section 1: Needs Your Attention Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-rq-ink">Needs your attention</h2>
              <p className="text-xs text-rq-muted">Priority items requiring human-in-the-loop operator action</p>
            </div>
            <span className="px-2 py-0.5 rounded-pill bg-amber-50 text-[#E27D14] border border-amber-200 text-xs font-mono font-medium">
              3 items pending
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Unassigned Critical Incident */}
            <div className="bg-rq-surface p-4 rounded-card border border-rq-border shadow-subtle flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-rq-navy">INC-1042</span>
                  <SeverityBadge severity="CRITICAL" />
                </div>
                <h3 className="font-semibold text-xs text-rq-ink">
                  Severe waterlogging & 12 citizens stranded near Mithi River
                </h3>
                <p className="text-xs text-rq-muted line-clamp-2">
                  Flood waters rising near Kranti Nagar Bridge. 3 seniors and 2 infants trapped.
                </p>
              </div>
              <div className="pt-2 border-t border-rq-border flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-rq-muted">2 reports merged</span>
                <Link
                  to="/command"
                  className="px-3 py-1 bg-rq-navy hover:bg-[#0E1D36] text-white rounded text-xs font-medium transition"
                >
                  Verify & Dispatch
                </Link>
              </div>
            </div>

            {/* Card 2: Low-stock Item at Depot */}
            <div className="bg-rq-surface p-4 rounded-card border border-rq-border shadow-subtle flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#E27D14]">KUR-DEPOT</span>
                  <span className="px-2 py-0.5 rounded-pill text-[11px] font-medium bg-amber-50 text-[#E27D14] border border-amber-200">
                    Low Stock Alert
                  </span>
                </div>
                <h3 className="font-semibold text-xs text-rq-ink">
                  Thermal emergency blankets below minimum safe threshold
                </h3>
                <p className="text-xs text-rq-muted">
                  Available: 12 units (Minimum threshold: 25). Frontline depot near Kurla basin.
                </p>
              </div>
              <div className="pt-2 border-t border-rq-border flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-rq-muted">Kurla West Station</span>
                <Link
                  to="/inventory"
                  className="px-3 py-1 bg-rq-surface-2 hover:bg-rq-border text-rq-ink border border-rq-border rounded text-xs font-medium transition"
                >
                  Transfer Stock
                </Link>
              </div>
            </div>

            {/* Card 3: SLA Wait Time Warning */}
            <div className="bg-rq-surface p-4 rounded-card border border-rq-border shadow-subtle flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-rq-navy">INC-2041</span>
                  <span className="px-2 py-0.5 rounded-pill text-[11px] font-medium bg-red-50 text-[#C8201B] border border-red-200">
                    SLA Warning
                  </span>
                </div>
                <h3 className="font-semibold text-xs text-rq-ink">
                  Ambulance trapped in water on Dr. Ambedkar Road
                </h3>
                <p className="text-xs text-rq-muted">
                  Wait time exceeded 30 minutes. Anti-starvation boost increased priority to 81.
                </p>
              </div>
              <div className="pt-2 border-t border-rq-border flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-rq-muted">Hindmata Junction</span>
                <Link
                  to="/command"
                  className="px-3 py-1 bg-rq-navy hover:bg-[#0E1D36] text-white rounded text-xs font-medium transition"
                >
                  Prioritize Squad
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Supported Disaster Scenarios & Live Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Disaster Scenarios Coverage */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-rq-ink">Supported disaster scenarios</h2>
              <p className="text-xs text-rq-muted">
                ResQGrid coordinates rapid response across diverse catastrophic events
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-card bg-rq-surface border border-rq-border space-y-2">
                <div className="flex items-center space-x-2 text-rq-navy font-semibold text-xs">
                  <Waves className="w-4 h-4 text-blue-600" />
                  <span>Urban Floods & Inundation</span>
                </div>
                <p className="text-xs text-rq-muted leading-relaxed">
                  Real-time tidal water surge tracking, swiftwater boat dispatch, and shelter occupancy routing.
                </p>
              </div>

              <div className="p-3.5 rounded-card bg-rq-surface border border-rq-border space-y-2">
                <div className="flex items-center space-x-2 text-rq-navy font-semibold text-xs">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>Earthquake & Structural Collapse</span>
                </div>
                <p className="text-xs text-rq-muted leading-relaxed">
                  Heavy extrication team matching, perimeter cordon enforcement, and trauma medical units.
                </p>
              </div>

              <div className="p-3.5 rounded-card bg-rq-surface border border-rq-border space-y-2">
                <div className="flex items-center space-x-2 text-rq-navy font-semibold text-xs">
                  <Wind className="w-4 h-4 text-teal-600" />
                  <span>Coastal Cyclones & Storms</span>
                </div>
                <p className="text-xs text-rq-muted leading-relaxed">
                  Pre-emptive mass transit evacuation, relief kit air-drops, and power generator rationing.
                </p>
              </div>

              <div className="p-3.5 rounded-card bg-rq-surface border border-rq-border space-y-2">
                <div className="flex items-center space-x-2 text-rq-navy font-semibold text-xs">
                  <Flame className="w-4 h-4 text-[#E4572E]" />
                  <span>Urban & Hazmat Fires</span>
                </div>
                <p className="text-xs text-rq-muted leading-relaxed">
                  Hydrant pressure logistics, breathing apparatus stock reservations, and chemical containment.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Live Operational Activity Feed */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-rq-ink">Live activity feed</h2>
              <p className="text-xs text-rq-muted">Real-time audit trail and lifecycle transitions</p>
            </div>

            <div className="bg-rq-surface border border-rq-border rounded-card p-4 space-y-3">
              <div className="flex items-start space-x-3 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-semibold text-rq-navy">INC-1042</span>
                    <span className="text-rq-muted text-[11px]">2m ago</span>
                  </div>
                  <p className="text-rq-ink text-xs">
                    Corroborating citizen report merged (Report #2, tracking INC-75740).
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-rq-ink">Operator Deshmukh</span>
                    <span className="text-rq-muted text-[11px]">8m ago</span>
                  </div>
                  <p className="text-rq-ink text-xs">
                    Verified incident INC-2041 with Critical severity override.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-semibold text-rq-navy">Dadar Central</span>
                    <span className="text-rq-muted text-[11px]">15m ago</span>
                  </div>
                  <p className="text-rq-ink text-xs">
                    Reserved 15 trauma first aid kits for impending deployment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
