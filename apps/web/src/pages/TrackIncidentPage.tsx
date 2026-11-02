import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { SeverityBadge, StatusBadge } from '../components/StatusBadge';
import { Incident } from '../types';

export const TrackIncidentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [trackingCode, setTrackingCode] = useState<string>(searchParams.get('code') || 'INC-1042');
  const [activeCode, setActiveCode] = useState<string>(searchParams.get('code') || 'INC-1042');

  const {
    data: incident,
    isLoading,
    isError,
    refetch,
  } = useQuery<Incident>({
    queryKey: ['incident-tracking', activeCode],
    queryFn: () => apiRequest<Incident>(`/incidents/tracking/${activeCode.trim().toUpperCase()}`),
    enabled: !!activeCode,
    refetchInterval: 5000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingCode.trim()) {
      setActiveCode(trackingCode.trim().toUpperCase());
    }
  };

  // Stepper milestones
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

  return (
    <div className="min-h-full bg-rq-bg py-8 px-4 font-sans flex flex-col items-center">
      {/* Search Header */}
      <div className="max-w-2xl w-full text-center space-y-3 mb-6">
        <h1 className="text-2xl font-bold text-rq-ink">Track Live Emergency Response</h1>
        <p className="text-xs text-rq-muted max-w-md mx-auto">
          Enter your incident reference code (e.g. <span className="font-mono font-semibold text-rq-navy">INC-1042</span>) to monitor live status and rescue squad ETA.
        </p>

        <form onSubmit={handleSearch} className="flex items-center max-w-md mx-auto gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-rq-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Enter Incident Code (e.g. INC-1042)"
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
      <div className="max-w-2xl w-full bg-rq-surface border border-rq-border rounded-card p-6 shadow-floating space-y-6">
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
            <p>Please verify your code format or try searching for <span className="font-mono text-rq-navy">INC-1042</span>.</p>
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

            {/* Stepper Progress */}
            <div className="space-y-4">
              <span className="text-xs font-semibold text-rq-ink block">Response Milestone Stepper</span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {steps.map((st, idx) => {
                  const state = getStepStatus(st.key, incident.status);
                  return (
                    <div
                      key={st.key}
                      className={`p-2.5 rounded-card border text-xs space-y-1 transition ${
                        state === 'completed'
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 text-[#2E7D5B]'
                          : state === 'current'
                          ? 'bg-blue-50/60 dark:bg-slate-800 border-rq-navy text-rq-navy font-semibold shadow-subtle'
                          : 'bg-rq-surface-2 border-rq-border text-rq-muted opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-xs font-bold">0{idx + 1}</span>
                        {state === 'completed' && <CheckCircle className="w-3.5 h-3.5" />}
                      </div>
                      <div className="font-medium text-xs leading-tight text-rq-ink">{st.title}</div>
                      <p className="text-xs text-rq-muted leading-tight hidden sm:block">{st.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ETA & Assigned Unit Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-rq-surface-2 rounded-card border border-rq-border space-y-2">
                <span className="text-xs font-semibold text-rq-ink flex items-center space-x-1.5">
                  <Truck className="w-4 h-4 text-rq-navy" />
                  <span>Assigned Tactical Squad</span>
                </span>
                <div className="font-semibold text-sm text-rq-ink">Bandra Water Rescue Alpha</div>
                <div className="text-xs text-rq-muted font-mono">Boat Unit • Swiftwater Qualified</div>
                <div className="flex items-center space-x-2 text-xs text-rq-muted pt-1">
                  <Phone className="w-3.5 h-3.5 text-rq-navy" />
                  <span>Emergency Dispatch Line: +91 22 2640 1111</span>
                </div>
              </div>

              <div className="p-4 bg-rq-surface-2 rounded-card border border-rq-border space-y-2">
                <span className="text-xs font-semibold text-rq-ink flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-[#E27D14]" />
                  <span>Estimated Response Time</span>
                </span>
                <div className="font-mono text-2xl font-bold text-rq-ink tabular-nums">~8 mins</div>
                <p className="text-xs text-rq-muted">
                  Unit is in transit. Stay on higher ground and avoid wading in rapid flood waters.
                </p>
              </div>
            </div>

            {/* Plain-Language Status Timeline */}
            <div className="space-y-3 pt-2 border-t border-rq-border">
              <span className="text-xs font-semibold text-rq-ink block">Plain-Language Status Updates</span>
              <div className="space-y-3 pl-3 border-l-2 border-rq-navy">
                <div className="text-xs">
                  <div className="font-semibold text-rq-ink">Squad En Route</div>
                  <p className="text-xs text-rq-muted">Rescue unit has cleared Kurla West depot and is navigating via S.V. Road bypass.</p>
                  <span className="text-xs font-mono text-rq-muted">5 minutes ago</span>
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-rq-ink">Relief Supplies Reserved</div>
                  <p className="text-xs text-rq-muted">18 swiftwater lifejackets and 40 drinking water jerrycans loaded.</p>
                  <span className="text-xs font-mono text-rq-muted">14 minutes ago</span>
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-rq-ink">Triage Approved by Command Room</div>
                  <p className="text-xs text-rq-muted">Incident confirmed as high-priority urban waterlogging.</p>
                  <span className="text-xs font-mono text-rq-muted">22 minutes ago</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
