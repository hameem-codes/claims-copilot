"use client";

import { useState, useRef, type KeyboardEvent } from "react";

interface ComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const quickActions = [
  "Check claim status",
  "Explain my coverage",
  "What documents do I need?",
  "Show me my policy details",
];

export function Composer({ onSend, disabled, placeholder = "Ask about your claim..." }: ComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  return (
    <div className="border-t-2 border-foreground bg-card">
      {/* Quick Actions */}
      <div className="px-4 pt-3 pb-1 flex flex-wrap gap-1.5">
        {quickActions.map((action) => (
          <button
            key={action}
            onClick={() => {
              onSend(action);
            }}
            disabled={disabled}
            className="btn btn-sm !rounded-[var(--radius-sm)] !shadow-[2px_2px_0_var(--foreground)] !border-[1.5px] text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="px-4 pb-4 pt-2 flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              handleInput();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-3 pr-10 text-sm font-body bg-input border-2 border-foreground rounded-[var(--radius-md)] resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder:text-muted-foreground disabled:opacity-50"
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
            <button
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Attach file"
            >
              📎
            </button>
            <button
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Voice input"
            >
              🎤
            </button>
          </div>
        </div>
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="btn btn-primary btn-lg !rounded-[var(--radius-md)] shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ minWidth: 48, minHeight: 48 }}
        >
          {disabled ? (
            <span className="tool-loading">◌</span>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
