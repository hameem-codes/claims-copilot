"use client";

import { useApp } from "@/context/AppContext";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ContextPanel } from "@/components/panel/ContextPanel";
import { ClaimsView } from "@/components/claims/ClaimsView";
import { PolicyView } from "@/components/claims/PolicyView";
import { SupportView } from "@/components/claims/SupportView";
import { CustomersView } from "@/components/claims/CustomersView";

export default function Home() {
  const { view, sidebarOpen, setSidebarOpen } = useApp();

  const renderMainContent = () => {
    switch (view) {
      case "claims":
        return <ClaimsView />;
      case "policies":
        return <PolicyView />;
      case "support":
        return <SupportView />;
      case "customers":
        return <CustomersView />;
      case "copilot":
      default:
        return <ChatWindow />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-3 left-3 z-50 btn btn-sm !rounded-[var(--radius-sm)]"
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } fixed md:relative z-40 h-full transition-transform duration-200`}
      >
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden">
        {renderMainContent()}
      </main>

      {/* Context Panel — desktop only */}
      <div className="hidden lg:block h-full">
        <ContextPanel />
      </div>
    </div>
  );
}
