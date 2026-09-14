"use client";

import {
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CircleHelp,
  Mail,
  MessageSquareText,
  Phone,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import type { Candidate } from "@/db/schema";
import { ScoreBar } from "@/components/ScoreBar";
import { StatusBadge } from "@/components/StatusBadge";

interface CandidateModalProps {
  candidate: Candidate;
  onClose: () => void;
}

export function CandidateModal({ candidate, onClose }: CandidateModalProps) {
  const matched = (candidate.matchedSkills as string[]) || [];
  const missing = (candidate.missingSkills as string[]) || [];
  const questions = (candidate.interviewQuestions as string[]) || [];
  const score = Math.round((candidate.compositeScore || 0) * 100);
  const initials = candidate.name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();

  const scoreCards = [
    { label: "Skill alignment", value: candidate.skillScore || 0, icon: Target, note: `${matched.length} requirements matched`, color: "#375dfb" },
    { label: "Semantic relevance", value: candidate.semanticScore || 0, icon: Sparkles, note: "Language and context fit", color: "#6d4fd5" },
    { label: "Experience", value: candidate.experienceScore || 0, icon: BriefcaseBusiness, note: `${candidate.yearsExperience || 0} years detected`, color: "#16865c" },
    { label: "Education", value: candidate.educationScore || 0, icon: BookOpen, note: candidate.education || "Not identified", color: "#a86108" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111318]/45 p-4 backdrop-blur-[3px]" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={`${candidate.name} candidate profile`} className="max-h-[94vh] w-full max-w-[920px] overflow-y-auto rounded-2xl border border-white/70 bg-white shadow-[0_28px_90px_rgba(17,19,24,.24)]">
        <header className="sticky top-0 z-10 border-b border-[#e4e6eb] bg-white/95 px-6 py-5 backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#111318] text-[13px] font-bold text-white">{initials}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="m-0 text-[20px] font-bold tracking-[-.025em] text-[#111318]">{candidate.name}</h2>
                <StatusBadge status={candidate.status || "pending"} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#70747d]">
                {candidate.email && <span className="inline-flex items-center gap-1.5"><Mail size={12} />{candidate.email}</span>}
                {candidate.phone && <span className="inline-flex items-center gap-1.5"><Phone size={12} />{candidate.phone}</span>}
                <span className="inline-flex items-center gap-1.5"><BriefcaseBusiness size={12} />{candidate.yearsExperience || 0} years</span>
                <span className="inline-flex items-center gap-1.5"><BookOpen size={12} />{candidate.education || "Unknown"}</span>
              </div>
            </div>
            <button type="button" aria-label="Close profile" className="icon-btn shrink-0" onClick={onClose}><X size={16} /></button>
          </div>
        </header>

        <div className="p-6">
          <section className="mb-6 grid gap-4 rounded-xl bg-[#111318] p-5 text-white md:grid-cols-[190px_1fr]">
            <div className="border-b border-[#30333a] pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-5">
              <div className="text-[9px] font-semibold uppercase tracking-[.12em] text-[#858a95]">Composite fit</div>
              <div className="mt-2 text-[46px] font-bold leading-none tracking-[-.055em]">{score}<span className="ml-1 text-[18px] font-medium text-[#858a95]">%</span></div>
              <div className="mt-4"><ScoreBar value={candidate.compositeScore || 0} showPercent={false} height={6} color="#6f8aff" /></div>
              <div className="mt-3 text-[10px] text-[#9ba0aa]">Current leaderboard rank {candidate.rank || "—"}</div>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.1em] text-[#9ba0aa]"><BadgeCheck size={13} />Recommendation</div>
              <p className="m-0 text-[12px] leading-5 text-[#d7d9de]">{candidate.recruiterNotes || "No automated assessment is available for this profile."}</p>
            </div>
          </section>

          <section className="mb-7">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[.1em] text-[#70747d]">Evidence by dimension</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {scoreCards.map(item => {
                const Icon = item.icon;
                return (
                  <div className="rounded-xl border border-[#e4e6eb] bg-[#fafbfc] p-4" key={item.label}>
                    <div className="mb-4 flex items-center justify-between"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white shadow-sm" style={{ color: item.color }}><Icon size={15} /></span><span className="text-[17px] font-bold tabular-nums text-[#22252b]">{Math.round(item.value * 100)}%</span></div>
                    <div className="text-[11px] font-semibold text-[#30333a]">{item.label}</div>
                    <div className="mb-3 mt-1 text-[9px] text-[#8a8e97]">{item.note}</div>
                    <ScoreBar value={item.value} showPercent={false} height={4} color={item.color} />
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mb-7 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[#d8ebe3] bg-[#fbfffd] p-4">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.08em] text-[#16865c]"><BadgeCheck size={14} />Matched requirements <span className="ml-auto rounded-full bg-[#e4f5ee] px-2 py-0.5">{matched.length}</span></div>
              <div className="tag-row">{matched.length ? matched.map(skill => <span className="skill-tag-green" key={skill}>{skill}</span>) : <span className="text-[10px] text-[#8a8e97]">No direct skill matches detected.</span>}</div>
            </div>
            <div className="rounded-xl border border-[#f0d9dd] bg-[#fffbfc] p-4">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.08em] text-[#c63d4d]"><CircleHelp size={14} />Requirements to validate <span className="ml-auto rounded-full bg-[#fbe9ec] px-2 py-0.5">{missing.length}</span></div>
              <div className="tag-row">{missing.length ? missing.map(skill => <span className="skill-tag-red" key={skill}>{skill}</span>) : <span className="text-[10px] text-[#16865c]">No material gaps detected.</span>}</div>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.1em] text-[#70747d]"><MessageSquareText size={14} />Structured interview prompts</div>
            <div className="grid gap-3 md:grid-cols-2">
              {questions.map((question, index) => (
                <div className="flex gap-3 rounded-xl border border-[#e4e6eb] bg-white p-4" key={question}>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#edf1ff] text-[9px] font-bold text-[#3152d5]">{String(index + 1).padStart(2, "0")}</span>
                  <p className="m-0 text-[11px] leading-[1.65] text-[#555963]">{question}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
