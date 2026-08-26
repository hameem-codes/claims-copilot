"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { claims } from "@/data/mock-data";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Claim, ClaimStatus } from "@/types";

const filterOptions: { label: string; value: ClaimStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "under_review" },
  { label: "Docs Needed", value: "documents_requested" },
  { label: "Approved", value: "approved" },
  { label: "Appealed", value: "appealed" },
  { label: "Closed", value: "closed" },
];

export function ClaimsView() {
  const { currentCustomer, setView } = useApp();
  const [filter, setFilter] = useState<ClaimStatus | "all">("all");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  const customerClaims = claims.filter(
    (c) => c.customerId === currentCustomer?.id
  );

  const filteredClaims =
    filter === "all"
      ? customerClaims
      : customerClaims.filter((c) => c.status === filter);

  // Claim Detail View
  if (selectedClaim) {
    return (
      <div className="h-full overflow-y-auto bg-[var(--bg)] relative">
        <div className="geo-dot-grid absolute inset-0 opacity-20 pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 py-6">
          {/* Back button */}
          <button
            onClick={() => setSelectedClaim(null)}
            className="btn btn-sm mb-4"
          >
            ← Back to claims
          </button>

          {/* Claim Header */}
          <div className="card !shadow-[6px_6px_0_var(--accent)] !border-accent/30 p-6 mb-6 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-28 h-28 bg-accent/10 rounded-full pointer-events-none" />
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-overline mb-1">Claim</p>
                <h2 className="font-heading font-800 text-3xl tracking-tight">
                  {selectedClaim.id}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">{selectedClaim.type}</p>
              </div>
              <StatusBadge status={selectedClaim.status} />
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Amount</p>
                <p className="font-mono font-bold text-lg">
                  ${selectedClaim.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Adjuster</p>
                <p className="font-semibold">{selectedClaim.adjuster}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Submitted</p>
                <p className="font-semibold">{selectedClaim.submittedDate}</p>
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div className="card card-accent p-5 mb-6">
            <p className="text-overline mb-2">AI Summary</p>
            <p className="text-sm leading-relaxed">
              {selectedClaim.status === "approved"
                ? "Your claim has been approved. Reimbursement is being processed and you should receive payment within 5-10 business days."
                : selectedClaim.status === "denied"
                ? "This claim was denied. You have the right to appeal within 30 days of the denial notice."
                : selectedClaim.status === "appealed"
                ? "Your appeal is being reviewed by a senior adjuster. This typically takes 15-30 business days."
                : selectedClaim.missingDocuments.length > 0
                ? `Your claim is waiting on ${selectedClaim.missingDocuments.length} document(s). Once submitted, review can proceed.`
                : "All documents are in place. Your claim is being processed by the assigned adjuster."}
            </p>
          </div>

          {/* Timeline */}
          <div className="card p-5 mb-6">
            <p className="text-overline mb-4">Timeline</p>
            <div className="relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
              <div className="space-y-4">
                {selectedClaim.timeline.map((event) => (
                  <div key={event.id} className="flex gap-3 relative">
                    <div
                      className={`w-6 h-6 rounded-full border-2 border-foreground flex items-center justify-center shrink-0 z-10 text-[0.5rem] font-bold ${
                        event.status === "completed"
                          ? "bg-quaternary text-white"
                          : event.status === "current"
                          ? "bg-accent text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {event.status === "completed" ? "✓" : event.status === "current" ? "●" : "○"}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.date || "Pending"}</p>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="card p-5">
            <p className="text-overline mb-3">Documents</p>
            <div className="space-y-2">
              {selectedClaim.documents.map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)] border-2 border-border text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        doc.status === "received"
                          ? "text-success"
                          : doc.status === "missing"
                          ? "text-error"
                          : "text-warning"
                      }
                    >
                      {doc.status === "received" ? "✓" : doc.status === "missing" ? "✗" : "◌"}
                    </span>
                    <span>{doc.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {doc.date || doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Claims List View
  return (
    <div className="h-full overflow-y-auto bg-[var(--bg)] relative">
      <div className="geo-dot-grid absolute inset-0 opacity-20 pointer-events-none" />
      <div className="relative z-10 px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-800 text-2xl tracking-tight">Claims</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {customerClaims.length} total claim{customerClaims.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={() => setView("copilot")} className="btn btn-sm">
            ← Back to Copilot
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`btn btn-sm !rounded-[var(--radius-sm)] ${
                filter === opt.value
                  ? "!bg-accent !text-white !border-[#6D28D9] !shadow-[2px_2px_0_#6D28D9]"
                  : ""
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Claims Grid */}
        {filteredClaims.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">✦</div>
            <p className="font-heading font-700 text-lg mb-1">No claims found</p>
            <p className="text-sm text-muted-foreground">
              {filter !== "all" ? "Try a different filter." : "No claims for this customer yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClaims.map((claim) => (
              <button
                key={claim.id}
                onClick={() => setSelectedClaim(claim)}
                className="card card-hover p-5 text-left relative overflow-hidden"
              >
                {/* Decorative element */}
                <div
                  className={`absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none ${
                    claim.status === "approved"
                      ? "bg-quaternary/15"
                      : claim.status === "denied" || claim.status === "appealed"
                      ? "bg-secondary/15"
                      : "bg-accent/10"
                  }`}
                />
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-heading font-800 text-xl tracking-tight">{claim.id}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{claim.type}</p>
                  </div>
                  <StatusBadge status={claim.status} size="sm" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-mono font-bold text-base">${claim.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Submitted</p>
                    <p className="font-medium">{claim.submittedDate}</p>
                  </div>
                </div>
                {claim.missingDocuments.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-warning font-medium">
                    <span>⚠</span>
                    <span>{claim.missingDocuments.length} document(s) missing</span>
                  </div>
                )}
                <div className="mt-3 text-xs text-accent font-semibold">
                  View details →
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
