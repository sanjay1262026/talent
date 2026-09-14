"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Eye,
  Filter,
  Search,
  Scale,
  Trophy,
  Users,
} from "lucide-react";
import type { Candidate, ScreeningSession } from "@/db/schema";
import { ScoreBar } from "@/components/ScoreBar";
import { StatusBadge } from "@/components/StatusBadge";
import { CandidateModal } from "./CandidateModal";
import type { AppView } from "../DashboardClient";

interface LeaderboardModuleProps {
  candidates: Candidate[];
  allCandidates: Candidate[];
  session: ScreeningSession | null;
  requirements: { minYearsExperience: number; educationLevel: string; requiredSkills: string[] } | null;
  onNavigate: (view: AppView) => void;
}

type SortKey = "rank" | "skill" | "semantic" | "experience" | "education";

export function LeaderboardModule({ candidates, allCandidates, session, requirements, onNavigate }: LeaderboardModuleProps) {
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("rank");

  const topMatches = allCandidates.filter(candidate => (candidate.compositeScore || 0) >= .75).length;
  const average = allCandidates.length ? allCandidates.reduce((sum, candidate) => sum + (candidate.compositeScore || 0), 0) / allCandidates.length : 0;
  const potential = allCandidates.filter(candidate => (candidate.compositeScore || 0) >= .6).length;

  const filtered = candidates
    .filter(candidate => {
      const query = search.toLowerCase().trim();
      const skills = (candidate.matchedSkills as string[]) || [];
      const matchesSearch = !query || [candidate.name, candidate.email || "", candidate.education || "", ...skills].some(value => value.toLowerCase().includes(query));
      return matchesSearch && (candidate.compositeScore || 0) >= minScore / 100;
    })
    .sort((a, b) => {
      const values: Record<SortKey, [number, number]> = {
        rank: [-(a.rank || 999), -(b.rank || 999)],
        skill: [a.skillScore || 0, b.skillScore || 0],
        semantic: [a.semanticScore || 0, b.semanticScore || 0],
        experience: [a.experienceScore || 0, b.experienceScore || 0],
        education: [a.educationScore || 0, b.educationScore || 0],
      };
      return values[sortBy][1] - values[sortBy][0];
    });

  if (allCandidates.length === 0) {
    return (
      <div className="workspace">
        <div className="panel empty-state">
          <div className="empty-icon"><Trophy size={24} /></div>
          <h1 className="empty-title">No candidate ranking yet</h1>
          <p className="empty-copy">Start a screening run to parse candidate documents and generate a transparent, multi-factor ranking.</p>
          <button type="button" className="btn btn-primary" onClick={() => onNavigate("ingestion")}>Create a screening</button>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace">
      <div className="page-head">
        <div>
          <div className="eyebrow">Active shortlist</div>
          <h1 className="page-title">Candidate leaderboard</h1>
          <p className="page-description">{session?.name || "Current screening"} · Ranked using your live scoring weights.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => onNavigate("comparison")}><Scale size={14} />Compare profiles</button>
          <button className="btn btn-primary" onClick={() => onNavigate("analytics")}><BarChart3 size={14} />View analytics</button>
        </div>
      </div>

      <div className="metric-grid">
        {[
          { label: "Applicants", value: allCandidates.length, note: "Successfully parsed", icon: Users },
          { label: "Top matches", value: topMatches, note: "At or above 75%", icon: Trophy },
          { label: "Average fit", value: `${Math.round(average * 100)}%`, note: "Across all profiles", icon: BarChart3 },
          { label: "Qualified pool", value: `${allCandidates.length ? Math.round(potential / allCandidates.length * 100) : 0}%`, note: "At or above 60%", icon: Filter },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div className="metric-card" key={item.label}>
              <div className="metric-top"><span>{item.label}</span><span className="metric-icon"><Icon size={14} /></span></div>
              <div className="metric-value">{item.value}</div>
              <div className="metric-note">{item.note}</div>
            </div>
          );
        })}
      </div>

      {requirements && (
        <div className="panel mb-4 flex flex-wrap items-center gap-2 p-3.5">
          <span className="mr-2 text-[10px] font-bold uppercase tracking-[.09em] text-[#70747d]">Role baseline</span>
          <span className="tag-neutral">{requirements.minYearsExperience}+ years</span>
          <span className="tag-neutral">{requirements.educationLevel}</span>
          {requirements.requiredSkills.slice(0, 12).map(skill => <span className="skill-tag-blue" key={skill}>{skill}</span>)}
          {requirements.requiredSkills.length > 12 && <span className="text-[10px] font-semibold text-[#70747d]">+{requirements.requiredSkills.length - 12} skills</span>}
        </div>
      )}

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#e4e6eb] p-3.5">
          <div className="relative min-w-[230px] flex-1 md:max-w-[360px]">
            <Search size={14} className="absolute left-3 top-3.5 text-[#8d919a]" />
            <input className="input-field !pl-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, email, education, or skill" />
          </div>
          <div className="flex items-center gap-3 rounded-[9px] border border-[#e1e3e8] bg-[#f8f9fb] px-3 py-2">
            <span className="text-[10px] font-semibold text-[#70747d]">Minimum {minScore}%</span>
            <input aria-label="Minimum candidate score" type="range" min={0} max={100} step={5} value={minScore} onChange={event => setMinScore(Number(event.target.value))} className="w-24" style={{ accentColor: "#375dfb" }} />
          </div>
          <div className="relative">
            <ArrowUpDown size={13} className="absolute left-3 top-3.5 text-[#8d919a]" />
            <select className="input-field !w-auto !pl-8 !pr-8" value={sortBy} onChange={event => setSortBy(event.target.value as SortKey)}>
              <option value="rank">Overall rank</option>
              <option value="skill">Skill match</option>
              <option value="semantic">Semantic fit</option>
              <option value="experience">Experience</option>
              <option value="education">Education</option>
            </select>
          </div>
          <span className="ml-auto text-[10px] font-medium text-[#8a8e97]">{filtered.length} displayed</span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1050px]">
            <div className="grid grid-cols-[64px_1.25fr_112px_1fr_95px_120px_44px] items-center gap-3 border-b border-[#e4e6eb] bg-[#fafbfc] px-4 py-3 text-[9px] font-bold uppercase tracking-[.1em] text-[#858993]">
              <span>Rank</span><span>Candidate</span><span>Overall fit</span><span>Score evidence</span><span>Coverage</span><span>Status</span><span />
            </div>

            {filtered.map(candidate => {
              const matched = (candidate.matchedSkills as string[]) || [];
              const missing = (candidate.missingSkills as string[]) || [];
              const expanded = expandedId === candidate.id;
              return (
                <div key={candidate.id} className="border-b border-[#eceef1] last:border-0">
                  <div className="grid grid-cols-[64px_1.25fr_112px_1fr_95px_120px_44px] items-center gap-3 px-4 py-4 transition hover:bg-[#fafbfc]">
                    <div>
                      <span className={`inline-grid h-8 w-8 place-items-center rounded-lg text-[11px] font-bold tabular-nums ${candidate.rank === 1 ? "bg-[#111318] text-white" : "border border-[#e0e2e6] bg-white text-[#555963]"}`}>{String(candidate.rank || 0).padStart(2, "0")}</span>
                    </div>
                    <button type="button" className="min-w-0 text-left" onClick={() => setSelectedCandidate(candidate)}>
                      <div className="truncate text-[12px] font-semibold text-[#22252b] hover:text-[#3152d5]">{candidate.name}</div>
                      <div className="mt-1 truncate text-[10px] text-[#858993]">{candidate.email || "No email extracted"} · {candidate.yearsExperience || 0} yrs · {candidate.education || "Unknown education"}</div>
                    </button>
                    <div>
                      <div className="text-[20px] font-bold tracking-[-.03em] tabular-nums text-[#111318]">{Math.round((candidate.compositeScore || 0) * 100)}<span className="ml-0.5 text-[11px] font-semibold text-[#8a8e97]">%</span></div>
                      <div className="mt-1.5"><ScoreBar value={candidate.compositeScore || 0} showPercent={false} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <ScoreBar value={candidate.skillScore || 0} label="Skills" height={3} />
                      <ScoreBar value={candidate.semanticScore || 0} label="Semantic" height={3} />
                      <ScoreBar value={candidate.experienceScore || 0} label="Experience" height={3} />
                      <ScoreBar value={candidate.educationScore || 0} label="Education" height={3} />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-[#30333a]">{matched.length}</div>
                      <div className="mt-0.5 text-[9px] text-[#8a8e97]">skills matched</div>
                    </div>
                    <StatusBadge status={candidate.status || "pending"} size="sm" />
                    <button type="button" aria-label={`Expand ${candidate.name}`} onClick={() => setExpandedId(expanded ? null : candidate.id)} className="icon-btn !h-8 !w-8">
                      {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  </div>

                  {expanded && (
                    <div className="grid gap-5 border-t border-[#eceef1] bg-[#f9fafb] px-5 py-4 md:grid-cols-[1fr_1fr_auto]">
                      <div>
                        <div className="mb-2 text-[9px] font-bold uppercase tracking-[.08em] text-[#16865c]">Matched requirements</div>
                        <div className="tag-row">{matched.length ? matched.slice(0, 12).map(skill => <span className="skill-tag-green" key={skill}>{skill}</span>) : <span className="text-[10px] text-[#8a8e97]">No direct matches detected</span>}</div>
                      </div>
                      <div>
                        <div className="mb-2 text-[9px] font-bold uppercase tracking-[.08em] text-[#c63d4d]">Missing requirements</div>
                        <div className="tag-row">{missing.length ? missing.slice(0, 10).map(skill => <span className="skill-tag-red" key={skill}>{skill}</span>) : <span className="text-[10px] text-[#16865c]">No material gaps detected</span>}</div>
                      </div>
                      <button type="button" className="btn btn-secondary self-end" onClick={() => setSelectedCandidate(candidate)}><Eye size={14} />Inspect profile</button>
                    </div>
                  )}
                </div>
              );
            })}

            {!filtered.length && (
              <div className="empty-state !min-h-[280px]"><div className="empty-icon"><Search size={22} /></div><h3 className="empty-title">No matching profiles</h3><p className="empty-copy">Try a broader search or lower the minimum score.</p></div>
            )}
          </div>
        </div>
      </div>

      {selectedCandidate && <CandidateModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />}
    </div>
  );
}
