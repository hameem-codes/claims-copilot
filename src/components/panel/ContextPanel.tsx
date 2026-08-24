"use client";

import { useApp } from "@/context/AppContext";
import { claims, policies } from "@/data/mock-data";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function ContextPanel() {
  const {
    currentCustomer, activeClaimId, getMemoriesForCustomer, insights,
    panelOpen, setPanelOpen, setView,
  } = useApp();

  if (!currentCustomer) return null;

  const activeClaim = activeClaimId ? claims.find((c) => c.id === activeClaimId) : null;
  const activePolicy = activeClaim ? policies.find((p) => p.id === activeClaim.policyId) : null;
  const memories = getMemoriesForCustomer(currentCustomer.id);

  if (!panelOpen) {
    return (
      <button
        onClick={() => setPanelOpen(true)}
        className="absolute right-0 top-1/2 -translate-y-1/2 btn btn-sm !rounded-r-none !rounded-l-[var(--radius-md)] !border-r-0 z-20"
      >
        ◁
      </button>
    );
  }

  return (
    <aside className="w-[280px] shrink-0 h-full border-l-2 border-foreground bg-card overflow-y-auto">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b-2 border-foreground flex items-center justify-between">
        <h3 className="font-heading font-700 text-sm">Customer Context</h3>
        <button
          onClick={() => setPanelOpen(false)}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground text-xs"
        >
          ▷
        </button>
      </div>

      {/* Customer Profile */}
      <div className="p-4 border-b-2 border-border relative">
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-secondary/15 rounded-full pointer-events-none" />
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-full border-2 border-foreground flex items-center justify-center text-sm font-bold text-white shadow-[2px_2px_0_var(--foreground)]"
            style={{ background: currentCustomer.avatarColor }}
          >
            {currentCustomer.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <p className="font-heading font-700 text-sm">{currentCustomer.name}</p>
            <p className="text-[0.6rem] font-mono text-muted-foreground uppercase">
              {currentCustomer.id}
            </p>
          </div>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contact</span>
            <span className="font-medium capitalize">{currentCustomer.preferredContact}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Since</span>
            <span className="font-medium">{currentCustomer.customerSince}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium truncate ml-2">{currentCustomer.email}</span>
          </div>
        </div>
      </div>

      {/* Active Claim */}
      {activeClaim && (
        <div className="p-4 border-b-2 border-border relative">
          <div className="absolute -top-3 -left-3 w-12 h-12 bg-accent/10 rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <p className="text-overline">Active Claim</p>
            <StatusBadge status={activeClaim.status} size="sm" />
          </div>
          <p className="font-heading font-800 text-lg tracking-tight mb-1">
            {activeClaim.id}
          </p>
          <p className="text-sm font-medium mb-2">{activeClaim.type}</p>
          <div className="space-y-1 text-xs mb-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-mono font-semibold">
                ${activeClaim.amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adjuster</span>
              <span className="font-medium">{activeClaim.adjuster}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submitted</span>
              <span className="font-medium">{activeClaim.submittedDate}</span>
            </div>
          </div>
          {activeClaim.missingDocuments.length > 0 && (
            <div className="bg-warning/15 border-2 border-warning/40 rounded-[var(--radius-sm)] px-3 py-2 mb-2">
              <p className="text-[0.6rem] font-mono font-600 uppercase tracking-wider text-warning mb-1">
                ⚠ Missing Documents
              </p>
              <ul className="text-xs space-y-0.5">
                {activeClaim.missingDocuments.map((doc) => (
                  <li key={doc}>• {doc}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => setView("claims")}
            className="btn btn-sm w-full mt-1"
          >
            View claim details →
          </button>
        </div>
      )}

      {/* Policy */}
      {activePolicy && (
        <div className="p-4 border-b-2 border-border">
          <p className="text-overline mb-2">Active Policy</p>
          <div className="card !shadow-[3px_3px_0_var(--foreground)] !border-[1.5px] px-3 py-2.5">
            <p className="font-heading font-700 text-sm mb-0.5">{activePolicy.id}</p>
            <p className="text-xs text-muted-foreground mb-1.5">{activePolicy.typeName}</p>
            <div className="flex items-center gap-2">
              <span className="pill pill-success !text-[0.5rem]">Active</span>
              <span className="text-[0.6rem] font-mono text-muted-foreground">
                Renews {activePolicy.renewalDate}
              </span>
            </div>
          </div>
          <button
            onClick={() => setView("policies")}
            className="btn btn-sm w-full mt-2"
          >
            View policy details →
          </button>
        </div>
      )}

      {/* Memory */}
      <div className="p-4 border-b-2 border-border">
        <p className="text-overline mb-2.5">What I Remember</p>
        <div className="space-y-1.5">
          {memories.slice(0, 6).map((mem) => (
            <div
              key={mem.id}
              className="flex items-start gap-2 text-xs"
            >
              <span className="text-success mt-0.5 shrink-0">✓</span>
              <span className="leading-relaxed">
                <span className="font-medium">{mem.key.replace(/_/g, " ")}:</span>{" "}
                <span className="text-muted-foreground">{mem.value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="p-4">
        <p className="text-overline mb-2.5">AI Insights</p>
        <div className="space-y-2">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`px-3 py-2.5 rounded-[var(--radius-sm)] border-2 text-xs ${
                insight.type === "warning"
                  ? "border-warning/40 bg-warning/10"
                  : insight.type === "success"
                  ? "border-quaternary/40 bg-quaternary/10"
                  : insight.type === "action"
                  ? "border-secondary/40 bg-secondary/10"
                  : "border-accent/30 bg-accent/10"
              }`}
            >
              <p className="font-semibold mb-0.5">{insight.title}</p>
              <p className="text-muted-foreground leading-relaxed">
                {insight.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
