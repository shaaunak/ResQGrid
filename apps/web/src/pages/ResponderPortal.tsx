import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  CheckCircle,
  MapPin,
  Clock,
  Camera,
  Navigation,
  FileCheck,
  AlertCircle,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { SeverityBadge, StatusBadge } from '../components/StatusBadge';
import { Assignment, AssignmentStatus } from '../types';

export const ResponderPortal: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');

  // Fetch my team's assignments
  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ['assignments'],
    queryFn: () => apiRequest<Assignment[]>('/assignments/my-assignments'),
    refetchInterval: 4000,
  });

  // Lifecycle transition mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AssignmentStatus }) => {
      return apiRequest(`/assignments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          responder_notes: notes || undefined,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['operational-summary'] });
      setNotes('');
    },
  });

  const activeMissions = assignments.filter(
    (a) => !['COMPLETED', 'DECLINED', 'CANCELLED'].includes(a.status)
  );

  return (
    <div className="min-h-full bg-rq-bg py-6 px-4 font-sans flex flex-col items-center">
      {/* Header bar */}
      <div className="max-w-2xl w-full flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-rq-ink">Field Responder Dispatch</h1>
          <p className="text-xs text-rq-muted">Captain Vikram Patil • Bandra Water Rescue Alpha</p>
        </div>
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-rq-surface border border-rq-border font-mono text-xs text-rq-muted">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>UNIT 01 ACTIVE</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-2xl w-full space-y-4">
        {/* Mission Queue */}
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-28 rounded-card skeleton-shimmer" />
            <div className="h-28 rounded-card skeleton-shimmer" />
          </div>
        ) : activeMissions.length === 0 ? (
          <div className="bg-rq-surface border border-rq-border rounded-card p-8 text-center text-xs text-rq-muted space-y-2 shadow-subtle">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
            <div className="font-semibold text-rq-ink text-sm">No Active Missions Pending</div>
            <p>Your rescue team is on standby at Bandra West Coastal Post.</p>
          </div>
        ) : (
          activeMissions.map((asgn) => {
            const inc = asgn.incident;
            return (
              <div
                key={asgn.id}
                className="bg-rq-surface border border-rq-border rounded-card p-5 shadow-floating space-y-4"
              >
                {/* Mission Header */}
                <div className="flex items-center justify-between border-b border-rq-border pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-rq-navy">
                      {inc?.tracking_id || 'INC-1042'}
                    </span>
                    {inc && <SeverityBadge severity={inc.severity} />}
                  </div>
                  <span className="px-2 py-0.5 rounded-pill bg-blue-50 text-blue-700 text-xs font-mono font-semibold border border-blue-200">
                    {asgn.status}
                  </span>
                </div>

                {/* Mission Details */}
                <div className="space-y-1.5">
                  <h2 className="text-sm font-bold text-rq-ink">{inc?.title || 'Emergency Water Rescue'}</h2>
                  <p className="text-xs text-rq-muted leading-relaxed">
                    {inc?.description || 'Immediate boat extrication required for stranded families.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-rq-surface-2 p-2.5 rounded-card border border-rq-border mt-2">
                    <div className="flex items-center space-x-1.5 text-rq-ink truncate">
                      <MapPin className="w-3.5 h-3.5 text-rq-navy flex-shrink-0" />
                      <span className="truncate">{inc?.address || 'Kurla West Basin'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-rq-ink">
                      <Clock className="w-3.5 h-3.5 text-[#E27D14] flex-shrink-0" />
                      <span>Assigned: ~12m ago</span>
                    </div>
                  </div>
                </div>

                {/* External GPS navigation link */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${inc?.latitude || 19.0726},${inc?.longitude || 72.8845}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-rq-navy font-semibold hover:underline"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Open Turn-by-Turn GPS Navigation</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>

                {/* Large Action Buttons (State Machine Transitions) */}
                <div className="pt-2 border-t border-rq-border space-y-2">
                  <span className="text-xs font-semibold text-rq-ink block">
                    Update Mission Progression
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: asgn.id, status: 'ACCEPTED' })}
                      disabled={asgn.status !== 'OFFERED' && asgn.status !== 'PENDING'}
                      className="py-2.5 px-2 bg-rq-navy hover:bg-[#0E1D36] disabled:opacity-30 text-white rounded text-xs font-bold transition shadow-subtle text-center"
                    >
                      1. Accept
                    </button>

                    <button
                      onClick={() => updateStatusMutation.mutate({ id: asgn.id, status: 'EN_ROUTE' })}
                      disabled={asgn.status !== 'ACCEPTED'}
                      className="py-2.5 px-2 bg-rq-navy hover:bg-[#0E1D36] disabled:opacity-30 text-white rounded text-xs font-bold transition shadow-subtle text-center"
                    >
                      2. En Route
                    </button>

                    <button
                      onClick={() => updateStatusMutation.mutate({ id: asgn.id, status: 'ON_SCENE' })}
                      disabled={asgn.status !== 'EN_ROUTE'}
                      className="py-2.5 px-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-30 text-white rounded text-xs font-bold transition shadow-subtle text-center"
                    >
                      3. On Scene
                    </button>

                    <button
                      onClick={() => updateStatusMutation.mutate({ id: asgn.id, status: 'COMPLETED' })}
                      disabled={asgn.status !== 'ON_SCENE'}
                      className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 text-white rounded text-xs font-bold transition shadow-subtle text-center"
                    >
                      4. Resolved
                    </button>
                  </div>
                </div>

                {/* Completion Photo Upload */}
                {asgn.status === 'ON_SCENE' && (
                  <div className="p-3 bg-rq-surface-2 rounded-card border border-rq-border space-y-2">
                    <label className="text-xs font-semibold text-rq-ink flex items-center space-x-1.5">
                      <Camera className="w-4 h-4 text-rq-navy" />
                      <span>Attach On-Scene Evidence Photo</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                        }
                      }}
                      className="text-xs text-rq-muted"
                    />
                    {photoPreview && (
                      <img
                        src={photoPreview}
                        alt="Evidence Preview"
                        className="w-16 h-16 object-cover rounded border border-rq-border"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
