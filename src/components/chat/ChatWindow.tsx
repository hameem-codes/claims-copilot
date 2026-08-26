"use client";

import { useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { MessageBubble } from "./MessageBubble";
import { Composer } from "./Composer";
import { useTime } from "@/lib/hooks";

export function ChatWindow() {
  const {
    currentConversation, currentCustomer, sendMessage, isProcessing,
    activeClaimId, setView,
  } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const time = useTime();

  const messages = currentConversation?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isProcessing]);

  const hasMessages = messages.length > 0;
  const customerName = currentCustomer?.name?.split(" ")[0] || "there";
  const greeting = time.hour < 12 ? "Good morning" : time.hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="geo-circle w-[200px] h-[200px] bg-secondary/10 -top-20 -right-20 absolute pointer-events-none" />
      <div className="geo-circle w-[120px] h-[120px] bg-accent/10 bottom-40 -left-16 absolute pointer-events-none" />
      <div className="geo-dot-grid absolute inset-0 opacity-30 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 px-6 py-3 border-b-2 border-foreground bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-heading font-800 text-lg tracking-tight">
              Claims Copilot
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="status-led status-led-green" />
              <span className="text-[0.65rem] font-mono text-muted-foreground uppercase tracking-wider">
                Ready
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="pill pill-accent !text-[0.55rem]">Memory Active</span>
            {activeClaimId && (
              <span className="pill pill-muted !text-[0.55rem]">
                {activeClaimId}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages or Greeting */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full px-8 max-w-2xl mx-auto">
            {/* Geometric decoration */}
            <div className="relative mb-6">
              <div className="w-16 h-16 bg-accent rounded-[16px] border-2 border-[#6D28D9] shadow-[4px_4px_0_#6D28D9] flex items-center justify-center text-2xl text-white">
                ◆
              </div>
              <div className="absolute -top-2 -right-3 w-5 h-5 bg-secondary rounded-full border-2 border-foreground" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-tertiary rounded-sm border-2 border-foreground rotate-45" />
            </div>

            <h1 className="font-heading font-800 text-3xl text-center mb-2 tracking-tight">
              {greeting}, {customerName} 👋
            </h1>
            <p className="text-muted-foreground text-center text-base mb-8 max-w-md leading-relaxed">
              {activeClaimId
                ? `I remember you have claim ${activeClaimId} in progress. What would you like to check?`
                : "I'm your intelligent insurance assistant. Ask me anything about your claims, policies, or coverage."}
            </p>

            {/* Suggested Actions */}
            <div className="grid grid-cols-2 gap-2.5 w-full max-w-lg">
              {[
                { label: "Check my claim", icon: "▦", action: "What's the status of my claim?" },
                { label: "Review my coverage", icon: "◈", action: "Is my damage covered?" },
                { label: "Explain my deductible", icon: "◎", action: "How does my deductible work?" },
                { label: "Find required documents", icon: "◉", action: "What documents do I still need?" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => sendMessage(item.action)}
                  className="card card-hover flex items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-4 space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isProcessing && (
              <div className="animate-slide-in flex gap-2 items-center px-4 py-2 text-sm text-muted-foreground">
                <span className="tool-loading text-accent text-lg">◆</span>
                <span className="font-mono text-xs uppercase tracking-wider">
                  Processing your request...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="relative z-10">
        <Composer
          onSend={sendMessage}
          disabled={isProcessing}
          placeholder={
            hasMessages
              ? "Continue the conversation..."
              : `Ask ${currentCustomer?.name || "me"} anything...`
          }
        />
      </div>
    </div>
  );
}
