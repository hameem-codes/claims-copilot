"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import type { SavedAnalysis, AnalysisType } from "@/types";

interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  documentType?: "claim" | "policy";
}

const typeLabel: Record<AnalysisType, string> = {
  "coverage-assessment": "Coverage Assessment",
  "claim-analysis": "Claim Analysis",
  "policy-analysis": "Policy Analysis",
  "discrepancy-report": "Discrepancy Report",
  "ai-summary": "AI Summary",
  "custom": "Custom Analysis",
};

const typePill: Record<AnalysisType, string> = {
  "coverage-assessment": "pill-accent",
  "claim-analysis": "pill-accent",
  "policy-analysis": "pill-muted",
  "discrepancy-report": "pill-warning",
  "ai-summary": "pill-muted",
  "custom": "pill-accent",
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

function AnalysisHistoryCard({
  analysis,
  onDelete,
  onContinue,
  onExport,
}: {
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
          {typeLabel[analysis.type] || "Analysis"}
        </span>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>

      <div>
        <p className="text-overline mb-1">Confidence</p>
        <ConfidenceBar value={analysis.confidence} />
      </div>

      {analysis.documents.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {analysis.documents.filter(Boolean).map((doc) => (
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
        <button onClick={() => setExpanded((v) => !v)} className="btn btn-sm">
          {expanded ? "Collapse" : "Open"}
        </button>
        <button onClick={onContinue} className="btn btn-sm btn-primary">Continue</button>
        <button onClick={onExport} className="btn btn-sm">Export</button>
        <button onClick={onDelete} className="btn btn-sm !border-error/40 !text-error hover:!bg-error/10 ml-auto">Delete</button>
      </div>
    </div>
  );
}

export function AnalysisView() {
  const { sendMessage, setView, saveAnalysis, savedAnalyses, deleteAnalysis } = useApp();
  const [analysisPrompt, setAnalysisPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    async function loadDocs() {
      try {
        const res = await fetch("/api/documents");
        if (res.ok) {
          const data = await res.json();
          setDocuments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load documents for analysis:", err);
      } finally {
        setLoadingDocs(false);
      }
    }
    loadDocs();
  }, []);

  const runAnalysis = async (prompt: string, analysisName: string, type: AnalysisType = "custom") => {
    if (!prompt.trim()) return;
    setRunning(true);
    try {
      saveAnalysis({
        name: analysisName,
        type,
        documents: documents.map((d) => d.name),
        summary: prompt.slice(0, 140) + (prompt.length > 140 ? "..." : ""),
        confidence: 85,
        content: prompt,
      });
      setView("copilot");
      setTimeout(() => sendMessage(prompt), 100);
    } finally {
      setRunning(false);
    }
  };

  const handleExport = (analysis: SavedAnalysis) => {
    const text = `# ${analysis.name}\n\nType: ${typeLabel[analysis.type] || analysis.type}\nDate: ${new Date(analysis.createdAt).toLocaleDateString()}\nConfidence: ${analysis.confidence}%\nDocuments: ${analysis.documents.filter(Boolean).join(", ")}\n\n## Summary\n${analysis.summary}\n\n## Full Analysis\n${analysis.content}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${analysis.name.replace(/[^a-z0-9]/gi, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleContinue = (analysis: SavedAnalysis) => {
    setView("copilot");
    setTimeout(() => sendMessage(`Continue this analysis: ${analysis.name}. Context: ${analysis.content}`), 100);
  };

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg)] relative">
      <div className="geo-dot-grid absolute inset-0 opacity-20 pointer-events-none" />
      <div className="relative z-10 px-6 py-6 max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading font-800 text-2xl tracking-tight">Analysis</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Grounded AI analysis across your uploaded documents and claims context
            </p>
          </div>
          <span className="pill pill-accent shrink-0">⊞ Analysis</span>
        </div>

        {/* Document Context Overview */}
        <div className="card p-5 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-overline">Available Application Documents</p>
            <button onClick={() => setView("documents")} className="btn btn-sm">
              Manage Documents →
            </button>
          </div>
          {loadingDocs ? (
            <p className="text-xs text-muted-foreground">Checking uploaded documents...</p>
          ) : documents.length === 0 ? (
            <div className="p-4 rounded-[var(--radius-sm)] bg-muted/40 border border-border text-center space-y-2">
              <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
              <p className="text-xs text-muted-foreground">
                Upload a Claim or Policy document to run grounded coverage and gap analysis.
              </p>
              <button onClick={() => setView("documents")} className="btn btn-sm btn-primary mt-1">
                Upload Document
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/50 rounded-[var(--radius-sm)] border border-border text-xs">
                  <span>📄</span>
                  <span className="font-medium truncate max-w-[180px]">{doc.name}</span>
                  <span className={`pill ${doc.documentType === "policy" ? "pill-accent" : "pill-muted"} !text-[0.55rem] !py-0 !px-1 capitalize`}>
                    {doc.documentType || "Claim"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unified Analysis Input */}
        <div className="card p-6 bg-card space-y-5">
          <h2 className="font-heading font-700 text-lg">Run Grounded Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Perform deep document analysis, verify coverage limits, check exclusions, and detect potential claim discrepancies based strictly on your uploaded files.
          </p>

          <div>
            <label className="text-overline mb-1.5 block">Analysis Query</label>
            <textarea
              rows={3}
              placeholder="e.g. Assess my claim against policy coverage, limits, deductibles, and applicable exclusions..."
              value={analysisPrompt}
              onChange={(e) => setAnalysisPrompt(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* Quick Analysis Triggers */}
          <div className="space-y-2">
            <p className="text-overline">Quick Analysis Tasks</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  label: "Coverage & Deductible Assessment",
                  desc: "Analyze claim against policy limits, deductible impact, and eligibility.",
                  type: "coverage-assessment" as AnalysisType,
                  prompt: "Perform a comprehensive coverage assessment: compare the submitted claim against the active policy, evaluate deductible impact, check limits, and identify eligibility.",
                },
                {
                  label: "Exclusions & Limitations Check",
                  desc: "Identify any policy exclusions or conditions that apply to current claims.",
                  type: "policy-analysis" as AnalysisType,
                  prompt: "Analyze the uploaded policy documents for any specific exclusions, limitations, or reporting deadlines that may affect claim reimbursement.",
                },
                {
                  label: "Missing Documentation Audit",
                  desc: "Determine any required supporting files missing from the claim.",
                  type: "claim-analysis" as AnalysisType,
                  prompt: "Audit the uploaded claim documents and list any missing evidence, invoices, or required documentation needed to complete the review.",
                },
                {
                  label: "Estimate & Discrepancy Report",
                  desc: "Flag amount discrepancies, inconsistent dates, or conflicting descriptions.",
                  type: "discrepancy-report" as AnalysisType,
                  prompt: "Check for discrepancies, conflicting descriptions, or amount inconsistencies across all uploaded claim and estimate documents.",
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => runAnalysis(item.prompt, item.label, item.type)}
                  disabled={running}
                  className="card card-hover p-3 text-left flex flex-col justify-between group"
                >
                  <div>
                    <p className="text-xs font-bold text-foreground group-hover:text-accent transition-colors">{item.label}</p>
                    <p className="text-[0.7rem] text-muted-foreground mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                  <span className="text-[0.65rem] font-semibold text-accent mt-2 flex items-center gap-1">
                    Run Analysis →
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={running || !analysisPrompt.trim()}
            onClick={() => runAnalysis(analysisPrompt, "Custom Analysis", "custom")}
            className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {running ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                Analyzing Documents...
              </>
            ) : (
              "⊞ Run Analysis"
            )}
          </button>
        </div>

        {/* Saved Analysis Sessions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-700 text-lg">Analysis History</h2>
            <span className="text-xs font-mono text-muted-foreground">
              {savedAnalyses.length} saved
            </span>
          </div>

          {savedAnalyses.length === 0 ? (
            <div className="card p-8 text-center bg-card">
              <div className="text-3xl mb-2">◉</div>
              <p className="font-heading font-700 text-sm mb-1">No analysis history yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Completed analyses will be saved here for review, export, and continuation.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {savedAnalyses.map((analysis) => (
                <AnalysisHistoryCard
                  key={analysis.id}
                  analysis={analysis}
                  onDelete={() => deleteAnalysis(analysis.id)}
                  onContinue={() => handleContinue(analysis)}
                  onExport={() => handleExport(analysis)}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
