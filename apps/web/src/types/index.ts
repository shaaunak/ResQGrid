export type UserRole = 'CITIZEN' | 'OPERATOR' | 'RESPONDER' | 'COORDINATOR' | 'ADMIN';

export type IncidentCategory =
  | 'FLOOD'
  | 'MEDICAL'
  | 'FIRE'
  | 'COLLAPSE'
  | 'EVACUATION'
  | 'SUPPLIES'
  | 'CYCLONE'
  | 'OTHER';

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IncidentStatus =
  | 'REPORTED'
  | 'VERIFIED'
  | 'PRIORITIZED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED'
  | 'CANCELLED';

export type TeamStatus = 'AVAILABLE' | 'DISPATCHED' | 'BUSY' | 'OFFLINE';

export type TeamType =
  | 'WATER_RESCUE'
  | 'MEDICAL'
  | 'FIREFIGHTING'
  | 'GENERAL_EVACUATION'
  | 'RELIEF_DISTRIBUTION';

export type AssignmentStatus =
  | 'OFFERED'
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EN_ROUTE'
  | 'ON_SCENE'
  | 'COMPLETED'
  | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface IncidentEvent {
  id: string;
  previous_status?: IncidentStatus;
  new_status: IncidentStatus;
  actor_id?: string;
  comment?: string;
  created_at: string;
}

export interface IncidentEvidence {
  id: string;
  evidence_type: string;
  s3_key: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_url?: string;
  created_at: string;
}

export interface Incident {
  id: string;
  tracking_id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affected_people: number;
  latitude: number;
  longitude: number;
  address: string;
  reporter_id?: string;
  reporter_phone?: string;
  is_simulated: boolean;
  priority_score: number;
  priority_breakdown?: {
    severity_factor: number;
    impact_factor: number;
    wait_time_factor: number;
    vulnerability_factor: number;
    total_score: number;
    explanation: string;
  };
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  version?: number;
  report_count?: number;
  parent_incident_id?: string;
  merged_reports?: Array<{
    id: string;
    tracking_id: string;
    title: string;
    description: string;
    affected_people: number;
    created_at: string;
  }>;
  active_assignment?: {
    assignment_id: string;
    status: string;
    team_id: string;
    team_name: string;
    team_type: string;
    current_latitude: number;
    current_longitude: number;
  };
  created_at: string;
  updated_at: string;
  events?: IncidentEvent[];
  evidence?: IncidentEvidence[];
}

export interface ResponseTeam {
  id: string;
  name: string;
  team_type: TeamType;
  status: TeamStatus;
  capacity: number;
  base_location_name: string;
  base_latitude: number;
  base_longitude: number;
  current_latitude: number;
  current_longitude: number;
  contact_phone?: string;
  qualifications?: string[];
  active_assignments_count: number;
}

export interface TeamRecommendation {
  team: ResponseTeam;
  suitability_score: number;
  distance_km: number;
  reasons: string[];
  is_eligible: boolean;
}

export interface StockReservation {
  id: string;
  assignment_id: string;
  depot_id: string;
  item_id: string;
  quantity_reserved: number;
  quantity_consumed: number;
  status: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  incident_id: string;
  team_id: string;
  assigned_by: string;
  status: AssignmentStatus;
  operator_notes?: string;
  responder_notes?: string;
  declination_reason?: string;
  assigned_at: string;
  accepted_at?: string;
  en_route_at?: string;
  on_scene_at?: string;
  completed_at?: string;
  created_at: string;
  team?: ResponseTeam;
  incident?: Incident;
  stock_reservations?: StockReservation[];
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  description?: string;
}

export interface Depot {
  id: string;
  name: string;
  location_name: string;
  depot_type: string;
  latitude: number;
  longitude: number;
  contact_phone?: string;
  manager_name?: string;
}

export interface Shelter {
  id: string;
  name: string;
  location_name: string;
  latitude: number;
  longitude: number;
  capacity_people: number;
  current_occupancy: number;
  status: string;
  contact_person?: string;
}

export interface InventoryStock {
  id: string;
  depot_id: string;
  item_id: string;
  quantity_available: number;
  quantity_reserved: number;
  quantity_total: number;
  minimum_threshold: number;
  is_low_stock: boolean;
  item?: InventoryItem;
  depot?: Depot;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  item_id: string;
  from_depot_id?: string;
  to_depot_id?: string;
  assignment_id?: string;
  quantity: number;
  movement_type: string;
  actor_id?: string;
  notes?: string;
  created_at: string;
}

export interface SimulationMetrics {
  avg_wait_time_seconds: number;
  critical_wait_time_seconds: number;
  p95_wait_time_seconds: number;
  resource_utilization_pct: number;
  assignment_success_rate: number;
  unfulfilled_requests: number;
  step_history?: any[];
}

export interface ComparisonResult {
  scenario_name: string;
  random_seed: number;
  total_incidents: number;
  baseline_fifo: SimulationMetrics;
  risk_aware_algorithm: SimulationMetrics;
  improvements: {
    critical_wait_time_reduction_pct: number;
    overall_wait_time_reduction_pct: number;
    success_rate_delta_pct: number;
  };
  summary_analysis: string;
}

export interface OperationalKPIs {
  total_incidents: number;
  active_incidents: number;
  critical_incidents: number;
  resolved_incidents: number;
  available_teams: number;
  active_teams: number;
  average_response_time_minutes: number;
  supplies_critical_alerts: number;
}

// Mission Trace Types
export interface TraceOriginEvidence {
  id: string;
  evidence_type: string;
  s3_key: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_url?: string;
  created_at: string;
}

export interface TraceOriginMergedReport {
  id: string;
  tracking_id: string;
  title: string;
  description: string;
  affected_people: number;
  created_at: string;
}

export interface TraceOrigin {
  incident_id: string;
  tracking_id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affected_people: number;
  latitude: number;
  longitude: number;
  address: string;
  reporter_id?: string;
  reporter_phone?: string;
  is_simulated: boolean;
  is_escalated: boolean;
  escalation_reason?: string;
  report_count: number;
  created_at: string;
  updated_at: string;
  verified_by_id?: string;
  verified_by_name?: string;
  verified_at?: string;
  rejection_reason?: string;
  evidence: TraceOriginEvidence[];
  merged_reports: TraceOriginMergedReport[];
}

export interface TracePriority {
  severity_factor: number;
  impact_factor: number;
  wait_time_factor: number;
  vulnerability_factor: number;
  total_score: number;
  explanation: string;
  config_version: string;
  scoring_timestamp?: string;
  input_snapshot?: Record<string, any>;
  academic_disclaimer?: string;
}

export interface TraceCandidateSquad {
  team_id: string;
  team_name: string;
  team_type: string;
  base_location: string;
  distance_km?: number;
  suitability_score: number;
  is_recommended: boolean;
  is_eligible: boolean;
  active_assignments_count: number;
  capacity: number;
  qualifications: string[];
}

export interface TraceAssignment {
  assignment_id: string;
  team_id: string;
  team_name: string;
  team_type: string;
  assigned_by_id: string;
  assigned_by_name?: string;
  status: AssignmentStatus;
  is_operator_override: boolean;
  override_reason?: string;
  operator_notes?: string;
  responder_notes?: string;
  declination_reason?: string;
  recommended_team_id?: string;
  recommended_team_name?: string;
  candidate_snapshots: TraceCandidateSquad[];
  assigned_at: string;
  accepted_at?: string;
  declined_at?: string;
  en_route_at?: string;
  on_scene_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  reassigned_at?: string;
  team_base_latitude: number;
  team_base_longitude: number;
  team_current_latitude: number;
  team_current_longitude: number;
}

export interface TraceInventoryItem {
  reservation_id: string;
  assignment_id: string;
  depot_id: string;
  depot_name: string;
  depot_location: string;
  item_id: string;
  item_name: string;
  item_sku: string;
  unit: string;
  quantity_reserved: number;
  quantity_consumed: number;
  quantity_released: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TraceStockMovement {
  id: string;
  item_name: string;
  quantity: number;
  movement_type: string;
  from_depot_name?: string;
  to_depot_name?: string;
  actor_name?: string;
  notes?: string;
  created_at: string;
}

export interface TraceCloudOutboxEvent {
  id: string;
  event_type: string;
  status: string;
  idempotency_key: string;
  retry_count: number;
  last_error?: string;
  created_at: string;
  processed_at?: string;
  correlation_id: string;
  cloud_delivery_status: string;
  sqs_message_id?: string;
  worker_notes?: string;
  payload: Record<string, any>;
}

export interface TraceTimelineEvent {
  id: string;
  category: 'INCIDENT' | 'ASSIGNMENT' | 'INVENTORY' | 'OUTBOX' | 'AUDIT';
  event_type: string;
  title: string;
  description: string;
  previous_state?: string;
  new_state?: string;
  actor_id?: string;
  actor_name?: string;
  actor_role?: string;
  timestamp: string;
  relative_time: string;
  latitude?: number;
  longitude?: number;
  metadata: Record<string, any>;
}

export interface TraceDurations {
  incident_age_seconds: number;
  time_to_verification_seconds?: number;
  time_to_assignment_seconds?: number;
  time_to_acceptance_seconds?: number;
  time_to_resolution_seconds?: number;
  incident_age_display: string;
  time_to_verification_display?: string;
  time_to_assignment_display?: string;
  time_to_acceptance_display?: string;
  time_to_resolution_display?: string;
}

export interface MissionTraceResponse {
  incident: TraceOrigin;
  priority: TracePriority;
  assignments: TraceAssignment[];
  inventory_reservations: TraceInventoryItem[];
  stock_movements: TraceStockMovement[];
  cloud_outbox_events: TraceCloudOutboxEvent[];
  timeline: TraceTimelineEvent[];
  durations: TraceDurations;
  export_url?: string;
}
