"use client";

interface ScoreBarProps {
  value: number;
  label?: string;
  showPercent?: boolean;
  height?: number;
  color?: string;
}

export function ScoreBar({ value, label, showPercent = true, height = 5, color }: ScoreBarProps) {
  const percent = Math.max(0, Math.min(100, Math.round(value * 100)));
  const fill = color || (percent >= 75 ? "#16865c" : percent >= 60 ? "#d28418" : "#d55260");

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="mb-1 flex items-center justify-between gap-2 text-[10px]">
          {label && <span className="font-medium text-[#70747d]">{label}</span>}
          {showPercent && <span className="font-semibold tabular-nums text-[#30333a]">{percent}%</span>}
        </div>
      )}
      <div className="score-track" style={{ height }} aria-label={`${label || "Score"}: ${percent}%`}>
        <div className="score-fill" style={{ width: `${percent}%`, background: fill }} />
      </div>
    </div>
  );
}
