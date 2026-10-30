"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Poppins } from "next/font/google";
import BrandMark from "@/components/BrandMark";
import { api, ApiError } from "@/lib/api";
import { apiSend } from "@/lib/http";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0039A6]";

const field =
  "w-full rounded-xl bg-slate-50 dark:bg-[#0F172A] py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white outline-none ring-1 ring-slate-200 dark:ring-white/10 transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#0039A6]";

const fieldNoIcon =
  "w-full rounded-xl bg-slate-50 dark:bg-[#0F172A] py-3 px-4 text-sm text-slate-900 dark:text-white outline-none ring-1 ring-slate-200 dark:ring-white/10 transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#0039A6]";

/* ─── Step indicator labels ─── */
const STEPS = [
  { key: "terms", label: "Terms & Conditions" },
  { key: "profile", label: "Profile Details" },
  { key: "photo", label: "Photo Capture" },
  { key: "complete", label: "Complete" },
] as const;

interface Invite {
  name: string;
  email: string;
  role: string;
  barangay: string | null;
  steps_completed: {
    terms: boolean;
    profile: boolean;
    photo: boolean;
  };
}

export default function ActivatePage() {
  return (
    <Suspense fallback={null}>
      <ActivateFlow />
    </Suspense>
  );
}

function ActivateFlow() {
  const token = useSearchParams().get("token") ?? "";
  const [invite, setInvite] = useState<Invite | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "invalid" | "done">("loading");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(0); // 0=terms, 1=profile, 2=photo, 3=complete

  useEffect(() => {
    if (!token) {
      setState("invalid");
      setMessage("This page needs the activation link the DILG Makati office sent to your email.");
      return;
    }
    api
      .get<Invite>(`/api/activate/${encodeURIComponent(token)}`)
      .then((res) => {
        setInvite(res);
        // Resume from where they left off
        if (res.steps_completed.photo) setStep(3);
        else if (res.steps_completed.profile) setStep(2);
        else if (res.steps_completed.terms) setStep(1);
        else setStep(0);
        setState("ready");
      })
      .catch((err: unknown) => {
        setState("invalid");
        setMessage(err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");
      });
  }, [token]);

  return (
    <div className={`${poppins.className} min-h-screen w-full bg-slate-50 dark:bg-[#0E0A17] text-slate-800 dark:text-[#E9DFFF] transition-colors duration-500 ease-out flex flex-col`}>
      {/* Atmospheric Glows */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[40rem] w-[40rem] rounded-full bg-[#E6FBF3]/40 blur-3xl dark:bg-[#06D6A0]/10" />
        <div className="absolute right-0 top-40 h-[40rem] w-[40rem] rounded-full bg-blue-50/20 blur-3xl dark:bg-[#0039A6]/15" />
        <div className="absolute bottom-0 left-1/3 h-[36rem] w-[36rem] rounded-full bg-[#FFF8E6]/40 blur-3xl dark:bg-[#F5A800]/10" />
      </div>

      {/* Header */}
      <header className="relative z-20 w-full border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#150F22]/85 backdrop-blur-2xl">
        <div className="w-full flex items-center justify-between px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#EBF2FF] text-[#0039A6] hover:bg-[#DBEAFE] dark:bg-[#1E293B] dark:text-[#93C5FD] ${focusRing}`} aria-label="Go back to home">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </Link>
            <BrandMark tone="dark" />
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-[#06D6A0]" />
              Account Activation
            </span>
          </div>
          <Link href="/login" className={`rounded-full bg-white dark:bg-white/10 px-4 py-2 text-xs sm:text-sm font-semibold text-[#002B7F] dark:text-[#93C5FD] ring-1 ring-[#CBD5E1] dark:ring-white/15 hover:bg-slate-50 dark:hover:bg-white/15 ${focusRing}`}>
            Sign In &rarr;
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-start justify-center px-4 sm:px-8 py-8 sm:py-12">
        <div className="w-full max-w-2xl">

          {/* Loading */}
          {state === "loading" && (
            <div className="py-20 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-solid border-[#0039A6] border-r-transparent" />
              <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">Validating activation link...</p>
            </div>
          )}

          {/* Invalid */}
          {state === "invalid" && (
            <div className="mx-auto max-w-md rounded-3xl bg-white dark:bg-[#171126] border border-slate-200 dark:border-white/10 p-7 sm:p-9 shadow-2xl">
              <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 p-4 text-xs leading-relaxed text-rose-800 dark:text-rose-300">
                <p className="font-bold text-sm mb-1">Invalid or Expired Link</p>
                {message}
              </div>
              <Link href="/" className={`mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15 ${focusRing}`}>
                &larr; Return to Home
              </Link>
            </div>
          )}

          {/* Done */}
          {state === "done" && (
            <div className="mx-auto max-w-md rounded-3xl bg-white dark:bg-[#171126] border border-slate-200 dark:border-white/10 p-7 sm:p-9 shadow-2xl text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#E6FBF3] text-[#06D6A0] dark:bg-[#0E382C] dark:text-[#84DEBD]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Activation Complete!</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Your account has been activated and is now <strong>pending verification</strong> by a DILG administrator.
              </p>
              <div className="mt-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 p-4 text-left">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-200">What happens next?</p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  You can sign in right away, but your access will be limited until an administrator reviews and verifies your account. You will receive a notification once verified.
                </p>
              </div>
              <Link href="/login" className={`mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#0039A6] py-3.5 text-sm font-semibold text-white shadow-md shadow-sm hover:bg-[#002B7F] ${focusRing}`}>
                Sign In &rarr;
              </Link>
            </div>
          )}

          {/* Multi-step form */}
          {state === "ready" && invite && (
            <>
              {/* Step Indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  {STEPS.map((s, i) => (
                    <div key={s.key} className="flex items-center flex-1 last:flex-none">
                      <div className={`flex items-center gap-2 ${i <= step ? "text-[#0039A6] dark:text-[#93C5FD]" : "text-slate-400 dark:text-slate-500"}`}>
                        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors ${
                          i < step ? "bg-[#06D6A0] text-white" : i === step ? "bg-[#0039A6] text-white" : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                        }`}>
                          {i < step ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                          ) : (
                            i + 1
                          )}
                        </div>
                        <span className="hidden sm:block text-xs font-semibold whitespace-nowrap">{s.label}</span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 sm:mx-3 rounded transition-colors ${i < step ? "bg-[#06D6A0]" : "bg-slate-200 dark:bg-white/10"}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Info Banner */}
              <div className="mb-6 rounded-2xl bg-purple-50 dark:bg-white/5 border border-purple-100 dark:border-white/10 p-4 flex items-center gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EBF2FF] dark:bg-[#1E293B]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0039A6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{invite.name}</p>
                  <p className="text-xs text-[#0039A6] dark:text-[#93C5FD]">{invite.email}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{invite.barangay ? `Barangay ${invite.barangay}` : "DILG Makati Operations Office"}</p>
                </div>
              </div>

              {/* Step 0: Terms & Conditions */}
              {step === 0 && <StepTerms token={token} onDone={() => setStep(1)} />}

              {/* Step 1: Profile Details + Password */}
              {step === 1 && <StepProfile token={token} invite={invite} onDone={() => setStep(2)} />}

              {/* Step 2: Photo Capture */}
              {step === 2 && <StepPhoto token={token} onDone={() => setStep(3)} />}

              {/* Step 3: Complete */}
              {step === 3 && <StepComplete token={token} onDone={() => setState("done")} />}
            </>
          )}
        </div>
      </main>

      <footer className="relative z-20 py-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-white/5">
        &copy; {new Date().getFullYear()} Republic of the Philippines &middot; DILG Makati City Field Office
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STEP 0 — Terms & Conditions
   ═══════════════════════════════════════════════════════════════════ */
function StepTerms({ token, onDone }: { token: string; onDone: () => void }) {
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      await apiSend("/api/activate/terms", "POST", { token, accepted: true });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-[#171126] border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-2xl">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Terms & Conditions</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Please read and accept the terms before proceeding.</p>

      <div className="rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 p-5 max-h-64 overflow-y-auto text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
        <p className="font-bold text-sm text-slate-900 dark:text-white">DILG Makati Talaghayan Portal — Terms of Use</p>

        <p><strong>1. Authorized Use.</strong> This system is provided exclusively for official use by authorized personnel of the Department of the Interior and Local Government (DILG) Makati City Field Office and designated Barangay Representatives. Access credentials are non-transferable.</p>

        <p><strong>2. Account Security.</strong> You are solely responsible for maintaining the confidentiality of your account credentials. You must immediately notify the DILG Makati Field Office of any unauthorized use of your account or any other security breach.</p>

        <p><strong>3. Data Privacy.</strong> In compliance with Republic Act No. 10173 (Data Privacy Act of 2012), personal information collected through this portal shall be processed only for legitimate purposes related to DILG operations. Your profile photo is required for identity verification purposes and will be stored securely.</p>

        <p><strong>4. Acceptable Use.</strong> You agree to use this system only for its intended purpose: filing reports, managing requirements, accessing resources, and performing duties related to your official role. Any misuse, unauthorized access, or attempt to compromise system security is strictly prohibited.</p>

        <p><strong>5. Government Property.</strong> All data, reports, and documents submitted through this portal are considered government records. Unauthorized disclosure, modification, or deletion of such records is prohibited and may be subject to administrative and/or criminal penalties under applicable laws.</p>

        <p><strong>6. Monitoring.</strong> System activity is monitored and logged for security and compliance purposes. The DILG reserves the right to review, audit, and investigate any activity within this system.</p>

        <p><strong>7. Account Verification.</strong> Upon activation, your account will undergo a verification process by a DILG administrator. During this period, system access may be limited. Full access will be granted upon successful verification.</p>

        <p><strong>8. Modifications.</strong> The DILG reserves the right to modify these terms at any time. Continued use of the system constitutes acceptance of any modifications.</p>
      </div>

      <label className="mt-5 flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-5 w-5 rounded border-slate-300 text-[#0039A6] focus:ring-[#0039A6] dark:border-white/20 dark:bg-black/30"
        />
        <span className="text-sm text-slate-700 dark:text-slate-300">
          I have read and agree to the <strong>Terms & Conditions</strong> and the <strong>Data Privacy Policy</strong> of the DILG Makati Talaghayan Portal.
        </span>
      </label>

      {error && (
        <div className="mt-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs font-medium text-rose-700 dark:text-rose-300">{error}</div>
      )}

      <button
        type="button"
        disabled={!accepted || saving}
        onClick={submit}
        className={`mt-6 w-full rounded-full bg-[#0039A6] py-3.5 text-sm font-semibold text-white shadow-md shadow-sm hover:bg-[#002B7F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`}
      >
        {saving ? "Saving..." : "Accept & Continue"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STEP 1 — Profile Details + Password
   ═══════════════════════════════════════════════════════════════════ */
function StepProfile({ token, invite, onDone }: { token: string; invite: Invite; onDone: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contact, setContact] = useState("");
  const [position, setPosition] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try to pre-fill from invite name
  useEffect(() => {
    const parts = invite.name.split(" ");
    if (parts.length >= 2) {
      setFirstName(parts[0]);
      setLastName(parts.slice(1).join(" "));
    } else {
      setFirstName(invite.name);
    }
  }, [invite.name]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("The two passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setSaving(true);
    try {
      await apiSend("/api/activate/profile", "POST", {
        token,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        contact_number: contact.trim() || null,
        position: position.trim() || null,
        password,
        password_confirmation: confirm,
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-[#171126] border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-2xl">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Profile Details</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Complete your profile information and set your password.</p>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">First Name *</label>
            <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Juan" className={`mt-1.5 ${fieldNoIcon}`} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Last Name *</label>
            <input required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dela Cruz" className={`mt-1.5 ${fieldNoIcon}`} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Contact Number</label>
            <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="09XX XXX XXXX" className={`mt-1.5 ${fieldNoIcon}`} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Position / Designation</label>
            <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Barangay Secretary" className={`mt-1.5 ${fieldNoIcon}`} />
          </div>
        </div>

        <hr className="border-slate-200 dark:border-white/10 my-2" />

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Set Password *</label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </span>
            <input required minLength={8} type={show ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className={field} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Confirm Password *</label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </span>
            <input required minLength={8} type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-type your password" className={field} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input id="show-pw" type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#0039A6] focus:ring-[#0039A6] dark:border-white/20 dark:bg-black/30" />
          <label htmlFor="show-pw" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">Show passwords</label>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs font-medium text-rose-700 dark:text-rose-300">{error}</div>
        )}

        <button type="submit" disabled={saving} className={`w-full rounded-full bg-[#0039A6] py-3.5 text-sm font-semibold text-white shadow-md shadow-sm hover:bg-[#002B7F] transition-colors disabled:opacity-60 ${focusRing}`}>
          {saving ? "Saving..." : "Save Profile & Continue"}
        </button>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STEP 2 — Photo Capture (Circular Biometric Selfie Camera)
   ═══════════════════════════════════════════════════════════════════ */
function StepPhoto({ token, onDone }: { token: string; onDone: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch {
      setCameraError(
        "Camera access was not granted or is unavailable. Please allow camera access in your browser settings to take your verification photo."
      );
    }
  }, []);

  useEffect(() => {
    void startCamera();
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return;

    // Crop strictly to a centered square from the video feed
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const side = Math.min(vw, vh);
    const sx = (vw - side) / 2;
    const sy = (vh - side) / 2;
    const size = Math.min(side, 720); // high resolution crisp output

    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear previous drawing
    ctx.clearRect(0, 0, size, size);

    // Clip strictly to a circle so that nothing outside the circle is drawn or captured
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Mirror the image horizontally to match the user's selfie view
    ctx.translate(size, 0);
    ctx.scale(-1, 1);

    // Draw only the centered square region from video into the circular clip
    ctx.drawImage(video, sx, sy, side, side, 0, 0, size, size);

    // Export as PNG so only the circular area has image data (outer area is not captured)
    const dataUrl = canvas.toDataURL("image/png");
    setCaptured(dataUrl);
    stopCamera();
  }

  function retake() {
    setCaptured(null);
    setError(null);
    void startCamera();
  }

  async function submit() {
    if (!captured) return;
    setError(null);
    setSaving(true);

    try {
      // Convert data URL to blob
      const res = await fetch(captured);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append("token", token);
      formData.append("photo", blob, "selfie.png");

      await fetch("/api/activate/photo", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-XSRF-TOKEN": decodeURIComponent(
            document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ""
          ),
        },
      }).then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message ?? "Upload failed");
        }
      });

      // Ensure CSRF cookie exists
      await fetch("/sanctum/csrf-cookie", { credentials: "include" });

      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo submission failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-[#171126] border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-2xl">
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Photo Verification</h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Position your face inside the circle. Only the area inside the circle will be captured for identity verification.
        </p>
      </div>

      {/* Live Camera View */}
      {!captured && (
        <div className="space-y-6">
          {cameraError ? (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 p-6 text-center space-y-3">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-100 dark:bg-amber-800/30 text-amber-600 dark:text-amber-300">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">Camera Access Needed</h3>
              <p className="text-xs text-amber-800 dark:text-amber-200/90 max-w-md mx-auto leading-relaxed">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={() => void startCamera()}
                className={`rounded-full bg-amber-600 hover:bg-amber-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm ${focusRing}`}
              >
                Retry Camera Access
              </button>
            </div>
          ) : (
            <>
              {/* Circular Camera Viewport — ONLY inside the circle is visible */}
              <div className="relative mx-auto w-64 h-64 sm:w-80 sm:h-80 md:w-88 md:h-88">
                {/* Outer animated pulse halo */}
                <div className="absolute -inset-2.5 rounded-full border-2 border-[#0039A6]/30 dark:border-[#0039A6]/40 animate-pulse pointer-events-none" />

                {/* Viewfinder: circular clip */}
                <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-[#0039A6] shadow-[0_0_50px_rgba(0,57,166,0.25)] bg-slate-950">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />

                  {/* Inner subtle guide circle */}
                  <div className="absolute inset-3 rounded-full border border-white/25 border-dashed pointer-events-none" />

                  {/* Live status badge */}
                  <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-[11px] font-medium text-white shadow">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live Camera
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Center your face within the circle &middot; Ensure good lighting
                </p>
              </div>

              <button
                type="button"
                onClick={capturePhoto}
                className={`w-full rounded-full bg-[#0039A6] py-3.5 text-sm font-semibold text-white shadow-md shadow-sm hover:bg-[#002B7F] transition-colors flex items-center justify-center gap-2 ${focusRing}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Capture Photo
              </button>
            </>
          )}
        </div>
      )}

      {/* Captured Preview */}
      {captured && (
        <div className="space-y-6">
          <div className="relative mx-auto w-64 h-64 sm:w-80 sm:h-80 md:w-88 md:h-88">
            <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.35)] bg-slate-950 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={captured} alt="Your captured photo" className="w-full h-full object-cover" />
              <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 backdrop-blur-md px-3.5 py-1 text-[11px] font-semibold text-white shadow-lg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Photo Captured
                </span>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Check your photo. Make sure your face is clearly visible and in focus.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={retake}
              className={`flex-1 rounded-full bg-slate-100 dark:bg-white/10 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors ${focusRing}`}
            >
              Retake Photo
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={submit}
              className={`flex-1 rounded-full bg-[#0039A6] py-3.5 text-sm font-semibold text-white shadow-md shadow-sm hover:bg-[#002B7F] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 ${focusRing}`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving Photo...
                </>
              ) : (
                "Use This Photo"
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs font-medium text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STEP 3 — Complete Activation
   ═══════════════════════════════════════════════════════════════════ */
function StepComplete({ token, onDone }: { token: string; onDone: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      await apiSend("/api/activate/complete", "POST", { token });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-[#171126] border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-2xl text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#EBF2FF] text-[#0039A6] dark:bg-[#1E293B] dark:text-[#93C5FD]">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">All Steps Completed!</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        You have completed all the required steps. Click the button below to finalize your account activation.
      </p>

      <div className="mt-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 text-left text-xs text-slate-600 dark:text-slate-300 space-y-2">
        <div className="flex items-center gap-2">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#06D6A0] text-white text-[10px]">&#10003;</span>
          <span>Terms & Conditions accepted</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#06D6A0] text-white text-[10px]">&#10003;</span>
          <span>Profile details filled</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#06D6A0] text-white text-[10px]">&#10003;</span>
          <span>Identity photo captured</span>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs font-medium text-rose-700 dark:text-rose-300">{error}</div>
      )}

      <button
        type="button"
        disabled={saving}
        onClick={submit}
        className={`mt-6 w-full rounded-full bg-[#06D6A0] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#06D6A0]/25 hover:bg-[#05B98A] transition-colors disabled:opacity-60 ${focusRing}`}
      >
        {saving ? "Finalizing..." : "Complete Activation"}
      </button>
    </div>
  );
}
