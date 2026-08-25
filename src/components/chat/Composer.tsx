"use client";

import { useState, useRef, type KeyboardEvent, type ChangeEvent } from "react";

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
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      console.log("[Composer Debug] supabase.auth.getSession():", session ? "Session Exists" : "No Session");
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Upload failed with status " + response.status);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      // Notify the user that the file was uploaded
      onSend(`I've uploaded a new document: ${file.name}. Can you confirm it's ready?`);
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Failed to upload document: ${error.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
            disabled={disabled || isUploading}
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
            disabled={disabled || isUploading}
            rows={1}
            className="w-full px-4 py-3 pr-10 text-sm font-body bg-input border-2 border-foreground rounded-[var(--radius-md)] resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder:text-muted-foreground disabled:opacity-50"
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="application/pdf,image/png,image/jpeg"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${isUploading ? 'animate-pulse opacity-50' : ''}`}
              title="Attach file"
            >
              📎
            </button>
            <button
              disabled={disabled || isUploading}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              title="Voice input"
            >
              🎤
            </button>
          </div>
        </div>
        <button
          onClick={handleSend}
          disabled={disabled || isUploading || !value.trim()}
          className="btn btn-primary btn-lg !rounded-[var(--radius-md)] shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ minWidth: 48, minHeight: 48 }}
        >
          {disabled || isUploading ? (
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
