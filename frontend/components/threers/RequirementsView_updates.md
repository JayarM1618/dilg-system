/**
 * ========================================================
 * REQUIREMENTS VIEW — Editable Forms & E-Signature Patch
 * ========================================================
 * INSTRUCTIONS: Apply these changes to your existing RequirementsView.tsx
 *
 * Adds the ability for supervisors to attach form templates to
 * requirements, and for barangay reps to fill out editable forms
 * with electronic signature directly within the system.
 */

// ──────────────────────────────────────────────────────────
// CHANGE 1: Add imports at the top of RequirementsView.tsx
// ──────────────────────────────────────────────────────────

/*
import FormFiller from "./FormFiller";
import type { FormTemplate, FormSubmissionItem } from "./types";
*/

// ──────────────────────────────────────────────────────────
// CHANGE 2: Add a "Forms" tab in the barangay rep view.
// Find the tabs array and add:
// ──────────────────────────────────────────────────────────

/*
  // In the barangay rep section, add a forms tab:
  const tabs = [
    { key: "requirements", label: "Requirements" },
    { key: "forms", label: "Editable Forms" },  // <-- NEW
  ];
*/

// ──────────────────────────────────────────────────────────
// CHANGE 3: Add the FormsList component for barangay reps
// Add this component inside or alongside RequirementsView.tsx
// ──────────────────────────────────────────────────────────

/*

function FormsList() {
  const { user } = useAuth();
  const { data: templates } = useFetch<{ data: FormTemplate[] }>(
    user ? "/api/form-templates" : null
  );
  const { data: submissions, reload } = useFetch<{ data: FormSubmissionItem[] }>(
    user ? "/api/form-submissions" : null
  );
  const [activeTemplate, setActiveTemplate] = useState<FormTemplate | null>(null);
  const [activeSubmission, setActiveSubmission] = useState<FormSubmissionItem | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (payload: {
    data: Record<string, unknown>;
    status: "draft" | "submitted";
    signature_data?: string;
    signature_name?: string;
    signature_position?: string;
  }) => {
    if (!activeTemplate) return;
    setSaving(true);
    try {
      if (activeSubmission) {
        // Update existing
        await apiSend(`/api/form-submissions/${activeSubmission.id}`, "PATCH", {
          ...payload,
          form_template_id: activeTemplate.id,
        });
      } else {
        // Create new
        await apiSend("/api/form-submissions", "POST", {
          ...payload,
          form_template_id: activeTemplate.id,
        });
      }
      reload();
      setActiveTemplate(null);
      setActiveSubmission(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  // If filling out a form
  if (activeTemplate) {
    return (
      <div>
        <button
          onClick={() => { setActiveTemplate(null); setActiveSubmission(null); }}
          className={`${btnGhost} mb-4 text-sm`}
        >
          ← Back to forms list
        </button>
        <FormFiller
          template={activeTemplate}
          initialData={activeSubmission?.data ?? {}}
          initialSignature={
            activeSubmission?.has_signature
              ? { name: activeSubmission.signature_name, position: activeSubmission.signature_position }
              : undefined
          }
          onSave={handleSave}
          saving={saving}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available form templates */}
      <section>
        <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-3">
          Available Forms
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {(templates?.data ?? []).length === 0 ? (
            <p className="text-sm text-muted dark:text-slate-400 col-span-2">
              No editable forms available yet.
            </p>
          ) : (
            (templates?.data ?? []).map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTemplate(t)}
                className="text-left rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 p-5 hover:border-[#7B4DFF]/40 transition-colors"
              >
                <h4 className="text-sm font-bold text-navy-900 dark:text-white">{t.title}</h4>
                {t.description && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.description}</p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full bg-[#7B4DFF]/15 px-2 py-0.5 text-[10px] font-bold text-[#5A18C9] dark:text-[#CDBBFF]">
                    {t.fields.length} fields
                  </span>
                  <span className="text-[10px] text-slate-400">v{t.version}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      {/* My submissions */}
      <section>
        <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-3">
          My Form Submissions
        </h3>
        {(submissions?.data ?? []).length === 0 ? (
          <p className="text-sm text-muted dark:text-slate-400">
            You haven't filled out any forms yet. Select a form above to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {(submissions?.data ?? []).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-navy-900 dark:text-white">
                    {s.template?.title ?? "Form"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Status: <StatusBadge status={s.status} /> · Updated {formatDateTime(s.updated_at)}
                  </p>
                </div>
                {(s.status === "draft" || s.status === "revision") && (
                  <button
                    onClick={() => {
                      setActiveTemplate(s.template!);
                      setActiveSubmission(s);
                    }}
                    className={`${btn} text-xs`}
                  >
                    {s.status === "revision" ? "Revise" : "Continue"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

*/

// ──────────────────────────────────────────────────────────
// CHANGE 4: For OFFICE view — Add form template management
// In the office section of RequirementsView, add a tab for
// managing form templates:
// ──────────────────────────────────────────────────────────

/*

function FormTemplateManager() {
  const { data, reload } = useFetch<{ data: FormTemplate[] }>("/api/form-templates");
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-navy-900 dark:text-white">Form Templates</h3>
        <button onClick={() => setShowCreate(!showCreate)} className={`${btn} text-xs`}>
          {showCreate ? "Cancel" : "+ Create Form Template"}
        </button>
      </div>

      {showCreate && <FormTemplateCreator onCreated={() => { reload(); setShowCreate(false); }} />}

      <div className="space-y-3">
        {(data?.data ?? []).map((t) => (
          <div key={t.id} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-navy-900 dark:text-white">{t.title}</h4>
                {t.description && <p className="text-xs text-slate-500 mt-1">{t.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  t.is_active
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                }`}>
                  {t.is_active ? "Active" : "Archived"}
                </span>
                <span className="text-xs text-slate-400">v{t.version}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {t.fields.length} fields · Created by {t.creator?.name ?? "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

*/

// ──────────────────────────────────────────────────────────
// CHANGE 5: FormTemplateCreator — JSON field builder
// This component lets supervisors visually add fields to
// create a new form template:
// ──────────────────────────────────────────────────────────

/*

function FormTemplateCreator({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [fields, setFields] = useState<FormField[]>([
    { name: "field_1", type: "text", label: "Field 1", required: true },
  ]);
  const [busy, setBusy] = useState(false);

  const addField = () => {
    const idx = fields.length + 1;
    setFields([...fields, { name: `field_${idx}`, type: "text", label: `Field ${idx}`, required: false }]);
  };

  const removeField = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const updateField = (idx: number, updates: Partial<FormField>) => {
    setFields(fields.map((f, i) => i === idx ? { ...f, ...updates } : f));
  };

  const handleSubmit = async () => {
    if (!title.trim() || fields.length === 0) return;
    setBusy(true);
    try {
      await apiSend("/api/form-templates", "POST", {
        title,
        description: description || null,
        category,
        fields,
      });
      onCreated();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#7B4DFF]/20 bg-[#F3EDFE] dark:bg-[#241A3F] p-6 space-y-4">
      <h4 className="text-sm font-bold text-navy-900 dark:text-white">Create Form Template</h4>

      <input
        type="text" value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="Form Title" className={`${field} w-full`}
      />
      <textarea
        value={description} onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)" rows={2} className={`${field} w-full`}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-bold text-slate-600 dark:text-slate-300">Fields</h5>
          <button onClick={addField} className={`${btnGhost} text-xs`}>+ Add Field</button>
        </div>

        {fields.map((f, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 items-end p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
            <input value={f.label} onChange={(e) => updateField(i, { label: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              placeholder="Label" className={`${field} col-span-1`} />
            <select value={f.type} onChange={(e) => updateField(i, { type: e.target.value as FormField['type'] })}
              className={`${field} col-span-1`}>
              {['text','textarea','number','date','select','checkbox','radio','file','signature'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-xs">
              <input type="checkbox" checked={f.required ?? false}
                onChange={(e) => updateField(i, { required: e.target.checked })}
                className="accent-[#7B4DFF]" />
              Required
            </label>
            <button onClick={() => removeField(i)} className="text-xs text-rose-500 hover:text-rose-700">Remove</button>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={handleSubmit} disabled={busy || !title.trim()} className={`${btn} text-sm`}>
          {busy ? "Creating…" : "Create Template"}
        </button>
      </div>
    </div>
  );
}

*/

export {};
