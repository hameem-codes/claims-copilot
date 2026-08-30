"use client";

import { useApp } from "@/context/AppContext";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { DocumentsView } from "@/components/documents/DocumentsView";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { AnalysisView } from "@/components/analysis/AnalysisView";
import { TimelineView } from "@/components/timeline/TimelineView";
import { SettingsView } from "@/components/settings/SettingsView";

export default function Home() {
  const { view, sidebarOpen, setSidebarOpen } = useApp();

  const renderMainContent = () => {
    switch (view) {
      case "dashboard":       return <DashboardView />;
      case "documents":       return <DocumentsView />;
      case "copilot":         return <ChatWindow />;
      case "analysis":        return <AnalysisView />;
      case "timeline":        return <TimelineView />;
      case "settings":        return <SettingsView />;
      // legacy fallbacks
      case "compare":
      case "saved":           return <AnalysisView />;
      case "claims-policies":
      case "claims":
      case "policies":
      case "ai-insights":     return <DashboardView />;
      case "support":         return <SettingsView />;
      default:                return <ChatWindow />;
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <div className={`fixed inset-y-0 left-0 z-40 h-[100dvh] transition-[width,min-width] duration-200 ease-out md:relative ${sidebarOpen ? "w-[280px] min-w-[280px]" : "w-[76px] min-w-[76px] overflow-hidden"} bg-card border-r-2 border-foreground`}>
        <div className="w-[280px] h-full">
          <Sidebar />
        </div>
      </div>
      {sidebarOpen && <button type="button" aria-label="Close navigation overlay" className="md:hidden fixed inset-0 z-30 cursor-default bg-black/20" onClick={() => setSidebarOpen(false)} />}
      <main className="min-w-0 flex-1 h-[100dvh] overflow-hidden">{renderMainContent()}</main>
    </div>
  );
}
