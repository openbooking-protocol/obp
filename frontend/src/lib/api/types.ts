// OBP API Types — generated from OpenAPI spec

export interface Pagination {
  total?: number;
  limit: number;
  cursor?: string;
  next_cursor?: string;
  has_more: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}

// ── Provider ──────────────────────────────────────────────────────────────

export type ProviderCategory =
  | "health"
  | "beauty"
  | "sport"
  | "education"
  | "professional"
  | "other";

export type ProviderStatus = "pending" | "active" | "suspended";

export interface ProviderLocation {
  address: string;
  city: string;
  country: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
}

export interface ProviderContact {
  email?: string;
  phone?: string;
  website?: string;
}

export interface Provider {
  id: string;
  name: string;
  description: string;
  category: ProviderCategory;
  location: ProviderLocation;
  timezone: string;
  contact: ProviderContact;
  logo_url?: string;
  federation_url?: string;
  status: ProviderStatus;
  metadata?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface CreateProviderInput {
  name: string;
  description: string;
  category: ProviderCategory;
  location: ProviderLocation;
  timezone: string;
  contact: ProviderContact;
  logo_url?: string;
  metadata?: Record<string, string>;
}

// ── Service ───────────────────────────────────────────────────────────────

export interface ServicePrice {
  amount: number;
  currency: string;
}

export interface CancellationPolicy {
  deadline_hours: number;
  fee_percent?: number;
  fee_fixed?: number;
}

export interface Service {
  id: string;
  provider_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  price?: ServicePrice;
  max_participants: number;
  requires_confirmation: boolean;
  cancellation_policy?: CancellationPolicy;
  tags: string[];
  active: boolean;
  metadata?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceInput {
  name: string;
  description: string;
  duration_minutes: number;
  buffer_before_minutes?: number;
  buffer_after_minutes?: number;
  price?: ServicePrice;
  max_participants?: number;
  requires_confirmation?: boolean;
  cancellation_policy?: CancellationPolicy;
  tags?: string[];
  active?: boolean;
  metadata?: Record<string, string>;
}

// ── Resource ──────────────────────────────────────────────────────────────

export type ResourceType = "staff" | "room" | "equipment";

export interface Resource {
  id: string;
  provider_id: string;
  type: ResourceType;
  name: string;
  services: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Schedule ──────────────────────────────────────────────────────────────

export interface RecurringRule {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface ScheduleException {
  date: string;
  available: boolean;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

export interface Schedule {
  id: string;
  provider_id: string;
  resource_id?: string;
  timezone: string;
  recurring_rules: RecurringRule[];
  exceptions: ScheduleException[];
  effective_from?: string;
  effective_until?: string;
  created_at: string;
  updated_at: string;
}

// ── Slot ──────────────────────────────────────────────────────────────────

export type SlotStatus = "available" | "held" | "booked" | "blocked";

export interface Slot {
  id: string;
  service_id: string;
  resource_id?: string;
  start_time: string;
  end_time: string;
  status: SlotStatus;
  remaining_capacity: number;
  price_override?: ServicePrice;
}

export interface HoldSlotResponse {
  slot_id: string;
  hold_token: string;
  expires_at: string;
}

// ── Booking ───────────────────────────────────────────────────────────────

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type BookingSource = "direct" | "federated" | "api";

export interface BookingCustomer {
  name: string;
  email: string;
  phone?: string;
}

export interface Booking {
  id: string;
  slot_id: string;
  service_id: string;
  provider_id: string;
  customer: BookingCustomer;
  status: BookingStatus;
  notes?: string;
  source: BookingSource;
  source_server?: string;
  version: number;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface CreateBookingInput {
  slot_id: string;
  hold_token: string;
  customer: BookingCustomer;
  notes?: string;
}

// ── Webhook ───────────────────────────────────────────────────────────────

export type WebhookEventType =
  | "booking.created"
  | "booking.confirmed"
  | "booking.cancelled"
  | "booking.completed"
  | "booking.no_show"
  | "slot.held"
  | "slot.released";

export interface Webhook {
  id: string;
  provider_id: string;
  url: string;
  events: WebhookEventType[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Federation ────────────────────────────────────────────────────────────

export type FederationPeerStatus = "pending" | "active" | "blocked";

export interface FederationPeer {
  id: string;
  server_url: string;
  name?: string;
  status: FederationPeerStatus;
  public_key?: string;
  created_at: string;
  updated_at: string;
}

// ── Federated search ──────────────────────────────────────────────────────

export interface FederatedProviderResult {
  id: string;
  name: string;
  description: string;
  category: ProviderCategory;
  location: ProviderLocation;
  timezone: string;
  contact: ProviderContact;
  logo_url?: string;
  status: ProviderStatus;
  serverUrl: string;
  created_at: string;
  updated_at: string;
}

// ── Discovery ─────────────────────────────────────────────────────────────

export interface WellKnownObp {
  obp_version: string;
  server_url: string;
  server_name: string;
  public_key?: string;
  federation_enabled: boolean;
  features: string[];
}

// ── Analytics ─────────────────────────────────────────────────────────────

export interface ProviderAnalytics {
  provider_id: string;
  period: { from: string; to: string };
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  completed_bookings: number;
  no_show_bookings: number;
  no_show_rate: number;
  bookings_by_day: Array<{ date: string; count: number }>;
  bookings_by_service: Array<{ service_id: string; name: string; count: number }>;
}

export interface ServerStats {
  total_providers: number;
  active_providers: number;
  total_services: number;
  total_bookings: number;
  total_slots: number;
  federation_peers: number;
}
