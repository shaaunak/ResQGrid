import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Shield,
  Clock,
  MapPin,
  Truck,
  Box,
  Cloud,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Layers,
  ArrowRight,
  Sparkles,
  Server,
  Play,
  RotateCcw,
  Sliders,
  ExternalLink,
  Users,
  Building,
  Check,
  Search,
  Filter,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { SeverityBadge, StatusBadge } from '../components/StatusBadge';
import { MissionTraceResponse, TraceTimelineEvent } from '../types';

export const MissionTracePage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active lookup tracking ID or incident ID (default to URL param or seed example)
  const [activeCode, setActiveCode] = useState<string>(
    incidentId || searchParams.get('id') || 'INC-28150'
  );
  const [inputCode, setInputCode] = useState<string>(activeCode);

  // Timeline Filter & Selection
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  // Fetch Mission Trace Data
  const {
    data: trace,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<MissionTraceResponse>({
    queryKey: ['mission-trace', activeCode],
    queryFn: () => apiRequest<MissionTraceResponse>(`/incidents/${activeCode.trim().toUpperCase()}/trace`),
    enabled: !!activeCode,
    refetchInterval: 5000,
  });

  // Filtered timeline events
  const timelineEvents = trace?.timeline || [];
  const filteredEvents = timelineEvents.filter((ev) => {
    if (selectedCategory === 'ALL') return true;
    return ev.category === selectedCategory;
  });

  // Map Initialization & Updates
  useEffect(() => {
    if (!mapContainerRef.current || !trace) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([trace.incident.latitude, trace.incident.longitude], 13);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      const markers = L.layerGroup().addTo(map);
      markerGroupRef.current = markers;
      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 250);
    }

    const map = mapInstanceRef.current;
    const markers = markerGroupRef.current;
    if (!map || !markers) return;

    markers.clearLayers();

    const inc = trace.incident;

    // 1. Incident Marker
    const incidentIcon = L.divIcon({
      className: 'custom-incident-pin',
      html: `
        <div style="background-color: #C8201B; width: 34px; height: 34px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const incMarker = L.marker([inc.latitude, inc.longitude], { icon: incidentIcon }).addTo(markers);
    incMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 4px;">
        <strong style="color: #12161C; font-size: 14px;">${inc.tracking_id}</strong><br/>
        <span style="color: #5A6472;">${inc.title}</span><br/>
        <div style="margin-top: 6px; font-weight: 600; color: #C8201B;">${inc.category} • ${inc.severity}</div>
      </div>
    `);

    // 2. Team Markers
    trace.assignments.forEach((asg) => {
      const teamIcon = L.divIcon({
        className: 'custom-team-pin',
        html: `
          <div style="background-color: #14284B; width: 32px; height: 32px; border-radius: 50%; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const teamMarker = L.marker([asg.team_current_latitude, asg.team_current_longitude], {
        icon: teamIcon,
      }).addTo(markers);

      teamMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 4px;">
          <strong style="color: #12161C; font-size: 14px;">${asg.team_name}</strong><br/>
          <span style="color: #5A6472;">Status: ${asg.status}</span><br/>
          <span style="color: #14284B; font-weight: 600;">${asg.team_type}</span>
        </div>
      `);

      // Draw connection line between team base/current and incident
      L.polyline(
        [
          [asg.team_current_latitude, asg.team_current_longitude],
          [inc.latitude, inc.longitude],
        ],
        { color: '#14284B', weight: 2.5, dashArray: '6, 6', opacity: 0.65 }
      ).addTo(markers);
    });

    // Fit Bounds
    const bounds = L.latLngBounds([[inc.latitude, inc.longitude]]);
    trace.assignments.forEach((asg) => {
      bounds.extend([asg.team_current_latitude, asg.team_current_longitude]);
    });
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    map.invalidateSize();
  }, [trace]);

  // Focus map when clicking an event with coordinates
  const handleFocusEvent = (ev: TraceTimelineEvent) => {
    setActiveEventId(ev.id);
    if (ev.latitude && ev.longitude && mapInstanceRef.current) {
      mapInstanceRef.current.setView([ev.latitude, ev.longitude], 15, { animate: true });
    }
  };

  // Playback timer loop
  useEffect(() => {
    let timer: any;
    if (isPlaying && filteredEvents.length > 0) {
      timer = setInterval(() => {
        setPlaybackIndex((prev) => {
          const next = prev + 1;
          if (next >= filteredEvents.length) {
            setIsPlaying(false);
            return 0;
          }
          handleFocusEvent(filteredEvents[next]);
          return next;
        });
      }, 1800);
    }
    return () => clearInterval(timer);
  }, [isPlaying, filteredEvents]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      setActiveCode(inputCode.trim());
      navigate(`/mission-trace/${inputCode.trim().toUpperCase()}`);
    }
  };

  const handleExport = () => {
    if (trace?.export_url) {
      window.open(trace.export_url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-rq-bg pb-16">
      {/* Header Bar */}
      <div className="border-b border-rq-border bg-rq-surface px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rq-brand-navy flex items-center justify-center text-white shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-rq-ink">Mission Trace Dossier</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-900 border border-amber-300">
                  Forensic Audit Trail
                </span>
              </div>
              <p className="text-xs text-rq-muted mt-0.5">
                PostgreSQL transactional audit trail, explainable priority scoring, and AWS cloud outbox verification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-4 h-4 text-rq-muted absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Lookup (e.g. INC-28150)"
                className="pl-9 pr-3 py-1.5 text-sm bg-rq-surface-2 border border-rq-border rounded-lg text-rq-ink focus:outline-none focus:border-rq-brand-navy w-48 md:w-56 font-mono"
              />
            </form>

            <button
              onClick={handleExport}
              disabled={!trace}
              className="flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold rounded-lg bg-rq-surface hover:bg-rq-surface-2 border border-rq-border text-rq-ink transition-colors shadow-xs disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-rq-brand-navy" />
              <span>Export Audit</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-rq-muted">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rq-brand-navy mb-4" />
            <p className="text-sm font-medium">Reconstructing forensic mission timeline from PostgreSQL records...</p>
          </div>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-900 mb-6">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>Failed to load Mission Trace for {activeCode}</span>
            </div>
            <p className="text-xs text-red-700">
              {(error as any)?.message || 'Incident not found or unauthorized access.'}
            </p>
          </div>
        )}

        {trace && (
          <div className="space-y-6">
            {/* Quick KPI Milestone Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-rq-surface border border-rq-border rounded-xl p-3 shadow-xs">
                <span className="text-xs text-rq-muted font-medium">Incident Age</span>
                <p className="text-lg font-bold text-rq-ink mt-0.5">{trace.durations.incident_age_display}</p>
                <span className="text-[11px] text-rq-muted">Registered at T+00:00</span>
              </div>
              <div className="bg-rq-surface border border-rq-border rounded-xl p-3 shadow-xs">
                <span className="text-xs text-rq-muted font-medium">Time to Verification</span>
                <p className="text-lg font-bold text-emerald-700 mt-0.5">
                  {trace.durations.time_to_verification_display || 'Pending'}
                </p>
                <span className="text-[11px] text-rq-muted">Operator approval</span>
              </div>
              <div className="bg-rq-surface border border-rq-border rounded-xl p-3 shadow-xs">
                <span className="text-xs text-rq-muted font-medium">Time to Dispatch</span>
                <p className="text-lg font-bold text-rq-brand-navy mt-0.5">
                  {trace.durations.time_to_assignment_display || 'In Queue'}
                </p>
                <span className="text-[11px] text-rq-muted">Unit matching decision</span>
              </div>
              <div className="bg-rq-surface border border-rq-border rounded-xl p-3 shadow-xs">
                <span className="text-xs text-rq-muted font-medium">Time to Acceptance</span>
                <p className="text-lg font-bold text-sky-700 mt-0.5">
                  {trace.durations.time_to_acceptance_display || 'Awaiting'}
                </p>
                <span className="text-[11px] text-rq-muted">Responder mobilized</span>
              </div>
              <div className="bg-rq-surface border border-rq-border rounded-xl p-3 shadow-xs col-span-2 md:col-span-1">
                <span className="text-xs text-rq-muted font-medium">Time to Resolution</span>
                <p className="text-lg font-bold text-purple-700 mt-0.5">
                  {trace.durations.time_to_resolution_display || 'Active Operation'}
                </p>
                <span className="text-[11px] text-rq-muted">Mission completion</span>
              </div>
            </div>

            {/* SECTION A & B: Incident Origin + Explainable Priority Engine */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* SECTION A: Origin Card */}
              <div className="lg:col-span-7 bg-rq-surface border border-rq-border rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-rq-border pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rq-muted">Section A</span>
                    <h2 className="text-base font-bold text-rq-ink">Incident Origin & Provenance</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={trace.incident.severity} />
                    <StatusBadge status={trace.incident.status} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-rq-muted font-medium">Incident Tracking Identifier</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-base font-mono font-bold text-rq-brand-navy bg-rq-surface-2 px-2 py-0.5 rounded border border-rq-border">
                        {trace.incident.tracking_id}
                      </span>
                      <span className="text-xs text-rq-muted">({trace.incident.incident_id})</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-rq-ink">{trace.incident.title}</h3>
                    <p className="text-xs text-rq-muted mt-1 leading-relaxed">{trace.incident.description}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-rq-border text-xs">
                    <div>
                      <span className="text-rq-muted block">Category</span>
                      <span className="font-semibold text-rq-ink">{trace.incident.category}</span>
                    </div>
                    <div>
                      <span className="text-rq-muted block">Affected People</span>
                      <span className="font-semibold text-rq-ink">{trace.incident.affected_people} citizens</span>
                    </div>
                    <div>
                      <span className="text-rq-muted block">Duplicate Merge</span>
                      <span className="font-semibold text-rq-brand-navy">
                        {trace.incident.report_count} Reports combined
                      </span>
                    </div>
                    <div>
                      <span className="text-rq-muted block">Triage Verifier</span>
                      <span className="font-semibold text-rq-ink">
                        {trace.incident.verified_by_name || 'Automated Queue'}
                      </span>
                    </div>
                  </div>

                  {trace.incident.merged_reports.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50/60 border border-blue-200/80 rounded-lg">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 mb-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>Spatial-Temporal Merged Citizen Reports ({trace.incident.merged_reports.length})</span>
                      </div>
                      <div className="space-y-1 text-xs text-blue-800">
                        {trace.incident.merged_reports.map((mr) => (
                          <div key={mr.id} className="flex items-center justify-between">
                            <span>
                              <strong className="font-mono">{mr.tracking_id}</strong>: {mr.title}
                            </span>
                            <span className="text-[11px] text-blue-600">+{mr.affected_people} people</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {trace.incident.evidence.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs text-rq-muted font-medium block mb-1">Attached S3 Evidence Vault</span>
                      <div className="flex flex-wrap gap-2">
                        {trace.incident.evidence.map((ev) => (
                          <a
                            key={ev.id}
                            href={ev.file_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-rq-surface-2 border border-rq-border rounded hover:border-rq-brand-navy text-rq-ink"
                          >
                            <FileText className="w-3 h-3 text-rq-brand-navy" />
                            <span>{ev.file_name}</span>
                            <span className="text-[10px] text-rq-muted">({Math.round(ev.file_size / 1024)} KB)</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION B: Explainable Priority Card */}
              <div className="lg:col-span-5 bg-rq-surface border border-rq-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-rq-border pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-rq-muted">Section B</span>
                      <h2 className="text-base font-bold text-rq-ink">Explainable Priority Engine</h2>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-rq-surface-2 border border-rq-border text-rq-brand-navy">
                      {trace.priority.config_version}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-xs font-semibold text-rq-muted">Calculated Heuristic Score</span>
                    <div className="text-right">
                      <span className="text-3xl font-black text-rq-brand-navy">
                        {trace.priority.total_score.toFixed(1)}
                      </span>
                      <span className="text-xs text-rq-muted font-medium"> / 100.0</span>
                    </div>
                  </div>

                  {/* Factor Breakdown Bars */}
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <div className="flex justify-between text-rq-muted mb-1 font-medium">
                        <span>Severity Factor (35%)</span>
                        <span className="text-rq-ink font-semibold">{trace.priority.severity_factor.toFixed(1)} pts</span>
                      </div>
                      <div className="h-1.5 w-full bg-rq-surface-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-600 rounded-full"
                          style={{ width: `${Math.min(100, trace.priority.severity_factor)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-rq-muted mb-1 font-medium">
                        <span>Impact Factor (25%)</span>
                        <span className="text-rq-ink font-semibold">{trace.priority.impact_factor.toFixed(1)} pts</span>
                      </div>
                      <div className="h-1.5 w-full bg-rq-surface-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-600 rounded-full"
                          style={{ width: `${Math.min(100, trace.priority.impact_factor)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-rq-muted mb-1 font-medium">
                        <span>Wait Time Factor (20% Starvation Prevention)</span>
                        <span className="text-rq-ink font-semibold">{trace.priority.wait_time_factor.toFixed(1)} pts</span>
                      </div>
                      <div className="h-1.5 w-full bg-rq-surface-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${Math.min(100, trace.priority.wait_time_factor)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-rq-muted mb-1 font-medium">
                        <span>Vulnerability / Hazard Urgency (20%)</span>
                        <span className="text-rq-ink font-semibold">{trace.priority.vulnerability_factor.toFixed(1)} pts</span>
                      </div>
                      <div className="h-1.5 w-full bg-rq-surface-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${Math.min(100, trace.priority.vulnerability_factor)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-rq-border">
                  <div className="text-[11px] text-rq-muted leading-relaxed italic bg-rq-surface-2 p-2.5 rounded-lg border border-rq-border">
                    &ldquo;{trace.priority.explanation}&rdquo;
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION C & D: Team Selection & Inventory Reservations */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* SECTION C: Team Selection */}
              <div className="lg:col-span-7 bg-rq-surface border border-rq-border rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-rq-border pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rq-muted">Section C</span>
                    <h2 className="text-base font-bold text-rq-ink">Tactical Unit Dispatch Decision</h2>
                  </div>
                  <span className="text-xs text-rq-muted">Haversine spatial ranking</span>
                </div>

                {trace.assignments.length === 0 ? (
                  <p className="text-xs text-rq-muted py-6 text-center">No response squad currently assigned.</p>
                ) : (
                  <div className="space-y-4">
                    {trace.assignments.map((asg) => (
                      <div key={asg.assignment_id} className="space-y-3">
                        <div className="flex items-start justify-between p-3.5 bg-rq-surface-2 border border-rq-border rounded-xl">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-rq-ink">{asg.team_name}</h4>
                              <span className="text-xs px-2 py-0.5 rounded bg-rq-brand-navy/10 text-rq-brand-navy font-semibold">
                                {asg.team_type}
                              </span>
                            </div>
                            <p className="text-xs text-rq-muted mt-1">
                              Dispatched by <strong>{asg.assigned_by_name}</strong> • Mission Status:{' '}
                              <span className="font-semibold text-rq-ink">{asg.status}</span>
                            </p>
                          </div>
                          {asg.is_operator_override ? (
                            <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-100 text-amber-900 border border-amber-300">
                              Operator Override
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Top Match
                            </span>
                          )}
                        </div>

                        {asg.is_operator_override && asg.override_reason && (
                          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                            <strong>Override Audit Reason:</strong> {asg.override_reason}
                          </div>
                        )}

                        {asg.candidate_snapshots.length > 0 && (
                          <div>
                            <span className="text-xs font-semibold text-rq-muted block mb-2">
                              Evaluated Candidate Squads (Decision Snapshot)
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              {asg.candidate_snapshots.map((c) => (
                                <div
                                  key={c.team_id}
                                  className={`p-2.5 rounded-lg border text-xs ${
                                    c.team_id === asg.team_id
                                      ? 'bg-blue-50/50 border-blue-300'
                                      : 'bg-rq-surface-2 border-rq-border'
                                  }`}
                                >
                                  <div className="font-bold text-rq-ink truncate">{c.team_name}</div>
                                  <div className="text-[11px] text-rq-muted mt-0.5">
                                    Match: <strong>{c.suitability_score}%</strong> • Dist:{' '}
                                    {c.distance_km ? `${c.distance_km} km` : 'Near'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION D: Inventory Allocation */}
              <div className="lg:col-span-5 bg-rq-surface border border-rq-border rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-rq-border pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rq-muted">Section D</span>
                    <h2 className="text-base font-bold text-rq-ink">Inventory Allocation Ledger</h2>
                  </div>
                  <span className="text-xs text-rq-muted">Row-level locking</span>
                </div>

                {trace.inventory_reservations.length === 0 ? (
                  <p className="text-xs text-rq-muted py-6 text-center">
                    No warehouse relief stock reserved for this mission.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {trace.inventory_reservations.map((inv) => (
                      <div
                        key={inv.reservation_id}
                        className="p-3 bg-rq-surface-2 border border-rq-border rounded-lg text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-rq-ink">{inv.item_name}</div>
                          <span className="text-[11px] text-rq-muted">
                            {inv.depot_name} ({inv.depot_location}) • SKU: {inv.item_sku}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-sm text-rq-brand-navy">
                            {inv.quantity_reserved} {inv.unit}
                          </span>
                          <div className="text-[10px] text-emerald-700 font-semibold uppercase">{inv.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION E: Cloud Event Processing & Transactional Outbox */}
            <div className="bg-rq-surface border border-rq-border rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-rq-border pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rq-muted">Section E</span>
                  <h2 className="text-base font-bold text-rq-ink">Cloud Outbox & SQS Event Pipeline</h2>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Transactional Outbox Active
                  </span>
                </div>
              </div>

              {trace.cloud_outbox_events.length === 0 ? (
                <p className="text-xs text-rq-muted py-4 text-center">No outbox events recorded for this incident.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {trace.cloud_outbox_events.map((ob) => (
                    <div key={ob.id} className="p-3 bg-rq-surface-2 border border-rq-border rounded-lg text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-rq-brand-navy text-[11px]">{ob.event_type}</span>
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                            ob.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ob.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {ob.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-rq-muted">
                        Correlation: <strong className="font-mono text-rq-ink">{ob.correlation_id}</strong>
                      </div>

                      <div className="text-[11px] text-rq-muted truncate">
                        Key: <span className="font-mono text-[10px]">{ob.idempotency_key}</span>
                      </div>

                      <div className="text-[11px] text-emerald-800 bg-emerald-50/80 p-1.5 rounded border border-emerald-200">
                        {ob.cloud_delivery_status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION F: Centerpiece Synchronized Event Timeline + Map */}
            <div className="bg-rq-surface border border-rq-border rounded-xl p-5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-rq-border pb-3 mb-4 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rq-muted">Section F</span>
                  <h2 className="text-base font-bold text-rq-ink">Synchronized Incident Timeline & Map View</h2>
                </div>

                {/* Timeline Category Filters & Playback Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-rq-surface-2 p-1 rounded-lg border border-rq-border text-xs">
                    {['ALL', 'INCIDENT', 'ASSIGNMENT', 'INVENTORY', 'OUTBOX'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2 py-1 rounded font-medium transition-colors ${
                          selectedCategory === cat
                            ? 'bg-rq-surface text-rq-brand-navy font-bold shadow-xs'
                            : 'text-rq-muted hover:text-rq-ink'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (!isPlaying) setPlaybackIndex(0);
                      setIsPlaying(!isPlaying);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      isPlaying
                        ? 'bg-amber-100 border-amber-300 text-amber-900'
                        : 'bg-rq-brand-navy text-white border-rq-brand-navy hover:bg-rq-brand-navy/90'
                    }`}
                  >
                    {isPlaying ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? 'Pause Playback' : 'Replay Timeline'}</span>
                  </button>
                </div>
              </div>

              {/* Split View: Vertical Timeline on Left, Map on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Vertical Timeline */}
                <div className="lg:col-span-6 space-y-3 max-h-[520px] overflow-y-auto pr-2">
                  {filteredEvents.length === 0 ? (
                    <p className="text-xs text-rq-muted py-6 text-center">No events matching selected filter.</p>
                  ) : (
                    filteredEvents.map((ev, index) => {
                      const isSelected = activeEventId === ev.id || (isPlaying && playbackIndex === index);

                      return (
                        <div
                          key={ev.id}
                          onClick={() => handleFocusEvent(ev)}
                          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-50/70 border-rq-brand-navy shadow-sm ring-1 ring-rq-brand-navy/20'
                              : 'bg-rq-surface-2 border-rq-border hover:border-rq-muted'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-rq-brand-navy bg-rq-surface px-1.5 py-0.5 rounded border border-rq-border">
                                {ev.relative_time}
                              </span>
                              <span className="font-bold text-rq-ink">{ev.title}</span>
                            </div>
                            <span className="text-[10px] text-rq-muted">
                              {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
                            </span>
                          </div>

                          <p className="text-xs text-rq-muted leading-relaxed">{ev.description}</p>

                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-rq-border text-[11px] text-rq-muted">
                            <span>
                              Actor: <strong className="text-rq-ink">{ev.actor_name}</strong> ({ev.actor_role})
                            </span>
                            {ev.latitude && ev.longitude && (
                              <span className="text-blue-700 font-medium flex items-center gap-0.5">
                                <MapPin className="w-3 h-3" /> Focus
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Leaflet Spatial Map Container */}
                <div className="lg:col-span-6 flex flex-col">
                  <div
                    ref={mapContainerRef}
                    className="w-full h-[520px] rounded-xl border border-rq-border overflow-hidden shadow-inner"
                  />
                  <div className="flex items-center justify-between text-[11px] text-rq-muted mt-2 px-1">
                    <span>Red: Emergency Epicenter • Navy: Dispatched Unit Station</span>
                    <span>Coordinates from database records</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
