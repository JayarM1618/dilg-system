"use client";

import { useState, useCallback, useEffect } from "react";
import SignaturePad from "@/components/threers/SignaturePad";
import { btn, btnGhost, Notice, formatBytes } from "@/components/threers/ui";
import type { FormField, FormTemplate } from "@/components/threers/types";

/* ------------------------------------------------------------------ */
/* FormFiller — Official Philippine Government Document & E-Signature */
/* Google Docs / Microsoft Word Document Sheet Layout                */
/* Supports: Clean document format, Draw Signature, & Isolated Print  */
/* ------------------------------------------------------------------ */

interface FormFillerProps {
  template: FormTemplate;
  /** Pre-filled data (e.g. from an existing draft submission) */
  initialData?: Record<string, unknown>;
  /** Existing signature info */
  initialSignature?: {
    data?: string;
    name?: string;
    position?: string;
  };
  /** Called on save (draft or submit) */
  onSave?: (payload: {
    data: Record<string, unknown>;
    status: "draft" | "submitted";
    signature_data?: string;
    signature_name?: string;
    signature_position?: string;
  }) => void;
  /** Is saving in progress? */
  saving?: boolean;
  /** Read-only mode (for reviewing submissions or supervisor preview) */
  readOnly?: boolean;
  /** Errors from server validation */
  serverErrors?: Record<string, string[]>;
  className?: string;
}

export interface AttachedFileMeta {
  name: string;
  size: number;
  type: string;
  data: string; // base64
}

export default function FormFiller({
  template,
  initialData = {},
  initialSignature,
  onSave,
  saving = false,
  readOnly = false,
  serverErrors,
  className = "",
}: FormFillerProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [signature, setSignature] = useState<{
    data?: string;
    name?: string;
    position?: string;
  }>(initialSignature ?? {});
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);

  const storageKey = `form_draft_${template.id}`;

  // Restore draft on mount if initialData is empty
  useEffect(() => {
    if (readOnly) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data && Object.keys(formData).length === 0) {
          setFormData(parsed.data);
          if (parsed.signature) setSignature(parsed.signature);
          setLastAutoSaved(parsed.savedAt || "Restored draft");
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey, readOnly]);

  // Debounced auto-save to localStorage
  useEffect(() => {
    if (readOnly || Object.keys(formData).length === 0) return;
    const timer = setTimeout(() => {
      try {
        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            data: formData,
            signature,
            savedAt: timeStr,
          })
        );
        setLastAutoSaved(timeStr);
      } catch {
        // ignore
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [formData, signature, storageKey, readOnly]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(storageKey);
      setFormData({});
      setSignature({});
      setLastAutoSaved(null);
    } catch {
      // ignore
    }
  };

  const updateField = useCallback((name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLocalErrors((prev) => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  }, []);

  /* ---- Validate required fields ---- */
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    for (const field of template.fields) {
      if (field.type === "section" || field.type === "signature") continue;
      if (field.required) {
        const val = formData[field.name];
        if (
          val === undefined ||
          val === null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0) ||
          (typeof val === "object" && Object.keys(val).length === 0)
        ) {
          errors[field.name] = `${field.label} is required`;
        }
      }
    }
    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (status: "draft" | "submitted") => {
    if (!onSave) return;
    if (status === "submitted" && !validate()) return;
    if (status === "submitted") {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
    onSave({
      data: formData,
      status,
      signature_data: signature.data,
      signature_name: signature.name,
      signature_position: signature.position,
    });
  };

  // Has explicit signature field OR default sign-off for submissions
  const hasSignatureField =
    template.fields.some((f) => f.type === "signature") ||
    !readOnly ||
    !!initialSignature?.data;

  /* ---- Print Handler: Isolates the Document Sheet Only ---- */
  const handlePrint = () => {
    document.body.classList.add("print-document-mode");

    const onAfterPrint = () => {
      document.body.classList.remove("print-document-mode");
      window.removeEventListener("afterprint", onAfterPrint);
    };

    window.addEventListener("afterprint", onAfterPrint);
    window.print();

    // Fallback cleanup if afterprint does not fire
    setTimeout(() => {
      document.body.classList.remove("print-document-mode");
    }, 2500);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ============================================================ */}
      {/* GOOGLE DOCS / MS WORD TOOLBAR (Visible on screen, hidden on print) */}
      {/* ============================================================ */}
      <div className="print:hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#1A1328]/95 backdrop-blur-md p-3 sm:px-5 sm:py-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0039A6]/10 text-[#0039A6] dark:bg-[#0039A6]/20 dark:text-[#93C5FD]">
            {/* Word / Document Icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {template.title}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Word / Document Mode &middot; Standard Letter (8.5&quot; &times; 11&quot;) &middot; v{template.version}
            </p>
            {lastAutoSaved && !readOnly && (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Draft saved locally {lastAutoSaved === "Restored draft" ? "(restored)" : `at ${lastAutoSaved}`}</span>
                <button
                  type="button"
                  onClick={clearDraft}
                  className="ml-1 text-[10px] text-slate-400 hover:text-rose-500 underline"
                  title="Clear locally saved draft"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 shadow-xs transition-colors"
            title="Print or export document as PDF"
          >
            <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print / Export Document</span>
          </button>

          {!readOnly && (
            <>
              <button
                type="button"
                onClick={() => handleSave("draft")}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-40 transition-colors"
              >
                {saving ? "Saving…" : "Save Draft"}
              </button>
              <button
                type="button"
                onClick={() => handleSave("submitted")}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0039A6] hover:bg-[#002B7F] text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs disabled:opacity-40 transition-colors"
              >
                <span>{saving ? "Submitting…" : "Submit & E-Sign"}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Server errors */}
      {serverErrors?.missing_fields && (
        <div className="print:hidden">
          <Notice kind="error">
            Missing required fields: {(serverErrors.missing_fields as unknown as string[]).join(", ")}
          </Notice>
        </div>
      )}

      {/* ============================================================ */}
      {/* GOOGLE DOCS / MS WORD DESKTOP WORKSPACE                      */}
      {/* Gray desk background with centered white paper document      */}
      {/* ============================================================ */}
      <div className="rounded-2xl bg-slate-200/60 dark:bg-[#0c0814] p-2 sm:p-6 md:p-8 flex justify-center">
        {/* ========================================================== */}
        {/* THE PAPER SHEET (Letter / A4 Document format)              */}
        {/* This container alone is extracted and printed              */}
        {/* ========================================================== */}
        <div
          id="printable-form-document"
          className="printable-form-document w-full max-w-[850px] bg-white text-slate-900 shadow-2xl border border-slate-300/80 rounded-xs p-6 sm:p-12 md:p-14 space-y-6 relative transition-all"
          style={{ fontFamily: 'var(--font-sans), "Times New Roman", Georgia, serif' }}
        >
          {/* -------------------------------------------------------- */}
          {/* 1. OFFICIAL PHILIPPINES & DILG LETTERHEAD                */}
          {/* -------------------------------------------------------- */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex items-center justify-between gap-4">
              {/* Left Seal / Crest Emblem */}
              <div className="shrink-0 flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full border border-slate-300 bg-slate-50 text-[#0039A6]">
                <svg className="w-9 h-9 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>

              {/* Centered Government Hierarchy Text */}
              <div className="text-center flex-1">
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-slate-600">
                  Republic of the Philippines
                </p>
                <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 mt-0.5">
                  Department of the Interior and Local Government
                </h2>
                <p className="text-[10px] sm:text-[11px] font-medium text-slate-700">
                  National Capital Region &middot; City of Makati
                </p>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-0.5">
                  Barangay Operations &amp; Review Management System (BORMS)
                </p>
              </div>

              {/* Right Seal / Document Status */}
              <div className="shrink-0 flex flex-col items-center justify-center text-center">
                <div className="flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full border border-slate-300 bg-slate-50 text-slate-700">
                  <span className="text-[9px] font-bold uppercase tracking-tighter">DILG<br/>OFFICIAL</span>
                </div>
              </div>
            </div>

            {/* Document Title (Word / Docs Header) */}
            <div className="text-center mt-5 pt-3 border-t border-slate-200">
              <h1 className="text-base sm:text-lg md:text-xl font-black uppercase tracking-wide text-slate-950 font-sans">
                {template.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                <span>FORM REF: DILG-MAKATI-{template.id || "DOC"}</span>
                <span>&bull;</span>
                <span>CATEGORY: {template.category || "GENERAL"}</span>
                <span>&bull;</span>
                <span>REVISION: v{template.version}</span>
              </div>
            </div>

            {/* General Instructions Note */}
            {template.description && (
              <div className="mt-4 rounded bg-slate-50 border border-slate-200/90 p-2.5 text-xs text-slate-700 italic leading-relaxed">
                <span className="font-bold not-italic text-slate-900 mr-1">Instructions:</span>
                {template.description}
              </div>
            )}
          </div>

          {/* -------------------------------------------------------- */}
          {/* 2. FORM FIELDS (Word / Google Docs Fillable Cells)       */}
          {/* -------------------------------------------------------- */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {template.fields
                .filter((f) => f.type !== "signature")
                .map((field) => {
                  const isSpan2 =
                    field.type === "section" ||
                    field.type === "textarea" ||
                    field.type === "file" ||
                    field.col_span === 2 ||
                    !field.col_span;

                  return (
                    <div
                      key={field.name}
                      className={isSpan2 ? "sm:col-span-2" : "sm:col-span-1"}
                    >
                      <FieldRenderer
                        field={field}
                        value={formData[field.name]}
                        onChange={(val) => updateField(field.name, val)}
                        error={localErrors[field.name]}
                        readOnly={readOnly}
                      />
                    </div>
                  );
                })}
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* 3. ELECTRONIC SIGNATURE & CERTIFICATION SECTION          */}
          {/* -------------------------------------------------------- */}
          {hasSignatureField && (
            <div className="pt-4 border-t-2 border-slate-900/80">
              <SignaturePad
                initialName={signature.name ?? ""}
                initialPosition={signature.position ?? ""}
                initialSignature={signature.data}
                readOnly={readOnly}
                onSave={(data, name, position) =>
                  setSignature({ data, name, position })
                }
                onClear={() => setSignature({})}
              />
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* 4. OFFICIAL DOCUMENT FOOTER (Word / Docs Style)         */}
          {/* -------------------------------------------------------- */}
          <div className="printable-doc-footer border-t border-slate-300 pt-3 mt-8 flex flex-wrap items-center justify-between text-[10px] text-slate-500 font-sans">
            <div>
              <p className="font-semibold text-slate-700">Official Document &middot; DILG E-Sub LGRRC</p>
              <p className="text-[9px]">City Government of Makati &middot; Barangay Operations &amp; Review</p>
            </div>
            <div className="text-right">
              <p>Form Control: DILG-BORMS-{template.id || "001"}</p>
              <p className="text-[9px]">Page 1 of 1</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BOTTOM ACTION BAR (Print:hidden)                             */}
      {/* ============================================================ */}
      {!readOnly && (
        <div className="print:hidden flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={saving}
            className={`${btnGhost} text-sm disabled:opacity-40`}
          >
            {saving ? "Saving…" : "Save as Draft"}
          </button>
          <button
            type="button"
            onClick={() => handleSave("submitted")}
            disabled={saving}
            className={`${btn} text-sm disabled:opacity-40 !bg-[#0039A6] hover:!bg-[#002B7F] text-white flex items-center justify-center gap-2`}
          >
            <span>{saving ? "Submitting Official Form…" : "Submit Official Form & E-Sign"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* FieldRenderer — renders an individual form field by type          */
/* Formatted like Google Docs / MS Word fillable form template        */
/* ================================================================== */

function FieldRenderer({
  field,
  value,
  onChange,
  error,
  readOnly,
}: {
  field: FormField;
  value: unknown;
  onChange: (val: unknown) => void;
  error?: string;
  readOnly?: boolean;
}) {
  const docInput =
    "w-full rounded border border-slate-300 bg-slate-50/40 hover:bg-white focus:bg-white focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 font-sans transition-colors disabled:opacity-80";
  const docLabel = "block text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-1";
  const errorCls = "mt-1 text-xs text-rose-600 font-semibold print:hidden";

  // SECTION DIVIDER (Word / Docs Table Section Header)
  if (field.type === "section") {
    return (
      <div className="pt-3 pb-1 border-b border-slate-300">
        <div className="bg-slate-100 border border-slate-300 px-3 py-1.5 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            {field.label}
          </h4>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Section</span>
        </div>
        {field.description && (
          <p className="mt-1 text-xs text-slate-600 italic px-1">{field.description}</p>
        )}
      </div>
    );
  }

  // FILE ATTACHMENT (Word / Docs Annex Attachment Block)
  if (field.type === "file") {
    const fileMeta =
      value && typeof value === "object" && "name" in value
        ? (value as AttachedFileMeta)
        : null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        onChange({
          name: file.name,
          size: file.size,
          type: file.type,
          data: reader.result as string, // base64
        });
      };
      reader.readAsDataURL(file);
    };

    return (
      <div className="rounded border border-slate-300 bg-slate-50/50 p-3.5 space-y-2">
        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
          <label className={docLabel}>
            {field.label}
            {field.required && <span className="text-rose-600 ml-0.5">*</span>}
          </label>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
            Official MOV Annex
          </span>
        </div>

        {field.description && (
          <p className="text-xs text-slate-600 italic mb-2">{field.description}</p>
        )}

        {fileMeta ? (
          <div className="flex items-center justify-between gap-3 rounded border border-slate-300 bg-white p-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-[#0039A6]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  Annex Attachment: {fileMeta.name}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {formatBytes(fileMeta.size)} &middot; {fileMeta.type || "Document"} &middot; Verified
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              {fileMeta.data && (
                <a
                  href={fileMeta.data}
                  download={fileMeta.name}
                  className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-[#0039A6] hover:bg-slate-50 transition-colors"
                  title="Download / View Attachment"
                >
                  Download
                </a>
              )}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="rounded p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remove Attachment"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {!readOnly && (
              <label className="print:hidden flex flex-col items-center justify-center rounded border-2 border-dashed border-slate-300 bg-white hover:border-slate-500 p-4 cursor-pointer transition-colors text-center">
                <svg className="w-6 h-6 mb-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xs font-semibold text-slate-700">
                  Attach Official Means of Verification (MOV)
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  PDF, DOCX, XLSX, or Images up to 10 MB
                </p>
                <input
                  type="file"
                  onChange={handleFileChange}
                  disabled={readOnly}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                />
              </label>
            )}

            <p className="hidden print:block text-xs text-slate-500 italic">
              [No physical attachment registered with this report]
            </p>
          </>
        )}

        {error && <p className={errorCls}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <label className={docLabel}>
        {field.label}
        {field.required && <span className="text-rose-600 ml-0.5">*</span>}
      </label>

      {field.description && (
        <p className="text-xs text-slate-600 italic mb-1">{field.description}</p>
      )}

      {/* TEXT */}
      {field.type === "text" && (
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? "Enter text..."}
          disabled={readOnly}
          className={docInput}
        />
      )}

      {/* TEXTAREA */}
      {field.type === "textarea" && (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? "Provide narrative or explanation..."}
          disabled={readOnly}
          rows={4}
          className={`${docInput} resize-y leading-relaxed`}
        />
      )}

      {/* NUMBER */}
      {field.type === "number" && (
        <input
          type="number"
          value={(value as number) ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
          placeholder={field.placeholder ?? "0"}
          disabled={readOnly}
          className={docInput}
        />
      )}

      {/* DATE */}
      {field.type === "date" && (
        <input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          className={docInput}
        />
      )}

      {/* SELECT */}
      {field.type === "select" && (
        <select
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          className={docInput}
        >
          <option value="">{field.placeholder ?? "— Select Option —"}</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt} className="bg-white text-slate-900">
              {opt}
            </option>
          ))}
        </select>
      )}

      {/* RADIO */}
      {field.type === "radio" && (
        <div className="flex flex-wrap gap-4 mt-1.5">
          {(field.options ?? []).map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer"
            >
              <input
                type="radio"
                name={field.name}
                value={opt}
                checked={(value as string) === opt}
                onChange={() => onChange(opt)}
                disabled={readOnly}
                className="accent-slate-900 h-4 w-4"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )}

      {/* CHECKBOX */}
      {field.type === "checkbox" && (
        <div className="flex flex-wrap gap-4 mt-1.5">
          {(field.options ?? []).length > 0 ? (
            (field.options ?? []).map((opt) => {
              const arr = Array.isArray(value) ? (value as string[]) : [];
              const checked = arr.includes(opt);
              return (
                <label
                  key={opt}
                  className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (checked) onChange(arr.filter((v) => v !== opt));
                      else onChange([...arr, opt]);
                    }}
                    disabled={readOnly}
                    className="accent-slate-900 rounded h-4 w-4"
                  />
                  <span>{opt}</span>
                </label>
              );
            })
          ) : (
            <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => onChange(e.target.checked)}
                disabled={readOnly}
                className="accent-slate-900 rounded h-4 w-4"
              />
              <span className="font-medium">{field.placeholder || "I confirm and certify this entry"}</span>
            </label>
          )}
        </div>
      )}

      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
}
