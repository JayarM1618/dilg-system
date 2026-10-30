/** All types used across the frontend. */

export type Role = "super_admin" | "office_supervisor" | "barangay_rep";

export type SubmissionStatus =
  | "pending"
  | "submitted"
  | "under_review"
  | "compliant"
  | "non_compliant"
  | "draft"
  | "approved"
  | "returned"
  | "overdue"
  | "rejected"
  | "revision";

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface Barangay {
  id: number;
  name: string;
  code: string;
  about?: string | null;
  hall_address?: string | null;
  hotline?: string | null;
  office_hours?: string | null;
  contact_person?: string | null;
  contact_number?: string | null;
  contact_email?: string | null;
  is_active: boolean;
}

export interface User {
  id: number;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  contact_number?: string | null;
  position?: string | null;
  email: string;
  role: Role;
  barangay_id?: number | null;
  barangay?: Barangay | null;
  is_active: boolean;
  status: string;
  verification_status?: VerificationStatus;
  verified_at?: string | null;
  verified_by?: number | null;
  verifier?: { id: number; name: string } | null;
  rejection_reason?: string | null;
  profile_photo_url?: string | null;
  terms_accepted_at?: string | null;
  invited_at?: string | null;
  activated_at?: string | null;
  created_at?: string | null;
  // Security fields
  password_changed_at?: string | null;
  password_expires_at?: string | null;
  force_password_change?: boolean;
  two_factor_enabled?: boolean;
  two_factor_confirmed_at?: string | null;
  // Archive fields
  archived_at?: string | null;
  archived_by?: number | null;
}

export type ReportCycle = "weekly" | "monthly" | "quarterly" | "semestral" | "annual";

export interface ReportCategory {
  id: number;
  name: string;
  cycle: ReportCycle;
  description?: string | null;
}

export interface Submission {
  id: number;
  report_category_id: number;
  barangay_id: number;
  submitted_by?: number;
  period_label?: string;
  period_start?: string;
  period_end?: string;
  due_date?: string;
  is_overdue?: boolean;
  file_path?: string | null;
  original_filename?: string | null;
  status: SubmissionStatus;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: number | null;
  review_remarks?: string | null;
  reviewer_notes?: string | null;
  created_at?: string;
  updated_at?: string;
  barangay?: Barangay;
  category?: ReportCategory;
}

export type IncidentType =
  | "phishing_attempt"
  | "suspicious_login"
  | "data_leak_suspicion"
  | "malware"
  | "other";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentStatus =
  | "reported"
  | "acknowledged"
  | "escalated_to_icto"
  | "resolved"
  | "false_positive";

export interface SecurityIncident {
  id: number;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  status: IncidentStatus;
  created_at: string;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface TalaghayanRow {
  barangay: { id: number; name: string; code: string };
  submissions: {
    category: string;
    cycle: ReportCycle;
    period_label: string;
    status: SubmissionStatus;
    is_late: boolean;
  }[];
  compliance_rate: number;
  barangay_id?: number;
  barangay_name?: string;
  [key: string]: unknown;
}

export interface VerificationInfo {
  status: VerificationStatus;
  is_pending: boolean;
  is_verified: boolean;
  is_rejected: boolean;
  rejection_reason: string | null;
  verified_at: string | null;
}

export interface SecurityInfo {
  password_expired: boolean;
  force_password_change: boolean;
  password_changed_at: string | null;
  password_expires_at: string | null;
  two_factor_enabled: boolean;
  two_factor_confirmed_at: string | null;
}

/* ─── New super-admin types ─── */

export interface SystemSetting {
  key: string;
  value: string | number | boolean;
  type: "string" | "integer" | "boolean" | "json";
  description?: string | null;
  updated_at?: string;
}

export interface LoginAttempt {
  id: number;
  email: string;
  ip_address: string;
  user_agent?: string | null;
  successful: boolean;
  user_id?: number | null;
  failure_reason?: string | null;
  attempted_at: string;
  user?: { id: number; name: string; email: string; role: Role } | null;
}

export interface IpBlock {
  id: number;
  ip_address: string;
  reason?: string | null;
  type: "auto" | "manual";
  blocked_by?: number | null;
  blocked_at: string;
  expires_at?: string | null;
  is_active: boolean;
  blocker?: { id: number; name: string } | null;
}

export interface SystemBroadcast {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "critical" | "maintenance";
  target: "all" | "super_admin" | "office_supervisor" | "barangay_rep";
  is_active: boolean;
  is_dismissible: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  created_by?: number | null;
  creator?: { id: number; name: string } | null;
  created_at?: string;
}

export interface ErrorLog {
  id: number;
  level: string;
  channel: string;
  message: string;
  context?: string | null;
  trace?: string | null;
  file?: string | null;
  line?: number | null;
  url?: string | null;
  method?: string | null;
  user_id?: number | null;
  ip_address?: string | null;
  logged_at: string;
  user?: { id: number; name: string } | null;
}

export interface SessionInfo {
  id: string | number;
  type: "session" | "token";
  user_id: number;
  user_name: string;
  user_email: string;
  user_role: string;
  ip_address?: string;
  user_agent?: string;
  token_name?: string;
  last_activity: string;
}

export interface ArchiveSummary {
  counts: Record<string, number>;
  total: number;
}

export interface SystemHealth {
  overall: "healthy" | "degraded";
  checks: Record<string, { status: string; latency_ms?: number; message?: string; driver?: string }>;
  checked_at: string;
}

export interface SystemInfo {
  php_version: string;
  laravel_version: string;
  mysql_version: string;
  server_os: string;
  server_uptime: string;
  disk_total: number;
  disk_free: number;
  disk_used: number;
  memory_limit: string;
  memory_usage: number;
  max_upload: string;
  post_max_size: string;
  timezone: string;
  app_env: string;
  app_debug: boolean;
  cache_driver: string;
  queue_driver: string;
  mail_driver: string;
}

export type TicketStatus =
  | "pending_acceptance"
  | "in_progress"
  | "escalated"
  | "resolved"
  | "closed";

export type TicketCategory =
  | "borms_reporting"
  | "deadline_extension"
  | "technical_issue"
  | "policy_inquiry"
  | "compliance_dispute"
  | "general_inquiry";

export interface SupportTicketMessage {
  id: number;
  support_ticket_id: number;
  user_id: number;
  message: string;
  is_escalation_note?: boolean;
  created_at: string;
  updated_at: string;
  user?: { id: number; name: string; role: Role };
}

export interface SupportTicket {
  id: number;
  ticket_number: string;
  barangay_id?: number | null;
  user_id: number;
  category: TicketCategory;
  subject: string;
  description: string;
  priority: "normal" | "urgent" | "critical";
  status: TicketStatus;
  accepted_by?: { id: number; name: string; role: Role } | number | null;
  accepted_at?: string | null;
  escalated_by?: { id: number; name: string; role: Role } | number | null;
  escalation_reason?: string | null;
  escalated_at?: string | null;
  resolved_by?: { id: number; name: string; role: Role } | number | null;
  resolution_notes?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
  barangay?: { id: number; name: string; code: string } | null;
  creator?: { id: number; name: string; role: Role } | null;
  messages_count?: number;
  messages?: SupportTicketMessage[];
}
