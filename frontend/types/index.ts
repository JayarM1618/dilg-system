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
  | "overdue";

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
