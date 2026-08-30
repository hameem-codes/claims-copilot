"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";

interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  documentType?: "claim" | "policy";
}

export function DashboardView() {
  const { currentCustomer, insights, setView, sendMessage, conversations } = useApp();
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);

  useEffect(() => {
    async function loadDocs() {
      try {
        const res = await fetch("/api/documents");
        if (res.ok) {
          const data = await res.json();
          setDocuments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load documents for dashboard:", err);
      }
    }
    loadDocs();
  }, []);

  const recentDocs = documents.slice(0, 4);
  const recentConvs = conversations.slice(0, 3);

  const quickAsk = (prompt: string) => {
    setView("copilot");
    setTimeout(() => sendMessage(prompt), 100);
  };

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg)] relative">
      <div className="geo-dot-grid absolute inset-0 opacity-20 pointer-events-none" />
      <div className="relative z-10 px-6 py-6 max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading font-800 text-2xl tracking-tight">
              Welcome back{currentCustomer?.name ? `, ${currentCustomer.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <span className="pill pill-accent shrink-0">Dashboard</span>
        </div>

        {/* ─── Quick Actions — horizontal bar ─── */}
        <div className="card p-4 bg-card">
          <p className="text-overline mb-3">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Ask AI",         icon: "◆", action: () => setView("copilot") },
              { label: "Analyze Claim",   icon: "▦", action: () => quickAsk("Analyze my uploaded claim documents and identify any issues or missing information") },
              { label: "Analyze Policy",  icon: "▤", action: () => quickAsk("Explain my uploaded insurance policy and key coverages") },
              { label: "Run Analysis",    icon: "⊞", action: () => setView("analysis") },
              { label: "Upload Document", icon: "▧", action: () => setView("documents") },
              { label: "View Timeline",   icon: "◎", action: () => setView("timeline") },
            ].map(qa => (
              <button key={qa.label} onClick={qa.action} className="card card-hover flex items-center gap-2 px-3 py-2.5 text-left shrink-0">
                <span className="text-sm shrink-0">{qa.icon}</span>
                <span className="text-xs font-medium leading-tight whitespace-nowrap">{qa.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Main Overview Card / Getting Started ─── */}
        {documents.length === 0 ? (
          <div className="card p-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 bg-accent rounded-[14px] border-2 border-[#6D28D9] shadow-[4px_4px_0_#6D28D9] flex items-center justify-center text-white text-2xl">◆</div>
            <h2 className="font-heading font-700 text-xl">{"Get started with Claims Copilot"}</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Upload your insurance policy and claim documents to unlock grounded AI analysis, coverage assessments, and guided claim support.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              <button onClick={() => setView("documents")} className="btn btn-primary">Upload Document</button>
              <button onClick={() => setView("analysis")} className="btn">Run Analysis</button>
              <button onClick={() => setView("copilot")} className="btn">Start AI Copilot</button>
            </div>
          </div>
        ) : (
          <div className="card p-5 bg-card space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-overline mb-1">Uploaded Documents Overview</p>
                <h2 className="font-heading font-700 text-lg leading-tight">
                  {documents.length} {documents.length === 1 ? "Document" : "Documents"} on File
                </h2>
              </div>
              <button onClick={() => setView("documents")} className="btn btn-sm">
                Manage Documents →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {documents.map(doc => (
                <div key={doc.id} className="p-3 bg-muted/40 rounded-[var(--radius-sm)] border border-border flex items-center gap-2.5">
                  <span className="text-xl">📄</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{doc.name}</p>
                    <p className="text-[0.65rem] text-muted-foreground font-mono">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`pill ${doc.documentType === "policy" ? "pill-accent" : "pill-muted"} !text-[0.55rem] capitalize shrink-0`}>
                    {doc.documentType || "Claim"}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={() => setView("analysis")} className="btn btn-sm btn-primary">Run Grounded Analysis</button>
              <button onClick={() => setView("copilot")} className="btn btn-sm">Ask Copilot</button>
              <button onClick={() => setView("documents")} className="btn btn-sm">Upload New Document</button>
            </div>
          </div>
        )}

        {/* ─── AI Insights ─── */}
        {insights.length > 0 && (
          <div className="card p-5 bg-card">
            <p className="text-overline mb-3">AI Insights</p>
            <div className="space-y-2">
              {insights.slice(0, 4).map(insight => (
                <div key={insight.id} className={`flex items-start gap-3 p-3 rounded-[var(--radius-sm)] border-2 ${
                  insight.type === "warning" ? "border-warning/50 bg-warning/5" :
                  insight.type === "success" ? "border-quaternary/50 bg-quaternary/5" :
                  insight.type === "action"  ? "border-accent/50 bg-accent/5" :
                  "border-border bg-muted/30"
                }`}>
                  <span className="text-sm mt-0.5">
                    {insight.type === "warning" ? "⚠" : insight.type === "success" ? "✓" : insight.type === "action" ? "◆" : "ℹ"}
                  </span>
                  <div>
                    <p className="text-xs font-semibold">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Recent Activity ─── */}
        <div className="card p-5 bg-card">
          <p className="text-overline mb-3">Recent Activity</p>
          {recentDocs.length === 0 && recentConvs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            <div className="space-y-2">
              {recentDocs.map((d) => (
                <div key={d.id} className="flex items-center gap-2 text-xs p-2 bg-muted/40 rounded-[var(--radius-sm)]">
                  <span className="text-base">▧</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{d.name}</p>
                    <p className="text-muted-foreground">{new Date(d.uploadDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`pill shrink-0 !text-[0.5rem] ${d.documentType === "policy" ? "pill-accent" : "pill-muted"} capitalize`}>
                    {d.documentType || "Claim"}
                  </span>
                </div>
              ))}
              {recentConvs.map(conv => (
                <div key={conv.id} className="flex items-center gap-2 text-xs p-2 bg-muted/40 rounded-[var(--radius-sm)]">
                  <span className="text-base">◆</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{conv.title}</p>
                    <p className="text-muted-foreground">{conv.messages.length} messages</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
