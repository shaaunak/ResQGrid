import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  CheckCircle,
  XCircle,
  Truck,
  Shield,
  Clock,
  Users,
  MapPin,
  ChevronRight,
  Package,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Incident, TeamRecommendation, InventoryStock } from '../types';
import { SeverityBadge, StatusBadge } from './StatusBadge';

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
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [operatorNotes, setOperatorNotes] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectInput, setShowRejectInput] = useState<boolean>(false);
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [requestQuantity, setRequestQuantity] = useState<number>(5);

  // Fetch Team Recommendations when incident is in VERIFIED or PRIORITIZED status
  const { data: recommendations, isLoading: loadingRecs } = useQuery<TeamRecommendation[]>({
    queryKey: ['recommendations', incident?.id],
    queryFn: () => apiRequest<TeamRecommendation[]>(`/incidents/${incident?.id}/recommendations`),
    enabled: !!incident && ['VERIFIED', 'PRIORITIZED', 'REPORTED'].includes(incident.status),
  });

  // Fetch available depot stocks for reservation
  const { data: stocks } = useQuery<InventoryStock[]>({
    queryKey: ['depot-stocks'],
    queryFn: () => apiRequest<InventoryStock[]>('/inventory/stocks'),
  });

  // Verify incident mutation
  const verifyMutation = useMutation({
    mutationFn: (approved: boolean) =>
      apiRequest(`/incidents/${incident?.id}/verify`, {
        method: 'POST',
        body: JSON.stringify({
          approved,
          rejection_reason: approved ? undefined : rejectReason,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      onIncidentUpdated();
      setShowRejectInput(false);
    },
  });

  // Dispatch Assignment mutation
  const assignMutation = useMutation({
    mutationFn: () => {
      const stock = stocks?.find((s) => s.id === selectedStockId);
      const requested_supplies = stock
        ? [{ item_id: stock.item_id, depot_id: stock.depot_id, quantity: requestQuantity }]
        : [];

      return apiRequest(`/incidents/${incident?.id}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          incident_id: incident?.id,
          team_id: selectedTeamId,
          operator_notes: operatorNotes || 'Immediate emergency mobilization dispatched.',
          requested_supplies,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['depot-stocks'] });
      onIncidentUpdated();
      onClose();
    },
  });

  if (!incident) return null;

  const breakdown = incident.priority_breakdown;

  return (
    <div className="w-full md:w-[420px] bg-command-surface border-l border-command-border h-full flex flex-col shadow-2xl z-20 text-xs overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-command-border flex items-center justify-between bg-command-darkest/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-command-teal font-bold text-sm tracking-wider">
            {incident.tracking_id}
          </span>
          <StatusBadge status={incident.status} />
          <SeverityBadge severity={incident.severity} />
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-command-muted hover:text-white hover:bg-command-card transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Incident Summary */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-1">{incident.title}</h2>
          <p className="text-command-muted text-[11px] leading-relaxed mb-3">{incident.description}</p>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-command-darkest/60 p-2.5 rounded border border-command-border/60">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-command-teal" />
              <span className="truncate">{incident.address}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>{incident.affected_people} Persons At Risk</span>
            </div>
          </div>
        </div>

        {/* Explainable Priority Engine Breakdown Card */}
        <div className="bg-command-card/80 p-3.5 rounded-lg border border-command-border/80 space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-command-border/50">
            <div className="flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-command-teal" />
              <span className="font-semibold text-white tracking-wide uppercase text-[10px]">
                Intelligent Priority Urgency
              </span>
            </div>
            <span className="font-mono font-bold text-sm text-command-teal bg-command-darkest px-2 py-0.5 rounded border border-command-teal/30">
              {incident.priority_score.toFixed(1)} / 100
            </span>
          </div>

          {breakdown ? (
            <div className="space-y-2 text-[11px]">
              <div>
                <div className="flex justify-between text-command-muted mb-0.5">
                  <span>Severity Factor (35%)</span>
                  <span className="font-mono text-slate-200">{breakdown.severity_factor} pts</span>
                </div>
                <div className="w-full bg-command-darkest h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-command-red h-full rounded-full"
                    style={{ width: `${breakdown.severity_factor}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-command-muted mb-0.5">
                  <span>Impact / Affected (25%)</span>
                  <span className="font-mono text-slate-200">{breakdown.impact_factor} pts</span>
                </div>
                <div className="w-full bg-command-darkest h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-command-amber h-full rounded-full"
                    style={{ width: `${breakdown.impact_factor}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-command-muted mb-0.5">
                  <span>Waiting Delay (20%)</span>
                  <span className="font-mono text-slate-200">{breakdown.wait_time_factor} pts</span>
                </div>
                <div className="w-full bg-command-darkest h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-400 h-full rounded-full"
                    style={{ width: `${breakdown.wait_time_factor}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-command-muted mb-0.5">
                  <span>Vulnerability (20%)</span>
                  <span className="font-mono text-slate-200">{breakdown.vulnerability_factor} pts</span>
                </div>
                <div className="w-full bg-command-darkest h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${breakdown.vulnerability_factor}%` }}
                  />
                </div>
              </div>

              <div className="mt-2 pt-1 text-[10px] text-command-muted italic flex items-start space-x-1">
                <Info className="w-3 h-3 text-command-teal flex-shrink-0 mt-0.5" />
                <span>{breakdown.explanation}</span>
              </div>
            </div>
          ) : (
            <div className="text-command-muted text-[11px]">Priority score calculated upon triage.</div>
          )}
        </div>

        {/* Triage Verification Action Buttons */}
        {incident.status === 'REPORTED' && (
          <div className="bg-command-darkest/70 p-3 rounded-lg border border-command-border space-y-2.5">
            <span className="font-semibold text-white uppercase text-[10px] tracking-wider block">
              Control Room Incident Triage
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => verifyMutation.mutate(true)}
                disabled={verifyMutation.isPending}
                className="flex-1 py-2 bg-command-teal hover:bg-command-teal-bright text-white font-semibold rounded flex items-center justify-center space-x-1.5 shadow transition"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Verify Emergency</span>
              </button>
              <button
                onClick={() => setShowRejectInput(!showRejectInput)}
                className="px-3 py-2 bg-command-card hover:bg-command-red/20 text-red-300 border border-command-border hover:border-command-red/40 rounded flex items-center justify-center space-x-1 transition"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </div>

            {showRejectInput && (
              <div className="pt-2 space-y-1.5 border-t border-command-border/50">
                <input
                  type="text"
                  placeholder="Mandatory rejection reason..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-command-surface border border-command-border rounded text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-command-red"
                />
                <button
                  onClick={() => verifyMutation.mutate(false)}
                  disabled={!rejectReason.trim() || verifyMutation.isPending}
                  className="w-full py-1.5 bg-command-red text-white font-medium rounded hover:bg-red-700 transition"
                >
                  Confirm Rejection & Archive
                </button>
              </div>
            )}
          </div>
        )}

        {/* Resource Matching Engine & Dispatch Workflow */}
        {['VERIFIED', 'PRIORITIZED'].includes(incident.status) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-command-border/50">
              <span className="font-semibold text-white uppercase text-[10px] tracking-wider">
                Matching Response Teams ({recommendations?.length || 0})
              </span>
              <span className="text-[10px] text-command-teal font-mono">Heuristic Ranking</span>
            </div>

            {loadingRecs ? (
              <div className="text-center py-4 text-command-muted font-mono">
                Calculating suitability scores & Haversine proximity...
              </div>
            ) : recommendations && recommendations.length > 0 ? (
              <div className="space-y-2">
                {recommendations.map((rec) => {
                  const team = rec.team;
                  const isSelected = selectedTeamId === team.id;
                  return (
                    <div
                      key={team.id}
                      onClick={() => rec.is_eligible && setSelectedTeamId(team.id)}
                      className={`p-3 rounded-lg border transition cursor-pointer ${
                        !rec.is_eligible
                          ? 'opacity-40 bg-command-darkest/40 border-command-border cursor-not-allowed'
                          : isSelected
                          ? 'bg-command-teal/15 border-command-teal text-white shadow-md'
                          : 'bg-command-card/70 border-command-border hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1.5">
                          <Truck className="w-3.5 h-3.5 text-command-teal" />
                          <span className="font-semibold">{team.name}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-command-teal">
                          {rec.suitability_score}% Suitability
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-[10px] text-command-muted font-mono mb-2">
                        <span>{team.team_type}</span>
                        <span>•</span>
                        <span>{rec.distance_km} km away</span>
                        <span>•</span>
                        <span>Cap: {team.capacity}</span>
                      </div>
                      <ul className="text-[10px] text-slate-300 space-y-0.5">
                        {rec.reasons.map((r, idx) => (
                          <li key={idx} className="flex items-start space-x-1">
                            <span className="text-command-teal">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-3 text-command-muted">No eligible response teams currently available.</div>
            )}

            {/* Relief Supply Reservation Dropdown */}
            <div className="bg-command-darkest/60 p-3 rounded border border-command-border space-y-2">
              <span className="font-semibold text-white text-[10px] uppercase tracking-wider flex items-center space-x-1">
                <Package className="w-3 h-3 text-command-teal" />
                <span>Reserve Limited Depot Supplies (Atomic)</span>
              </span>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={selectedStockId}
                  onChange={(e) => setSelectedStockId(e.target.value)}
                  className="col-span-2 px-2 py-1.5 bg-command-surface border border-command-border rounded text-white text-[11px] focus:outline-none"
                >
                  <option value="">-- No Supplies Reserved --</option>
                  {stocks?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.item?.name} ({s.quantity_available} avail at {s.depot?.name})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={requestQuantity}
                  onChange={(e) => setRequestQuantity(parseInt(e.target.value) || 1)}
                  className="px-2 py-1.5 bg-command-surface border border-command-border rounded text-white text-[11px] focus:outline-none"
                  placeholder="Qty"
                />
              </div>
            </div>

            {/* Operator Dispatch Button */}
            <button
              onClick={() => assignMutation.mutate()}
              disabled={!selectedTeamId || assignMutation.isPending}
              className="w-full py-2.5 bg-command-teal hover:bg-command-teal-bright disabled:opacity-40 text-white font-semibold rounded flex items-center justify-center space-x-1.5 shadow-lg transition text-xs"
            >
              <Truck className="w-4 h-4" />
              <span>Mobilize & Dispatch Assignment</span>
            </button>
          </div>
        )}

        {/* Audit Timeline */}
        <div className="pt-2 border-t border-command-border/50">
          <span className="font-semibold text-white uppercase text-[10px] tracking-wider block mb-2">
            Incident Event Log ({incident.events?.length || 0})
          </span>
          <div className="space-y-2 text-[10px] font-mono">
            {incident.events?.map((ev) => (
              <div key={ev.id} className="p-2 bg-command-darkest/50 rounded border border-command-border/40">
                <div className="flex items-center justify-between text-command-muted">
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
  );
};

