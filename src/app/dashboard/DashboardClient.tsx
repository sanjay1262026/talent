"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, ChevronRight, Command } from "lucide-react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./components/Sidebar";
import { IngestionModule } from "./components/IngestionModule";
import { LeaderboardModule } from "./components/LeaderboardModule";
import { ComparisonModule } from "./components/ComparisonModule";
import { AnalyticsModule } from "./components/AnalyticsModule";
import { ExportModule } from "./components/ExportModule";
import { ScoringEngineModule } from "./components/ScoringEngineModule";
import type { Candidate, ScreeningSession } from "@/db/schema";

export type AppView = "ingestion" | "leaderboard" | "comparison" | "analytics" | "export" | "scoring";

export interface Weights {
  skill: number;
  semantic: number;
  experience: number;
  education: number;
}

export interface ScreeningResult {
  session: ScreeningSession;
  candidates: Candidate[];
  requirements: {
    minYearsExperience: number;
    educationLevel: string;
    requiredSkills: string[];
  };
}

interface DashboardClientProps {
  user: { name: string; email: string; role: string };
}

const VIEW_LABELS: Record<AppView, string> = {
  ingestion: "New screening",
  leaderboard: "Candidate leaderboard",
  comparison: "Candidate comparison",
  analytics: "Talent analytics",
  export: "Reports and export",
  scoring: "Scoring methodology",
};

export function DashboardClient({ user }: DashboardClientProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<AppView>("ingestion");
  const [weights, setWeights] = useState<Weights>({ skill: 0.4, semantic: 0.35, experience: 0.15, education: 0.1 });
  const [screeningResult, setScreeningResult] = useState<ScreeningResult | null>(null);
  const [sessionHistory, setSessionHistory] = useState<ScreeningSession[]>([]);
  const [visibleStatuses, setVisibleStatuses] = useState<Record<string, boolean>>({ top_match: true, potential_fit: true, low_match: true });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetch("/api/sessions")
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => setSessionHistory(data.sessions || []))
      .catch(() => undefined);

    const mobileQuery = window.matchMedia("(max-width: 760px)");
    const syncSidebar = () => setSidebarCollapsed(mobileQuery.matches);
    syncSidebar();
    mobileQuery.addEventListener("change", syncSidebar);
    return () => mobileQuery.removeEventListener("change", syncSidebar);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const handleScreeningComplete = useCallback((result: ScreeningResult) => {
    setScreeningResult(result);
    setSessionHistory(previous => [result.session, ...previous.filter(item => item.id !== result.session.id)].slice(0, 20));
    setActiveView("leaderboard");
  }, []);

  const loadSession = useCallback(async (sessionId: number) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) return;
      const data = await response.json();
      setScreeningResult({
        session: data.session,
        candidates: data.candidates,
        requirements: data.session.extractedRequirements || { minYearsExperience: 3, educationLevel: "Bachelors", requiredSkills: [] },
      });
      const savedWeights = data.session.weights as Weights | null;
      if (savedWeights) setWeights(savedWeights);
      setActiveView("leaderboard");
    } catch (error) {
      console.error("Failed to load session", error);
    }
  }, []);

  const recomputedCandidates = screeningResult
    ? screeningResult.candidates
        .map(candidate => {
          const total = weights.skill + weights.semantic + weights.experience + weights.education;
          const compositeScore = total > 0
            ? ((candidate.skillScore || 0) * weights.skill +
                (candidate.semanticScore || 0) * weights.semantic +
                (candidate.experienceScore || 0) * weights.experience +
                (candidate.educationScore || 0) * weights.education) / total
            : candidate.compositeScore || 0;
          const status = compositeScore >= .75 ? "top_match" : compositeScore >= .6 ? "potential_fit" : "low_match";
          return { ...candidate, compositeScore, status };
        })
        .sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0))
        .map((candidate, index) => ({ ...candidate, rank: index + 1 }))
    : [];

  const filteredCandidates = recomputedCandidates.filter(candidate => visibleStatuses[candidate.status || "pending"]);

  const renderView = () => {
    switch (activeView) {
      case "ingestion":
        return <IngestionModule weights={weights} onScreeningComplete={handleScreeningComplete} />;
      case "leaderboard":
        return <LeaderboardModule candidates={filteredCandidates} allCandidates={recomputedCandidates} session={screeningResult?.session || null} requirements={screeningResult?.requirements || null} onNavigate={setActiveView} />;
      case "comparison":
        return <ComparisonModule candidates={recomputedCandidates} />;
      case "analytics":
        return <AnalyticsModule candidates={recomputedCandidates} requirements={screeningResult?.requirements || null} />;
      case "export":
        return <ExportModule candidates={recomputedCandidates} session={screeningResult?.session || null} requirements={screeningResult?.requirements || null} />;
      case "scoring":
        return <ScoringEngineModule />;
    }
  };

  const initials = user.name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        activeView={activeView}
        onNavigate={setActiveView}
        weights={weights}
        onWeightsChange={setWeights}
        visibleStatuses={visibleStatuses}
        onVisibleStatusesChange={setVisibleStatuses}
        sessionHistory={sessionHistory}
        onLoadSession={loadSession}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(value => !value)}
        candidateCount={recomputedCandidates.length}
      />

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-path">
            <Command size={15} color="#70747d" />
            <span className="topbar-path-muted">TalentOS</span>
            <ChevronRight size={13} className="topbar-divider" />
            <span className="topbar-path-current">{VIEW_LABELS[activeView]}</span>
          </div>
          <div className="topbar-actions">
            {screeningResult && (
              <div className="live-pill">
                <span className="live-dot" />
                {recomputedCandidates.length} profiles active
              </div>
            )}
            <div className="user-compact">
              <div className="avatar h-8 w-8 text-[10px]">{initials}</div>
              <span>{user.name}</span>
            </div>
          </div>
        </header>

        <main className="app-content">
          <div className="app-content-inner fade-up" key={activeView}>{renderView()}</div>
        </main>
      </div>
    </div>
  );
}
