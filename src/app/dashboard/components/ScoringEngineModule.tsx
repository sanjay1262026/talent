"use client";

import { useState } from "react";
import {
  Binary,
  BookOpen,
  Braces,
  BriefcaseBusiness,
  CheckCircle2,
  Database,
  FileSearch,
  Fingerprint,
  FunctionSquare,
  GitBranch,
  ListFilter,
  Scale,
  ShieldCheck,
  Target,
} from "lucide-react";
import { SKILL_TAXONOMY } from "@/lib/skills-taxonomy";

const DIMENSIONS = [
  { name: "Skill alignment", symbol: "Wₛ", weight: "40%", description: "Exact boundary matching against the normalized skill taxonomy and known aliases.", icon: Target, color: "#375dfb" },
  { name: "Semantic relevance", symbol: "Wᵥ", weight: "35%", description: "Context similarity between job and resume using sublinear TF-IDF vectors.", icon: Binary, color: "#7455d9" },
  { name: "Experience match", symbol: "Wₑ", weight: "15%", description: "Explicit year mentions and employment date ranges compared with the role baseline.", icon: BriefcaseBusiness, color: "#16865c" },
  { name: "Education match", symbol: "Wₑd", weight: "10%", description: "Ordinal degree matching from secondary education through doctoral attainment.", icon: BookOpen, color: "#a86108" },
];

const PIPELINE = [
  { title: "Document extraction", description: "Reads text layers from PDF and DOCX files, then normalizes whitespace, punctuation, and line breaks.", icon: FileSearch },
  { title: "Taxonomy resolution", description: "Maps detected technical terms and aliases to canonical skills using boundary-aware regular expressions.", icon: Fingerprint },
  { title: "Vector construction", description: "Creates unigram and bigram TF-IDF vectors with sublinear term-frequency scaling.", icon: GitBranch },
  { title: "Similarity scoring", description: "Measures the cosine angle between the role vector and each candidate vector, independent of document length.", icon: FunctionSquare },
  { title: "Qualification parsing", description: "Detects degree level, explicit experience statements, and dated employment intervals.", icon: ListFilter },
  { title: "Weighted decision", description: "Combines independent dimensions using recruiter-controlled weights and re-ranks instantly.", icon: Scale },
];

export function ScoringEngineModule() {
  const categories = Object.keys(SKILL_TAXONOMY);
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  return (
    <div className="workspace-narrow">
      <div className="page-head">
        <div><div className="eyebrow">Transparent by design</div><h1 className="page-title">Scoring methodology</h1><p className="page-description">A model card for the screening engine. Every recommendation is composed from inspectable signals rather than a single opaque prediction.</p></div>
        <div className="flex items-center gap-2 rounded-full border border-[#cdeade] bg-[#eaf8f2] px-3 py-2 text-[10px] font-semibold text-[#16865c]"><ShieldCheck size={14} />Explainable scoring enabled</div>
      </div>

      <section className="mb-5 overflow-hidden rounded-2xl bg-[#111318] text-white shadow-[0_18px_45px_rgba(17,19,24,.13)]">
        <div className="border-b border-[#2b2e35] px-6 py-4"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[#8e939d]"><FunctionSquare size={14} />Composite formula</div></div>
        <div className="p-6">
          <div className="overflow-x-auto rounded-xl border border-[#2b2e35] bg-[#171a20] px-5 py-7 text-center font-mono text-[12px] leading-7 text-[#d9dbe0] md:text-[14px]">
            Fit = (Skill × Wₛ) + (Semantic × Wᵥ) + (Experience × Wₑ) + (Education × Wₑd)
          </div>
          <p className="mb-0 mt-4 text-[10px] leading-5 text-[#858a95]">Weights are normalized before calculation. Changing a slider updates every composite score, status, and rank in the browser without rerunning document extraction.</p>
        </div>
      </section>

      <div className="mb-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {DIMENSIONS.map(item => { const Icon = item.icon; return (
          <section className="panel p-4" key={item.name} style={{ borderTop: `3px solid ${item.color}` }}>
            <div className="mb-5 flex items-center justify-between"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f4f5f7]" style={{ color: item.color }}><Icon size={15} /></span><span className="font-mono text-[10px] font-bold text-[#8a8e97]">{item.symbol}</span></div>
            <div className="text-[25px] font-bold tracking-[-.04em]" style={{ color: item.color }}>{item.weight}</div>
            <h2 className="mb-1 mt-3 text-[11px] font-bold text-[#30333a]">{item.name}</h2>
            <p className="m-0 text-[10px] leading-[1.6] text-[#7b7f88]">{item.description}</p>
          </section>
        ); })}
      </div>

      <section className="panel mb-5 overflow-hidden">
        <div className="panel-header"><div><h2 className="panel-title"><Braces size={15} />Processing pipeline</h2><p className="panel-subtitle">From document bytes to a ranked recommendation.</p></div></div>
        <div className="grid gap-px bg-[#e4e6eb] md:grid-cols-2 lg:grid-cols-3">
          {PIPELINE.map((item, index) => { const Icon = item.icon; return (
            <div className="bg-white p-5" key={item.title}>
              <div className="mb-4 flex items-center justify-between"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#edf1ff] text-[#375dfb]"><Icon size={15} /></span><span className="text-[9px] font-bold tracking-[.1em] text-[#b0b3ba]">{String(index + 1).padStart(2, "0")}</span></div>
              <h3 className="mb-1.5 text-[11px] font-bold text-[#30333a]">{item.title}</h3><p className="m-0 text-[10px] leading-[1.65] text-[#7b7f88]">{item.description}</p>
            </div>
          ); })}
        </div>
      </section>

      <section className="panel mb-5 overflow-hidden">
        <div className="panel-header"><div><h2 className="panel-title"><CheckCircle2 size={15} />Decision thresholds</h2><p className="panel-subtitle">Consistent status labels for triage, not automatic hiring decisions.</p></div></div>
        <div className="grid gap-px bg-[#e4e6eb] md:grid-cols-3">
          {[
            { label: "Top match", range: "75–100%", color: "#16865c", background: "#f5fcf9", description: "Prioritize for structured interview and human review." },
            { label: "Potential fit", range: "60–74%", color: "#a86108", background: "#fffbf4", description: "Validate transferable experience and identified gaps." },
            { label: "Low match", range: "0–59%", color: "#c63d4d", background: "#fff8f9", description: "Review only when sourcing constraints justify expansion." },
          ].map(item => (
            <div className="p-5" key={item.label} style={{ background: item.background }}><div className="text-[24px] font-bold tracking-[-.035em]" style={{ color: item.color }}>{item.range}</div><div className="mt-3 text-[11px] font-bold text-[#30333a]">{item.label}</div><p className="mb-0 mt-1 text-[10px] leading-4 text-[#7b7f88]">{item.description}</p></div>
          ))}
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="panel-header"><div><h2 className="panel-title"><Database size={15} />Skill taxonomy</h2><p className="panel-subtitle">{Object.values(SKILL_TAXONOMY).flat().length} recognized terms with canonical alias resolution.</p></div></div>
        <div className="p-5">
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {categories.map(category => (
              <button type="button" key={category} onClick={() => setActiveCategory(category)} className={`shrink-0 rounded-lg border px-3 py-2 text-[10px] font-semibold transition ${activeCategory === category ? "border-[#375dfb] bg-[#edf1ff] text-[#3152d5]" : "border-[#e1e3e8] bg-white text-[#70747d] hover:bg-[#f8f9fb]"}`}>{category}<span className="ml-1.5 opacity-60">{SKILL_TAXONOMY[category as keyof typeof SKILL_TAXONOMY].length}</span></button>
            ))}
          </div>
          <div className="tag-row">{SKILL_TAXONOMY[activeCategory as keyof typeof SKILL_TAXONOMY].map(skill => <span className="tag-neutral" key={skill}>{skill}</span>)}</div>
        </div>
      </section>
    </div>
  );
}
