"use client";

import {
  ArrowLeftToLine,
  ArrowRightToLine,
  BarChart3,
  BriefcaseBusiness,
  ChevronRight,
  FileDown,
  History,
  LogOut,
  Scale,
  Settings2,
  SlidersHorizontal,
  Trophy,
  UploadCloud,
  UsersRound,
} from "lucide-react";
import { type AppView, type Weights } from "../DashboardClient";
import type { ScreeningSession } from "@/db/schema";
import { formatDate } from "@/lib/utils";

interface SidebarProps {
  user: { name: string; email: string; role: string };
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  weights: Weights;
  onWeightsChange: (w: Weights) => void;
  visibleStatuses: Record<string, boolean>;
  onVisibleStatusesChange: (s: Record<string, boolean>) => void;
  sessionHistory: ScreeningSession[];
  onLoadSession: (id: number) => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  candidateCount: number;
}

const NAV_ITEMS = [
  { id: "ingestion" as const, icon: UploadCloud, label: "New screening" },
  { id: "leaderboard" as const, icon: Trophy, label: "Leaderboard" },
  { id: "comparison" as const, icon: Scale, label: "Compare" },
  { id: "analytics" as const, icon: BarChart3, label: "Talent analytics" },
  { id: "export" as const, icon: FileDown, label: "Reports" },
  { id: "scoring" as const, icon: Settings2, label: "Methodology" },
];

const STATUS_FILTERS = [
  { key: "top_match", label: "Top match", color: "#38b987" },
  { key: "potential_fit", label: "Potential fit", color: "#e2a447" },
  { key: "low_match", label: "Low match", color: "#dd6875" },
];

interface WeightSliderProps {
  label: string;
  metric: keyof Weights;
  color: string;
  weights: Weights;
  onUpdate: (key: keyof Weights, value: number) => void;
}

function WeightSlider({ label, metric, color, weights, onUpdate }: WeightSliderProps) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1.5 flex items-center justify-between text-[10px]">
        <span className="text-[#a8acb6]">{label}</span>
        <span className="font-semibold tabular-nums text-white">{Math.round(weights[metric] * 100)}%</span>
      </div>
      <input
        aria-label={`${label} weight`}
        type="range"
        min={0}
        max={100}
        value={Math.round(weights[metric] * 100)}
        onChange={event => onUpdate(metric, Number(event.target.value))}
        className="block h-1 w-full cursor-pointer"
        style={{ accentColor: color }}
      />
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const {
    user, activeView, onNavigate, weights, onWeightsChange, visibleStatuses,
    onVisibleStatusesChange, sessionHistory, onLoadSession, onLogout, collapsed,
    onToggleCollapse, candidateCount,
  } = props;
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const initials = user.name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();

  const updateWeight = (key: keyof Weights, value: number) => {
    onWeightsChange({ ...weights, [key]: value / 100 });
  };

  return (
    <aside
      className={`sidebar relative z-30 flex h-screen shrink-0 flex-col overflow-hidden bg-[#111318] text-white transition-[width] duration-300 ${collapsed ? "w-[68px]" : "w-[264px]"}`}
    >
      <div className="flex h-16 shrink-0 items-center border-b border-[#292c34] px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#375dfb] text-sm font-bold shadow-[0_5px_16px_rgba(55,93,251,.28)]">T</div>
        {!collapsed && (
          <div className="ml-3 min-w-0">
            <div className="text-[14px] font-semibold tracking-[-.02em]">TalentOS</div>
            <div className="text-[9px] uppercase tracking-[.16em] text-[#777b85]">Resume intelligence</div>
          </div>
        )}
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapse}
          className={`sidebar-collapse ml-auto grid h-8 w-8 place-items-center rounded-lg text-[#737783] transition hover:bg-[#20232b] hover:text-white ${collapsed ? "absolute left-[18px] top-[74px]" : ""}`}
        >
          {collapsed ? <ArrowRightToLine size={15} /> : <ArrowLeftToLine size={15} />}
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto no-scrollbar ${collapsed ? "pt-12" : ""}`}>
        <nav className="p-3">
          {!collapsed && <p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[.14em] text-[#626671]">Workspace</p>}
          <div className="space-y-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const active = item.id === activeView;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={collapsed ? item.label : undefined}
                  onClick={() => onNavigate(item.id)}
                  className={`relative flex h-10 w-full items-center rounded-[9px] text-[12px] font-medium transition ${collapsed ? "justify-center" : "gap-3 px-3"} ${active ? "bg-white text-[#111318]" : "text-[#9da1ab] hover:bg-[#1b1e25] hover:text-white"}`}
                >
                  <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.id === "leaderboard" && candidateCount > 0 && (
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold ${active ? "bg-[#e9edff] text-[#3152d5]" : "bg-[#292d36] text-[#b3b7c1]"}`}>{candidateCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {!collapsed && (
          <div className="mx-3 mt-1 rounded-xl border border-[#292c34] bg-[#171a20] p-3.5">
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal size={13} className="text-[#858995]" />
              <span className="text-[10px] font-semibold uppercase tracking-[.1em] text-[#858995]">Scoring weights</span>
            </div>
            <WeightSlider label="Skills" metric="skill" color="#6f8aff" weights={weights} onUpdate={updateWeight} />
            <WeightSlider label="Semantic fit" metric="semantic" color="#8ca0ff" weights={weights} onUpdate={updateWeight} />
            <WeightSlider label="Experience" metric="experience" color="#55b9a0" weights={weights} onUpdate={updateWeight} />
            <WeightSlider label="Education" metric="education" color="#d09f55" weights={weights} onUpdate={updateWeight} />
            <div className={`mt-3 border-t border-[#292c34] pt-3 text-[10px] ${Math.abs(totalWeight - 1) < .001 ? "text-[#68c6a5]" : "text-[#e48c96]"}`}>
              Total allocation {Math.round(totalWeight * 100)}%
            </div>
          </div>
        )}

        {!collapsed && (
          <div className="px-5 py-5">
            <div className="mb-3 flex items-center gap-2">
              <UsersRound size={13} className="text-[#717681]" />
              <span className="text-[9px] font-semibold uppercase tracking-[.13em] text-[#717681]">Visible candidates</span>
            </div>
            <div className="space-y-2.5">
              {STATUS_FILTERS.map(item => (
                <label key={item.key} className="flex cursor-pointer items-center gap-2.5 text-[11px] text-[#a8acb6]">
                  <input
                    type="checkbox"
                    checked={Boolean(visibleStatuses[item.key])}
                    onChange={event => onVisibleStatusesChange({ ...visibleStatuses, [item.key]: event.target.checked })}
                    style={{ accentColor: item.color }}
                  />
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.color }} />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {!collapsed && sessionHistory.length > 0 && (
          <div className="border-t border-[#22252c] px-3 py-4">
            <div className="mb-2 flex items-center gap-2 px-2">
              <History size={13} className="text-[#717681]" />
              <span className="text-[9px] font-semibold uppercase tracking-[.13em] text-[#717681]">Recent sessions</span>
            </div>
            <div className="space-y-1">
              {sessionHistory.slice(0, 4).map(item => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => onLoadSession(item.id)}
                  className="group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-[#1b1e25]"
                >
                  <BriefcaseBusiness size={13} className="shrink-0 text-[#626671] group-hover:text-[#9bafff]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] font-medium text-[#b6bac3]">{item.name}</span>
                    <span className="block text-[9px] text-[#666a75]">{item.totalApplicants} profiles · {formatDate(item.createdAt)}</span>
                  </span>
                  <ChevronRight size={12} className="text-[#4f535d]" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-[#292c34] p-3">
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5"}`}>
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#292d36] text-[9px] font-bold text-white">{initials}</div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[10px] font-semibold text-[#d4d6dc]">{user.name}</div>
              <div className="truncate text-[9px] text-[#696e78]">{user.email}</div>
            </div>
          )}
          <button type="button" title="Sign out" aria-label="Sign out" onClick={onLogout} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#737783] transition hover:bg-[#2a1e22] hover:text-[#ed7d89]">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
