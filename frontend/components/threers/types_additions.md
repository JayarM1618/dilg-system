/**
 * ========================================================
 * ADDITIONAL TYPES — Feature Expansion
 * ========================================================
 * ADD these type definitions to your existing types.ts file.
 */

// ── Form Template (editable forms created by supervisors) ──
export interface FormField {
  name: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'file' | 'signature';
  label: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
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
  status: 'draft' | 'submitted' | 'approved' | 'revision' | 'rejected';
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
  barangay: 'Barangay',
  sk: 'Sangguniang Kabataan (SK)',
  katarungang_pambarangay: 'Katarungang Pambarangay',
};

// ── Repository group constants (expanded) ──
export const REPO_GROUP_LABELS: Record<string, string> = {
  legislative: 'Resolutions & Ordinances',
  civil_registry: 'Civil Registry',
  audit_compliance: 'Audit & Compliance',
  katarungang_pambarangay: 'Katarungang Pambarangay',
  peace_order: 'Peace & Order / Anti-Illegal Drugs',
  gad: 'Gender & Development (GAD)',
  vulnerable_sectors: 'Vulnerable Sectors',
  sk: 'Sangguniang Kabataan (SK)',
  environment: 'Environment / Solid Waste',
};

// ── Form submission status labels ──
export const FORM_STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  revision: 'Needs Revision',
  rejected: 'Rejected',
};
