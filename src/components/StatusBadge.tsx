"use client";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config: Record<string, { label: string; className: string }> = {
    top_match: { label: "Top match", className: "status-top" },
    potential_fit: { label: "Potential fit", className: "status-potential" },
    low_match: { label: "Low match", className: "status-low" },
  };
  const item = config[status] || { label: "Pending", className: "status-pending" };

  return (
    <span className={`status-badge ${item.className}`} style={size === "sm" ? { padding: "4px 7px", fontSize: 9 } : undefined}>
      <span className="status-dot" />
      {item.label}
    </span>
  );
}
