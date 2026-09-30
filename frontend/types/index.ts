export type Role = "super_admin" | "office_supervisor" | "barangay_rep";

export interface Barangay {
  id: number;
  name: string;
  code: string;
  contact_person?: string | null;
  contact_number?: string | null;
  contact_email?: string | null;
  is_active: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  barangay_id: number | null;
  barangay?: Barangay | null;
  is_active: boolean;
}

export type ReportCycle = "weekly" | "monthly" | "quarterly" | "semestral" | "annual";

export interface ReportCategory {
  id: number;
  name: string;
  cycle: ReportCycle;
  description?: string | null;
}

export type SubmissionStatus =
  | "pending"
  | "submitted"
  | "under_review"
  | "compliant"
  | "non_compliant";

export interface Submission {
  id: number;
  barangay_id: number;
  report_category_id: number;
  period_label: string;
  period_start: string;
  period_end: string;
  due_date: string;
  file_path: string | null;
  original_filename: string | null;
  status: SubmissionStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_remarks: string | null;
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
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}
