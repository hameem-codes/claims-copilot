"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { signOut } from "@/lib/auth-client";

type SettingsTab = "account" | "preferences" | "data" | "security";

const tabs: { id: SettingsTab; label: string; icon: string }[] = [
  { id: "account",     label: "Account",     icon: "◈" },
  { id: "preferences", label: "Preferences", icon: "◧" },
  { id: "data",        label: "Data",        icon: "▧" },
  { id: "security",    label: "Security",    icon: "◉" },
];

export function SettingsView() {
  const { currentCustomer, savedAnalyses, deleteAnalysis } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [notifyClaims, setNotifyClaims] = useState(true);
  const [notifyDocs, setNotifyDocs] = useState(true);
  const [aiVerbose, setAiVerbose] = useState(false);
  const [showSources, setShowSources] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<"analyses" | null>(null);

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      await signOut();
    } catch {
      // noop
    } finally {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }
  };

  const handleDeleteAllAnalyses = () => {
    if (deleteConfirm === "analyses") {
      savedAnalyses.forEach(a => deleteAnalysis(a.id));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm("analyses");
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg)] relative">
      <div className="geo-dot-grid absolute inset-0 opacity-20 pointer-events-none" />
      <div className="relative z-10 px-6 py-6 max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading font-800 text-2xl tracking-tight">Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your account, preferences, and data</p>
          </div>
          <span className="pill pill-muted shrink-0">◧ Settings</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Tab list */}
          <div className="sm:w-44 shrink-0 flex sm:flex-col gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-[var(--radius-sm)] border-2 transition-colors text-left ${
                  activeTab === tab.id
                    ? "bg-accent text-white border-[#6D28D9] shadow-[2px_2px_0_#6D28D9]"
                    : "bg-card border-transparent hover:bg-muted text-foreground"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content panel */}
          <div className="flex-1 min-w-0">

            {/* ─── Account ─── */}
            {activeTab === "account" && (
              <div className="card p-6 bg-card space-y-5">
                <h2 className="font-heading font-700 text-lg">Account Information</h2>
                <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-[var(--radius-sm)] border-2 border-border">
                  <div
                    className="w-12 h-12 shrink-0 rounded-full border-2 border-foreground flex items-center justify-center text-sm font-bold text-white shadow-[2px_2px_0_var(--foreground)]"
                    style={{ background: currentCustomer?.avatarColor || "#8B5CF6" }}
                  >
                    {currentCustomer?.name?.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold">{currentCustomer?.name}</p>
                    <p className="text-xs font-mono text-muted-foreground">{currentCustomer?.id}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Name",              value: currentCustomer?.name || "" },
                    { label: "Email",             value: currentCustomer?.email || "" },
                    { label: "Phone",             value: currentCustomer?.phone || "" },
                    { label: "Preferred Contact", value: currentCustomer?.preferredContact?.toUpperCase() || "" },
                    { label: "Customer Since",    value: currentCustomer?.customerSince || "" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between gap-4 px-3 py-2.5 bg-muted/40 rounded-[var(--radius-sm)]">
                      <span className="text-sm text-muted-foreground">{row.label}</span>
                      <span className="text-sm font-medium text-right break-all">{row.value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  To update your profile information, please contact your insurance representative.
                </p>
              </div>
            )}

            {/* ─── Preferences ─── */}
            {activeTab === "preferences" && (
              <div className="card p-6 bg-card space-y-5">
                <h2 className="font-heading font-700 text-lg">Preferences</h2>

                <div className="space-y-1">
                  <p className="text-overline">Notifications</p>
                  <div className="space-y-2 mt-2">
                    {[
                      { label: "Claim status updates", value: notifyClaims, set: setNotifyClaims },
                      { label: "Document upload reminders", value: notifyDocs, set: setNotifyDocs },
                    ].map(pref => (
                      <label key={pref.label} className="flex items-center justify-between gap-4 px-3 py-2.5 bg-muted/40 rounded-[var(--radius-sm)] cursor-pointer">
                        <span className="text-sm">{pref.label}</span>
                        <button
                          role="switch"
                          aria-checked={pref.value}
                          onClick={() => pref.set(v => !v)}
                          className={`relative w-10 h-5 rounded-full border-2 border-foreground transition-colors ${pref.value ? "bg-accent" : "bg-muted"}`}
                        >
                          <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full border border-foreground/20 transition-transform ${pref.value ? "translate-x-5" : "translate-x-0.5"}`} />
                        </button>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-overline">AI Response Preferences</p>
                  <div className="space-y-2 mt-2">
                    {[
                      { label: "Verbose AI responses", value: aiVerbose, set: setAiVerbose },
                      { label: "Show source references", value: showSources, set: setShowSources },
                    ].map(pref => (
                      <label key={pref.label} className="flex items-center justify-between gap-4 px-3 py-2.5 bg-muted/40 rounded-[var(--radius-sm)] cursor-pointer">
                        <span className="text-sm">{pref.label}</span>
                        <button
                          role="switch"
                          aria-checked={pref.value}
                          onClick={() => pref.set(v => !v)}
                          className={`relative w-10 h-5 rounded-full border-2 border-foreground transition-colors ${pref.value ? "bg-accent" : "bg-muted"}`}
                        >
                          <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full border border-foreground/20 transition-transform ${pref.value ? "translate-x-5" : "translate-x-0.5"}`} />
                        </button>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Data ─── */}
            {activeTab === "data" && (
              <div className="card p-6 bg-card space-y-5">
                <h2 className="font-heading font-700 text-lg">Data Management</h2>

                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-[var(--radius-sm)] border-2 border-border">
                  <div>
                    <p className="text-sm font-medium">Saved Analyses</p>
                    <p className="text-xs text-muted-foreground">{savedAnalyses.length} analyses stored in session</p>
                  </div>
                  <button
                    onClick={handleDeleteAllAnalyses}
                    className={`btn btn-sm ${deleteConfirm === "analyses" ? "!border-error !text-error hover:!bg-error/10" : ""}`}
                  >
                    {deleteConfirm === "analyses" ? "Confirm Delete?" : "Delete All"}
                  </button>
                </div>

                <div className="p-3 bg-muted/40 rounded-[var(--radius-sm)] border-2 border-border">
                  <p className="text-sm font-medium">Documents</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Uploaded documents are stored server-side. Manage them in the Documents view.
                  </p>
                  <button
                    className="btn btn-sm mt-2"
                    onClick={() => {/* setView("documents") is in parent but we can import useApp */}}
                  >
                    Manage Documents →
                  </button>
                </div>

                <div className="p-4 rounded-[var(--radius-sm)] border-2 border-dashed border-foreground/30">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> Conversation history and analyses are stored in-session only and will reset on page refresh. Document files are persisted server-side.
                  </p>
                </div>
              </div>
            )}

            {/* ─── Security ─── */}
            {activeTab === "security" && (
              <div className="card p-6 bg-card space-y-5">
                <h2 className="font-heading font-700 text-lg">Security</h2>

                <div className="p-3 bg-muted/40 rounded-[var(--radius-sm)] border-2 border-border flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Session Authentication</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Secured via Better Auth server-side sessions</p>
                  </div>
                  <span className="pill pill-accent shrink-0 !text-[0.55rem]">Active</span>
                </div>

                <div className="p-3 bg-muted/40 rounded-[var(--radius-sm)] border-2 border-border">
                  <p className="text-sm font-medium">Change Password</p>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-3">Update your account password</p>
                  <div className="space-y-2">
                    <input type="password" placeholder="Current password" className="w-full px-3 py-2 text-sm bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent" />
                    <input type="password" placeholder="New password" className="w-full px-3 py-2 text-sm bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent" />
                    <input type="password" placeholder="Confirm new password" className="w-full px-3 py-2 text-sm bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent" />
                    <button className="btn btn-primary w-full">Update Password</button>
                  </div>
                </div>

                <div className="border-t-2 border-border pt-4">
                  <button
                    onClick={handleSignOut}
                    disabled={signOutLoading}
                    className="btn w-full !border-error/40 !text-error hover:!bg-error/10 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {signOutLoading
                      ? <><span className="animate-spin w-4 h-4 border-2 border-error border-t-transparent rounded-full inline-block" /> Signing out...</>
                      : "Sign Out"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
