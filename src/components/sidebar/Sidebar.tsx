"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { customers } from "@/data/mock-data";
import type { AppView } from "@/types";

const navItems: { id: AppView; label: string; icon: string }[] = [
  { id: "copilot", label: "Copilot", icon: "◆" },
  { id: "claims", label: "Claims", icon: "▦" },
  { id: "policies", label: "Policies", icon: "▤" },
  { id: "customers", label: "Customers", icon: "▧" },
  { id: "support", label: "Support", icon: "▲" },
];

export function Sidebar() {
  const {
    view, setView, currentCustomer, selectCustomer,
    conversations, currentConversation, createConversation, selectConversation,
  } = useApp();

  const customerConversations = conversations.filter(
    (c) => c.customerId === currentCustomer?.id
  );

  const [today, setToday] = useState("");
  useEffect(() => setToday(new Date().toISOString().split("T")[0]), []);
  const todayConvs = today
    ? customerConversations.filter((c) => c.updatedAt.split("T")[0] === today)
    : [];
  const olderConvs = today
    ? customerConversations.filter((c) => c.updatedAt.split("T")[0] !== today)
    : customerConversations;

  return (
    <aside className="flex flex-col h-full bg-card border-r-2 border-foreground w-[280px] shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b-2 border-foreground">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-accent rounded-[10px] border-2 border-[#6D28D9] shadow-[2px_2px_0_#6D28D9] flex items-center justify-center text-white font-heading font-800 text-sm">
            CC
          </div>
          <div>
            <h1 className="font-heading font-800 text-sm tracking-tight leading-none">
              Claims Copilot
            </h1>
            <p className="text-overline mt-0.5">Insurance AI Assistant</p>
          </div>
        </div>
      </div>

      {/* New Conversation Button */}
      <div className="px-4 pt-4 pb-2">
        <button onClick={createConversation} className="btn btn-primary w-full">
          + New Conversation
        </button>
      </div>

      {/* Customer Selector */}
      <div className="px-4 py-2">
        <p className="text-overline mb-2">Customer</p>
        <select
          value={currentCustomer?.id || ""}
          onChange={(e) => {
            const c = customers.find((cu) => cu.id === e.target.value);
            if (c) selectCustomer(c);
          }}
          className="w-full px-3 py-2 text-sm font-body border-2 border-foreground rounded-[var(--radius-sm)] bg-card appearance-none cursor-pointer"
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-[var(--radius-sm)] transition-colors text-left ${
              view === item.id
                ? "bg-accent text-white border-2 border-[#6D28D9]"
                : "hover:bg-muted text-foreground border-2 border-transparent"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
            {item.id === "claims" && currentCustomer && (
              <span className="ml-auto pill pill-muted !text-[0.5rem] !py-0 !px-1.5">
                {customerConversations.length > 0 ? "●" : "0"}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t-2 border-border my-1" />

      {/* Conversation History */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <p className="text-overline px-2 mb-2">Conversations</p>

        {todayConvs.length > 0 && (
          <div className="mb-3">
            <p className="text-[0.65rem] font-mono font-500 text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
              Today
            </p>
            {todayConvs.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={currentConversation?.id === conv.id}
                onClick={() => selectConversation(conv.id)}
              />
            ))}
          </div>
        )}

        {olderConvs.length > 0 && (
          <div>
            <p className="text-[0.65rem] font-mono font-500 text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
              Previous
            </p>
            {olderConvs.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={currentConversation?.id === conv.id}
                onClick={() => selectConversation(conv.id)}
              />
            ))}
          </div>
        )}

        {customerConversations.length === 0 && (
          <p className="text-sm text-muted-foreground px-2">
            No conversations yet. Start a new one!
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t-2 border-foreground">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full border-2 border-foreground flex items-center justify-center text-[0.6rem] font-bold text-white"
            style={{ background: currentCustomer?.avatarColor || "#8B5CF6" }}
          >
            {currentCustomer?.name?.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{currentCustomer?.name}</p>
            <p className="text-[0.6rem] font-mono text-muted-foreground truncate">
              {currentCustomer?.id}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ConversationItem({
  conv,
  isActive,
  onClick,
}: {
  conv: { id: string; title: string };
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-sm rounded-[var(--radius-sm)] transition-colors mb-0.5 ${
        isActive
          ? "bg-muted font-semibold border-2 border-foreground shadow-[2px_2px_0_var(--foreground)]"
          : "hover:bg-muted/60 border-2 border-transparent"
      }`}
    >
      <span className="block truncate">{conv.title}</span>
    </button>
  );
}
