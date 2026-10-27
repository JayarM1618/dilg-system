"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiError } from "@/lib/api";
import { ROLE_INFO } from "@/lib/roles";
import type { User } from "@/types";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B4DFF]";

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, refetch, verification } = useAuth();

  const [position, setPosition] = useState(user?.position ?? "");
  const [contactNumber, setContactNumber] = useState(user?.contact_number ?? "");
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const roleInfo = ROLE_INFO[user.role];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (showPasswordSection && newPassword) {
      if (newPassword.length < 8) {
        setError("New password must be at least 8 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New password and confirmation do not match.");
        return;
      }
      if (!currentPassword) {
        setError("Please enter your current password to set a new password.");
        return;
      }
    }

    setSaving(true);
    try {
      const payload: {
        position?: string | null;
        contact_number?: string | null;
        current_password?: string;
        new_password?: string;
        new_password_confirmation?: string;
      } = {
        position: position.trim() || null,
        contact_number: contactNumber.trim() || null,
      };

      if (showPasswordSection && newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
        payload.new_password_confirmation = confirmPassword;
      }

      const res = await api.patch<{ message: string; user: User }>("/api/me", payload);
      setSuccess(res?.message ?? "Profile updated successfully.");
      await refetch();

      // Reset password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);

      setTimeout(() => {
        setSuccess(null);
      }, 3500);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-[#161024] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header banner */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 px-6 py-4 bg-slate-50/80 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#7B4DFF]/15 text-[#7B4DFF] dark:text-[#CDBBFF]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                My Official Profile
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                DILG Makati Governance Identity &amp; Credentials
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            title="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Biometric Selfie Profile Photo Section (STRICTLY LOCKED) */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5">
            <div className="relative shrink-0">
              <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-[#7B4DFF] shadow-lg bg-slate-950 flex items-center justify-center">
                {user.profile_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.profile_photo_url}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-[#7B4DFF]/20 text-[#7B4DFF] font-bold text-2xl">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-white shadow-md border-2 border-white dark:border-[#161024]" title="Profile photo is verified and locked">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#7B4DFF]/15 text-[#7B4DFF] dark:text-[#CDBBFF]">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Biometric Photo (Locked)
                </span>
                {verification?.is_verified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Verified by DILG
                  </span>
                )}
              </div>
              <h4 className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white truncate">
                {user.name}
              </h4>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Identity photo captured during your official activation. Biometric records cannot be altered to preserve verification integrity.
              </p>
            </div>
          </div>

          {/* Special Information (LOCKED / READ-ONLY) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Official Government Records (Locked)
              </label>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Read-only
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Full Name */}
              <div className="rounded-xl bg-slate-100/70 dark:bg-white/[0.04] p-3 border border-slate-200/60 dark:border-white/5 relative">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Official Full Name
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                  {user.name}
                </span>
                <span className="absolute right-3 top-3 text-slate-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </span>
              </div>

              {/* Email Address */}
              <div className="rounded-xl bg-slate-100/70 dark:bg-white/[0.04] p-3 border border-slate-200/60 dark:border-white/5 relative">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  DILG Sign-In Email
                </span>
                <span className="text-sm font-mono font-medium text-slate-800 dark:text-slate-200 mt-0.5 block truncate" title={user.email}>
                  {user.email}
                </span>
                <span className="absolute right-3 top-3 text-slate-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </span>
              </div>

              {/* Jurisdiction / Barangay */}
              <div className="rounded-xl bg-slate-100/70 dark:bg-white/[0.04] p-3 border border-slate-200/60 dark:border-white/5 relative">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Assigned Jurisdiction
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                  {user.barangay?.name ? `Barangay ${user.barangay.name}` : "DILG Makati Central"}
                </span>
                <span className="absolute right-3 top-3 text-slate-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </span>
              </div>

              {/* Role */}
              <div className="rounded-xl bg-slate-100/70 dark:bg-white/[0.04] p-3 border border-slate-200/60 dark:border-white/5 relative">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  System Authority
                </span>
                <span className="text-sm font-semibold text-[#7B4DFF] dark:text-[#CDBBFF] mt-0.5 block truncate">
                  {roleInfo?.label ?? user.role}
                </span>
                <span className="absolute right-3 top-3 text-slate-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
              * Official identity and jurisdiction changes require direct DILG administrator approval.
            </p>
          </div>

          {/* Editable Information */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Contact &amp; Assignment (Editable)
              </label>
              <span className="inline-flex items-center gap-1 text-[11px] text-[#7B4DFF] dark:text-[#CDBBFF] font-semibold">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Can be updated
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Position / Designation
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Barangay Secretary, Kagawad"
                  className={`w-full rounded-xl bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 outline-none transition focus:border-[#7B4DFF] focus:ring-2 focus:ring-[#7B4DFF]/20 ${focusRing}`}
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Your official title or office in the barangay.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Contact Mobile Number
                </label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="e.g. 09171234567"
                  className={`w-full rounded-xl bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 outline-none transition focus:border-[#7B4DFF] focus:ring-2 focus:ring-[#7B4DFF]/20 ${focusRing}`}
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Where DILG supervisors can reach you.
                </p>
              </div>
            </div>
          </div>

          {/* Change Password Toggle */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                setShowPasswordSection((v) => !v);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setError(null);
              }}
              className="text-xs font-bold text-[#7B4DFF] dark:text-[#CDBBFF] hover:underline flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>{showPasswordSection ? "Hide Password Change" : "Change Account Password"}</span>
            </button>

            {showPasswordSection && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className={`w-full rounded-xl bg-white dark:bg-[#1E1630] px-3.5 py-2 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 outline-none focus:border-[#7B4DFF] focus:ring-2 focus:ring-[#7B4DFF]/20 ${focusRing}`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className={`w-full rounded-xl bg-white dark:bg-[#1E1630] px-3.5 py-2 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 outline-none focus:border-[#7B4DFF] focus:ring-2 focus:ring-[#7B4DFF]/20 ${focusRing}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className={`w-full rounded-xl bg-white dark:bg-[#1E1630] px-3.5 py-2 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 outline-none focus:border-[#7B4DFF] focus:ring-2 focus:ring-[#7B4DFF]/20 ${focusRing}`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs font-medium text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-full px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors ${focusRing}`}
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`rounded-full bg-[#7B4DFF] hover:bg-[#6A3CF0] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-[#7B4DFF]/25 disabled:opacity-60 transition-all flex items-center gap-2 ${focusRing}`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
