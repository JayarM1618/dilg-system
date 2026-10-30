"use client";

import { useEffect, useState } from "react";

interface BarangayHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BarangayHelpModal({ isOpen, onClose }: BarangayHelpModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "threers" | "statuses" | "support">("overview");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-[#0039A6] dark:bg-blue-950/50 dark:text-blue-300 font-bold text-lg">
              📘
            </span>
            <div>
              <h2 id="help-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Barangay Representative Operational Guide
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Talaghayan &bull; BORMS quick reference &amp; compliance FAQ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Close guide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="mt-4 flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5 text-xs font-semibold">
          {[
            { id: "overview", label: "Overview" },
            { id: "threers", label: "The 3 Rs" },
            { id: "statuses", label: "Status Guide" },
            { id: "support", label: "Contact & Support" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-2 px-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-white dark:bg-[#0039A6] text-[#0039A6] dark:text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-5 space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-4">
                <h3 className="font-bold text-[#0039A6] dark:text-blue-300">Welcome to Talaghayan E-Sub</h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  As the authorized representative for your barangay in Makati City, this system is your central workspace to submit official reports, comply with DILG circulars, and publish public notices to your citizens.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5">
                  <p className="font-bold text-slate-900 dark:text-white">🏢 Barangay Hub</p>
                  <p className="mt-1 text-slate-500 dark:text-slate-400">
                    Your command home screen with deadline countdown alerts and telemetry metrics.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5">
                  <p className="font-bold text-slate-900 dark:text-white">📁 BORMS Workspace</p>
                  <p className="mt-1 text-slate-500 dark:text-slate-400">
                    Where you file reports, access the document repository, and fill dynamic government form templates.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5">
                  <p className="font-bold text-slate-900 dark:text-white">🛡️ Bagwis</p>
                  <p className="mt-1 text-slate-500 dark:text-slate-400">
                    City-level view-only dashboard showing overall Makati 23-barangay compliance matrix.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5">
                  <p className="font-bold text-slate-900 dark:text-white">📢 Announcements &amp; Programs</p>
                  <p className="mt-1 text-slate-500 dark:text-slate-400">
                    Post local advisories, emergency numbers, and programs directly to the public Citizen Portal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "threers" && (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <span className="font-bold text-sm text-[#0039A6] dark:text-blue-300">1. Requirements (Directives &amp; Circulars)</span>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  These are specific directives, memo instructions, or urgent requests sent from DILG Makati supervisors requiring your barangay to comply or submit documentation.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <span className="font-bold text-sm text-[#0039A6] dark:text-blue-300">2. Reports (Periodic Compliance)</span>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  Recurring scheduled submissions: Monthly Accomplishment, Quarterly Financial &amp; Peace &amp; Order Reports, SK Submissions, and Annual Budget Accomplishments.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <span className="font-bold text-sm text-[#0039A6] dark:text-blue-300">3. Resources &amp; Repository</span>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  <strong>Resources:</strong> Official downloadable forms and memo guidelines. Fill them online with automated local draft saving.<br/>
                  <strong>Repository:</strong> Permanent digital archive of approved barangay resolutions, ordinances, and past submissions.
                </p>
              </div>
            </div>
          )}

          {activeTab === "statuses" && (
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20">
                <span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800 shrink-0">Pending</span>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">Waiting for Barangay Action</p>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">The filing cycle is open. Upload the required document or fill out the digital template before the due date.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20">
                <span className="px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-800 shrink-0">Under Review</span>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">Received by DILG Makati</p>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">Your filing has been logged. An assigned DILG supervisor is inspecting attachments and data entries.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 shrink-0">Compliant</span>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">Validated &amp; Approved</p>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">The report satisfies all statutory DILG requirements and counts toward your barangay&apos;s compliance score. Click <strong>Receipt</strong> to print your proof of submission.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl border border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20">
                <span className="px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800 shrink-0">Needs Fixing</span>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">Action Required / Returned with Remarks</p>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">The examiner noted missing signatures, wrong periods, or incomplete annexes. Review the examiner remarks, rectify the file, and click <strong>Resubmit</strong>.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "support" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-2">
                <p className="font-bold text-slate-900 dark:text-white text-sm">DILG Makati City Field Office</p>
                <p className="text-slate-600 dark:text-slate-300">
                  5th Floor, Makati City Hall (New Building), F. Zobel St., Brgy. Poblacion, Makati City
                </p>
                <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-1">
                  <p><strong>Telephone:</strong> (02) 8870-1160</p>
                  <p><strong>Email:</strong> makati.dilg@gmail.com</p>
                  <p><strong>Operating Hours:</strong> Monday &ndash; Friday, 8:00 AM &ndash; 5:00 PM</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20">
                <p className="font-bold text-[#0039A6] dark:text-blue-300">Tips for Faster Approvals</p>
                <ul className="mt-1.5 space-y-1 list-disc list-inside text-slate-600 dark:text-slate-300">
                  <li>Ensure uploaded PDFs have legible Punong Barangay and Secretary signatures.</li>
                  <li>Always verify that the period selected corresponds with the document content.</li>
                  <li>Download and print your <strong>e-AR Receipt</strong> immediately after submission for your council files.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
          <span className="text-xs text-slate-400">Need help? Contact DILG Makati Field Office</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#0039A6] hover:bg-[#002B7F] px-5 py-2 text-xs font-bold text-white transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

