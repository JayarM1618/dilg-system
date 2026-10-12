"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Poppins } from "next/font/google";
import BrandMark from "@/components/BrandMark";
import { api, ApiError } from "@/lib/api";
import { apiSend } from "@/lib/http";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B4DFF]";
const input =
  "mt-1.5 w-full rounded-xl bg-white dark:bg-[#2B2542] px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none ring-1 ring-[#E3DEF5] dark:ring-[#433A66] placeholder:text-slate-400 focus:ring-2 focus:ring-[#7B4DFF]";

interface Invite {
  name: string;
  email: string;
  role: string;
  barangay: string | null;
}

export default function ActivatePage() {
  return (
    <Suspense fallback={null}>
      <ActivateForm />
    </Suspense>
  );
}

function ActivateForm() {
  const token = useSearchParams().get("token") ?? "";
  const [invite, setInvite] = useState<Invite | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "invalid" | "done">("loading");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
        setState("ready");
      })
      .catch((err: unknown) => {
        setState("invalid");
        setMessage(err instanceof ApiError ? err.message : "Could not reach the server. Please try again.");
      });
  }, [token]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await apiSend("/api/activate", "POST", { token, password, password_confirmation: confirm });
      setState("done");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`${poppins.className} min-h-screen p-3 text-slate-800 dark:text-[#E9DFFF] sm:p-6 lg:p-8`}>
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-360 flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/60 shadow-[0_30px_80px_-30px_rgba(91,60,200,0.35)] backdrop-blur-3xl dark:border-white/10 dark:bg-[#1B142F]/60 sm:min-h-[calc(100vh-3rem)] sm:rounded-[2rem]">
        <header className="border-b border-[#EDE7FA] px-5 py-4 dark:border-white/10 sm:px-8">
          <BrandMark tone="dark" />
        </header>

        <main className="grid flex-1 place-items-center p-5 sm:p-8">
          <div className="w-full max-w-md rounded-3xl bg-[#F3EDFE] p-6 dark:bg-white/5 sm:p-8">
            {state === "loading" && <p className="text-center text-sm text-slate-600 dark:text-slate-300">Checking your link...</p>}

            {state === "invalid" && (
              <>
                <h1 className="text-2xl font-semibold text-[#1B1235] dark:text-white">Link not valid</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{message}</p>
                <Link href="/" className={`mt-6 inline-block rounded-full text-sm font-semibold text-[#5A18C9] underline underline-offset-4 dark:text-[#D1C4F9] ${focusRing}`}>
                  Back to start
                </Link>
              </>
            )}

            {state === "done" && (
              <>
                <h1 className="text-2xl font-semibold text-[#1B1235] dark:text-white">Account activated</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Your password is saved. Sign in with <strong>{invite?.email}</strong>.
                </p>
                <Link href="/login" className={`mt-6 inline-block rounded-full bg-[#7B4DFF] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#5A18C9] ${focusRing}`}>
                  Go to sign in
                </Link>
              </>
            )}

            {state === "ready" && invite && (
              <form onSubmit={submit}>
                <h1 className="text-2xl font-semibold text-[#1B1235] dark:text-white">Activate your account</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Welcome, {invite.name}. The DILG Makati office created this account for{" "}
                  {invite.barangay ? `Barangay ${invite.barangay}` : "the DILG office"}. Choose a password to finish.
                </p>

                <label className="mt-5 block text-sm font-medium text-[#1B1235] dark:text-slate-200">
                  Email
                  <input readOnly value={invite.email} className={`${input} opacity-70`} />
                </label>
                <label className="mt-4 block text-sm font-medium text-[#1B1235] dark:text-slate-200">
                  New password
                  <input required minLength={8} type={show ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
                </label>
                <label className="mt-4 block text-sm font-medium text-[#1B1235] dark:text-slate-200">
                  Confirm password
                  <input required minLength={8} type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
                </label>
                <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show passwords
                </label>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">At least 8 characters, with letters and numbers.</p>

                {error && <p role="alert" className="mt-4 text-sm font-medium text-bad dark:text-rose-400">{error}</p>}

                <button type="submit" disabled={saving} className={`mt-6 w-full rounded-full bg-[#7B4DFF] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5A18C9] disabled:opacity-60 ${focusRing}`}>
                  {saving ? "Activating..." : "Activate account"}
                </button>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
