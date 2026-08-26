"use client";

import { useApp } from "@/context/AppContext";
import { claims, policies } from "@/data/mock-data";

const statusLabel: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  adjuster_assigned: "Adjuster Assigned",
  documents_requested: "Docs Requested",
  approved: "Approved",
  denied: "Denied",
  closed: "Closed",
  appealed: "Appealed",
};

const statusColor: Record<string, string> = {
  submitted: "pill-muted",
  under_review: "pill-accent",
  adjuster_assigned: "pill-accent",
  documents_requested: "",
  approved: "",
  denied: "",
  closed: "pill-muted",
  appealed: "",
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function DashboardView() {
  const { currentCustomer, insights, activeClaimId, setView, sendMessage, conversations, setActiveClaimId } = useApp();

  const customerClaims = claims.filter(c => c.customerId === currentCustomer?.id);
  const customerPolicies = policies.filter(p => p.customerId === currentCustomer?.id);
  const activeClaim = customerClaims.find(c => c.id === activeClaimId) || customerClaims.find(c => c.status !== "closed" && c.status !== "denied");
  const activePolicy = activeClaim ? customerPolicies.find(p => p.id === activeClaim.policyId) : customerPolicies[0];

  const recentDocs = customerClaims.flatMap(c =>
    c.documents
      .filter(d => d.status === "received" && d.date)
      .map(d => ({ ...d, claimId: c.id }))
  ).slice(0, 4);

  const recentConvs = conversations
    .filter(c => c.customerId === currentCustomer?.id)
    .slice(0, 3);

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
              Welcome back{currentCustomer ? `, ${currentCustomer.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <span className="pill pill-accent shrink-0">Dashboard</span>
        </div>

        {/* ─── Quick Actions — horizontal bar (always visible) ─── */}
        <div className="card p-4 bg-card">
          <p className="text-overline mb-3">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Ask AI",                icon: "◆", action: () => setView("copilot") },
              { label: "Analyze Claim",          icon: "▦", action: () => quickAsk("Analyze my active claim and identify any issues or missing information") },
              { label: "Analyze Policy",         icon: "▤", action: () => quickAsk("Explain my active insurance policy and key coverages") },
              { label: "Compare Policy & Claim", icon: "⊞", action: () => setView("compare") },
              { label: "Upload Document",        icon: "▧", action: () => setView("documents") },
              { label: "View Timeline",          icon: "◎", action: () => setView("timeline") },
            ].map(qa => (
              <button key={qa.label} onClick={qa.action} className="card card-hover flex items-center gap-2 px-3 py-2.5 text-left shrink-0">
                <span className="text-sm shrink-0">{qa.icon}</span>
                <span className="text-xs font-medium leading-tight whitespace-nowrap">{qa.label}</span>
              </button>
            ))}
          </div>
        </div>

        {customerClaims.length === 0 && customerPolicies.length === 0 ? (
          /* ─── New user empty state ─── */
          <div className="card p-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 bg-accent rounded-[14px] border-2 border-[#6D28D9] shadow-[4px_4px_0_#6D28D9] flex items-center justify-center text-white text-2xl">◆</div>
            <h2 className="font-heading font-700 text-xl">{"Get started with Claims Copilot"}</h2>
            <p className="text-sm text-muted-foreground max-w-sm">Upload your insurance policy and claim documents to unlock AI analysis, coverage assessments, and guided claim support.</p>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              <button onClick={() => setView("documents")} className="btn btn-primary">Upload Policy</button>
              <button onClick={() => setView("documents")} className="btn">Upload Claim</button>
              <button onClick={() => setView("compare")} className="btn">Compare Documents</button>
              <button onClick={() => { setView("copilot"); }} className="btn">Start AI Analysis</button>
            </div>
          </div>
        ) : (
          <>
            {/* ─── Active Claim Card ─── */}
            {activeClaim && (
              <div className="card p-5 bg-card">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-overline mb-1">Active Claim</p>
                    <h2 className="font-heading font-700 text-lg leading-tight">{activeClaim.id} — {activeClaim.type}</h2>
                  </div>
                  <span className={`pill ${statusColor[activeClaim.status] || "pill-muted"} shrink-0`}>
                    {statusLabel[activeClaim.status] || activeClaim.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{activeClaim.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Claim Amount", value: fmt(activeClaim.amount) },
                    { label: "Incident Date", value: activeClaim.incidentDate },
                    { label: "Submitted", value: activeClaim.submittedDate },
                    { label: "Adjuster", value: activeClaim.adjuster },
                  ].map(r => (
                    <div key={r.label} className="bg-muted/60 rounded-[var(--radius-sm)] px-3 py-2">
                      <p className="text-overline">{r.label}</p>
                      <p className="text-sm font-semibold mt-0.5">{r.value}</p>
                    </div>
                  ))}
                </div>
                {/* Claim progress */}
                <div className="mb-4">
                  <p className="text-overline mb-2">Claim Progress</p>
                  <div className="flex gap-1">
                    {activeClaim.timeline.map((evt) => (
                      <div key={evt.id} className="flex-1 text-center">
                        <div className={`h-2 rounded-full mb-1 ${evt.status === "completed" ? "bg-accent" : evt.status === "current" ? "bg-tertiary" : "bg-border"}`} />
                        <p className="text-[0.55rem] font-mono text-muted-foreground truncate">{evt.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Missing docs */}
                {activeClaim.missingDocuments.length > 0 && (
                  <div className="p-3 rounded-[var(--radius-sm)] border-2 border-error/40 bg-error/5 text-sm mb-4">
                    <span className="font-semibold text-error">Missing documents: </span>
                    <span className="text-muted-foreground">{activeClaim.missingDocuments.join(", ")}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => quickAsk(`Analyze my claim ${activeClaim.id}`)} className="btn btn-sm btn-primary">Analyze Claim</button>
                  <button onClick={() => quickAsk(`What is the status of claim ${activeClaim.id}?`)} className="btn btn-sm">Ask AI</button>
                  <button onClick={() => { setActiveClaimId(activeClaim.id); setView("compare"); }} className="btn btn-sm">Compare With Policy</button>
                  <button onClick={() => setView("timeline")} className="btn btn-sm">View Timeline</button>
                </div>
              </div>
            )}

            {/* ─── Policy Overview ─── */}
            {activePolicy && (
              <div className="card p-5 bg-card">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-overline mb-1">Active Policy</p>
                    <h2 className="font-heading font-700 text-lg leading-tight">{activePolicy.id} — {activePolicy.typeName}</h2>
                  </div>
                  <span className={`pill shrink-0 ${activePolicy.status === "active" ? "pill-accent" : "pill-muted"}`}>
                    {activePolicy.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  <div className="bg-muted/60 rounded-[var(--radius-sm)] px-3 py-2">
                    <p className="text-overline">Premium</p>
                    <p className="text-sm font-semibold mt-0.5">{fmt(activePolicy.premium)}/mo</p>
                  </div>
                  <div className="bg-muted/60 rounded-[var(--radius-sm)] px-3 py-2">
                    <p className="text-overline">Renewal</p>
                    <p className="text-sm font-semibold mt-0.5">{activePolicy.renewalDate}</p>
                  </div>
                  <div className="bg-muted/60 rounded-[var(--radius-sm)] px-3 py-2">
                    <p className="text-overline">Coverages</p>
                    <p className="text-sm font-semibold mt-0.5">{activePolicy.coverages.length} items</p>
                  </div>
                </div>
                <div className="space-y-1.5 mb-4">
                  {activePolicy.coverages.map(cov => (
                    <div key={cov.name} className="flex items-center justify-between text-xs bg-muted/40 rounded-[var(--radius-sm)] px-3 py-1.5">
                      <span className="font-medium">{cov.name}</span>
                      <span className="font-mono text-muted-foreground">
                        Limit: {fmt(cov.limit)}{cov.deductible > 0 ? ` / Ded: ${fmt(cov.deductible)}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => quickAsk(`Explain my policy ${activePolicy.id}`)} className="btn btn-sm btn-primary">Explain Policy</button>
                  <button onClick={() => quickAsk(`What are the exclusions in policy ${activePolicy.id}?`)} className="btn btn-sm">Find Exclusions</button>
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
                  {recentDocs.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs p-2 bg-muted/40 rounded-[var(--radius-sm)]">
                      <span className="text-base">▧</span>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{d.name}</p>
                        <p className="text-muted-foreground">{d.claimId} · {d.date}</p>
                      </div>
                      <span className={`pill shrink-0 !text-[0.5rem] ${d.status === "received" ? "pill-accent" : "pill-muted"}`}>{d.status}</span>
                    </div>
                  ))}
                  {recentConvs.map(conv => (
                    <div key={conv.id} className="flex items-center gap-2 text-xs p-2 bg-muted/40 rounded-[var(--radius-sm)]">
                      <span className="text-base">◆</span>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{conv.title}</p>
                        <p className="text-muted-foreground">{conv.messages.length} messages</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
