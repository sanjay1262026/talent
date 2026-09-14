"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Link2Off, ShieldCheck } from "lucide-react";

type PageState = "checking" | "invalid" | "form" | "success";

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [state, setState] = useState<PageState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function validate() {
      if (!token) {
        setState("invalid");
        return;
      }
      try {
        const response = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        const data = await response.json();
        if (!cancelled) setState(data.valid ? "form" : "invalid");
      } catch {
        if (!cancelled) setState("invalid");
      }
    }

    validate();
    return () => { cancelled = true; };
  }, [token]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("The passwords you entered do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "We could not update your password.");
      }
      setState("success");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not update your password.");
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
        {state === "checking" && (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="loading-spinner !border-[#c9cfd9] !border-t-[#375dfb] !h-6 !w-6" />
            <p className="mb-0 mt-5 text-[11px] text-[#70747d]">Verifying your reset link…</p>
          </div>
        )}

        {state === "invalid" && (
          <div>
            <div className="mb-6 grid h-11 w-11 place-items-center rounded-xl bg-[#fff0f2] text-[#c63d4d]">
              <Link2Off size={20} />
            </div>
            <h1 className="m-0 text-[28px] font-bold tracking-[-.045em] text-[#111318]">This link has expired</h1>
            <p className="mt-3 text-[12px] leading-[1.7] text-[#70747d]">
              Password reset links are valid for 60 minutes and can only be used once.
              Request a fresh link to continue.
            </p>
            <div className="mt-7 flex items-center gap-3">
              <Link href="/forgot-password" className="btn btn-primary">Request a new link</Link>
              <Link href="/login" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#70747d] hover:text-[#30333a]">
                <ArrowLeft size={13} /> Back to sign in
              </Link>
            </div>
          </div>
        )}

        {state === "form" && (
          <div>
            <div className="mb-6 grid h-11 w-11 place-items-center rounded-xl bg-[#edf1ff] text-[#375dfb]">
              <KeyRound size={20} />
            </div>
            <div className="eyebrow">Secure reset</div>
            <h1 className="m-0 text-[28px] font-bold tracking-[-.045em] text-[#111318]">Choose a new password</h1>
            <p className="mt-3 text-[12px] leading-[1.7] text-[#70747d]">
              Create a strong password for your account. After updating, you&apos;ll sign in with the new password.
            </p>

            <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="form-label" htmlFor="new-password">New password</label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className="input-field !h-12 !pr-11"
                    placeholder="At least 8 characters"
                    minLength={8}
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(value => !value)}
                    className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-md text-[#8a8e97] hover:bg-[#f3f4f6]"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="mb-0 mt-2 text-[10px] leading-[1.6] text-[#9a9ea8]">
                  Use at least 8 characters with a mix of letters and numbers.
                </p>
              </div>

              <div>
                <label className="form-label" htmlFor="confirm-password">Confirm new password</label>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="input-field !h-12"
                  placeholder="Repeat your new password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
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
                  <><span className="loading-spinner" />Updating password</>
                ) : (
                  <>Update password<ArrowRight size={15} /></>
                )}
              </button>
            </form>
          </div>
        )}

        {state === "success" && (
          <div>
            <div className="mb-6 grid h-11 w-11 place-items-center rounded-xl bg-[#eaf8f2] text-[#16865c]">
              <CheckCircle2 size={20} />
            </div>
            <h1 className="m-0 text-[28px] font-bold tracking-[-.045em] text-[#111318]">Password updated</h1>
            <p className="mt-3 text-[12px] leading-[1.7] text-[#70747d]">
              Your password has been changed successfully. All previous reset links are now invalid.
            </p>
            <div className="mt-5 flex items-center gap-2 rounded-[10px] border border-[#cdeade] bg-[#f5fcf9] p-3.5 text-[10px] leading-[1.6] text-[#16865c]">
              <ShieldCheck size={14} className="shrink-0" />
              You can now sign in securely on any of your devices.
            </div>
            <button
              type="button"
              onClick={() => { router.push("/login"); router.refresh(); }}
              className="btn btn-primary btn-lg mt-7 w-full"
            >
              Sign in with new password<ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
