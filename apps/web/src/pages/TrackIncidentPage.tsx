import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import {
  Search,
  CheckCircle,
  Clock,
  Truck,
  MapPin,
  AlertTriangle,
  ArrowRight,
  Shield,
  Activity,
  Phone,
  Navigation,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { SeverityBadge, StatusBadge } from '../components/StatusBadge';
import { Incident } from '../types';

export const TrackIncidentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [trackingCode, setTrackingCode] = useState<string>(searchParams.get('code') || 'INC-5011');
  const [activeCode, setActiveCode] = useState<string>(searchParams.get('code') || 'INC-5011');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const {
    data: incident,
    isLoading,
    isError,
    refetch,
  } = useQuery<any>({
    queryKey: ['incident-tracking', activeCode],
    queryFn: () => apiRequest<any>(`/incidents/tracking/${activeCode.trim().toUpperCase()}`),
    enabled: !!activeCode,
    refetchInterval: 4000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingCode.trim()) {
      setActiveCode(trackingCode.trim().toUpperCase());
    }
  };

  // Milestone Stepper definition
  const steps = [
    { key: 'REPORTED', title: 'Report Intake', desc: 'Registered in ResQGrid Command Grid' },
    { key: 'VERIFIED', title: 'Operator Triage', desc: 'Incident validated, severity confirmed' },
    { key: 'ASSIGNED', title: 'Squad Dispatched', desc: 'Rescue unit mobilized with relief kit' },
    { key: 'IN_PROGRESS', title: 'On Scene Action', desc: 'Active evacuation & relief operations' },
    { key: 'RESOLVED', title: 'Mission Complete', desc: 'All persons accounted for safely' },
  ];

  const getStepStatus = (stepKey: string, currentStatus?: string) => {
    const order = ['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];
    const currentIndex = order.indexOf(currentStatus || 'REPORTED');
    const stepIndex = order.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  // Compute haversine distance and ETA dynamically
  const activeAssignment = incident?.active_assignment;
  let distanceKm: number | null = null;
  let etaMinutes: number | null = null;

  if (incident && activeAssignment) {
    const R = 6371; // km
    const dLat = ((incident.latitude - activeAssignment.current_latitude) * Math.PI) / 180;
    const dLon = ((incident.longitude - activeAssignment.current_longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((activeAssignment.current_latitude * Math.PI) / 180) *
        Math.cos((incident.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distanceKm = Math.round(R * c * 10) / 10;
    // Avg speed 25 km/h in dense Mumbai traffic/rain
    etaMinutes = Math.max(3, Math.round((distanceKm / 25) * 60));
  }

  // Initialize and update Live Leaflet Map showing incident and responder
  useEffect(() => {
    if (!incident || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([incident.latitude, incident.longitude], 13);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    const markersGroup = markersGroupRef.current;
    if (markersGroup) {
      markersGroup.clearLayers();

      // Incident Marker (Red)
      const incidentIcon = L.divIcon({
        className: 'custom-incident-marker',
        html: `
          <div style="background-color: #C8201B; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <div style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const incMarker = L.marker([incident.latitude, incident.longitude], { icon: incidentIcon }).addTo(
        markersGroup
      );
      incMarker.bindPopup(`<b>${incident.tracking_id}</b><br/>${incident.title}`);

      // If active squad assigned, add squad marker & route line
      if (activeAssignment) {
        const squadIcon = L.divIcon({
          className: 'custom-squad-marker',
          html: `
            <div style="background-color: #14284B; width: 26px; height: 26px; border-radius: 6px; border: 2px solid #38BDF8; box-shadow: 0 4px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px;">
              🚑
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const squadMarker = L.marker(
          [activeAssignment.current_latitude, activeAssignment.current_longitude],
          { icon: squadIcon }
        ).addTo(markersGroup);
        squadMarker.bindPopup(`<b>${activeAssignment.team_name}</b><br/>En route`);

        // Connect path polyline
        const pathLine = L.polyline(
          [
            [activeAssignment.current_latitude, activeAssignment.current_longitude],
            [incident.latitude, incident.longitude],
          ],
          {
            color: '#14284B',
            dashArray: '6, 8',
            weight: 3,
            opacity: 0.8,
          }
        ).addTo(markersGroup);

        mapInstanceRef.current?.fitBounds(pathLine.getBounds(), { padding: [40, 40] });
      } else {
        mapInstanceRef.current?.setView([incident.latitude, incident.longitude], 14);
      }
    }
  }, [incident, activeAssignment]);

  // Clean events for updates timeline
  const events = incident?.events || [];
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="min-h-full bg-rq-bg py-8 px-4 font-sans flex flex-col items-center">
      {/* Search Header */}
      <div className="max-w-3xl w-full text-center space-y-3 mb-6">
        <h1 className="text-2xl font-bold text-rq-ink">Track Live Emergency Response</h1>
        <p className="text-xs text-rq-muted max-w-md mx-auto">
          Enter your incident reference code (e.g.{' '}
          <button
            onClick={() => {
              setTrackingCode('INC-5011');
              setActiveCode('INC-5011');
            }}
            className="font-mono font-semibold text-rq-navy underline"
          >
            INC-5011
          </button>{' '}
          or{' '}
          <button
            onClick={() => {
              setTrackingCode('INC-1042');
              setActiveCode('INC-1042');
            }}
            className="font-mono font-semibold text-rq-navy underline"
          >
            INC-1042
          </button>
          ) to monitor live status, real event logs, and tactical squad ETA.
        </p>

        <form onSubmit={handleSearch} className="flex items-center max-w-md mx-auto gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-rq-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Enter Incident Code (e.g. INC-5011)"
              className="w-full pl-9 pr-3 py-2 bg-rq-surface border border-rq-border rounded-input text-xs font-mono uppercase text-rq-ink placeholder:text-rq-muted focus:outline-none focus:border-rq-navy shadow-subtle"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-rq-navy hover:bg-[#0E1D36] text-white text-xs font-semibold rounded-input shadow-subtle transition flex items-center space-x-1"
          >
            <span>Track</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Main Tracking Card */}
      <div className="max-w-3xl w-full bg-rq-surface border border-rq-border rounded-card p-6 shadow-floating space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-6 w-32 skeleton-shimmer rounded" />
            <div className="h-20 skeleton-shimmer rounded-card" />
            <div className="h-40 skeleton-shimmer rounded-card" />
          </div>
        ) : isError || !incident ? (
          <div className="p-8 text-center text-xs text-rq-muted space-y-2">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <div className="font-semibold text-rq-ink text-sm">Incident reference not found</div>
            <p>
              Please verify your code format or try searching for{' '}
              <span className="font-mono text-rq-navy">INC-5011</span> or{' '}
              <span className="font-mono text-rq-navy">INC-1042</span>.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Bar: Code & Severity */}
            <div className="flex items-center justify-between border-b border-rq-border pb-4">
              <div>
                <span className="font-mono text-xl font-bold text-rq-navy tracking-wider block">
                  {incident.tracking_id}
                </span>
                <span className="text-xs text-rq-muted">{incident.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <StatusBadge status={incident.status} />
                <SeverityBadge severity={incident.severity} />
              </div>
            </div>

            {/* Stepper Progress Driven by Real Status */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-rq-ink block">
                Response Milestone Stepper (Live Real Status)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {steps.map((st, idx) => {
                  const state = getStepStatus(st.key, incident.status);
                  return (
                    <div
                      key={st.key}
                      className={`p-2.5 rounded-card border text-xs space-y-1 transition ${
                        state === 'completed'
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 text-[#2E7D5B]'
                          : state === 'current'
                          ? 'bg-blue-50/70 dark:bg-slate-800 border-rq-navy text-rq-navy font-semibold shadow-subtle ring-1 ring-rq-navy'
                          : 'bg-rq-surface-2 border-rq-border text-rq-muted opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-xs font-bold">0{idx + 1}</span>
                        {state === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      <div className="font-medium text-xs leading-tight text-rq-ink">{st.title}</div>
                      <p className="text-xs text-rq-muted leading-tight hidden sm:block">{st.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Tactical Map with Responder Position and Route */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-rq-ink flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rq-navy" />
                  <span>Tactical Cartography & Squad Positioning</span>
                </span>
                {activeAssignment && (
                  <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    <span>Live GPS Telemetry</span>
                  </span>
                )}
              </div>
              <div
                ref={mapContainerRef}
                className="w-full h-56 rounded-card border border-rq-border overflow-hidden shadow-subtle relative z-0"
              />
            </div>

            {/* Real Squad Status & Computed ETA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-rq-surface-2 rounded-card border border-rq-border space-y-2">
                <span className="text-xs font-semibold text-rq-ink flex items-center space-x-1.5">
                  <Truck className="w-4 h-4 text-rq-navy" />
                  <span>Assigned Tactical Squad</span>
                </span>
                {activeAssignment ? (
                  <>
                    <div className="font-semibold text-sm text-rq-ink">{activeAssignment.team_name}</div>
                    <div className="text-xs text-rq-muted font-mono">
                      Type: {activeAssignment.team_type} • Status: {activeAssignment.status}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-rq-muted pt-1">
                      <Phone className="w-3.5 h-3.5 text-rq-navy" />
                      <span>Emergency Dispatch Line: +91 22 2640 1111</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-semibold text-sm text-rq-ink">Pending Operator Dispatch</div>
                    <div className="text-xs text-rq-muted leading-relaxed">
                      Incident is in operator triage. A swiftwater or evacuation unit will be mobilized shortly upon approval.
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 bg-rq-surface-2 rounded-card border border-rq-border space-y-2">
                <span className="text-xs font-semibold text-rq-ink flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-[#E27D14]" />
                  <span>Estimated Response Time & Distance</span>
                </span>
                {activeAssignment && etaMinutes !== null ? (
                  <>
                    <div className="font-mono text-2xl font-bold text-rq-ink tabular-nums">
                      ~{etaMinutes} mins{' '}
                      <span className="text-xs text-rq-muted font-normal">({distanceKm} km away)</span>
                    </div>
                    <p className="text-xs text-rq-muted leading-relaxed">
                      Tactical unit mobilized. Stay on higher ground, conserve telephone battery, and avoid rapid moving water.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="font-mono text-2xl font-bold text-rq-muted tabular-nums">Awaiting Dispatch</div>
                    <p className="text-xs text-rq-muted leading-relaxed">
                      Estimated response time will calculate automatically once a rescue squad is assigned and departs depot.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Plain-Language Status Timeline Driven By Real Database Event Log */}
            <div className="space-y-3 pt-2 border-t border-rq-border">
              <span className="text-xs font-semibold text-rq-ink block">
                Plain-Language Incident Updates (Verified Event Log)
              </span>
              <div className="space-y-3 pl-3 border-l-2 border-rq-navy">
                {sortedEvents.length > 0 ? (
                  sortedEvents.map((ev: any, idx: number) => {
                    const statusText =
                      ev.new_status === 'REPORTED'
                        ? 'Citizen Report Intake & Grid Registration'
                        : ev.new_status === 'VERIFIED'
                        ? 'Operator Triage & Severity Confirmation'
                        : ev.new_status === 'ASSIGNED'
                        ? 'Tactical Squad Mobilized & Kit Reserved'
                        : ev.new_status === 'IN_PROGRESS'
                        ? 'Squad Arrived On-Scene & Initiated Rescue'
                        : ev.new_status === 'RESOLVED'
                        ? 'Incident Resolved & Area Stabilized'
                        : `Status Update: ${ev.new_status}`;

                    return (
                      <div key={ev.id || idx} className="text-xs space-y-0.5">
                        <div className="font-semibold text-rq-ink">{statusText}</div>
                        <p className="text-xs text-rq-muted">
                          {ev.comment ||
                            `Official record update transitioned incident state to ${ev.new_status}.`}
                        </p>
                        <span className="text-xs font-mono text-rq-muted">
                          {new Date(ev.created_at).toLocaleString()}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-rq-muted">
                    No status transition events logged yet for this report.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
