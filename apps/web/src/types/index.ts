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
