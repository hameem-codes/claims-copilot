"use client";

import { useState } from "react";
import { ClaimsView } from "./ClaimsView";
import { PolicyView } from "./PolicyView";

type Tab = "claims" | "policies";

export function ClaimsPoliciesView() {
  const [activeTab, setActiveTab] = useState<Tab>("claims");

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="shrink-0 px-6 pt-5 pb-0 border-b-2 border-foreground bg-card/80 backdrop-blur-sm">
        <div className="flex gap-1">
          {(["claims", "policies"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-t-[var(--radius-sm)] border-2 border-b-0 transition-colors capitalize ${
                activeTab === tab
                  ? "bg-background border-foreground text-foreground -mb-[2px]"
                  : "bg-muted/40 border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "claims" ? "Claims" : "Policies"}
            </button>
          ))}
        </div>
      </div>

      {/* Content — each sub-view manages its own scroll */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "claims" ? <ClaimsView /> : <PolicyView />}
      </div>
    </div>
  );
}
