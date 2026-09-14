"use client";

import { Download, FileSpreadsheet, FileText, Printer, ShieldCheck, Trophy } from "lucide-react";
import type { Candidate, ScreeningSession } from "@/db/schema";

interface ExportModuleProps {
  candidates: Candidate[];
  session: ScreeningSession | null;
  requirements: { minYearsExperience: number; educationLevel: string; requiredSkills: string[] } | null;
}

export function ExportModule({ candidates, session, requirements }: ExportModuleProps) {
  const exportCSV = () => {
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const headers = ["Rank", "Name", "Email", "Phone", "Composite score", "Skill score", "Semantic score", "Experience score", "Education score", "Years experience", "Education", "Status", "Matched skills", "Missing skills"];
    const rows = candidates.map(candidate => [
      candidate.rank || "", candidate.name, candidate.email || "", candidate.phone || "",
      Math.round((candidate.compositeScore || 0) * 100), Math.round((candidate.skillScore || 0) * 100),
      Math.round((candidate.semanticScore || 0) * 100), Math.round((candidate.experienceScore || 0) * 100),
      Math.round((candidate.educationScore || 0) * 100), candidate.yearsExperience || 0, candidate.education || "",
      candidate.status || "", ((candidate.matchedSkills as string[]) || []).join(", "), ((candidate.missingSkills as string[]) || []).join(", "),
    ]);
    const csv = [headers, ...rows].map(row => row.map(escape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `talent-screen-${(session?.name || "results").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!candidates.length) {
    return <div className="workspace"><div className="panel empty-state"><div className="empty-icon"><FileText size={24} /></div><h1 className="empty-title">Nothing to report yet</h1><p className="empty-copy">Complete a screening run before exporting candidate evidence or creating a committee brief.</p></div></div>;
  }

  const topCandidates = candidates.filter(candidate => (candidate.compositeScore || 0) >= .75).slice(0, 8);
  const potential = candidates.filter(candidate => (candidate.compositeScore || 0) >= .6 && (candidate.compositeScore || 0) < .75).length;
  const low = candidates.filter(candidate => (candidate.compositeScore || 0) < .6).length;
  const average = candidates.reduce((sum, candidate) => sum + (candidate.compositeScore || 0), 0) / candidates.length;

  return (
    <div className="workspace-narrow">
      <div className="page-head no-print">
        <div><div className="eyebrow">Committee handoff</div><h1 className="page-title">Reports and export</h1><p className="page-description">Move structured screening evidence into your ATS or share a concise, printable recommendation with the hiring panel.</p></div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 no-print">
        <section className="panel p-5">
          <div className="mb-5 flex items-start justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf1ff] text-[#375dfb]"><FileSpreadsheet size={19} /></div><span className="rounded-full bg-[#f1f2f4] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#70747d]">CSV</span></div>
          <h2 className="m-0 text-[16px] font-bold tracking-[-.02em] text-[#22252b]">Structured candidate data</h2>
          <p className="mb-5 mt-2 text-[11px] leading-[1.65] text-[#70747d]">Export every candidate, dimensional score, contact field, matched requirement, and skill gap for spreadsheet analysis or ATS import.</p>
          <div className="mb-5 tag-row">{["14 fields", "All candidates", "ATS ready", "UTF-8"].map(tag => <span className="tag-neutral" key={tag}>{tag}</span>)}</div>
          <button type="button" className="btn btn-primary w-full" onClick={exportCSV}><Download size={14} />Download {candidates.length} records</button>
        </section>

        <section className="panel p-5">
          <div className="mb-5 flex items-start justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf8f2] text-[#16865c]"><Printer size={19} /></div><span className="rounded-full bg-[#f1f2f4] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#70747d]">PDF ready</span></div>
          <h2 className="m-0 text-[16px] font-bold tracking-[-.02em] text-[#22252b]">Hiring committee brief</h2>
          <p className="mb-5 mt-2 text-[11px] leading-[1.65] text-[#70747d]">Print a focused review packet with the strongest candidates, evidence summaries, and role requirements for panel calibration.</p>
          <div className="mb-5 tag-row">{["Shortlist", "Evidence summary", "Role baseline", "Print optimized"].map(tag => <span className="tag-neutral" key={tag}>{tag}</span>)}</div>
          <button type="button" className="btn btn-secondary w-full" onClick={() => window.print()}><Printer size={14} />Print committee brief</button>
        </section>
      </div>

      <section id="print-report" className="panel overflow-hidden">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-[#e4e6eb] p-7">
          <div><div className="mb-4 flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[#111318] text-[11px] font-bold text-white">T</div><span className="text-[12px] font-bold text-[#111318]">TalentOS</span></div><h1 className="m-0 text-[24px] font-bold tracking-[-.035em] text-[#111318]">Hiring committee brief</h1><p className="mt-2 text-[11px] text-[#70747d]">{session?.name || "Screening results"} · {new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</p></div>
          <div className="rounded-xl border border-[#e4e6eb] bg-[#fafbfc] px-5 py-4 text-right"><div className="text-[9px] font-bold uppercase tracking-[.1em] text-[#858993]">Profiles reviewed</div><div className="mt-1 text-[26px] font-bold text-[#111318]">{candidates.length}</div></div>
        </header>

        <div className="p-7">
          <div className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Top matches", value: topCandidates.length, color: "#16865c" },
              { label: "Potential fits", value: potential, color: "#a86108" },
              { label: "Below threshold", value: low, color: "#c63d4d" },
              { label: "Average fit", value: `${Math.round(average * 100)}%`, color: "#375dfb" },
            ].map(item => <div className="rounded-xl border border-[#e4e6eb] p-4" key={item.label}><div className="text-[9px] font-bold uppercase tracking-[.08em] text-[#858993]">{item.label}</div><div className="mt-2 text-[22px] font-bold" style={{ color: item.color }}>{item.value}</div></div>)}
          </div>

          <div className="mb-4 flex items-center gap-2"><Trophy size={15} className="text-[#70747d]" /><h2 className="m-0 text-[12px] font-bold uppercase tracking-[.08em] text-[#30333a]">Recommended shortlist</h2></div>
          {topCandidates.length ? (
            <div className="space-y-3">
              {topCandidates.map((candidate, index) => {
                const matched = (candidate.matchedSkills as string[]) || [];
                return (
                  <article className="rounded-xl border border-[#e4e6eb] p-4" key={candidate.id}>
                    <div className="flex items-start gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#111318] text-[10px] font-bold text-white">{String(index + 1).padStart(2, "0")}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-2"><div><h3 className="m-0 text-[13px] font-bold text-[#22252b]">{candidate.name}</h3><p className="mt-1 text-[9px] text-[#858993]">{candidate.email || "Contact not extracted"} · {candidate.yearsExperience || 0} years · {candidate.education}</p></div><div className="text-[20px] font-bold text-[#16865c]">{Math.round((candidate.compositeScore || 0) * 100)}%</div></div><div className="mt-3 tag-row">{matched.slice(0, 9).map(skill => <span className="skill-tag-green" key={skill}>{skill}</span>)}</div>{candidate.recruiterNotes && <p className="mb-0 mt-3 text-[10px] leading-[1.6] text-[#70747d]">{candidate.recruiterNotes}</p>}</div></div>
                  </article>
                );
              })}
            </div>
          ) : <div className="rounded-xl border border-[#ead9dc] bg-[#fffbfc] p-5 text-[11px] text-[#86515a]">No profile met the 75% shortlist threshold. Review the role baseline or expand sourcing.</div>}

          {requirements && (
            <div className="mt-7 rounded-xl bg-[#f7f8fa] p-5">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.08em] text-[#555963]"><ShieldCheck size={14} />Role baseline used in this review</div>
              <div className="tag-row"><span className="tag-neutral">{requirements.minYearsExperience}+ years</span><span className="tag-neutral">{requirements.educationLevel}</span>{requirements.requiredSkills.map(skill => <span className="skill-tag-blue" key={skill}>{skill}</span>)}</div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
