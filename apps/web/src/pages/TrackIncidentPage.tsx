import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  CheckCircle2,
  Clock,
  Shield,
  MapPin,
  Calendar,
  AlertCircle,
  Truck,
  FileText,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Incident } from '../types';
import { StatusBadge, SeverityBadge } from '../components/StatusBadge';

export const TrackIncidentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';
  const [trackingInput, setTrackingInput] = useState(initialId);
  const [activeTrackingId, setActiveTrackingId] = useState(initialId);

  useEffect(() => {
    if (initialId) {
      setTrackingInput(initialId);
      setActiveTrackingId(initialId);
    }
  }, [initialId]);

  const { data: incident, isLoading, error } = useQuery<Incident>({
    queryKey: ['tracking', activeTrackingId],
    queryFn: () => apiRequest<Incident>(`/incidents/tracking/${activeTrackingId}`),
    enabled: !!activeTrackingId,
    retry: 1,
  });

  const steps = [
    { key: 'REPORTED', label: 'Report Received', desc: 'Registered in ResQGrid' },
    { key: 'VERIFIED', label: 'Operator Triaged', desc: 'Urgency scored & approved' },
    { key: 'ASSIGNED', label: 'Team Mobilized', desc: 'Response team dispatched' },
    { key: 'IN_PROGRESS', label: 'On Scene Action', desc: 'Responders conducting rescue' },
    { key: 'RESOLVED', label: 'Emergency Resolved', desc: 'Completed and verified' },
  ];

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const order = ['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(stepKey);

    if (currentStatus === 'REJECTED') return 'rejected';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-wide">Emergency Request Public Tracker</h1>
        <p className="text-xs text-command-muted font-mono">
          Enter your unique ResQGrid incident tracking reference code (e.g. INC-1042) to monitor live status.
        </p>

        {/* Search Bar */}
        <div className="max-w-md mx-auto pt-2 flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-command-muted absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Enter Incident Code (e.g. INC-1042)"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
              className="w-full pl-9 pr-3 py-2 bg-command-surface border border-command-border rounded text-white text-xs font-mono uppercase focus:outline-none focus:border-command-teal shadow"
            />
          </div>
          <button
            onClick={() => setActiveTrackingId(trackingInput.trim())}
            className="px-4 py-2 bg-command-teal hover:bg-command-teal-bright text-white font-medium rounded text-xs shadow transition font-mono"
          >
            Track Status
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-command-muted font-mono text-xs">
          Querying cloud database for incident reference...
        </div>
      )}

      {error && (
        <div className="p-4 bg-command-red/10 border border-command-red/40 rounded-lg text-center text-xs text-red-300">
          <AlertCircle className="w-5 h-5 mx-auto mb-1 text-red-400" />
          <span>Incident reference not found. Please verify tracking ID format (e.g. INC-1042).</span>
        </div>
      )}

      {incident && (
        <div className="bg-command-surface border border-command-border rounded-lg p-6 shadow-xl space-y-6 text-xs">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-command-border gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-base font-bold text-command-teal">{incident.tracking_id}</span>
                <StatusBadge status={incident.status} />
                <SeverityBadge severity={incident.severity} />
              </div>
              <h2 className="text-sm font-semibold text-white mt-1">{incident.title}</h2>
            </div>
            <div className="text-right text-[11px] font-mono text-command-muted">
              <div>Reported: {new Date(incident.created_at).toLocaleString()}</div>
              <div>Location: {incident.address.split(',')[0]}</div>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="py-2">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {steps.map((st) => {
                const state = getStepStatus(st.key, incident.status);
                return (
                  <div
                    key={st.key}
                    className={`p-3 rounded-lg border text-center font-mono space-y-1 transition ${
                      state === 'completed'
                        ? 'bg-command-card/80 border-command-teal/50 text-white'
                        : state === 'current'
                        ? 'bg-command-teal/20 border-command-teal text-command-teal shadow-md ring-1 ring-command-teal/50'
                        : 'bg-command-darkest/40 border-command-border/40 text-command-muted'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      {state === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-command-teal" />
                      ) : state === 'current' ? (
                        <Clock className="w-4 h-4 text-command-teal animate-spin" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-command-border" />
                      )}
                    </div>
                    <div className="font-semibold text-[11px]">{st.label}</div>
                    <div className="text-[9px] text-command-muted">{st.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Incident Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-command-darkest/60 p-4 rounded-lg border border-command-border/60 space-y-2">
              <span className="font-semibold text-white uppercase text-[10px] tracking-wider block font-mono">
                Report Summary
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">{incident.description}</p>
              <div className="pt-2 text-[10px] font-mono text-command-muted space-y-1">
                <div>Category: <span className="text-white">{incident.category}</span></div>
                <div>Persons At Risk: <span className="text-amber-400 font-semibold">{incident.affected_people}</span></div>
                <div>Location Landmark: <span className="text-slate-300">{incident.address}</span></div>
              </div>
            </div>

            {/* Audit Event History */}
            <div className="bg-command-darkest/60 p-4 rounded-lg border border-command-border/60 space-y-2">
              <span className="font-semibold text-white uppercase text-[10px] tracking-wider block font-mono">
                Official Operational History
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {incident.events?.map((ev) => (
                  <div key={ev.id} className="p-2 rounded bg-command-surface/60 border border-command-border/40 text-[10px] font-mono">
                    <div className="flex justify-between text-command-muted">
                      <span className="text-command-teal font-semibold">{ev.new_status}</span>
                      <span>{new Date(ev.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-slate-300 mt-0.5">{ev.comment}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

