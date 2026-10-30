"use client";

import { useState, type FormEvent } from "react";
import { useFetch } from "@/hooks/useFetch";
import { apiSend } from "@/lib/http";
import { formatDate } from "@/lib/format";
import { useConfirm } from "@/components/ConfirmModal";
import FormFiller from "./FormFiller";
import { btn, btnGhost, field } from "./ui";
import {
  KIND_LABEL,
  type FormField,
  type FormTemplate,
  type RequirementItem,
} from "./types";

const card = "rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-sm";
const label = "mb-1 block text-sm font-medium text-slate-800 dark:text-slate-200";

interface Flash {
  kind: "ok" | "error";
  text: string;
}

/* ------------------------------------------------------------------ */
/* FORM PRESETS FOR QUICK START                                       */
/* ------------------------------------------------------------------ */

const FORM_PRESETS: Array<{
  name: string;
  title: string;
  category: string;
  description: string;
  fields: FormField[];
}> = [
  {
    name: "Barangay Accomplishment & Verification Report",
    title: "Barangay Monthly Accomplishment & Verification Report",
    category: "Audit & Compliance",
    description: "Official monthly progress and accomplishment report of programs, projects, and activities implemented by the Barangay Council.",
    fields: [
      { name: "reporting_period", type: "select", label: "Reporting Period / Quarter", required: true, options: ["1st Quarter (Jan-Mar)", "2nd Quarter (Apr-Jun)", "3rd Quarter (Jul-Sep)", "4th Quarter (Oct-Dec)"], col_span: 1 },
      { name: "date_submitted", type: "date", label: "Date of Report", required: true, col_span: 1 },
      { name: "project_name", type: "text", label: "Key Program / Project Title", required: true, placeholder: "e.g. Barangay Solid Waste & Cleanliness Drive", col_span: 2 },
      { name: "beneficiaries_count", type: "number", label: "Target Beneficiaries / Residents Served", required: true, placeholder: "e.g. 350", col_span: 1 },
      { name: "fund_source", type: "select", label: "Fund Source Utilized", required: true, options: ["Barangay General Fund", "20% Development Fund", "SK Fund", "Special Purpose Fund"], col_span: 1 },
      { name: "accomplishment_narrative", type: "textarea", label: "Detailed Accomplishment Narrative", required: true, placeholder: "Provide comprehensive narrative of project milestones, outcomes, and challenges...", col_span: 2 },
      { name: "sec_evidence", type: "section", label: "Official Means of Verification & Document Attachments", description: "Attach photo documentation, minutes, attendance sheets, or resolutions.", col_span: 2 },
      { name: "activity_photos_doc", type: "file", label: "Supporting Proof / Verification File (PDF, Office, or Images)", required: true, description: "Attach project photo album, payroll, or certificate of completion.", col_span: 2 },
      { name: "signature", type: "signature", label: "Official Certification & Electronic Signature", required: true, col_span: 2 },
    ],
  },
  {
    name: "DILG Directive / Advisory Compliance Memo",
    title: "Compliance Submission on DILG Directive",
    category: "General",
    description: "Standard compliance submission and verification report in response to issued DILG Makati memorandum, advisory, or circular.",
    fields: [
      { name: "memo_ref_no", type: "text", label: "Memorandum / Advisory Reference No.", required: true, placeholder: "e.g. DILG-MKT-MEMO-2026-042", col_span: 1 },
      { name: "date_received", type: "date", label: "Date Directive Was Received", required: true, col_span: 1 },
      { name: "action_taken", type: "textarea", label: "Barangay Actions Taken / Directive Implementation Status", required: true, placeholder: "Detail the specific actions and interventions executed by the barangay...", col_span: 2 },
      { name: "compliance_proof", type: "file", label: "Supporting Documentation / Proof of Compliance", required: true, description: "Attach transmittal letters, executive orders, or council resolutions.", col_span: 2 },
      { name: "signature", type: "signature", label: "Punong Barangay / Signatory Certification", required: true, col_span: 2 },
    ],
  },
  {
    name: "Katarungang Pambarangay Incident Docket",
    title: "Katarungang Pambarangay Case Resolution Docket",
    category: "Katarungang Pambarangay",
    description: "Summary report of disputes, conciliation proceedings, and settlements handled by the Lupon Tagapamayapa.",
    fields: [
      { name: "case_number", type: "text", label: "KP Case / Docket Number", required: true, placeholder: "e.g. KP-2026-089", col_span: 1 },
      { name: "hearing_date", type: "date", label: "Date of Conciliation Hearing", required: true, col_span: 1 },
      { name: "nature_of_dispute", type: "select", label: "Nature of Dispute", required: true, options: ["Civil / Debt Collection", "Property / Boundary Dispute", "Neighbor Altercation / Defamation", "Other Minor Offense"], col_span: 1 },
      { name: "case_status", type: "radio", label: "Settlement Status", required: true, options: ["Amicably Settled", "Certificate to File Action Issued", "Pending Hearing", "Dismissed / Withdrawn"], col_span: 1 },
      { name: "settlement_details", type: "textarea", label: "Summary of Agreement / Proceedings", required: true, placeholder: "Briefly narrate terms agreed by both parties...", col_span: 2 },
      { name: "case_file", type: "file", label: "Signed KP Form / Agreement Document", required: true, description: "Upload signed KP Form No. 16 (Amicable Settlement) or transmittal letter.", col_span: 2 },
      { name: "signature", type: "signature", label: "Lupon Chairman / Secretary Signature", required: true, col_span: 2 },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* FormTemplateManager — DILG Supervisor Form Management in Resource  */
/* ------------------------------------------------------------------ */

export default function FormTemplateManager({
  onSendRequirement,
  setFlash,
}: {
  onSendRequirement?: () => void;
  setFlash?: (f: Flash) => void;
}) {
  const confirm = useConfirm();
  const { data, reload } = useFetch<{ data: FormTemplate[] }>("/api/form-templates");
  const [showCreate, setShowCreate] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null);
  const [sendTemplate, setSendTemplate] = useState<FormTemplate | null>(null);

  const handleDelete = async (t: FormTemplate) => {
    const ok = await confirm(`Delete form template "${t.title}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await apiSend(`/api/form-templates/${t.id}`, "DELETE");
      setFlash?.({ kind: "ok", text: `Template "${t.title}" deleted.` });
      reload();
    } catch (err) {
      setFlash?.({ kind: "error", text: err instanceof Error ? err.message : "Failed to delete template." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0039A6]/10 text-[#0039A6] dark:bg-[#0039A6]/20 dark:text-[#93C5FD]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Official Form Formats &amp; E-Templates
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create standard Word/Docs formats, design e-signature fields, preview in document layout, and issue them directly to barangays.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(!showCreate)}
          className={`${btn} text-xs !bg-[#0039A6] hover:!bg-[#002B7F] text-white flex items-center gap-1.5 shadow-sm`}
        >
          {showCreate ? (
            <span>Close Form Studio</span>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Create Format (Word / Docs Style)</span>
            </>
          )}
        </button>
      </div>

      {/* Format Creator (Google Docs / MS Word Studio) */}
      {showCreate && (
        <FormTemplateCreator
          onCreated={() => {
            reload();
            setShowCreate(false);
            setFlash?.({ kind: "ok", text: "New official form format successfully saved and published!" });
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Form Formats List */}
      <div className="space-y-3">
        {(data?.data ?? []).length === 0 ? (
          <div className={`${card} py-12 text-center text-slate-500 dark:text-slate-400`}>
            <svg className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-semibold text-slate-700 dark:text-slate-300">No form templates created yet</p>
            <p className="text-xs mt-1">Click &ldquo;+ Create Format (Word / Docs Style)&rdquo; above to design your first official document format.</p>
          </div>
        ) : (
          (data?.data ?? []).map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-5 transition-all hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {t.title}
                    </h4>
                    <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                      {t.category || "General"}
                    </span>
                    <span className="rounded-full bg-blue-50 dark:bg-blue-500/10 text-[#0039A6] dark:text-blue-300 border border-blue-200 dark:border-blue-500/20 px-2 py-0.5 text-[10px] font-mono font-medium">
                      Word/Docs Ready
                    </span>
                  </div>
                  {t.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      {t.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      t.is_active
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                    }`}
                  >
                    {t.is_active ? "Active" : "Archived"}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">v{t.version}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-white/10 pt-3">
                <p className="text-xs text-slate-500">
                  {t.fields.length} form fields &middot; Created by {t.creator?.name ?? "DILG Makati"} &middot; {formatDate(t.created_at)}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(t)}
                    className={`${btnGhost} text-xs !py-1 !px-2.5 flex items-center gap-1.5`}
                  >
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Preview Document</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSendTemplate(t)}
                    className={`${btn} text-xs !py-1 !px-3 !bg-[#0039A6] hover:!bg-[#002B7F] text-white flex items-center gap-1.5`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Send to Barangays</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(t)}
                    className="rounded-lg p-1.5 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Delete Template"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview Modal in Google Docs / Word Layout */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col w-full max-w-4xl max-h-[92vh] bg-slate-100 dark:bg-[#120d20] rounded-2xl border border-slate-300 dark:border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1328]">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded bg-[#0039A6]/10 text-[#0039A6]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Word / Google Docs Document Preview: {previewTemplate.title}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Official format simulation &middot; Printable document format &middot; v{previewTemplate.version}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <FormFiller template={previewTemplate} readOnly />
            </div>

            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1328]">
              <span className="text-xs text-slate-500">
                Official Philippine Government standard format
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className={`${btnGhost} text-xs`}
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = previewTemplate;
                    setPreviewTemplate(null);
                    setSendTemplate(t);
                  }}
                  className={`${btn} text-xs !bg-[#0039A6] hover:!bg-[#002B7F] text-white flex items-center gap-1.5`}
                >
                  Send to Barangays
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Template Modal */}
      {sendTemplate && (
        <SendTemplateModal
          template={sendTemplate}
          onClose={() => setSendTemplate(null)}
          onSent={(msg) => {
            setFlash?.({ kind: "ok", text: msg });
            onSendRequirement?.();
          }}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/* FormTemplateCreator — Google Docs / Microsoft Word Document Studio */
/* Allows DILG Supervisor to visually craft documents on a paper sheet */
/* ================================================================== */

export function FormTemplateCreator({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel?: () => void;
}) {  const [activeTab, setActiveTab] = useState<"builder" | "preview">("builder");
  const [title, setTitle] = useState("Barangay Monthly Accomplishment & Verification Report");
  const [description, setDescription] = useState(
    "Official monthly progress and accomplishment report of programs, projects, and activities implemented by the Barangay Council."
  );
  const [category, setCategory] = useState("Audit & Compliance");
  const [version, setVersion] = useState("1.0");
  const [fields, setFields] = useState<FormField[]>(FORM_PRESETS[0].fields);
  const [busy, setBusy] = useState(false);
  const [newOptionTexts, setNewOptionTexts] = useState<Record<number, string>>({});

  const applyPreset = (preset: typeof FORM_PRESETS[0]) => {
    setTitle(preset.title);
    setDescription(preset.description);
    setCategory(preset.category);
    setFields([...preset.fields]);
  };

  const addField = (type: FormField["type"] = "text") => {
    const idx = fields.length + 1;
    const isSection = type === "section";
    const isSignature = type === "signature";
    const newField: FormField = {
      name: `field_${idx}_${Date.now().toString().slice(-4)}`,
      type,
      label: isSection
        ? `Section ${idx}: Title`
        : isSignature
        ? "Official Certification & Electronic Signature"
        : `Field ${idx}: Title`,
      required: !isSection,
      col_span: isSection || isSignature || type === "textarea" || type === "file" ? 2 : 1,
      options: type === "select" || type === "radio" || type === "checkbox" ? ["Option 1", "Option 2"] : undefined,
    };
    setFields([...fields, newField]);
  };

  const removeField = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const moveField = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= fields.length) return;
    const copy = [...fields];
    const temp = copy[idx];
    copy[idx] = copy[target];
    copy[target] = temp;
    setFields(copy);
  };

  const duplicateField = (idx: number) => {
    const orig = fields[idx];
    const copy: FormField = {
      ...orig,
      name: `${orig.name}_copy_${Date.now().toString().slice(-3)}`,
      label: `${orig.label} (Copy)`,
    };
    const newFields = [...fields];
    newFields.splice(idx + 1, 0, copy);
    setFields(newFields);
  };

  const updateField = (idx: number, updates: Partial<FormField>) => {
    setFields(fields.map((f, i) => (i === idx ? { ...f, ...updates } : f)));
  };

  const addOption = (fieldIdx: number) => {
    const text = (newOptionTexts[fieldIdx] ?? "").trim();
    if (!text) return;
    const current = fields[fieldIdx].options ?? [];
    updateField(fieldIdx, { options: [...current, text] });
    setNewOptionTexts({ ...newOptionTexts, [fieldIdx]: "" });
  };

  const removeOption = (fieldIdx: number, optIdx: number) => {
    const current = fields[fieldIdx].options ?? [];
    updateField(fieldIdx, { options: current.filter((_, i) => i !== optIdx) });
  };

  const handleSubmit = async () => {
    if (!title.trim() || fields.length === 0) {
      alert("Please provide a title and at least one form field.");
      return;
    }
    setBusy(true);
    try {
      await apiSend("/api/form-templates", "POST", {
        title: title.trim(),
        description: description.trim() || null,
        category,
        version: version || "1.0",
        fields,
      });
      onCreated();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setBusy(false);
    }
  };

  const previewTemplateObj: FormTemplate = {
    id: 0,
    title: title || "Untitled Form Format",
    description,
    category,
    fields,
    version,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  return (
    <div className="rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-xl overflow-hidden">
      {/* ============================================================ */}
      {/* 1. GOOGLE DOCS / MICROSOFT WORD APPLICATION TOOLBAR          */}
      {/* ============================================================ */}
      <div className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0F172A] px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0039A6] text-white shadow-xs">
            {/* Word Document Icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Word / Docs Document Format Studio</span>
              <span className="rounded bg-blue-100 dark:bg-blue-500/20 text-[#0039A6] dark:text-blue-300 text-[10px] font-bold px-2 py-0.5">
                DILG Standard
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Design government templates formatted like Microsoft Word &amp; Google Docs
            </p>
          </div>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-200/80 dark:bg-black/30 p-0.5 border border-slate-300/60 dark:border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("builder")}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                activeTab === "builder"
                  ? "bg-white dark:bg-[#0F172A] text-[#0039A6] dark:text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Document Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                activeTab === "preview"
                  ? "bg-white dark:bg-[#0F172A] text-[#0039A6] dark:text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Live Document Preview
            </button>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`${btnGhost} text-xs !py-1.5`}
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy || !title.trim() || fields.length === 0}
            className={`${btn} text-xs !py-1.5 !bg-[#0039A6] hover:!bg-[#002B7F] text-white flex items-center gap-1.5 shadow-sm`}
          >
            {busy ? "Saving Template..." : "Save & Publish Format"}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. WORD / GOOGLE DOCS INSERT CONTROLS RIBBON                 */}
      {/* ============================================================ */}
      <div className="border-b border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-[#1A1328] px-4 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
            Templates:
          </span>
          {FORM_PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:border-slate-800 hover:text-slate-900 transition-colors"
            >
              {p.name.split(" ")[0]} Form
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setTitle("");
              setDescription("");
              setFields([{ name: "field_1", type: "text", label: "General Project Title", required: true, col_span: 2 }]);
            }}
            className="rounded border border-dashed border-slate-400 dark:border-white/10 px-2 py-1 text-slate-500 hover:text-slate-900 transition-colors"
          >
            Blank Sheet
          </button>
        </div>


      </div>

      {/* ============================================================ */}
      {/* 3. WORKSPACE: GOOGLE DOCS / MICROSOFT WORD PAGE SHEET        */}
      {/* ============================================================ */}
      {activeTab === "preview" ? (
        /* LIVE DOCUMENT PREVIEW */
        <div className="p-4 sm:p-8 bg-slate-200/70 dark:bg-[#0c0814]">
          <div className="mb-4 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 max-w-[850px] mx-auto">
            <span className="italic">
              Interactive preview: this is exactly how barangays will see, fill, attach files, and sign your Word document.
            </span>
            <button
              type="button"
              onClick={() => setActiveTab("builder")}
              className={`${btnGhost} text-xs !py-0.5`}
            >
              &larr; Return to Editor
            </button>
          </div>
          <FormFiller template={previewTemplateObj} readOnly={false} />
        </div>
      ) : (
        /* DOCUMENT EDITOR CANVAS */
        <div className="p-3 sm:p-8 bg-slate-200/70 dark:bg-[#0c0814] flex justify-center">
          {/* THE PAPER SHEET CONTAINER */}
          <div className="w-full max-w-[850px] bg-white text-slate-900 shadow-2xl border border-slate-300 rounded-xs p-6 sm:p-12 md:p-14 space-y-6 relative">
            {/* ------------------------------------------------------ */}
            {/* A. DOCUMENT LETTERHEAD (Editable inline)               */}
            {/* ------------------------------------------------------ */}
            <div className="border-b-2 border-slate-900 pb-5">
              <div className="flex items-center justify-between gap-4">
                <div className="shrink-0 flex items-center justify-center h-14 w-14 rounded-full border border-slate-300 bg-slate-50 text-[#0039A6]">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>

                <div className="text-center flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">
                    Republic of the Philippines
                  </p>
                  <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900">
                    Department of the Interior and Local Government
                  </h3>
                  <p className="text-[11px] font-medium text-slate-700">
                    National Capital Region &middot; City of Makati
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-0.5">
                    Barangay Operations &amp; Review Management System (BORMS)
                  </p>
                </div>

                <div className="shrink-0 flex items-center justify-center h-14 w-14 rounded-full border border-slate-300 bg-slate-50 text-slate-700">
                  <span className="text-[9px] font-bold uppercase tracking-tighter text-center">DILG<br/>OFFICIAL</span>
                </div>
              </div>

              {/* Editable Document Title (Direct Word/Docs Heading) */}
              <div className="text-center mt-5 pt-3 border-t border-slate-200">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Document Title (Click to edit)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="CLICK TO ENTER OFFICIAL DOCUMENT TITLE"
                  className="w-full text-center font-black uppercase text-base sm:text-xl text-slate-950 border-b border-dashed border-slate-300 hover:border-slate-700 focus:border-slate-950 focus:outline-none py-1 bg-transparent transition-colors"
                />
              </div>

              {/* Document Metadata Table (Word ISO Box) */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border border-slate-300 bg-slate-50/70 p-2.5 rounded text-xs">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Document Category:
                  </span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-1 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="Audit & Compliance">Audit &amp; Compliance</option>
                    <option value="Peace & Order">Peace &amp; Order</option>
                    <option value="SK Affairs">SK Affairs</option>
                    <option value="Katarungang Pambarangay">Katarungang Pambarangay</option>
                    <option value="GAD">Gender &amp; Development (GAD)</option>
                    <option value="General">General / Administrative</option>
                  </select>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Template Version:
                  </span>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full mt-1 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none"
                    placeholder="1.0"
                  />
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Format Status:
                  </span>
                  <span className="inline-block mt-1 font-bold text-emerald-700 bg-emerald-100 rounded px-2 py-0.5 text-xs">
                    Official Active Format
                  </span>
                </div>
              </div>

              {/* Instructions / Purpose Callout */}
              <div className="mt-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Instructions for Barangay Officials:
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain the purpose, legal basis, and instructions on how barangays should accomplish this document..."
                  rows={2}
                  className="w-full text-xs italic bg-slate-50 border border-slate-300 rounded p-2.5 text-slate-800 focus:bg-white focus:border-slate-800 focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* ------------------------------------------------------ */}
            {/* B. DOCUMENT FIELDS ON THE PAPER SHEET                  */}
            {/* ------------------------------------------------------ */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Document Fields &amp; Content Elements ({fields.length})
                </h4>
                <span className="text-[10px] text-slate-500 italic">
                  Drag / reorder using arrow buttons
                </span>
              </div>

              {fields.map((f, i) => {
                const hasOptions = f.type === "select" || f.type === "radio" || f.type === "checkbox";
                const isSection = f.type === "section";
                const isSignature = f.type === "signature";

                return (
                  <div
                    key={i}
                    className={`rounded border p-3.5 transition-all relative ${
                      isSection
                        ? "bg-slate-100/90 border-slate-400"
                        : isSignature
                        ? "bg-emerald-50/40 border-emerald-300"
                        : "bg-white border-slate-300 hover:border-slate-500 shadow-xs"
                    }`}
                  >
                    {/* Header Controls for Field */}
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-200 font-bold text-slate-700 text-[10px]">
                          {i + 1}
                        </span>
                        <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                          {isSection ? "Section Divider" : isSignature ? "E-Signature Attestation" : f.type}
                        </span>
                        {!isSection && !isSignature && (
                          <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer ml-2">
                            <input
                              type="checkbox"
                              checked={f.required}
                              onChange={(e) => updateField(i, { required: e.target.checked })}
                              className="accent-slate-900 rounded"
                            />
                            <span>Required</span>
                          </label>
                        )}
                      </div>

                      {/* Move / Duplicate / Delete actions */}
                      <div className="flex items-center gap-1 text-slate-500">
                        <button
                          type="button"
                          onClick={() => moveField(i, -1)}
                          disabled={i === 0}
                          className="px-1.5 py-0.5 rounded hover:bg-slate-200 disabled:opacity-20 text-xs"
                          title="Move Up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveField(i, 1)}
                          disabled={i === fields.length - 1}
                          className="px-1.5 py-0.5 rounded hover:bg-slate-200 disabled:opacity-20 text-xs"
                          title="Move Down"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateField(i)}
                          className="px-1.5 py-0.5 rounded hover:bg-slate-200 text-slate-700 text-xs"
                          title="Duplicate Field"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => removeField(i)}
                          className="px-1.5 py-0.5 rounded hover:bg-rose-100 text-rose-600 text-xs font-semibold"
                          title="Delete Field"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Field Editor Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          {isSection ? "Section Heading Title" : "Field Question / Label"}
                        </label>
                        <input
                          type="text"
                          value={f.label}
                          onChange={(e) =>
                            updateField(i, {
                              label: e.target.value,
                              name: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 50) || `field_${i + 1}`,
                            })
                          }
                          className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Field Type
                        </label>
                        <select
                          value={f.type}
                          onChange={(e) =>
                            updateField(i, {
                              type: e.target.value as FormField["type"],
                              options: ["select", "radio", "checkbox"].includes(e.target.value) && !f.options ? ["Option 1", "Option 2"] : f.options,
                            })
                          }
                          className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none"
                        >
                          <option value="text">Short Text</option>
                          <option value="textarea">Long Narrative</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="select">Dropdown Menu</option>
                          <option value="radio">Multiple Choice</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="file">File Attachment</option>
                          <option value="section">Section Divider</option>
                          <option value="signature">Draw E-Sign Pad</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Layout Width
                        </label>
                        <select
                          value={f.col_span ?? 2}
                          onChange={(e) => updateField(i, { col_span: Number(e.target.value) as 1 | 2 })}
                          className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none"
                        >
                          <option value={2}>Full Page Width (100%)</option>
                          <option value={1}>Half Width (50%)</option>
                        </select>
                      </div>

                      {f.type !== "section" && f.type !== "signature" && (
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                            Placeholder Preview Text (Optional)
                          </label>
                          <input
                            type="text"
                            value={f.placeholder ?? ""}
                            onChange={(e) => updateField(i, { placeholder: e.target.value })}
                            placeholder="e.g. Enter project title..."
                            className="w-full rounded border border-slate-300 px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                          />
                        </div>
                      )}

                      <div className={f.type === "section" || f.type === "signature" ? "sm:col-span-4" : "sm:col-span-2"}>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Instructions for Official
                        </label>
                        <input
                          type="text"
                          value={f.description ?? ""}
                          onChange={(e) => updateField(i, { description: e.target.value })}
                          placeholder="e.g. Provide specific details or attach official documents."
                          className="w-full rounded border border-slate-300 px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                        />
                      </div>
                    </div>

                    {/* Options Editor for Select / Radio / Checkbox */}
                    {hasOptions && (
                      <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-2.5 space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                          Configure Dropdown / Choice Options:
                        </label>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {(f.options ?? []).map((opt, optIdx) => (
                            <span
                              key={optIdx}
                              className="inline-flex items-center gap-1 rounded bg-white border border-slate-300 px-2 py-0.5 text-xs text-slate-800"
                            >
                              <span>{opt}</span>
                              <button
                                type="button"
                                onClick={() => removeOption(i, optIdx)}
                                className="text-slate-400 hover:text-rose-600 ml-1 font-bold"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={newOptionTexts[i] ?? ""}
                            onChange={(e) => setNewOptionTexts({ ...newOptionTexts, [i]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addOption(i);
                              }
                            }}
                            placeholder="Add option and press Enter..."
                            className="flex-1 rounded border border-slate-300 px-2.5 py-1 text-xs text-slate-900 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => addOption(i)}
                            className="rounded bg-slate-800 text-white px-2.5 py-1 text-xs font-semibold hover:bg-black"
                          >
                            + Add Option
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bottom Insert Button */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => addField("text")}
                  className="rounded-lg border-2 border-dashed border-slate-300 hover:border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Insert Additional Field on this Page</span>
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------ */}
            {/* C. DOCUMENT FOOTER (Word / Docs Style)                 */}
            {/* ------------------------------------------------------ */}
            <div className="border-t border-slate-300 pt-3 mt-8 flex flex-wrap items-center justify-between text-[10px] text-slate-500 font-sans">
              <div>
                <p className="font-semibold text-slate-700">Official Document &middot; DILG E-Sub LGRRC</p>
                <p className="text-[9px]">City Government of Makati &middot; Barangay Operations &amp; Review</p>
              </div>
              <div className="text-right">
                <p>Form Control: DILG-BORMS-TMPL</p>
                <p className="text-[9px]">Page 1 of 1</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* SendTemplateModal — Modal to send template directly to barangays   */
/* ================================================================== */

function SendTemplateModal({
  template,
  onClose,
  onSent,
}: {
  template: FormTemplate;
  onClose: () => void;
  onSent: (message: string) => void;
}) {
  const [title, setTitle] = useState(template.title);
  const [kind, setKind] = useState<RequirementItem["kind"]>("report");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState(template.description || "");
  const [audience, setAudience] = useState<"all" | "selected">("all");
  const [picked, setPicked] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const barangays = useFetch<{ id: number; name: string; is_active?: boolean }[]>("/api/barangays");
  const list = (barangays.data ?? []).filter((b) => b.is_active !== false);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (audience === "selected" && picked.length === 0) return;

    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        kind,
        description: description.trim() || null,
        due_date: dueDate || null,
        requires_response: true,
        form_template_id: template.id,
        audience,
      };
      if (audience === "selected") {
        payload.barangay_ids = picked;
      }
      await apiSend("/api/requirements", "POST", payload);
      onSent(`"${title}" with attached format was sent to ${audience === "all" ? "all barangays" : `${picked.length} barangay(s)`}.`);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send requirement");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-xl max-h-[90vh] bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Send Form Format to Barangays</span>
            </h3>
            <p className="text-xs text-slate-500">
              Barangays will receive an official directive to fill &amp; e-sign &ldquo;{template.title}&rdquo;
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSend} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="rounded-xl border border-[#0039A6]/25 bg-[#0039A6]/10 p-3 text-xs text-[#0039A6] dark:text-blue-300 flex items-center gap-2">
            <span>Attached Format: <b>{template.title}</b> ({template.fields.length} fields &middot; v{template.version})</span>
          </div>

          <label className="block">
            <span className={label}>Directive Title</span>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`${field} w-full`}
              placeholder="e.g. Monthly Accomplishment Report"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={label}>Directive Type</span>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as RequirementItem["kind"])}
                className={`${field} w-full`}
              >
                {Object.entries(KIND_LABEL).map(([k, v]) => (
                  <option key={k} value={k} className="bg-white dark:bg-[#1E293B]">{v}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={label}>Deadline (optional)</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`${field} w-full`}
              />
            </label>
          </div>

          <label className="block">
            <span className={label}>Instructions / Transmittal Note</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${field} w-full resize-y`}
              placeholder="Provide instructions to the barangay officials regarding this document..."
            />
          </label>

          {/* Target Audience */}
          <div>
            <span className={label}>Target Barangays</span>
            <div className="flex items-center gap-4 mt-1 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="audience"
                  value="all"
                  checked={audience === "all"}
                  onChange={() => setAudience("all")}
                  className="accent-[#0039A6]"
                />
                <span>All Barangays ({list.length})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="audience"
                  value="selected"
                  checked={audience === "selected"}
                  onChange={() => setAudience("selected")}
                  className="accent-[#0039A6]"
                />
                <span>Select Specific Barangays</span>
              </label>
            </div>

            {audience === "selected" && (
              <div className="mt-2.5 max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10 p-2.5 space-y-1">
                {list.map((b) => (
                  <label key={b.id} className="flex items-center gap-2 text-xs cursor-pointer p-1 rounded hover:bg-slate-50 dark:hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={picked.includes(b.id)}
                      onChange={(e) => {
                        if (e.target.checked) setPicked([...picked, b.id]);
                        else setPicked(picked.filter((id) => id !== b.id));
                      }}
                      className="accent-[#0039A6] rounded"
                    />
                    <span>{b.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className={`${btnGhost} text-xs`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !title.trim() || (audience === "selected" && picked.length === 0)}
              className={`${btn} text-xs !bg-[#0039A6] hover:!bg-[#002B7F] text-white`}
            >
              {busy ? "Sending to Barangays..." : "Send Directive Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

