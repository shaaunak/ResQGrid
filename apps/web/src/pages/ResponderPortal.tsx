import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  CheckCircle2,
  XCircle,
  Navigation,
  MapPin,
  Package,
  AlertTriangle,
  Upload,
  Clock,
  Shield,
  FileCheck,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Assignment, AssignmentStatus } from '../types';
import { SeverityBadge, StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export const ResponderPortal: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [responderNotes, setResponderNotes] = useState<string>('');
  const [declinationReason, setDeclinationReason] = useState<string>('');
  const [showDeclineModal, setShowDeclineModal] = useState<boolean>(false);
  const [consumedQuantity, setConsumedQuantity] = useState<number>(4);
  const [completionPhoto, setCompletionPhoto] = useState<File | null>(null);

  // Fetch active missions for responder's team
  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ['my-assignments'],
    queryFn: () => apiRequest<Assignment[]>('/assignments?only_my_team=true'),
    refetchInterval: 5000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: AssignmentStatus }) => {
      // 1. If completing, upload photo if provided
      if (status === 'COMPLETED' && completionPhoto && selectedAssignment) {
        const formData = new FormData();
        formData.append('file', completionPhoto);
        formData.append('incident_id', selectedAssignment.incident_id);
        formData.append('evidence_type', 'RESPONDER_COMPLETION');

        await apiRequest(`/evidence/upload/incidents/${selectedAssignment.incident_id}/${completionPhoto.name}`, {
          method: 'POST',
          body: formData,
        });
      }

      // 2. Prepare consumed supplies payload if completing
      const consumed_supplies =
        status === 'COMPLETED' && selectedAssignment?.stock_reservations?.length
          ? selectedAssignment.stock_reservations.map((r) => ({
              item_id: r.item_id,
              depot_id: r.depot_id,
              quantity: consumedQuantity,
            }))
          : undefined;

      return apiRequest<Assignment>(`/assignments/${selectedAssignment?.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          responder_notes: responderNotes || undefined,
          declination_reason: status === 'DECLINED' ? declinationReason : undefined,
          consumed_supplies,
        }),
      });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setSelectedAssignment(updated);
      setResponderNotes('');
      setShowDeclineModal(false);
      setCompletionPhoto(null);
    },
  });

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-command-border gap-2">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Truck className="w-5 h-5 text-command-teal" />
            <span>Field Responder Tactical Workspace</span>
          </h1>
          <p className="text-xs text-command-muted font-mono mt-0.5">
            Mission dispatch console for mobilized rapid response squads in Mumbai.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-command-muted">Authenticated Unit:</span>
          <span className="px-2.5 py-1 rounded bg-command-card text-white border border-command-border">
            {user?.full_name || 'Captain Vikram Patil (Bandra Unit Alpha)'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Missions List Column */}
        <div className="bg-command-surface border border-command-border rounded-lg p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-command-border/60">
            <span className="font-mono text-xs font-semibold text-white uppercase tracking-wider">
              Assigned Missions ({assignments.length})
            </span>
            <span className="text-[10px] text-command-teal font-mono">Live Sync</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center text-command-muted font-mono text-xs">
                Checking team mission queue...
              </div>
            ) : assignments.length === 0 ? (
              <div className="p-8 text-center text-command-muted text-xs">
                No active mission orders assigned to this unit currently.
              </div>
            ) : (
              assignments.map((asgn) => {
                const isSelected = selectedAssignment?.id === asgn.id;
                return (
                  <div
                    key={asgn.id}
                    onClick={() => setSelectedAssignment(asgn)}
                    className={`p-3 rounded-lg border transition cursor-pointer ${
                      isSelected
                        ? 'bg-command-teal/15 border-command-teal shadow-md'
                        : 'bg-command-card/70 border-command-border hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-white">
                        {asgn.incident?.tracking_id || 'INC-ASSIGN'}
                      </span>
                      <StatusBadge status={asgn.status as any} />
                    </div>
                    <h3 className="text-xs font-medium text-slate-200 truncate mb-1">
                      {asgn.incident?.title || 'Emergency Mission'}
                    </h3>
                    <div className="flex items-center justify-between text-[10px] font-mono text-command-muted">
                      <span>{new Date(asgn.assigned_at).toLocaleTimeString()}</span>
                      <span className="text-command-teal font-semibold">
                        {asgn.stock_reservations?.length || 0} Supplies Reserved
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Mission Detail & Lifecycle Operations Column */}
        <div className="lg:col-span-2 bg-command-surface border border-command-border rounded-lg p-5 shadow-xl space-y-5 text-xs">
          {selectedAssignment ? (
            <>
              {/* Mission Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-command-border gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-command-teal">
                      {selectedAssignment.incident?.tracking_id}
                    </span>
                    <StatusBadge status={selectedAssignment.status as any} />
                    {selectedAssignment.incident?.severity && (
                      <SeverityBadge severity={selectedAssignment.incident.severity} />
                    )}
                  </div>
                  <h2 className="text-base font-semibold text-white mt-1">
                    {selectedAssignment.incident?.title}
                  </h2>
                </div>
                <div className="text-right text-[11px] font-mono text-command-muted">
                  <div>Assigned: {new Date(selectedAssignment.assigned_at).toLocaleTimeString()}</div>
                  <div className="text-slate-300">{selectedAssignment.team?.name}</div>
                </div>
              </div>

              {/* Location & Operator Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-command-darkest/60 p-3.5 rounded border border-command-border">
                <div>
                  <span className="text-command-muted uppercase text-[10px] font-mono tracking-wider block mb-1">
                    Target Scene Location
                  </span>
                  <div className="flex items-center space-x-1.5 text-white font-medium">
                    <MapPin className="w-3.5 h-3.5 text-command-red flex-shrink-0" />
                    <span>{selectedAssignment.incident?.address}</span>
                  </div>
                </div>
                <div>
                  <span className="text-command-muted uppercase text-[10px] font-mono tracking-wider block mb-1">
                    Command Center Orders
                  </span>
                  <p className="text-slate-300 italic">
                    "{selectedAssignment.operator_notes || 'Immediate assistance required.'}"
                  </p>
                </div>
              </div>

              {/* Reserved Relief Supplies Section */}
              <div className="bg-command-card/70 p-3.5 rounded border border-command-border space-y-2">
                <span className="font-semibold text-white uppercase text-[10px] font-mono tracking-wider flex items-center space-x-1.5">
                  <Package className="w-3.5 h-3.5 text-command-teal" />
                  <span>Depot Supplies Allocated to Unit</span>
                </span>
                {selectedAssignment.stock_reservations?.length ? (
                  <div className="space-y-1.5">
                    {selectedAssignment.stock_reservations.map((res) => (
                      <div
                        key={res.id}
                        className="flex items-center justify-between p-2 rounded bg-command-darkest/50 border border-command-border/40 font-mono text-[11px]"
                      >
                        <span className="text-slate-200">Reserved Equipment / Rations</span>
                        <span className="text-command-teal font-semibold">
                          {res.quantity_reserved} units reserved (Status: {res.status})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-command-muted text-[11px]">No inventory materials requested for this task.</div>
                )}
              </div>

              {/* Responder Mission Control Stepper Actions */}
              <div className="space-y-3 pt-2">
                <span className="font-semibold text-white uppercase text-[10px] font-mono tracking-wider block">
                  Mission Stage Execution
                </span>

                {selectedAssignment.status === 'PENDING' && (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => updateStatusMutation.mutate({ status: 'ACCEPTED' })}
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 py-2.5 bg-command-teal hover:bg-command-teal-bright text-white font-semibold rounded flex items-center justify-center space-x-2 shadow transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Mission Order</span>
                    </button>
                    <button
                      onClick={() => setShowDeclineModal(true)}
                      className="px-4 py-2.5 bg-command-card hover:bg-command-red/20 text-red-300 border border-command-border rounded flex items-center space-x-1.5 transition"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                )}

                {selectedAssignment.status === 'ACCEPTED' && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ status: 'EN_ROUTE' })}
                    disabled={updateStatusMutation.isPending}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded flex items-center justify-center space-x-2 shadow transition"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Depart Station • Mark En Route to Scene</span>
                  </button>
                )}

                {selectedAssignment.status === 'EN_ROUTE' && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ status: 'ON_SCENE' })}
                    disabled={updateStatusMutation.isPending}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded flex items-center justify-center space-x-2 shadow transition"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Confirm Arrival • Mark On Scene</span>
                  </button>
                )}

                {selectedAssignment.status === 'ON_SCENE' && (
                  <div className="space-y-3 bg-command-darkest/70 p-4 rounded border border-command-border">
                    <span className="font-semibold text-white text-xs block">
                      Mission Completion & Supplies Reconciliation
                    </span>

                    <div className="space-y-2">
                      <label className="block text-command-muted font-medium">Field Completion Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Rescued 12 citizens, distributed 4 lifejackets and first aid..."
                        value={responderNotes}
                        onChange={(e) => setResponderNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-command-card border border-command-border rounded text-white text-xs focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-command-muted font-medium mb-1">
                          Actual Supplies Consumed
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={consumedQuantity}
                          onChange={(e) => setConsumedQuantity(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-command-card border border-command-border rounded text-white text-xs font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-command-muted font-medium mb-1">
                          Completion Photo (S3 Proof)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setCompletionPhoto(e.target.files?.[0] || null)}
                          className="w-full text-xs text-command-muted file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-command-card file:text-white"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => updateStatusMutation.mutate({ status: 'COMPLETED' })}
                      disabled={updateStatusMutation.isPending}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded flex items-center justify-center space-x-2 shadow-lg transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Mission & Resolve Incident</span>
                    </button>
                  </div>
                )}

                {selectedAssignment.status === 'COMPLETED' && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-center text-emerald-300 font-mono">
                    <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                    <span>Mission completed successfully. Incident marked as RESOLVED in command grid.</span>
                  </div>
                )}

                {/* Decline modal / box */}
                {showDeclineModal && (
                  <div className="p-3 bg-command-darkest rounded border border-command-red/40 space-y-2">
                    <span className="font-semibold text-red-300 text-xs">Mandatory Declination Reason</span>
                    <input
                      type="text"
                      placeholder="e.g. Unit engaged in prior rapid extrication..."
                      value={declinationReason}
                      onChange={(e) => setDeclinationReason(e.target.value)}
                      className="w-full px-3 py-2 bg-command-surface border border-command-border rounded text-white text-xs focus:outline-none"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateStatusMutation.mutate({ status: 'DECLINED' })}
                        disabled={!declinationReason.trim()}
                        className="px-3 py-1.5 bg-command-red text-white rounded text-xs hover:bg-red-700"
                      >
                        Confirm Decline & Return to Queue
                      </button>
                      <button
                        onClick={() => setShowDeclineModal(false)}
                        className="px-3 py-1.5 bg-command-card text-slate-300 rounded text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-command-muted font-mono">
              Select an assigned mission from the left queue to view operation briefing and dispatch controls.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

