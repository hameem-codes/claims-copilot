"use client";

import type { ToolCall } from "@/types";

interface ToolExecutionCardProps {
  toolCalls: ToolCall[];
}

const toolIcons: Record<string, string> = {
  retrieve_claim: "▦",
  retrieve_policy: "▤",
  check_coverage: "◈",
  check_missing_docs: "◉",
  retrieve_timeline: "◎",
  retrieve_customer: "▧",
  search_docs: "▲",
};

const toolLabels: Record<string, string> = {
  retrieve_claim: "CHECKING CLAIM",
  retrieve_policy: "CHECKING POLICY",
  check_coverage: "VERIFYING COVERAGE",
  check_missing_docs: "CHECKING DOCUMENTS",
  retrieve_timeline: "LOADING TIMELINE",
  retrieve_customer: "LOADING PROFILE",
  search_docs: "SEARCHING DOCUMENTATION",
};

export function ToolExecutionCard({ toolCalls }: ToolExecutionCardProps) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="my-1.5 border-2 border-border rounded-[var(--radius-sm)] bg-muted/50 overflow-hidden">
      {toolCalls.map((tc, i) => (
        <div
          key={tc.id}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono ${
            i > 0 ? "border-t-2 border-border" : ""
          }`}
        >
          <span className="text-sm">
            {toolIcons[tc.tool] || "●"}
          </span>
          <span className="text-muted-foreground uppercase tracking-wider text-[0.65rem]">
            {toolLabels[tc.tool] || tc.tool}
          </span>
          <span className="ml-auto">
            {tc.status === "success" && (
              <span className="text-success font-bold">✓</span>
            )}
            {tc.status === "error" && (
              <span className="text-error font-bold">✗</span>
            )}
            {tc.status === "running" && (
              <span className="text-accent tool-loading">◌</span>
            )}
            {tc.status === "pending" && (
              <span className="text-muted-foreground">○</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
