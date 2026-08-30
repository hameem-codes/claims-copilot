"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { ClaimTimelineEvent } from "@/types";

const eventStatusStyle: Record<ClaimTimelineEvent["status"], string> = {
  completed: "bg-accent border-[#6D28D9]",
  current:   "bg-tertiary border-foreground",
  upcoming:  "bg-muted border-foreground",
};

export function TimelineView() {
  const { setView } = useApp();
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [newEventDesc, setNewEventDesc] = useState("");
  const [customEvents, setCustomEvents] = useState<ClaimTimelineEvent[]>([]);

  const sortedEvents = [...customEvents].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });

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
              Event progression and milestones for your claim
            </p>
          </div>
          <span className="pill pill-accent shrink-0">◎ Timeline</span>
        </div>

        {/* Timeline container */}
        <div className="card p-5 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-overline">Event Progression</p>
            <button onClick={() => setShowAddEvent(v => !v)} className="btn btn-sm">
              {showAddEvent ? "Cancel" : "+ Add Event"}
            </button>
          </div>

          {/* Add event form */}
          {showAddEvent && (
            <div className="p-4 border-2 border-dashed border-foreground/40 rounded-[var(--radius-sm)] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-overline mb-1 block">Event Name</label>
                  <input
                    value={newEventTitle}
                    onChange={e => setNewEventTitle(e.target.value)}
                    placeholder="e.g. Incident reported, estimate received"
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
                  placeholder="Describe milestone details..."
                  className="w-full px-3 py-2 text-sm bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <button onClick={addEvent} disabled={!newEventTitle.trim()} className="btn btn-primary btn-sm disabled:opacity-60">
                Save Event
              </button>
            </div>
          )}

          {sortedEvents.length === 0 ? (
            <div className="p-6 rounded-[var(--radius-sm)] bg-muted/40 border border-border text-center space-y-3">
              <div className="text-3xl">◎</div>
              <p className="font-heading font-700 text-sm">No timeline events recorded yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Upload claim documents to track processing milestones or add custom claim events to maintain your timeline.
              </p>
              <div className="flex flex-wrap gap-2 justify-center pt-1">
                <button onClick={() => setShowAddEvent(true)} className="btn btn-sm btn-primary">
                  + Add First Event
                </button>
                <button onClick={() => setView("documents")} className="btn btn-sm">
                  Upload Claim Document
                </button>
              </div>
            </div>
          ) : (
            <div className="relative pt-2">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

              <ol className="space-y-4">
                {sortedEvents.map((event, idx) => (
                  <li key={event.id} className="flex items-start gap-4 pl-2">
                    {/* Dot */}
                    <div className={`relative z-10 w-8 h-8 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white shadow-[2px_2px_0_var(--foreground)] ${eventStatusStyle[event.status]}`}>
                      {event.status === "completed" ? "✓" : event.status === "current" ? "●" : `${idx + 1}`}
                    </div>
                    {/* Content */}
                    <div className={`flex-1 pb-2 ${idx < sortedEvents.length - 1 ? "border-b border-border" : ""}`}>
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
          )}
        </div>

      </div>
    </div>
  );
}
