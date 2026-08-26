"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { SavedAnalysis, AnalysisType } from "@/types";

const typeLabel: Record<AnalysisType, string> = {
  "policy-analysis":     "Policy Analysis",
  "claim-analysis":      "Claim Analysis",
  "coverage-assessment": "Coverage Assessment",
  "policy-vs-claim":     "Policy vs Claim",
  "document-comparison": "Document Comparison",
  "discrepancy-report":  "Discrepancy Report",
  "ai-summary":          "AI Summary",
};

const typePill: Record<AnalysisType, string> = {
  "policy-analysis":     "pill-accent",
  "claim-analysis":      "pill-accent",
  "coverage-assessment": "",
  "policy-vs-claim":     "pill-accent",
  "document-comparison": "pill-muted",
  "discrepancy-report":  "",
  "ai-summary":          "pill-muted",
};

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground shrink-0">{value}%</span>
    </div>
  );
}

function AnalysisCard({ analysis, onDelete, onContinue, onExport }: {
  analysis: SavedAnalysis;
  onDelete: () => void;
  onContinue: () => void;
  onExport: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card p-5 bg-card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading font-700 text-base leading-tight truncate">{analysis.name}</h3>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {new Date(analysis.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <span className={`pill ${typePill[analysis.type] || "pill-muted"} shrink-0 !text-[0.55rem]`}>
          {typeLabel[analysis.type]}
        </span>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>

      <div>
        <p className="text-overline mb-1">Confidence</p>
        <ConfidenceBar value={analysis.confidence} />
      </div>

      {analysis.documents.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {analysis.documents.filter(Boolean).map(doc => (
            <span key={doc} className="pill pill-muted !text-[0.55rem]">{doc}</span>
          ))}
        </div>
      )}

      {expanded && analysis.content && (
        <div className="p-3 bg-muted/40 rounded-[var(--radius-sm)] border-2 border-border">
          <p className="text-xs font-mono whitespace-pre-wrap leading-relaxed">{analysis.content}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button onClick={() => setExpanded(v => !v)} className="btn btn-sm">
          {expanded ? "Collapse" : "Open"}
        </button>
        <button onClick={onContinue} className="btn btn-sm btn-primary">Continue</button>
        <button onClick={onExport} className="btn btn-sm">Export</button>
        <button onClick={onDelete} className="btn btn-sm !border-error/40 !text-error hover:!bg-error/10 ml-auto">Delete</button>
      </div>
    </div>
  );
}

export function SavedAnalysesView() {
  const { savedAnalyses, deleteAnalysis, setView, sendMessage } = useApp();
  const [filterType, setFilterType] = useState<AnalysisType | "all">("all");

  const filtered = filterType === "all"
    ? savedAnalyses
    : savedAnalyses.filter(a => a.type === filterType);

  const handleContinue = (analysis: SavedAnalysis) => {
    setView("copilot");
    setTimeout(() => sendMessage(`Continue this analysis: ${analysis.name}. Here is what was done: ${analysis.summary}`), 100);
  };

  const handleExport = (analysis: SavedAnalysis) => {
    const text = `# ${analysis.name}\n\nType: ${typeLabel[analysis.type]}\nDate: ${new Date(analysis.createdAt).toLocaleDateString()}\nConfidence: ${analysis.confidence}%\nDocuments: ${analysis.documents.filter(Boolean).join(", ")}\n\n## Summary\n${analysis.summary}\n\n## Full Analysis\n${analysis.content}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${analysis.name.replace(/[^a-z0-9]/gi, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg)] relative">
      <div className="geo-dot-grid absolute inset-0 opacity-20 pointer-events-none" />
      <div className="relative z-10 px-6 py-6 max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading font-800 text-2xl tracking-tight">Saved Analyses</h1>
            <p className="text-muted-foreground text-sm mt-1">Your saved AI analyses, comparisons, and reports</p>
          </div>
          <span className="pill pill-accent shrink-0">◉ {savedAnalyses.length} saved</span>
        </div>

        {savedAnalyses.length === 0 ? (
          /* Empty state */
          <div className="card p-10 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 bg-muted rounded-[14px] border-2 border-foreground shadow-[4px_4px_0_var(--foreground)] flex items-center justify-center text-2xl">◉</div>
            <h2 className="font-heading font-700 text-lg">No analyses saved yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Run a comparison or analysis in <strong>Compare & Analyze</strong>, and it will automatically be saved here for future reference.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setView("compare")} className="btn btn-primary">Go to Compare & Analyze</button>
              <button onClick={() => setView("copilot")} className="btn">Ask AI</button>
            </div>
          </div>
        ) : (
          <>
            {/* Filter bar */}
            <div className="flex flex-wrap gap-2">
              {(["all", ...Object.keys(typeLabel)] as (AnalysisType | "all")[]).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] border-2 transition-colors ${
                    filterType === type
                      ? "bg-accent text-white border-[#6D28D9]"
                      : "bg-card border-foreground hover:bg-muted"
                  }`}
                >
                  {type === "all" ? "All" : typeLabel[type as AnalysisType]}
                </button>
              ))}
            </div>

            {/* Analyses grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map(analysis => (
                <AnalysisCard
                  key={analysis.id}
                  analysis={analysis}
                  onDelete={() => deleteAnalysis(analysis.id)}
                  onContinue={() => handleContinue(analysis)}
                  onExport={() => handleExport(analysis)}
                />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="card p-6 text-center">
                <p className="text-muted-foreground text-sm">No analyses of this type yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
