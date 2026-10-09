import type { SubmissionStatus } from "@/types";

export type Paged<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

export type SubmissionFileVersion = {
  id: number;
  version: number;
  original_filename: string;
  mime_type: string | null;
  size_bytes: number;
  sha256: string;
  created_at: string;
  uploader?: { id: number; name: string } | null;
};

export type RepoSubmission = {
  id: number;
  barangay_id: number;
  report_category_id: number;
  period_label: string;
  due_date: string;
  status: SubmissionStatus;
  submitted_at: string | null;
  review_remarks: string | null;
  /** Computed by Laravel: pending and past its due date. */
  is_overdue?: boolean;
  barangay?: { id: number; name: string } | null;
  category?: { id: number; name: string; cycle: string } | null;
  latest_file?: SubmissionFileVersion | null;
};

export type Category = { id: number; name: string; cycle: string };

export type ResourceItem = {
  id: number;
  title: string;
  type: "template" | "guideline" | "sop" | "security_advisory" | "other";
  description: string | null;
  version: string;
  is_current: boolean;
  effective_date: string | null;
  archived_at: string | null;
  original_filename: string | null;
  created_at: string;
  category?: Category | null;
  uploader?: { id: number; name: string } | null;
};

export type Period = { period_label: string; period_start: string; due_date: string };

export type ComplianceReport = {
  period_label: string | null;
  totals: {
    pending: number;
    submitted: number;
    under_review: number;
    compliant: number;
    non_compliant: number;
    total: number;
    overdue: number;
    late_filed: number;
    compliance_rate: number;
    filing_rate: number;
  };
  by_barangay: {
    barangay: { id: number; name: string; code: string };
    total: number;
    compliant: number;
    non_compliant: number;
    awaiting_review: number;
    not_filed: number;
    overdue: number;
    compliance_rate: number;
  }[];
  overdue: { id: number; barangay: string; category: string; due_date: string }[];
};

export type SecuritySummary = {
  total: number;
  open: number;
  unacknowledged_over_24h: number;
  avg_hours_to_acknowledge: number | null;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
};

export type AuditEntry = {
  id: number;
  action: string;
  subject_type: string | null;
  subject_id: number | null;
  meta: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user?: { id: number; name: string; role: string } | null;
};

export type CategoryWithTemplate = Category & {
  latest_resource?: { id: number; version: string } | null;
};

export type Incident = {
  id: number;
  type: string;
  severity: string;
  description: string;
  status: string;
  created_at: string;
};
