"use client";

import { useState } from "react";
import { ArrowRight, BarChart3, Check, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const authenticate = async (endpoint: string, body: Record<string, string>) => {
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "We could not complete the request.");
    router.push("/dashboard");
    router.refresh();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authenticate(mode === "login" ? "/api/auth/login" : "/api/auth/register", mode === "login" ? { email: form.email, password: form.password } : form);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not complete the request.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    setError("");
    try {
      await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Demo Recruiter", email: "admin@talentai.com", password: "demo1234" }) });
      await authenticate("/api/auth/login", { email: "admin@talentai.com", password: "demo1234" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Demo access is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#111318] p-12 text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url('/images/hero-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(17,19,24,.94)_15%,rgba(17,19,24,.64)_60%,rgba(24,38,83,.72))]" />
        <div className="absolute inset-0 opacity-[.09]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.25) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.25) 1px,transparent 1px)", backgroundSize: "64px 64px" }} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#375dfb] text-sm font-bold shadow-[0_8px_24px_rgba(55,93,251,.35)]">T</div>
          <div><div className="text-[15px] font-semibold tracking-[-.02em]">TalentOS</div><div className="text-[9px] uppercase tracking-[.16em] text-[#9297a2]">Resume intelligence</div></div>
        </div>

        <div className="relative z-10 my-auto max-w-[620px] py-14">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-3 py-2 text-[10px] font-medium text-[#d5d8df] backdrop-blur-md"><Sparkles size={13} className="text-[#90a3ff]" />Decision support for modern hiring teams</div>
          <h1 className="m-0 max-w-[590px] text-[52px] font-semibold leading-[1.06] tracking-[-.055em]">A better signal from every resume.</h1>
          <p className="mt-6 max-w-[530px] text-[14px] leading-7 text-[#adb1ba]">Screen complete candidate pools against role evidence, understand every score, and give hiring teams a shortlist they can defend.</p>

          <div className="mt-10 grid max-w-[560px] grid-cols-3 overflow-hidden rounded-xl border border-white/10 bg-black/20 backdrop-blur-md">
            {[
              { value: "4", label: "Evidence dimensions" },
              { value: "200+", label: "Skills recognized" },
              { value: "100%", label: "Explainable ranking" },
            ].map((item, index) => <div className={`p-5 ${index ? "border-l border-white/10" : ""}`} key={item.label}><div className="text-[22px] font-semibold tracking-[-.04em]">{item.value}</div><div className="mt-1 text-[9px] uppercase tracking-[.09em] text-[#858a95]">{item.label}</div></div>)}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-[10px] text-[#7f848f]"><span>Built for recruiter judgment, not replacement.</span><span className="inline-flex items-center gap-2"><ShieldCheck size={13} />Private workspace</span></div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center bg-white px-6 py-12 sm:px-10">
        <div className="absolute left-6 top-6 flex items-center gap-2 lg:hidden"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[#111318] text-[11px] font-bold text-white">T</div><span className="text-[13px] font-bold text-[#111318]">TalentOS</span></div>
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <div className="eyebrow">Recruiter workspace</div>
            <h1 className="m-0 text-[32px] font-bold tracking-[-.045em] text-[#111318]">{mode === "login" ? "Welcome back" : "Create your workspace"}</h1>
            <p className="mt-3 text-[12px] leading-5 text-[#70747d]">{mode === "login" ? "Sign in to continue with saved screenings and candidate decisions." : "Your account keeps screening history available across your devices."}</p>
          </div>

          <button type="button" onClick={handleDemo} disabled={loading} className="btn btn-secondary btn-lg mb-6 w-full"><BarChart3 size={15} />Explore with demonstration data<ArrowRight size={14} /></button>
          <div className="mb-6 flex items-center gap-3"><span className="h-px flex-1 bg-[#e4e6eb]" /><span className="text-[9px] font-bold uppercase tracking-[.11em] text-[#9a9ea8]">or use your account</span><span className="h-px flex-1 bg-[#e4e6eb]" /></div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "register" && <div><label className="form-label" htmlFor="name">Full name</label><input id="name" className="input-field !h-12" value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="Jordan Lee" required /></div>}
            <div><label className="form-label" htmlFor="email">Work email</label><input id="email" className="input-field !h-12" type="email" autoComplete="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} placeholder="jordan@company.com" required /></div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="form-label !mb-0" htmlFor="password">Password</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => router.push("/forgot-password")}
                    className="text-[10px] font-semibold text-[#3152d5] transition hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative"><LockKeyhole size={15} className="absolute left-3.5 top-4 text-[#9a9ea8]" /><input id="password" className="input-field !h-12 !pl-10 !pr-11" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 8 : 1} value={form.password} onChange={event => setForm(current => ({ ...current, password: event.target.value }))} placeholder={mode === "register" ? "At least 8 characters" : "Enter your password"} required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(value => !value)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-md text-[#8a8e97] hover:bg-[#f3f4f6]">{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>
            </div>

            {error && <div className="rounded-[9px] border border-[#f1cfd4] bg-[#fff4f5] p-3 text-[10px] leading-4 text-[#ac3341]">{error}</div>}

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">{loading ? <><span className="loading-spinner" />Authenticating</> : <>{mode === "login" ? "Sign in" : "Create account"}<ArrowRight size={15} /></>}</button>
          </form>

          <div className="mt-6 text-center text-[11px] text-[#70747d]">{mode === "login" ? "New to TalentOS?" : "Already have an account?"}<button type="button" onClick={() => { setMode(current => current === "login" ? "register" : "login"); setError(""); }} className="ml-1.5 font-semibold text-[#3152d5] hover:underline">{mode === "login" ? "Create an account" : "Sign in"}</button></div>
          <div className="mt-9 flex items-center justify-center gap-5 border-t border-[#eceef1] pt-5 text-[9px] text-[#9a9ea8]"><span className="inline-flex items-center gap-1.5"><Check size={11} />Cross-device history</span><span className="inline-flex items-center gap-1.5"><Check size={11} />Secure session</span></div>
        </div>
      </section>
    </main>
  );
}
