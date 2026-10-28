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
  category?: {
    id: number;
    name: string;
    cycle: string;
    slug?: string;
    sector?: string;
    deadline_description?: string;
    barangay_action?: string;
    supervisor_action?: string;
  } | null;
  latest_file?: SubmissionFileVersion | null;
};

export type Category = {
  id: number;
  name: string;
  cycle: string;
  slug?: string;
  sector?: string;
  deadline_description?: string;
  barangay_action?: string;
  supervisor_action?: string;
  sort_order?: number;
};

export type ResourceItem = {
  id: number;
  title: string;
  type: "template" | "guideline" | "sop" | "toolkit" | "citizen_chart" | "drive_link" | "security_advisory" | "other";
  resource_group: string;
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
  latest_resource?: { id: number; version: string; original_filename?: string } | null;
  description?: string | null;
  template?: { id: number; version: string; original_filename?: string } | null;
};

export type Submission = RepoSubmission;

export type Incident = {
  id: number;
  type: string;
  severity: string;
  description: string;
  status: string;
  evidence_path?: string | null;
  reported_by?: number;
  reporter?: { id: number; name: string; email?: string } | null;
  acknowledged_by?: number | null;
  acknowledger?: { id: number; name: string } | null;
  acknowledged_at?: string | null;
  resolution_notes?: string | null;
  resolved_at?: string | null;
  created_at: string;
};

/* ---------- Bagwis PPAs (city-level programs) ---------- */

export type BagwisPpa = {
  id: number;
  name: string;
  slug: string;
  frequency: string;
  responsible_office: string;
  description: string | null;
  deadline_description: string | null;
  sort_order: number;
};

export type BagwisPpaEntry = {
  id: number;
  bagwis_ppa_id: number;
  period_label: string;
  status: "pending" | "submitted" | "compliant" | "non_compliant";
  remarks: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  submitter?: { id: number; name: string } | null;
  reviewer?: { id: number; name: string } | null;
};

/* ---------- Requirements (DILG sends, barangays comply) ---------- */

export type AssignmentStatus = "pending" | "received" | "submitted" | "revision" | "complied";

export type RequirementFileItem = { id: number; original_filename: string; size_bytes: number };

export type RequirementResponseItem = {
  id: number;
  version: number;
  note: string | null;
  original_filename: string | null;
  size_bytes: number;
  created_at: string;
  uploader?: { id: number; name: string } | null;
};

export type RequirementAssignmentItem = {
  id: number;
  requirement_id: number;
  barangay_id: number;
  status: AssignmentStatus;
  received_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  is_overdue?: boolean;
  barangay?: { id: number; name: string } | null;
  responses?: RequirementResponseItem[];
  reviewer?: { id: number; name: string } | null;
};

export type RequirementItem = {
  id: number;
  title: string;
  kind: "file" | "report" | "complaint" | "memo" | "other";
  description: string | null;
  due_date: string | null;
  requires_response: boolean;
  form_template_id?: number | null;
  form_template?: FormTemplate | null;
  formTemplate?: FormTemplate | null;
  audience: "all" | "selected";
  status: "open" | "closed";
  created_at: string;
  creator?: { id: number; name: string } | null;
  files?: RequirementFileItem[];
  files_count?: number;
  progress?: { total: number; complied: number; submitted: number; revision: number; waiting: number; overdue: number; percent: number };
  assignments?: RequirementAssignmentItem[];
  assignment?: RequirementAssignmentItem;
};

/** A barangay's inbox row: its assignment plus the requirement DILG sent. */
export type InboxItem = RequirementAssignmentItem & {
  requirement: RequirementItem;
  responses_count: number;
};

export type TrackerRow = {
  barangay_id: number;
  barangay: string;
  total: number;
  complied: number;
  submitted: number;
  revision: number;
  waiting: number;
  overdue: number;
  percent: number | null;
};

export const KIND_LABEL: Record<RequirementItem["kind"], string> = {
  file: "File",
  report: "Report request",
  complaint: "Complaint",
  memo: "Memo",
  other: "Other",
};

export const ASSIGNMENT_LABEL: Record<AssignmentStatus, string> = {
  pending: "New",
  received: "Received",
  submitted: "Waiting for DILG review",
  revision: "Needs revision",
  complied: "Complied",
};

/* ---------- Repository (centralized document storage) ---------- */

export type DocumentCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  group_slug: string | null;
  documents_count?: number;
  children?: DocumentCategory[];
};

export type RepositoryDoc = {
  id: number;
  document_category_id: number;
  title: string;
  description: string | null;
  access_level: "public" | "office" | "barangay";
  barangay_id: number | null;
  original_filename: string;
  mime_type: string | null;
  size_bytes: number;
  sha256: string | null;
  status: "active" | "archived";
  archived_at: string | null;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
  category?: { id: number; name: string; slug: string } | null;
  barangay?: { id: number; name: string } | null;
  uploader?: { id: number; name: string } | null;
};

export type RepositorySummary = {
  total: number;
  by_category: DocumentCategory[];
  recent: RepositoryDoc[];
};

export const ACCESS_LABEL: Record<RepositoryDoc["access_level"], string> = {
  public: "Everyone",
  office: "DILG Office only",
  barangay: "Barangay only",
};

// ── Form Template (editable forms created by supervisors) ──
export interface FormField {
  name: string;
  type: "text" | "textarea" | "number" | "date" | "select" | "checkbox" | "radio" | "file" | "signature" | "section";
  label: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
  col_span?: 1 | 2;
}

export interface FormTemplate {
  id: number;
  title: string;
  description: string | null;
  category: string;
  fields: FormField[];
  version: string;
  is_active: boolean;
  creator?: { id: number; name: string };
  created_at: string;
}

// ── Form Submission (filled out by barangay reps) ──
export interface FormSubmissionItem {
  id: number;
  form_template_id: number;
  requirement_id: number | null;
  barangay_id: number;
  data: Record<string, unknown>;
  status: "draft" | "submitted" | "approved" | "revision" | "rejected";
  submitted_at: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  has_signature?: boolean;
  signature_name?: string;
  signature_position?: string;
  signed_at?: string | null;
  template?: FormTemplate;
  barangay?: { id: number; name: string };
  submitter?: { id: number; name: string };
  reviewer?: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

// ── Sector constants ──
export const SECTOR_LABELS: Record<string, string> = {
  barangay: "Barangay",
  sk: "Sangguniang Kabataan (SK)",
  katarungang_pambarangay: "Katarungang Pambarangay",
};

// ── Repository group constants (expanded) ──
export const REPO_GROUP_LABELS: Record<string, string> = {
  legislative: "Resolutions & Ordinances",
  civil_registry: "Civil Registry",
  audit_compliance: "Audit & Compliance",
  katarungang_pambarangay: "Katarungang Pambarangay",
  peace_order: "Peace & Order / Anti-Illegal Drugs",
  gad: "Gender & Development (GAD)",
  vulnerable_sectors: "Vulnerable Sectors",
  sk: "Sangguniang Kabataan (SK)",
  environment: "Environment / Solid Waste",
};

// ── Form submission status labels ──
export const FORM_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  revision: "Needs Revision",
  rejected: "Rejected",
};

