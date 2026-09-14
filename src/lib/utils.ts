import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatScore(score: number) {
  return Math.round(score * 100);
}

export function getStatusColor(status: string) {
  switch (status) {
    case "top_match":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
    case "potential_fit":
      return "text-amber-400 bg-amber-400/10 border-amber-400/30";
    case "low_match":
      return "text-red-400 bg-red-400/10 border-red-400/30";
    default:
      return "text-slate-400 bg-slate-400/10 border-slate-400/30";
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "top_match":
      return "Top Match";
    case "potential_fit":
      return "Potential Fit";
    case "low_match":
      return "Low Match";
    default:
      return "Pending";
  }
}

export function scoreToStatus(score: number): string {
  if (score >= 0.75) return "top_match";
  if (score >= 0.6) return "potential_fit";
  return "low_match";
}

export function getRankBadgeColor(rank: number) {
  if (rank === 1) return "from-yellow-400 to-amber-500";
  if (rank === 2) return "from-slate-300 to-slate-400";
  if (rank === 3) return "from-amber-600 to-amber-700";
  return "from-indigo-500 to-purple-600";
}
