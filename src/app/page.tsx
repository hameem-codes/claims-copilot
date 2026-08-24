"use client";

import { useApp } from "@/context/AppContext";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ClaimsView } from "@/components/claims/ClaimsView";
import { PolicyView } from "@/components/claims/PolicyView";
import { SupportView } from "@/components/claims/SupportView";
import { CustomersView } from "@/components/claims/CustomersView";

export default function Home() {
  const { view, sidebarOpen, setSidebarOpen } = useApp();

  const renderMainContent = () => {
    switch (view) {
      case "claims": return <ClaimsView />;
      case "policies": return <PolicyView />;
      case "support": return <SupportView />;
      case "customers": return <CustomersView />;
      case "copilot":
      default: return <ChatWindow />;
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {!sidebarOpen && (
        <button type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)} className="md:hidden fixed top-3 left-3 z-50 btn btn-sm !h-10 !w-10 !p-0 !rounded-[var(--radius-sm)]">☰</button>
      )}
      <div className={`fixed inset-y-0 left-0 z-40 h-[100dvh] transition-transform duration-200 ease-out md:relative md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar />
      </div>
      {sidebarOpen && <button type="button" aria-label="Close navigation overlay" className="md:hidden fixed inset-0 z-30 cursor-default bg-black/20" onClick={() => setSidebarOpen(false)} />}
      <main className="min-w-0 flex-1 h-[100dvh] overflow-hidden">{renderMainContent()}</main>
    </div>
  );
}
