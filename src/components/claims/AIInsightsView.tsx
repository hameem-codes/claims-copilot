"use client";

import { useApp } from "@/context/AppContext";

export function AIInsightsView() {
  const { currentCustomer, insights, setView } = useApp();

  if (!currentCustomer) {
    return (
      <div className="h-full overflow-y-auto bg-[var(--bg)] relative">
        <div className="geo-dot-grid absolute inset-0 opacity-20 pointer-events-none" />
        <div className="relative z-10 px-6 py-6 max-w-3xl mx-auto text-center py-20">
          <p className="text-muted-foreground text-sm">No customer context loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg)] relative">
      <div className="geo-dot-grid absolute inset-0 opacity-20 pointer-events-none" />
      <div className="relative z-10 px-6 py-6 max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-800 text-2xl tracking-tight">AI Insights</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Automated claims analysis and policy recommendations for {currentCustomer.name}
            </p>
          </div>
          <button onClick={() => setView("copilot")} className="btn btn-sm">
            ← Back to Copilot
          </button>
        </div>

        {/* Insights list */}
        {insights.length === 0 ? (
          <div className="card p-12 text-center bg-card shadow-sm">
            <div className="text-4xl mb-3">✨</div>
            <p className="font-heading font-700 text-lg mb-1">No insights generated</p>
            <p className="text-sm text-muted-foreground">
              All claims are in good standing and no action is required at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => {
              const styleClasses = 
                insight.type === "warning"
                  ? "border-warning/60 bg-warning/10 text-amber-900"
                  : insight.type === "success"
                  ? "border-quaternary/60 bg-quaternary/10 text-emerald-900"
                  : insight.type === "action"
                  ? "border-secondary/60 bg-secondary/10 text-pink-900"
                  : "border-accent/40 bg-accent/10 text-violet-900";

              const badgeLabel = 
                insight.type === "warning" ? "Attention" :
                insight.type === "success" ? "Success" :
                insight.type === "action" ? "Action Needed" : "Info";

              const badgeColor = 
                insight.type === "warning" ? "pill-warning" :
                insight.type === "success" ? "pill-success" :
                insight.type === "action" ? "pill-accent" : "pill-muted";

              return (
                <div key={insight.id} className={`card p-5 ${styleClasses} flex gap-4 items-start`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`pill ${badgeColor} !text-[0.65rem] !py-0.5 !px-2`}>
                        {badgeLabel}
                      </span>
                      <span className="text-[0.65rem] font-mono opacity-60">ID: {insight.id}</span>
                    </div>
                    <h3 className="font-heading font-800 text-sm md:text-base mb-1.5 text-foreground">
                      {insight.title}
                    </h3>
                    <p className="text-xs md:text-sm opacity-90 leading-relaxed text-foreground/90">
                      {insight.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
