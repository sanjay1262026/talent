"use client";

import { useState } from "react";
import { ArrowRight, Check, GitCompareArrows, MessageSquareText, Scale, UserRoundSearch } from "lucide-react";
import type { Candidate } from "@/db/schema";
import { ScoreBar } from "@/components/ScoreBar";
import { StatusBadge } from "@/components/StatusBadge";
import { Legend, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";

interface ComparisonModuleProps { candidates: Candidate[]; }

export function ComparisonModule({ candidates }: ComparisonModuleProps) {
  const [selectedCandidateA, setSelectedCandidateA] = useState<number | "">("");
  const [selectedCandidateB, setSelectedCandidateB] = useState<number | "">("");

  const candidateA = selectedCandidateA !== "" ? selectedCandidateA : (candidates[0]?.id ?? "");
  const candidateB = selectedCandidateB !== "" ? selectedCandidateB : (candidates[1]?.id ?? "");

  const first = candidates.find(candidate => candidate.id === candidateA);
  const second = candidates.find(candidate => candidate.id === candidateB);
  const radarData = [
    { axis: "Skills", first: Math.round((first?.skillScore || 0) * 100), second: Math.round((second?.skillScore || 0) * 100) },
    { axis: "Semantic", first: Math.round((first?.semanticScore || 0) * 100), second: Math.round((second?.semanticScore || 0) * 100) },
    { axis: "Experience", first: Math.round((first?.experienceScore || 0) * 100), second: Math.round((second?.experienceScore || 0) * 100) },
    { axis: "Education", first: Math.round((first?.educationScore || 0) * 100), second: Math.round((second?.educationScore || 0) * 100) },
    { axis: "Overall", first: Math.round((first?.compositeScore || 0) * 100), second: Math.round((second?.compositeScore || 0) * 100) },
  ];
  const metrics = [
    ["Overall fit", first?.compositeScore || 0, second?.compositeScore || 0],
    ["Skill alignment", first?.skillScore || 0, second?.skillScore || 0],
    ["Semantic relevance", first?.semanticScore || 0, second?.semanticScore || 0],
    ["Experience match", first?.experienceScore || 0, second?.experienceScore || 0],
    ["Education match", first?.educationScore || 0, second?.educationScore || 0],
  ] as const;

  if (candidates.length < 2) {
    return (
      <div className="workspace"><div className="panel empty-state"><div className="empty-icon"><Scale size={24} /></div><h1 className="empty-title">Two profiles are required</h1><p className="empty-copy">Run a screening with at least two resumes to open a side-by-side hiring decision.</p></div></div>
    );
  }

  const questions = first && second ? [
    `Both candidates show credible alignment. Ask each to explain the highest-impact technical decision they personally owned and how they measured the outcome.`,
    `${first.name} shows ${first.yearsExperience || 0} years of experience and ${second.name} shows ${second.yearsExperience || 0}. Ask how their experience changes the way they manage ambiguity and delivery risk.`,
    `Give both candidates the same unfamiliar legacy-system scenario. Compare how they investigate constraints, communicate trade-offs, and sequence the first 30 days.`,
    `Ask each candidate to challenge one requirement in this role and make a reasoned case for a different priority.`,
  ] : [];

  return (
    <div className="workspace-narrow">
      <div className="page-head">
        <div><div className="eyebrow">Decision room</div><h1 className="page-title">Compare two finalists</h1><p className="page-description">Put evidence side by side and focus the interview on the differences that matter.</p></div>
      </div>

      <div className="panel mb-5 p-4">
        <div className="grid items-end gap-4 md:grid-cols-[1fr_42px_1fr]">
          <CandidateSelect label="Candidate A" value={candidateA} candidates={candidates} onChange={setSelectedCandidateA} />
          <div className="mb-1 hidden h-10 place-items-center rounded-full bg-[#f1f2f4] text-[#70747d] md:grid"><GitCompareArrows size={16} /></div>
          <CandidateSelect label="Candidate B" value={candidateB} candidates={candidates} onChange={setSelectedCandidateB} />
        </div>
      </div>

      {first && second && (
        <>
          <div className="mb-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <CandidateCard candidate={first} label="Candidate A" accent="#375dfb" />
              <CandidateCard candidate={second} label="Candidate B" accent="#7455d9" />
            </div>
            <div className="panel p-5">
              <div className="mb-1 text-[13px] font-semibold text-[#30333a]">Competency shape</div>
              <div className="text-[10px] text-[#858993]">Normalized comparison across all five scoring dimensions.</div>
              <div className="mt-2 h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="70%">
                    <PolarGrid stroke="#e1e4e9" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: "#70747d", fontSize: 10 }} />
                    <Radar name={first.name} dataKey="first" stroke="#375dfb" fill="#375dfb" fillOpacity={0.12} strokeWidth={2} />
                    <Radar name={second.name} dataKey="second" stroke="#7455d9" fill="#7455d9" fillOpacity={0.1} strokeWidth={2} />
                    <Legend iconType="circle" wrapperStyle={{ color: "#555963", fontSize: 10 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="panel mb-5 overflow-hidden">
            <div className="panel-header"><div><h2 className="panel-title"><Scale size={15} />Evidence matrix</h2><p className="panel-subtitle">The stronger signal is identified per dimension.</p></div></div>
            <div className="overflow-x-auto">
              <div className="min-w-[680px]">
                <div className="grid grid-cols-[1.2fr_1fr_1fr_140px] border-b border-[#e4e6eb] bg-[#fafbfc] px-5 py-3 text-[9px] font-bold uppercase tracking-[.09em] text-[#858993]"><span>Dimension</span><span>{first.name}</span><span>{second.name}</span><span>Stronger signal</span></div>
                {metrics.map(([label, firstValue, secondValue]) => {
                  const winner = firstValue > secondValue ? first : secondValue > firstValue ? second : null;
                  return (
                    <div key={label} className="grid grid-cols-[1.2fr_1fr_1fr_140px] items-center border-b border-[#eceef1] px-5 py-3.5 last:border-0">
                      <span className="text-[11px] font-semibold text-[#555963]">{label}</span>
                      <span className={`text-[15px] font-bold tabular-nums ${winner?.id === first.id ? "text-[#375dfb]" : "text-[#30333a]"}`}>{Math.round(firstValue * 100)}%</span>
                      <span className={`text-[15px] font-bold tabular-nums ${winner?.id === second.id ? "text-[#7455d9]" : "text-[#30333a]"}`}>{Math.round(secondValue * 100)}%</span>
                      <span>{winner ? <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#16865c]"><Check size={12} />{winner.name.split(" ")[0]}</span> : <span className="text-[10px] text-[#858993]">Equivalent</span>}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="panel-header"><div><h2 className="panel-title"><MessageSquareText size={15} />Differentiating interview prompts</h2><p className="panel-subtitle">Use the same prompt with both candidates for a fair comparison.</p></div></div>
            <div className="grid gap-3 p-5 md:grid-cols-2">
              {questions.map((question, index) => (
                <div key={question} className="flex gap-3 rounded-xl border border-[#e4e6eb] p-4">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#edf1ff] text-[9px] font-bold text-[#3152d5]">{String(index + 1).padStart(2, "0")}</span>
                  <p className="m-0 text-[11px] leading-[1.65] text-[#555963]">{question}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CandidateSelect({ label, value, candidates, onChange }: { label: string; value: number | ""; candidates: Candidate[]; onChange: (value: number | "") => void }) {
  return (
    <div><label className="form-label">{label}</label><select className="input-field" value={value} onChange={event => onChange(Number(event.target.value) || "")}><option value="">Choose a candidate</option>{candidates.map(candidate => <option key={candidate.id} value={candidate.id}>#{candidate.rank} {candidate.name} · {Math.round((candidate.compositeScore || 0) * 100)}%</option>)}</select></div>
  );
}

function CandidateCard({ candidate, label, accent }: { candidate: Candidate; label: string; accent: string }) {
  const matched = ((candidate.matchedSkills as string[]) || []).length;
  return (
    <div className="panel p-5" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f1f3f6] text-[#555963]"><UserRoundSearch size={16} /></div>
        <div className="min-w-0 flex-1"><div className="text-[9px] font-bold uppercase tracking-[.1em]" style={{ color: accent }}>{label}</div><div className="mt-1 truncate text-[14px] font-bold text-[#22252b]">{candidate.name}</div><div className="mt-1 text-[10px] text-[#858993]">{candidate.yearsExperience || 0} years · {candidate.education}</div></div>
        <StatusBadge status={candidate.status || "pending"} size="sm" />
      </div>
      <div className="my-5 flex items-end justify-between border-y border-[#eceef1] py-4"><div><div className="text-[9px] font-semibold uppercase tracking-[.08em] text-[#858993]">Overall fit</div><div className="mt-1 text-[32px] font-bold leading-none tracking-[-.045em] text-[#111318]">{Math.round((candidate.compositeScore || 0) * 100)}%</div></div><div className="text-right"><div className="text-[14px] font-bold text-[#30333a]">{matched}</div><div className="text-[9px] text-[#858993]">skills matched</div></div></div>
      <div className="grid grid-cols-2 gap-3"><ScoreBar label="Skills" value={candidate.skillScore || 0} /><ScoreBar label="Semantic" value={candidate.semanticScore || 0} /><ScoreBar label="Experience" value={candidate.experienceScore || 0} /><ScoreBar label="Education" value={candidate.educationScore || 0} /></div>
    </div>
  );
}
