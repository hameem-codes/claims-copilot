"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";

interface ComposerProps {
  onSend: (message: string, attachment?: { id: string, name: string, type: string, size: number }) => void;
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
  const [isListening, setIsListening] = useState(false);
  const [attachment, setAttachment] = useState<{ id: string, name: string, type: string, size: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large (max 10MB)");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload document");
      }

      const doc = await res.json();
      setAttachment({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        size: doc.size
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred during upload.";
      alert(msg);
    } finally {
      setUploading(false);
    }
  };

  const toggleListening = async () => {
    console.log("toggleListening called. isListening:", isListening, "recognitionRef.current:", !!recognitionRef.current);
    setSpeechError(null);

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
      recognitionRef.current = null;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log("SpeechRecognition not in window");
      setSpeechError("Voice recognition is not supported in this browser.");
      return;
    }

    // Request microphone access explicitly to trigger the prompt
    if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        console.log("Requesting mic permission via getUserMedia");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.warn("getUserMedia permission failed:", err);
        setSpeechError("Microphone access was denied. Please allow microphone access and try again.");
        return;
      }
    }

    let recognition;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      console.log("Constructing SpeechRecognition instance");
      recognition = new SpeechRecognition();
    } catch (err) {
      console.warn("Failed to construct SpeechRecognition:", err);
      setSpeechError("Voice recognition is not supported or was blocked by this browser.");
      setIsListening(false);
      recognitionRef.current = null;
      return;
    }

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let currentFinalTranscript = value ? value.trim() + " " : "";

    recognition.onstart = () => {
      console.log("Speech recognition started (onstart)");
      if (!isMountedRef.current) return;
      setIsListening(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      console.log("Speech recognition result received (onresult):", event);
      if (!isMountedRef.current) return;
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentFinalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      console.log("Updated value:", currentFinalTranscript + interimTranscript);
      setValue(currentFinalTranscript + interimTranscript);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.log("Speech recognition error event (onerror):", event.error);
      if (!isMountedRef.current) return;
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
      recognitionRef.current = null;

      switch (event.error) {
        case "network":
          setSpeechError("Voice recognition is temporarily unavailable. Please check your connection and try again.");
          break;
        case "not-allowed":
          setSpeechError("Microphone access was denied. Please allow microphone access and try again.");
          break;
        case "audio-capture":
          setSpeechError("Microphone unavailable. Please check your microphone.");
          break;
        case "service-not-allowed":
          setSpeechError("Speech recognition is unavailable in this browser.");
          break;
        case "language-not-supported":
          if (recognition.lang !== "en-US") {
             recognition.lang = "en-US";
             try { recognition.start(); } catch(e) {}
          }
          break;
        case "no-speech":
        case "aborted":
          // Silently handle
          break;
        default:
          break;
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition ended (onend)");
      if (!isMountedRef.current) return;
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      console.log("Calling recognition.start()");
      recognition.start();
    } catch (e) {
      console.warn("Failed to start speech recognition:", e);
      setIsListening(false);
      recognitionRef.current = null;
    }
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, attachment || undefined);
    setValue("");
    setAttachment(null);
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
    <div className="border-t-2 border-foreground bg-card flex flex-col">
      {/* Error Message */}
      {speechError && (
        <div className="px-4 pt-2 pb-1 text-xs text-error animate-in fade-in slide-in-from-top-2">
          {speechError}
        </div>
      )}

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

      {/* Attachment Area */}
      {attachment && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 bg-muted/50 rounded-[var(--radius-sm)] px-3 py-2 text-sm border-2 border-foreground w-max">
            <span className="text-xl">📄</span>
            <div className="flex flex-col">
              <span className="font-medium text-foreground truncate max-w-[200px]">{attachment.name}</span>
              <span className="text-[0.65rem] text-muted-foreground font-mono">{Math.round(attachment.size / 1024)} KB</span>
            </div>
            <button
              onClick={() => setAttachment(null)}
              className="ml-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-error/20 hover:text-error text-muted-foreground transition-colors font-bold"
              title="Remove attachment"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 pb-4 pt-2 flex items-end gap-2">
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSpeechError(null);
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
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || disabled}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${uploading ? 'opacity-50 animate-pulse' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              title="Attach file"
            >
              📎
            </button>
            <button
              onClick={toggleListening}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                isListening 
                  ? "text-error bg-error/10 animate-pulse border border-error/50" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title={isListening ? "Stop listening" : "Voice input"}
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
