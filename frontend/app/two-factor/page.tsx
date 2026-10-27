"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import QRCode from "qrcode";
import BrandMark from "@/components/BrandMark";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiError } from "@/lib/api";
import { homeFor } from "@/lib/roles";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B4DFF]";

type SetupStep = "intro" | "scan" | "verify" | "recovery" | "done";

export default function TwoFactorPage() {
  const { user, loading, security, refetch } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<SetupStep>("intro");
  const [secret, setSecret] = useState("");
  const [qrUri, setQrUri] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);

  // Disable 2FA state
  const [showDisable, setShowDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disabling, setDisabling] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!qrUri) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(qrUri, {
      width: 220,
      margin: 2,
      color: {
        dark: "#1A102F",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => {
        console.error("Failed to generate QR code canvas:", err);
        setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUri)}`);
      });
  }, [qrUri]);

  // If 2FA is already enabled, show the "enabled" state
  const isEnabled = security?.two_factor_enabled === true;

  async function handleEnable() {
    setError(null);
    setSubmitting(true);
    try {
      const data = await api.post<{ secret: string; qr_uri: string; recovery_codes: string[] }>(
        "/api/two-factor/enable"
      );
      setSecret(data.secret);
      setQrUri(data.qr_uri);
      setRecoveryCodes(data.recovery_codes);
      setStep("scan");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start 2FA setup.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCodeInput(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) codeRefs.current[index + 1]?.focus();
    if (newCode.every((d) => d !== "") && newCode.join("").length === 6) {
      handleConfirm(newCode.join(""));
    }
  }

  function handleCodeKeyDown(index: number, key: string) {
    if (key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newCode = [...code];
    for (let i = 0; i < 6; i++) newCode[i] = pasted[i] || "";
    setCode(newCode);
    if (pasted.length === 6) handleConfirm(pasted);
    else codeRefs.current[pasted.length]?.focus();
  }

  async function handleConfirm(verifyCode?: string) {
    const finalCode = verifyCode || code.join("");
    if (finalCode.length !== 6) return;

    setError(null);
    setSubmitting(true);
    try {
      await api.post("/api/two-factor/confirm", { code: finalCode });
      setStep("recovery");
      await refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code. Please try again.");
      setCode(["", "", "", "", "", ""]);
      codeRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDisable() {
    setDisableError(null);
    setDisabling(true);
    try {
      await api.post("/api/two-factor/disable", { password: disablePassword });
      await refetch();
      setShowDisable(false);
      setDisablePassword("");
    } catch (err) {
      setDisableError(err instanceof ApiError ? err.message : "Failed to disable 2FA.");
    } finally {
      setDisabling(false);
    }
  }

  function copyToClipboard(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => {
      setter(true);
      setTimeout(() => setter(false), 2000);
    });
  }

  if (loading || !user) {
    return (
      <div className={`${poppins.className} min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0E0A17]`}>
        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className={`${poppins.className} min-h-screen w-full bg-slate-50 dark:bg-[#0E0A17] text-slate-800 dark:text-[#E9DFFF] transition-colors duration-500 ease-out flex flex-col`}>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[40rem] w-[40rem] rounded-full bg-[#F3EDFE]/40 blur-3xl dark:bg-[#7B4DFF]/15" />
        <div className="absolute right-0 bottom-0 h-[40rem] w-[40rem] rounded-full bg-[#E6FBF3]/40 blur-3xl dark:bg-[#06D6A0]/10" />
      </div>

      <header className="relative z-20 w-full border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#150F22]/85 backdrop-blur-2xl">
        <div className="w-full flex items-center justify-between px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(homeFor(user.role))}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F1EBFF] text-[#7B4DFF] hover:bg-[#E3D5FF] dark:bg-[#2C2344] dark:text-[#CDBBFF] ${focusRing}`}
              aria-label="Back to dashboard"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <BrandMark tone="dark" />
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-[#F1EBFF] dark:bg-[#2C2145] px-3 py-1 text-xs font-semibold text-[#7B4DFF] dark:text-[#CDBBFF]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Security Settings
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#171126] border border-slate-200 dark:border-white/10 p-7 sm:p-9 shadow-2xl shadow-purple-950/10 dark:shadow-black/60">

          {/* ── Already enabled ── */}
          {isEnabled && step === "intro" && (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Two-Factor Authentication Enabled</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Your account is protected with an authenticator app. You&apos;ll be asked for a verification code each time you sign in.
                </p>
                {security?.two_factor_confirmed_at && (
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Enabled on {new Date(security.two_factor_confirmed_at).toLocaleDateString()}
                  </p>
                )}
              </div>

              {!showDisable ? (
                <button
                  type="button"
                  onClick={() => setShowDisable(true)}
                  className={`w-full rounded-xl border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/30 py-3 px-4 text-sm font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition ${focusRing}`}
                >
                  Disable Two-Factor Authentication
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300">Enter your password to confirm:</p>
                  <input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full rounded-xl bg-slate-50 dark:bg-[#201833] py-3 px-4 text-sm text-slate-900 dark:text-white outline-none ring-1 ring-slate-200 dark:ring-white/10 transition focus:ring-2 focus:ring-rose-500"
                    autoFocus
                  />
                  {disableError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">{disableError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowDisable(false); setDisablePassword(""); setDisableError(null); }}
                      className={`flex-1 rounded-xl border border-slate-200 dark:border-white/10 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition ${focusRing}`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDisable}
                      disabled={disabling || !disablePassword}
                      className={`flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60 transition flex items-center justify-center gap-2 ${focusRing}`}
                    >
                      {disabling ? (
                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      ) : (
                        "Disable 2FA"
                      )}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => router.push(homeFor(user.role))}
                className="mt-4 w-full text-center text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                &larr; Back to dashboard
              </button>
            </>
          )}

          {/* ── Step: Intro ── */}
          {!isEnabled && step === "intro" && (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#F1EBFF] dark:bg-[#2C2145] text-[#7B4DFF] dark:text-[#CDBBFF] mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Set Up Two-Factor Authentication
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Add an extra layer of security to your account using an authenticator app like Google Authenticator or Authy.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {["Download an authenticator app on your phone", "Scan the QR code we provide", "Enter the 6-digit code to verify"].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#F1EBFF] dark:bg-[#2C2145] text-xs font-bold text-[#7B4DFF] dark:text-[#CDBBFF]">
                      {i + 1}
                    </span>
                    {text}
                  </div>
                ))}
              </div>

              {error && (
                <div className="mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs text-rose-700 dark:text-rose-300">
                  {error}
                </div>
              )}

              <button
                onClick={handleEnable}
                disabled={submitting}
                className={`w-full rounded-xl bg-[#7B4DFF] py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-[#7B4DFF]/25 hover:bg-[#6A3CF0] active:bg-[#5A18C9] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 ${focusRing}`}
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Begin Setup"
                )}
              </button>
            </>
          )}

          {/* ── Step: Scan QR ── */}
          {step === "scan" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Scan QR Code</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Scan this QR code with your authenticator app
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 dark:border-white/10 flex items-center justify-center min-h-[228px] min-w-[228px]">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt="Two-Factor Authentication QR Code"
                      width={200}
                      height={200}
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-slate-400 gap-2">
                      <span className="h-6 w-6 rounded-full border-2 border-[#7B4DFF] border-t-transparent animate-spin" />
                      <span className="text-xs">Generating QR code...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 text-center">
                  Or enter this key manually:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-slate-50 dark:bg-[#201833] px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-200 text-center tracking-widest break-all">
                    {secret}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(secret, setCopiedSecret)}
                    className={`shrink-0 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-slate-100 dark:hover:bg-white/10 ${focusRing}`}
                  >
                    {copiedSecret ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setStep("verify");
                  setTimeout(() => codeRefs.current[0]?.focus(), 100);
                }}
                className={`w-full rounded-xl bg-[#7B4DFF] py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-[#7B4DFF]/25 hover:bg-[#6A3CF0] transition-colors ${focusRing}`}
              >
                I&apos;ve Scanned the Code &rarr;
              </button>
            </>
          )}

          {/* ── Step: Verify code ── */}
          {step === "verify" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verify Setup</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Enter the 6-digit code shown in your authenticator app
                </p>
              </div>

              <div className="flex justify-center gap-2 mb-4" onPaste={handleCodePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { codeRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeInput(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e.key)}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl bg-slate-50 dark:bg-[#201833] text-slate-900 dark:text-white outline-none ring-1 ring-slate-200 dark:ring-white/10 transition focus:ring-2 focus:ring-[#7B4DFF] ${focusRing}`}
                    aria-label={`Digit ${i + 1}`}
                    disabled={submitting}
                  />
                ))}
              </div>

              {error && (
                <div className="mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3 text-xs text-rose-700 dark:text-rose-300 text-center">
                  {error}
                </div>
              )}

              <p className="text-center text-xs text-slate-400 dark:text-slate-500 mb-4">
                The code refreshes every 30 seconds.
              </p>

              <button
                type="button"
                onClick={() => setStep("scan")}
                className="w-full text-center text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                &larr; Back to QR code
              </button>
            </>
          )}

          {/* ── Step: Recovery codes ── */}
          {step === "recovery" && (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Save Recovery Codes</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Save these recovery codes in a safe place. Each can be used once if you lose access to your authenticator.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-[#201833] border border-slate-200 dark:border-white/10 p-4 mb-4">
                <div className="grid grid-cols-2 gap-2">
                  {recoveryCodes.map((rc, i) => (
                    <code key={i} className="text-sm font-mono text-slate-700 dark:text-slate-200 text-center py-1.5 rounded-lg bg-white dark:bg-[#1B142F] border border-slate-100 dark:border-white/5">
                      {rc}
                    </code>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => copyToClipboard(recoveryCodes.join("\n"), setCopiedRecovery)}
                  className={`flex-1 rounded-xl border border-slate-200 dark:border-white/10 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition flex items-center justify-center gap-2 ${focusRing}`}
                >
                  {copiedRecovery ? "Copied!" : "Copy All Codes"}
                </button>
              </div>

              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 p-3 mb-6 text-xs text-amber-700 dark:text-amber-300">
                <strong>Warning:</strong> These codes will not be shown again. If you lose them and your authenticator app, you will be locked out of your account.
              </div>

              <button
                onClick={() => {
                  setStep("done");
                  setTimeout(() => router.push(homeFor(user.role)), 2000);
                }}
                className={`w-full rounded-xl bg-[#7B4DFF] py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-[#7B4DFF]/25 hover:bg-[#6A3CF0] transition-colors ${focusRing}`}
              >
                I&apos;ve Saved My Codes &rarr; Finish Setup
              </button>
            </>
          )}

          {/* ── Step: Done ── */}
          {step === "done" && (
            <div className="text-center py-8">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">All Set!</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Two-factor authentication is now active. You&apos;ll need your authenticator code each time you sign in.
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Redirecting to dashboard...</p>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 w-full border-t border-slate-200 dark:border-white/10 py-4 text-center text-xs text-slate-500 dark:text-[#7C6FA3]">
        Talaghayan Portal v2.4 &middot; Department of the Interior and Local Government &middot; Makati City
      </footer>
    </div>
  );
}
