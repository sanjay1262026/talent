"use client";

import { BarChart3, BriefcaseBusiness, CircleGauge, Target, Trophy, Users } from "lucide-react";
import type { Candidate } from "@/db/schema";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface AnalyticsModuleProps {
  candidates: Candidate[];
  requirements: { minYearsExperience: number; educationLevel: string; requiredSkills: string[] } | null;
}

const tooltipStyle = { background: "#fff", border: "1px solid #e4e6eb", borderRadius: 9, boxShadow: "0 10px 30px rgba(16,24,40,.1)", fontSize: 10 };

export function AnalyticsModule({ candidates, requirements }: AnalyticsModuleProps) {
  if (!candidates.length) {
    return <div className="workspace"><div className="panel empty-state"><div className="empty-icon"><BarChart3 size={24} /></div><h1 className="empty-title">Analytics will appear after screening</h1><p className="empty-copy">Process a candidate set to see score distribution, status mix, experience spread, and market skill gaps.</p></div></div>;
  }

  const top = candidates.filter(candidate => (candidate.compositeScore || 0) >= .75).length;
  const potential = candidates.filter(candidate => (candidate.compositeScore || 0) >= .6 && (candidate.compositeScore || 0) < .75).length;
  const low = candidates.length - top - potential;
  const average = candidates.reduce((sum, candidate) => sum + (candidate.compositeScore || 0), 0) / candidates.length;

  const scoreDistribution = [
    { range: "Below 50", min: 0, max: .5, color: "#d55260" },
    { range: "50–64", min: .5, max: .65, color: "#dc9140" },
    { range: "65–74", min: .65, max: .75, color: "#d1ac45" },
    { range: "75–84", min: .75, max: .85, color: "#45a77f" },
    { range: "85–100", min: .85, max: 1.01, color: "#375dfb" },
  ].map(bucket => ({ ...bucket, candidates: candidates.filter(candidate => (candidate.compositeScore || 0) >= bucket.min && (candidate.compositeScore || 0) < bucket.max).length }));

  const statusData = [
    { name: "Top match", value: top, color: "#16865c" },
    { name: "Potential fit", value: potential, color: "#d28a25" },
    { name: "Low match", value: low, color: "#d55260" },
  ].filter(item => item.value > 0);

  const skillGaps = (requirements?.requiredSkills || []).map(skill => {
    const available = candidates.filter(candidate => ((candidate.matchedSkills as string[]) || []).includes(skill)).length;
    return { skill: skill.length > 14 ? `${skill.slice(0, 13)}…` : skill, available, missing: candidates.length - available };
  }).sort((a, b) => b.missing - a.missing).slice(0, 10);

  const experienceSpread = [
    { level: "Junior", range: "0–2 yrs", min: 0, max: 2 },
    { level: "Mid-level", range: "3–5 yrs", min: 3, max: 5 },
    { level: "Senior", range: "6–8 yrs", min: 6, max: 8 },
    { level: "Lead", range: "9–12 yrs", min: 9, max: 12 },
    { level: "Principal", range: "13+ yrs", min: 13, max: 999 },
  ].map(item => ({ ...item, candidates: candidates.filter(candidate => (candidate.yearsExperience || 0) >= item.min && (candidate.yearsExperience || 0) <= item.max).length }));

  return (
    <div className="workspace">
      <div className="page-head"><div><div className="eyebrow">Pipeline intelligence</div><h1 className="page-title">Talent analytics</h1><p className="page-description">Understand shortlist quality, experience shape, and recurring requirement gaps across the candidate pool.</p></div></div>

      <div className="metric-grid">
        {[
          { label: "Profiles screened", value: candidates.length, note: "Complete dataset", icon: Users },
          { label: "Top matches", value: top, note: `${Math.round(top / candidates.length * 100)}% of the pool`, icon: Trophy },
          { label: "Average score", value: `${Math.round(average * 100)}%`, note: "Weighted composite", icon: CircleGauge },
          { label: "Below threshold", value: low, note: "Under 60% fit", icon: Target },
        ].map(item => { const Icon = item.icon; return <div className="metric-card" key={item.label}><div className="metric-top"><span>{item.label}</span><span className="metric-icon"><Icon size={14} /></span></div><div className="metric-value">{item.value}</div><div className="metric-note">{item.note}</div></div>; })}
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <ChartPanel title="Score distribution" subtitle="Candidates grouped by overall fit band.">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={scoreDistribution} barSize={38} margin={{ top: 10, right: 4, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" vertical={false} />
              <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: "#858993", fontSize: 9 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#858993", fontSize: 9 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f5f6f8" }} formatter={value => [`${value} profiles`, "Candidates"]} />
              <Bar dataKey="candidates" radius={[5, 5, 0, 0]}>{scoreDistribution.map(item => <Cell key={item.range} fill={item.color} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Recommendation mix" subtitle="Current candidate status allocation.">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" innerRadius={62} outerRadius={90} paddingAngle={3} stroke="none">{statusData.map(item => <Cell key={item.name} fill={item.color} />)}</Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ color: "#70747d", fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      {skillGaps.length > 0 && (
        <div className="mb-5">
          <ChartPanel title="Market skill availability" subtitle="Available versus missing evidence for the most constrained role requirements.">
            <ResponsiveContainer width="100%" height={310}>
              <BarChart data={skillGaps} layout="vertical" barSize={13} margin={{ top: 8, right: 15, left: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" horizontal={false} />
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#858993", fontSize: 9 }} />
                <YAxis type="category" dataKey="skill" width={100} axisLine={false} tickLine={false} tick={{ fill: "#555963", fontSize: 9 }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f8fa" }} />
                <Legend iconType="circle" wrapperStyle={{ color: "#70747d", fontSize: 10 }} />
                <Bar dataKey="available" name="Evidence found" fill="#375dfb" stackId="skills" radius={[3, 0, 0, 3]} />
                <Bar dataKey="missing" name="Evidence missing" fill="#dfe3ea" stackId="skills" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>
      )}

      <ChartPanel title="Experience composition" subtitle="Seniority mix inferred from explicit years and employment date ranges.">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={experienceSpread} barSize={48} margin={{ top: 8, right: 8, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" vertical={false} />
            <XAxis dataKey="level" axisLine={false} tickLine={false} tick={{ fill: "#70747d", fontSize: 9 }} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#858993", fontSize: 9 }} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f8fa" }} formatter={value => [`${value} profiles`, "Candidates"]} />
            <Bar dataKey="candidates" fill="#375dfb" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>
    </div>
  );
}

function ChartPanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="panel p-5"><div className="mb-4"><h2 className="m-0 text-[13px] font-semibold text-[#30333a]">{title}</h2><p className="mt-1 text-[10px] text-[#858993]">{subtitle}</p></div>{children}</section>;
}
