"use client";

import { useState, useCallback } from "react";
import SignaturePad from "@/components/threers/SignaturePad";
import { btn, btnGhost, Notice, formatBytes } from "@/components/threers/ui";
import type { FormField, FormTemplate } from "@/components/threers/types";

/* ------------------------------------------------------------------ */
/* FormFiller — renders an official government form from a template   */
/* Supports: real file uploads, interactive e-signature, printable    */
/* document generation, responsive layout, and validation            */
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Official Government Form Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white via-slate-50 to-[#F5F2FF] dark:from-[#1E1730] dark:via-[#191228] dark:to-[#140D22] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7B4DFF]/15 text-[#5A18C9] dark:text-[#CDBBFF] shadow-xs">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Republic of the Philippines &middot; DILG Makati
              </p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {template.title}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#7B4DFF]/15 px-3 py-1 text-xs font-semibold text-[#5A18C9] dark:text-[#CDBBFF]">
              {template.category || "General Form"}
            </span>
            <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-1 text-xs font-mono font-medium text-slate-600 dark:text-slate-300">
              v{template.version}
            </span>
            <button
              type="button"
              onClick={handlePrint}
              className={`${btnGhost} text-xs !py-1 !px-2.5 flex items-center gap-1.5`}
              title="Print or export as PDF document"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print / Export Document</span>
            </button>
          </div>
        </div>

        {template.description && (
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {template.description}
          </p>
        )}
      </div>

      {/* Server errors */}
      {serverErrors?.missing_fields && (
        <Notice kind="error">
          Missing required fields: {(serverErrors.missing_fields as unknown as string[]).join(", ")}
        </Notice>
      )}

      {/* Dynamic Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {template.fields
          .filter((f) => f.type !== "signature") // Signature rendered in dedicated certification section
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

      {/* Electronic Signature & Certification Section */}
      {hasSignatureField && (
        <div className="pt-2">
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

      {/* Action Buttons */}
      {!readOnly && (
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
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
            className={`${btn} text-sm disabled:opacity-40 !bg-[#7B4DFF] hover:!bg-[#6A3DE8] text-white flex items-center justify-center gap-2`}
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
  const baseInput =
    "w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7B4DFF]/40 disabled:opacity-60 transition-colors";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1";
  const errorCls = "mt-1 text-xs text-rose-500 font-medium";

  // SECTION DIVIDER
  if (field.type === "section") {
    return (
      <div className="pt-4 pb-2 border-b border-slate-200 dark:border-white/10">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-[#7B4DFF]" />
          {field.label}
        </h4>
        {field.description && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{field.description}</p>
        )}
      </div>
    );
  }

  // FILE ATTACHMENT
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
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <label className={labelCls}>
            {field.label}
            {field.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Attachment</span>
        </div>

        {field.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{field.description}</p>
        )}

        {fileMeta ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#7B4DFF]/30 bg-white dark:bg-[#1E1730] p-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7B4DFF]/15 text-[#7B4DFF]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {fileMeta.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  {formatBytes(fileMeta.size)} &middot; {fileMeta.type || "Document"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {fileMeta.data && (
                <a
                  href={fileMeta.data}
                  download={fileMeta.name}
                  className={`${btnGhost} text-xs !py-1 !px-2.5 text-[#7B4DFF]`}
                  title="Download / View Attachment"
                >
                  Download File
                </a>
              )}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Remove Attachment"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ) : (
          !readOnly && (
            <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-white/20 p-5 bg-white dark:bg-black/20 hover:border-[#7B4DFF]/50 cursor-pointer transition-colors text-center">
              <svg className="w-8 h-8 mb-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Click or drag file to attach
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supports PDF, DOCX, XLSX, Images up to 10 MB
              </p>
              <input
                type="file"
                onChange={handleFileChange}
                disabled={readOnly}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              />
            </label>
          )
        )}

        {readOnly && !fileMeta && (
          <p className="text-xs text-slate-400 italic">No file attached.</p>
        )}

        {error && <p className={errorCls}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <label className={labelCls}>
        {field.label}
        {field.required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>

      {field.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">{field.description}</p>
      )}

      {/* TEXT */}
      {field.type === "text" && (
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? "Enter text..."}
          disabled={readOnly}
          className={baseInput}
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
          className={`${baseInput} resize-y`}
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
          className={baseInput}
        />
      )}

      {/* DATE */}
      {field.type === "date" && (
        <input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          className={baseInput}
        />
      )}

      {/* SELECT */}
      {field.type === "select" && (
        <select
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          className={baseInput}
        >
          <option value="">{field.placeholder ?? "— Select Option —"}</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt} className="bg-white dark:bg-[#201835]">
              {opt}
            </option>
          ))}
        </select>
      )}

      {/* RADIO */}
      {field.type === "radio" && (
        <div className="flex flex-wrap gap-4 mt-2">
          {(field.options ?? []).map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <input
                type="radio"
                name={field.name}
                value={opt}
                checked={(value as string) === opt}
                onChange={() => onChange(opt)}
                disabled={readOnly}
                className="accent-[#7B4DFF] h-4 w-4"
              />
              {opt}
            </label>
          ))}
        </div>
      )}

      {/* CHECKBOX */}
      {field.type === "checkbox" && (
        <div className="flex flex-wrap gap-4 mt-2">
          {(field.options ?? []).length > 0 ? (
            (field.options ?? []).map((opt) => {
              const arr = Array.isArray(value) ? (value as string[]) : [];
              const checked = arr.includes(opt);
              return (
                <label
                  key={opt}
                  className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (checked) onChange(arr.filter((v) => v !== opt));
                      else onChange([...arr, opt]);
                    }}
                    disabled={readOnly}
                    className="accent-[#7B4DFF] rounded h-4 w-4"
                  />
                  {opt}
                </label>
              );
            })
          ) : (
            <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => onChange(e.target.checked)}
                disabled={readOnly}
                className="accent-[#7B4DFF] rounded h-4 w-4"
              />
              <span>{field.placeholder || "I confirm and certify this entry"}</span>
            </label>
          )}
        </div>
      )}

      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
}
