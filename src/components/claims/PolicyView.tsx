"use client";

import { useApp } from "@/context/AppContext";
import { policies } from "@/data/mock-data";

export function PolicyView() {
  const { currentCustomer, setView } = useApp();

  const customerPolicies = policies.filter(
    (p) => p.customerId === currentCustomer?.id
  );

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg)] relative">
      <div className="geo-dot-grid absolute inset-0 opacity-20 pointer-events-none" />
      <div className="relative z-10 px-6 py-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-800 text-2xl tracking-tight">Policies</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {customerPolicies.length} active polic{customerPolicies.length !== 1 ? "ies" : "y"}
            </p>
          </div>
          <button onClick={() => setView("copilot")} className="btn btn-sm">
            ← Back to Copilot
          </button>
        </div>

        {customerPolicies.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">▤</div>
            <p className="font-heading font-700 text-lg mb-1">No policies found</p>
            <p className="text-sm text-muted-foreground">No policies for this customer.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {customerPolicies.map((policy) => (
              <div key={policy.id} className="card p-5 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/8 rounded-full pointer-events-none" />

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-heading font-800 text-xl tracking-tight">{policy.id}</p>
                    <p className="text-sm text-muted-foreground">{policy.typeName}</p>
                  </div>
                  <span className="pill pill-success">Active</span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-3 gap-4 text-xs mb-4 pb-4 border-b-2 border-border">
                  <div>
                    <p className="text-muted-foreground mb-0.5">Effective</p>
                    <p className="font-medium">{policy.effectiveDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Renewal</p>
                    <p className="font-medium">{policy.renewalDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Premium</p>
                    <p className="font-mono font-semibold">${policy.premium}/mo</p>
                  </div>
                </div>

                {/* Coverages */}
                <div className="mb-4">
                  <p className="text-overline mb-2">Coverages</p>
                  <div className="space-y-2">
                    {policy.coverages.map((coverage) => (
                      <div
                        key={coverage.name}
                        className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)] bg-muted/50 border-2 border-border text-sm"
                      >
                        <span className="font-medium">{coverage.name}</span>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="font-mono">
                            ${coverage.limit.toLocaleString()} limit
                          </span>
                          <span className="text-muted-foreground font-mono">
                            ${coverage.deductible} ded.
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exclusions */}
                <div>
                  <p className="text-overline mb-2">Exclusions</p>
                  <ul className="text-xs text-muted-foreground space-y-1 pl-4">
                    {policy.exclusions.map((excl) => (
                      <li key={excl}>• {excl}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
