"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, KeyRound, MailCheck, TerminalSquare } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null);
  const [devResetUrl, setDevResetUrl] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setDevResetUrl("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "We could not process that request.");
      }
      setMessage(data.message);
      setEmailConfigured(Boolean(data.emailConfigured));
      if (data.devResetUrl) setDevResetUrl(data.devResetUrl);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not process that request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="absolute left-6 top-6 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#111318] text-[11px] font-bold text-white">T</div>
        <span className="text-[13px] font-bold text-[#111318]">TalentOS</span>
      </div>

      <div className="w-full max-w-[420px]">
        <Link
          href="/login"
          className="mb-7 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#70747d] transition hover:text-[#30333a]"
        >
          <ArrowLeft size={13} /> Back to sign in
        </Link>

        <div className="mb-8">
          <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-[#edf1ff] text-[#375dfb]">
            <KeyRound size={20} />
          </div>
          <div className="eyebrow">Account recovery</div>
          <h1 className="m-0 text-[30px] font-bold tracking-[-.045em] text-[#111318]">Forgot your password?</h1>
          <p className="mt-3 text-[12px] leading-5 text-[#70747d]">
            Enter the email address associated with your account and we&apos;ll send you a secure link
            to choose a new password. The link expires after 60 minutes.
          </p>
        </div>

        {message ? (
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
            <div className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${emailConfigured ? "bg-[#eaf8f2] text-[#16865c]" : "bg-[#fff5e5] text-[#a86108]"}`}>
              <MailCheck size={18} />
            </div>
            <h2 className="m-0 text-[15px] font-bold text-[#111318]">Check your inbox</h2>
            <p className="mb-0 mt-2 text-[11px] leading-[1.7] text-[#70747d]">{message}</p>

            {devResetUrl && (
              <div className="mt-4 rounded-[10px] border border-[#dfe3ea] bg-[#f8f9fb] p-3.5">
                <div className="mb-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.1em] text-[#70747d]">
                  <TerminalSquare size={12} /> Development mode — no mail server configured
                </div>
                <p className="mb-2 mt-0 text-[10px] leading-[1.6] text-[#8a8e97]">
                  Email delivery is off in development, so here is your reset link directly:
                </p>
                <a
                  href={devResetUrl}
                  className="block break-all text-[11px] font-semibold text-[#3152d5] hover:underline"
                >
                  {devResetUrl}
                </a>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button type="button" onClick={() => { setMessage(""); setEmail(email); }} className="btn btn-secondary">
                Try another email
              </button>
              <Link href="/login" className="text-[11px] font-semibold text-[#3152d5] hover:underline">
                Return to sign in
              </Link>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="form-label" htmlFor="reset-email">Work email</label>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                className="input-field !h-12"
                placeholder="you@company.com"
                value={email}
                onChange={event => setEmail(event.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-[9px] border border-[#f1cfd4] bg-[#fff4f5] p-3 text-[10px] leading-4 text-[#ac3341]">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
              {loading ? (
                <><span className="loading-spinner" />Sending reset link</>
              ) : (
                <>Send reset link<ArrowRight size={15} /></>
              )}
            </button>
          </form>
        )}

        <p className="mt-7 text-center text-[10px] leading-[1.7] text-[#9a9ea8]">
          For security, we&apos;ll show a confirmation even if the address isn&apos;t registered.
        </p>
      </div>
    </main>
  );
}
