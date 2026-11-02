import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Shield,
  CheckCircle,
  XCircle,
  Truck,
  Box,
  MapPin,
  Clock,
  AlertTriangle,
  Info,
  Users,
  Camera,
  Activity,
  History,
  FileCheck,
  ChevronRight,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { SeverityBadge, StatusBadge } from './StatusBadge';
import { Incident, ResponseTeam, Depot, TeamRecommendation } from '../types';

interface TriageDrawerProps {
  incident: Incident | null;
  onClose: () => void;
  onIncidentUpdated: () => void;
}

export const TriageDrawer: React.FC<TriageDrawerProps> = ({
  incident,
  onClose,
  onIncidentUpdated,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    'SUMMARY' | 'PRIORITY' | 'TEAMS' | 'TIMELINE' | 'EVIDENCE' | 'AUDIT'
  >('SUMMARY');

  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [operatorNotes, setOperatorNotes] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectInput, setShowRejectInput] = useState<boolean>(false);

  // Fetch Recommended Teams
  const { data: recommendations = [], isLoading: loadingRecs } = useQuery<TeamRecommendation[]>({
    queryKey: ['incident-recommendations', incident?.id],
    queryFn: () => apiRequest<TeamRecommendation[]>(`/incidents/${incident?.id}/recommendations`),
    enabled: !!incident && ['VERIFIED', 'REPORTED', 'PRIORITIZED'].includes(incident.status),
  });

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: async (approved: boolean) => {
      return apiRequest(`/incidents/${incident?.id}/verify`, {
        method: 'POST',
        body: JSON.stringify({
          approved,
          rejection_reason: approved ? undefined : rejectReason || 'Declined during operator triage.',
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['operational-summary'] });
      onIncidentUpdated();
    },
  });

  // Dispatch mutation
  const assignMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/incidents/${incident?.id}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          incident_id: incident?.id,
          team_id: selectedTeamId,
          operator_notes: operatorNotes || 'Immediate emergency mobilization dispatched.',
          override_reason: overrideReason || undefined,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['operational-summary'] });
      onIncidentUpdated();
      onClose();
    },
  });

  if (!incident) return null;

  const breakdown = incident.priority_breakdown;
  const isTopTeamSelected = recommendations[0]?.team.id === selectedTeamId;
  const isOverride = !isTopTeamSelected && selectedTeamId !== '';

  return (
    <div className="w-full md:w-[440px] bg-rq-surface border-l border-rq-border h-full flex flex-col shadow-floating z-20 text-xs overflow-hidden font-sans">
      {/* Header */}
      <div className="p-4 border-b border-rq-border flex items-center justify-between bg-rq-surface-2 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-rq-navy font-bold text-sm tracking-wider">
            {incident.tracking_id}
          </span>
          <StatusBadge status={incident.status} />
          <SeverityBadge severity={incident.severity} />
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-rq-muted hover:text-rq-ink hover:bg-rq-surface transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center px-4 border-b border-rq-border bg-rq-surface overflow-x-auto text-[11px] font-medium space-x-1 flex-shrink-0">
        {[
          { key: 'SUMMARY', label: 'Summary' },
          { key: 'PRIORITY', label: 'Priority' },
          { key: 'TEAMS', label: 'Team Match' },
          { key: 'TIMELINE', label: 'Timeline' },
          { key: 'EVIDENCE', label: 'Evidence' },
          { key: 'AUDIT', label: 'Audit Log' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`py-2.5 px-2 border-b-2 transition whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-rq-navy text-rq-navy font-semibold'
                : 'border-transparent text-rq-muted hover:text-rq-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'SUMMARY' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-rq-ink mb-1">{incident.title}</h2>
              <p className="text-rq-muted text-xs leading-relaxed mb-3">{incident.description}</p>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-rq-surface-2 p-2.5 rounded-card border border-rq-border">
                <div className="flex items-center space-x-1.5 text-rq-ink truncate">
                  <MapPin className="w-3.5 h-3.5 text-rq-navy flex-shrink-0" />
                  <span className="truncate">{incident.address}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-rq-ink">
                  <Users className="w-3.5 h-3.5 text-[#E27D14] flex-shrink-0" />
                  <span>{incident.affected_people} Persons At Risk</span>
                </div>
              </div>
            </div>

            {/* Quick Priority Glance */}
            <div className="bg-rq-surface-2 p-3 rounded-card border border-rq-border flex items-center justify-between">
              <div>
                <span className="font-semibold text-rq-ink text-xs block">AI Priority Urgency</span>
                <span className="text-[11px] text-rq-muted">Calculated multi-factor score</span>
              </div>
              <div className="font-mono font-bold text-lg text-rq-navy px-2.5 py-0.5 bg-rq-surface rounded border border-rq-border">
                {incident.priority_score.toFixed(1)} <span className="text-xs text-rq-muted">/ 100</span>
              </div>
            </div>

            {/* Verification Action if Reported */}
            {incident.status === 'REPORTED' && (
              <div className="bg-rq-surface-2 p-3 rounded-card border border-rq-border space-y-2.5">
                <span className="font-semibold text-rq-ink text-[11px] uppercase tracking-wider block font-mono">
                  Human-in-the-Loop Triage
                </span>
                <p className="text-xs text-rq-muted">
                  Operator must verify emergency credibility before response units can be mobilized.
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={() => verifyMutation.mutate(true)}
                    disabled={verifyMutation.isPending}
                    className="flex-1 py-2 bg-rq-navy hover:bg-[#0E1D36] text-white font-semibold rounded text-xs flex items-center justify-center space-x-1.5 shadow-subtle transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Verify Incident</span>
                  </button>
                  <button
                    onClick={() => setShowRejectInput(!showRejectInput)}
                    className="px-3 py-2 bg-rq-surface hover:bg-red-50 text-[#C8201B] border border-rq-border hover:border-red-300 rounded text-xs font-medium transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                </div>

                {showRejectInput && (
                  <div className="space-y-2 pt-2 border-t border-rq-border">
                    <input
                      type="text"
                      placeholder="Reason for declining report..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full p-2 bg-rq-surface border border-rq-border rounded text-xs"
                    />
                    <button
                      onClick={() => verifyMutation.mutate(false)}
                      className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'PRIORITY' && (
          <div className="space-y-4">
            <div className="bg-rq-surface-2 p-3 rounded-card border border-rq-border text-xs leading-relaxed text-rq-muted">
              <span className="font-semibold text-rq-ink">Explainable Priority Formulation:</span> The priority score ($0 - 100$) dynamically balances instant threat severity (35%), human casualties (25%), wait-time anti-starvation (20%), and disaster type urgency (20%).
            </div>

            {breakdown ? (
              <div className="space-y-3 bg-rq-surface p-3 rounded-card border border-rq-border text-xs">
                <div>
                  <div className="flex justify-between text-rq-muted mb-1">
                    <span>Severity Weight (35%)</span>
                    <span className="font-mono text-rq-ink font-semibold">{breakdown.severity_factor} pts</span>
                  </div>
                  <div className="w-full bg-rq-surface-2 h-1.5 rounded-full overflow-hidden border border-rq-border">
                    <div className="bg-[#C8201B] h-full" style={{ width: `${breakdown.severity_factor}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-rq-muted mb-1">
                    <span>Impact & Casualties (25%)</span>
                    <span className="font-mono text-rq-ink font-semibold">{breakdown.impact_factor} pts</span>
                  </div>
                  <div className="w-full bg-rq-surface-2 h-1.5 rounded-full overflow-hidden border border-rq-border">
                    <div className="bg-[#E27D14] h-full" style={{ width: `${breakdown.impact_factor}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-rq-muted mb-1">
                    <span>Wait-Time Anti-Starvation (20%)</span>
                    <span className="font-mono text-rq-ink font-semibold">{breakdown.wait_time_factor} pts</span>
                  </div>
                  <div className="w-full bg-rq-surface-2 h-1.5 rounded-full overflow-hidden border border-rq-border">
                    <div className="bg-[#C9A100] h-full" style={{ width: `${breakdown.wait_time_factor}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-rq-muted mb-1">
                    <span>Disaster Inherent Urgency (20%)</span>
                    <span className="font-mono text-rq-ink font-semibold">{breakdown.vulnerability_factor} pts</span>
                  </div>
                  <div className="w-full bg-rq-surface-2 h-1.5 rounded-full overflow-hidden border border-rq-border">
                    <div className="bg-blue-600 h-full" style={{ width: `${breakdown.vulnerability_factor}%` }} />
                  </div>
                </div>

                <div className="pt-2 border-t border-rq-border text-[11px] text-rq-muted italic">
                  "{breakdown.explanation}"
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-rq-muted">Priority calculation will trigger on triage.</div>
            )}
          </div>
        )}

        {activeTab === 'TEAMS' && (
          <div className="space-y-3">
            <div className="text-xs text-rq-muted">
              Select an emergency rescue squad for deployment. The matching engine evaluates capability qualification, distance, and current capacity:
            </div>

            {loadingRecs ? (
              <div className="space-y-2">
                <div className="h-14 rounded skeleton-shimmer" />
                <div className="h-14 rounded skeleton-shimmer" />
              </div>
            ) : recommendations.length === 0 ? (
              <div className="p-4 text-center text-xs text-rq-muted">
                No active squads available. All units may be dispatched.
              </div>
            ) : (
              recommendations.map((rec, idx) => {
                const team = rec.team;
                const isSelected = selectedTeamId === team.id;
                return (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`p-3 rounded-card border transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/60 dark:bg-slate-800 border-rq-navy shadow-subtle'
                        : 'bg-rq-surface border-rq-border hover:bg-rq-surface-2'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1.5">
                        <Truck className="w-3.5 h-3.5 text-rq-navy" />
                        <span className="font-semibold text-xs text-rq-ink">{team.name}</span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.2 rounded-pill bg-emerald-50 text-[#2E7D5B] text-[10px] font-semibold border border-emerald-200">
                            Top Recommendation
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-rq-navy">
                        Score: {rec.suitability_score.toFixed(0)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[11px] text-rq-muted font-mono mb-2">
                      <span>Distance: {rec.distance_km.toFixed(1)} km</span>
                      <span>ETA: ~{Math.round(rec.distance_km * 3.5 + 4)} mins</span>
                      <span>Base: {team.base_location_name.split(' ')[0]}</span>
                      <span>Capacity: {team.capacity} Responders</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {rec.reasons.map((r, rIdx) => (
                        <span
                          key={rIdx}
                          className="px-1.5 py-0.5 rounded bg-rq-surface-2 border border-rq-border text-[10px] text-rq-muted"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}

            {isOverride && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-card border border-amber-300 dark:border-amber-900 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-amber-900 dark:text-amber-300 font-semibold text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#E27D14]" />
                  <span>Operator Override Required</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-400">
                  You are selecting a non-top recommended squad. Please document the reason for the audit trail:
                </p>
                <input
                  type="text"
                  placeholder="e.g. Squad is returning from adjacent sector..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-amber-300 rounded text-xs"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'TIMELINE' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-rq-ink">
              <History className="w-4 h-4 text-rq-navy" />
              <span>Incident Event Trail</span>
            </div>
            <div className="space-y-2 border-l-2 border-rq-border ml-2 pl-3">
              {(incident.events || []).map((ev) => (
                <div key={ev.id} className="relative text-xs">
                  <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-rq-navy ring-4 ring-rq-surface" />
                  <div className="font-semibold text-rq-ink">{ev.new_status}</div>
                  <p className="text-rq-muted text-[11px]">{ev.comment}</p>
                  <span className="font-mono text-[10px] text-rq-muted">
                    {new Date(ev.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'EVIDENCE' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-rq-ink">
              <Camera className="w-4 h-4 text-rq-navy" />
              <span>Attached Ground Evidence</span>
            </div>
            <div className="p-6 text-center text-xs text-rq-muted border border-dashed border-rq-border rounded-card">
              No ground photos uploaded yet. Responders will capture completion photos upon arrival.
            </div>
          </div>
        )}

        {activeTab === 'AUDIT' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-rq-ink">
              <FileCheck className="w-4 h-4 text-rq-navy" />
              <span>Cryptographic Audit Trail</span>
            </div>
            <div className="p-3 bg-rq-surface-2 rounded-card border border-rq-border text-[11px] font-mono space-y-1 text-rq-muted">
              <div>Incident ID: {incident.id}</div>
              <div>Optimistic Version: v{incident.version || 1}</div>
              <div>Report Count: {incident.report_count || 1}</div>
              <div>Simulated: {incident.is_simulated ? 'True' : 'False'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Dispatch Footer */}
      {['VERIFIED', 'REPORTED', 'PRIORITIZED'].includes(incident.status) && (
        <div className="p-4 border-t border-rq-border bg-rq-surface-2 flex-shrink-0 space-y-2">
          <button
            onClick={() => assignMutation.mutate()}
            disabled={!selectedTeamId || assignMutation.isPending || (isOverride && !overrideReason)}
            className="w-full py-2.5 bg-rq-navy hover:bg-[#0E1D36] disabled:opacity-50 text-white font-semibold rounded text-xs flex items-center justify-center space-x-2 shadow-subtle transition"
          >
            <Truck className="w-4 h-4" />
            <span>
              {assignMutation.isPending ? 'Mobilizing Squad...' : 'Approve & Dispatch Unit'}
            </span>
          </button>
          {!selectedTeamId && (
            <p className="text-center text-[10px] text-rq-muted">
              Select a squad from the "Team Match" tab above to authorize dispatch.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
