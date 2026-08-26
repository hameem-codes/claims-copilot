"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import type { AppView } from "@/types";
import { signOut } from "@/lib/auth-client";

const navItems: { id: AppView; label: string; icon: string }[] = [
  { id: "dashboard",      label: "Dashboard",        icon: "◈" },
  { id: "claims-policies",label: "Claims & Policies", icon: "▦" },
  { id: "documents",      label: "Documents",         icon: "▧" },
  { id: "copilot",        label: "AI Copilot",        icon: "◆" },
  { id: "compare",        label: "Compare & Analyze", icon: "⊞" },
  { id: "timeline",       label: "Claim Timeline",    icon: "◎" },
  { id: "saved",          label: "Saved Analyses",    icon: "◉" },
  { id: "settings",       label: "Settings",          icon: "◧" },
];


export function Sidebar() {
  const {
    view,
    setView,
    currentCustomer,
    conversations,
    currentConversation,
    createConversation,
    selectConversation,
    sidebarOpen,
    setSidebarOpen,
  } = useApp();

  const [profileOpen, setProfileOpen] = useState(false);

  const customerConversations = conversations.filter(
    (c) => c.customerId === currentCustomer?.id
  );

  const [today, setToday] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setToday(new Date().toISOString().split("T")[0]);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [profileOpen]);

  const todayConvs = today
    ? customerConversations.filter((c) => c.updatedAt.split("T")[0] === today)
    : [];
  const olderConvs = today
    ? customerConversations.filter((c) => c.updatedAt.split("T")[0] !== today)
    : customerConversations;

  const handleNavClick = (nextView: AppView) => {
    setView(nextView);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside className="relative flex h-[100dvh] w-full shrink-0 flex-col overflow-hidden">
      <div className="shrink-0 px-5 py-4 border-b-2 border-foreground">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-9 h-9 shrink-0 bg-accent rounded-[10px] border-2 border-[#6D28D9] shadow-[2px_2px_0_#6D28D9] flex items-center justify-center text-white font-heading font-800 text-sm hover:-translate-y-px active:translate-x-[1px] active:translate-y-[1px] transition-transform"
            >
              CC
            </button>
            <div className={`min-w-0 transition-opacity duration-200 ${sidebarOpen ? "opacity-100" : "opacity-0"}`}>
              <h1 className="font-heading font-800 text-sm tracking-tight leading-none truncate">Claims Copilot</h1>
              <p className="text-overline mt-0.5 truncate">Insurance AI Assistant</p>
            </div>
          </div>
          <button type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className={`md:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border-2 border-foreground bg-card text-base font-bold shadow-[2px_2px_0_var(--foreground)] transition-transform hover:-translate-y-px active:translate-x-[1px] active:translate-y-[1px] ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>×</button>
        </div>
      </div>

      <div className={`flex-1 min-h-0 flex flex-col transition-opacity duration-200 ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="shrink-0 px-4 pt-4 pb-2">
          <button onClick={createConversation} className="btn btn-primary w-full">+ New Conversation</button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <nav className="px-3 py-2" aria-label="Primary navigation">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-[var(--radius-sm)] transition-colors text-left ${view === item.id ? "bg-accent text-white border-2 border-[#6D28D9]" : "hover:bg-muted text-foreground border-2 border-transparent"}`}>
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
                {item.id === "claims" && currentCustomer && <span className="ml-auto pill pill-muted !text-[0.5rem] !py-0 !px-1.5">{customerConversations.length > 0 ? "●" : "0"}</span>}
              </button>
            ))}
          </nav>

          <div className="mx-4 border-t-2 border-border my-1" />

          <div className="px-3 py-2">
            <p className="text-overline px-2 mb-2">Conversations</p>
            {todayConvs.length > 0 && (
              <div className="mb-3">
                <p className="text-[0.65rem] font-mono font-500 text-muted-foreground uppercase tracking-wider px-2 mb-1.5">Today</p>
                {todayConvs.map((conv) => <ConversationItem key={conv.id} conv={conv} isActive={currentConversation?.id === conv.id} onClick={() => selectConversation(conv.id)} />)}
              </div>
            )}
            {olderConvs.length > 0 && (
              <div>
                <p className="text-[0.65rem] font-mono font-500 text-muted-foreground uppercase tracking-wider px-2 mb-1.5">Previous</p>
                {olderConvs.map((conv) => <ConversationItem key={conv.id} conv={conv} isActive={currentConversation?.id === conv.id} onClick={() => selectConversation(conv.id)} />)}
              </div>
            )}
            {customerConversations.length === 0 && <p className="text-sm text-muted-foreground px-2">No conversations yet. Start a new one!</p>}
          </div>
        </div>

        <div className="relative shrink-0 px-4 py-3 border-t-2 border-foreground">
          <button type="button" aria-label="Open user profile" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)} className="w-full flex items-center gap-2 rounded-[var(--radius-sm)] p-1 text-left transition-colors hover:bg-muted focus-visible:outline-3 focus-visible:outline-accent">
            <div className="w-7 h-7 shrink-0 rounded-full border-2 border-foreground flex items-center justify-center text-[0.6rem] font-bold text-white" style={{ background: currentCustomer?.avatarColor || "#8B5CF6" }}>{currentCustomer?.name?.split(" ").map((n) => n[0]).join("")}</div>
            <div className="min-w-0 flex-1"><p className="text-xs font-semibold truncate">{currentCustomer?.name}</p><p className="text-[0.6rem] font-mono text-muted-foreground truncate">{currentCustomer?.id}</p></div>
            <span className="text-xs text-muted-foreground">⌃</span>
          </button>
        </div>

        {profileOpen && currentCustomer && (
          <div className="fixed inset-0 z-[60]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setProfileOpen(false); }}>
            <section role="dialog" aria-modal="true" aria-label="User profile" className="absolute bottom-4 left-4 w-[calc(100vw-2rem)] max-w-[360px] animate-pop-in rounded-[var(--radius-md)] border-2 border-foreground bg-card p-4 shadow-[6px_6px_0_var(--foreground)] sm:left-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3 border-b-2 border-border pb-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 shrink-0 rounded-full border-2 border-foreground flex items-center justify-center text-sm font-bold text-white shadow-[2px_2px_0_var(--foreground)]" style={{ background: currentCustomer.avatarColor }}>{currentCustomer.name.split(" ").map((n) => n[0]).join("")}</div>
                  <div className="min-w-0"><h2 className="font-heading font-700 text-base truncate">{currentCustomer.name}</h2><p className="text-[0.65rem] font-mono text-muted-foreground">{currentCustomer.id}</p></div>
                </div>
                <button type="button" aria-label="Close user profile" onClick={() => setProfileOpen(false)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded border-2 border-foreground text-sm font-bold hover:bg-muted">×</button>
              </div>
              
              <div className="grid grid-cols-1 gap-2.5 pt-1 text-xs">
                <ProfileRow label="Email" value={currentCustomer.email} />
                <ProfileRow label="Phone" value={currentCustomer.phone} />
                <ProfileRow label="Preferred contact" value={currentCustomer.preferredContact.toUpperCase()} />
                <ProfileRow label="Customer since" value={currentCustomer.customerSince} />
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await signOut();
                    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                    window.location.href = "/login";
                  } catch (err) {
                    console.error("Sign out failed:", err);
                    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                    window.location.href = "/login";
                  }
                }}
                className="mt-2 btn btn-primary w-full !py-2 text-xs !min-h-0"
              >
                Sign Out
              </button>
            </section>
          </div>
        )}
      </div>
    </aside>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 rounded-[var(--radius-sm)] bg-muted/60 px-3 py-2"><span className="text-muted-foreground">{label}</span><span className="max-w-[65%] text-right font-medium break-words">{value}</span></div>;
}

function ConversationItem({ conv, isActive, onClick }: { conv: { id: string; title: string }; isActive: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`w-full text-left px-3 py-2 text-sm rounded-[var(--radius-sm)] transition-colors mb-0.5 ${isActive ? "bg-muted font-semibold border-2 border-foreground shadow-[2px_2px_0_var(--foreground)]" : "hover:bg-muted/60 border-2 border-transparent"}`}><span className="block truncate">{conv.title}</span></button>;
}
