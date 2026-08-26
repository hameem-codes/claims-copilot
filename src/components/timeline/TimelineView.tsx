"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { claims } from "@/data/mock-data";
import type { ClaimTimelineEvent } from "@/types";

const eventStatusStyle: Record<ClaimTimelineEvent["status"], string> = {
  completed: "bg-accent border-[#6D28D9]",
  current:   "bg-tertiary border-foreground",
  upcoming:  "bg-muted border-foreground",
};

export function TimelineView() {
  const { currentCustomer, activeClaimId, setActiveClaimId, sendMessage, setView } = useApp();
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [newEventDesc, setNewEventDesc] = useState("");
  const [customEvents, setCustomEvents] = useState<ClaimTimelineEvent[]>([]);

  const customerClaims = claims.filter(c => c.customerId === currentCustomer?.id);
  const activeClaim = customerClaims.find(c => c.id === activeClaimId) || customerClaims[0];
  const allTimeline = activeClaim ? [...activeClaim.timeline, ...customEvents].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  }) : [];

  const addEvent = () => {
    if (!newEventTitle.trim()) return;
    const evt: ClaimTimelineEvent = {
      id: `custom-${Date.now()}`,
      date: newEventDate,
      title: newEventTitle.trim(),
      description: newEventDesc.trim(),
      status: "completed",
    };
    setCustomEvents(prev => [...prev, evt]);
    setNewEventTitle("");
    setNewEventDate(new Date().toISOString().split("T")[0]);
    setNewEventDesc("");
    setShowAddEvent(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg)] relative">
      <div className="geo-dot-grid absolute inset-0 opacity-20 pointer-events-none" />
      <div className="relative z-10 px-6 py-6 max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading font-800 text-2xl tracking-tight">Claim Timeline</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Complete event history for your claim
            </p>
          </div>
          <span className="pill pill-accent shrink-0">◎ Timeline</span>
        </div>

        {/* Claim Selector */}
        {customerClaims.length > 1 && (
          <div className="card p-4 bg-card">
            <label className="text-overline mb-2 block">Viewing Timeline For</label>
            <select
              value={activeClaim?.id || ""}
              onChange={e => setActiveClaimId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {customerClaims.map(c => (
                <option key={c.id} value={c.id}>{c.id} — {c.type}</option>
              ))}
            </select>
          </div>
        )}

        {activeClaim ? (
          <>
            {/* AI Summary */}
            <div className="card p-5 bg-card border-accent/30 !shadow-[4px_4px_0_var(--accent)]">
              <p className="text-overline mb-2">AI Timeline Summary</p>
              <p className="text-sm leading-relaxed mb-3">
                <strong>{activeClaim.id}</strong> was submitted on {activeClaim.submittedDate} for {activeClaim.type}.
                The claim is currently <strong>{activeClaim.status.replace(/_/g, " ")}</strong> and managed by adjuster{" "}
                <strong>{activeClaim.adjuster}</strong>.
                {activeClaim.missingDocuments.length > 0 && (
                  <> The following documents are still required: <strong>{activeClaim.missingDocuments.join(", ")}</strong>.</>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setView("copilot"); setTimeout(() => sendMessage(`Summarize the current status and next steps for claim ${activeClaim.id}`), 100); }}
                  className="btn btn-sm btn-primary"
                >
                  ◆ Ask AI About Timeline
                </button>
                <button
                  onClick={() => { setView("copilot"); setTimeout(() => sendMessage(`What actions should I take next for claim ${activeClaim.id}?`), 100); }}
                  className="btn btn-sm"
                >
                  Next Steps
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="card p-5 bg-card">
              <div className="flex items-center justify-between mb-4">
                <p className="text-overline">Event History</p>
                <button onClick={() => setShowAddEvent(v => !v)} className="btn btn-sm">
                  {showAddEvent ? "Cancel" : "+ Add Event"}
                </button>
              </div>

              {/* Add event form */}
              {showAddEvent && (
                <div className="mb-4 p-4 border-2 border-dashed border-foreground/40 rounded-[var(--radius-sm)] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-overline mb-1 block">Event Name</label>
                      <input
                        value={newEventTitle}
                        onChange={e => setNewEventTitle(e.target.value)}
                        placeholder="e.g. Estimate received"
                        className="w-full px-3 py-2 text-sm bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="text-overline mb-1 block">Date</label>
                      <input
                        type="date"
                        value={newEventDate}
                        onChange={e => setNewEventDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-overline mb-1 block">Description</label>
                    <input
                      value={newEventDesc}
                      onChange={e => setNewEventDesc(e.target.value)}
                      placeholder="Describe what happened..."
                      className="w-full px-3 py-2 text-sm bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <button onClick={addEvent} disabled={!newEventTitle.trim()} className="btn btn-primary btn-sm disabled:opacity-60">
                    Add Event
                  </button>
                </div>
              )}

              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

                <ol className="space-y-4">
                  {allTimeline.map((event, idx) => (
                    <li key={event.id} className="flex items-start gap-4 pl-2">
                      {/* Dot */}
                      <div className={`relative z-10 w-8 h-8 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white shadow-[2px_2px_0_var(--foreground)] ${eventStatusStyle[event.status]}`}>
                        {event.status === "completed" ? "✓" : event.status === "current" ? "●" : `${idx + 1}`}
                      </div>
                      {/* Content */}
                      <div className={`flex-1 pb-2 ${idx < allTimeline.length - 1 ? "border-b border-border" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold">{event.title}</p>
                          {event.date && (
                            <span className="text-xs font-mono text-muted-foreground shrink-0">{event.date}</span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                        )}
                        {event.status === "current" && (
                          <span className="pill pill-accent !text-[0.5rem] mt-1">Current</span>
                        )}
                        {event.status === "upcoming" && (
                          <span className="pill pill-muted !text-[0.5rem] mt-1">Upcoming</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Pending actions */}
            {activeClaim.missingDocuments.length > 0 && (
              <div className="card p-5 bg-card border-warning/40">
                <p className="text-overline mb-2 text-warning">⚠ Pending Actions</p>
                <ul className="space-y-1.5">
                  {activeClaim.missingDocuments.map(doc => (
                    <li key={doc} className="flex items-center gap-2 text-sm">
                      <span className="text-error">○</span>
                      <span>Upload: <strong>{doc}</strong></span>
                      <button
                        onClick={() => setView("documents")}
                        className="btn btn-sm ml-auto !py-0.5 !min-h-0 text-xs"
                      >
                        Upload
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-muted-foreground text-sm">No claims found. Upload a claim document to get started.</p>
            <button onClick={() => setView("documents")} className="btn btn-primary mt-4">Upload Document</button>
          </div>
        )}
      </div>
    </div>
  );
}
