"use client";

import type { ClaimStatus } from "@/types";

const statusConfig: Record<ClaimStatus, { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "pill-muted" },
  under_review: { label: "Under Review", className: "pill-accent" },
  adjuster_assigned: { label: "Adjuster Assigned", className: "pill-accent" },
  documents_requested: { label: "Docs Needed", className: "pill-warning" },
  approved: { label: "Approved", className: "pill-success" },
  denied: { label: "Denied", className: "pill-error" },
  closed: { label: "Closed", className: "pill-muted" },
  appealed: { label: "Appealed", className: "pill-warning" },
};

interface StatusBadgeProps {
  status: ClaimStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`pill ${config.className} ${size === "sm" ? "!text-[0.55rem] !py-0 !px-1.5" : ""}`}>
      {config.label}
    </span>
  );
}
