"use client";

import type { ConversationMessage } from "@/types";
import { ToolExecutionCard } from "./ToolExecutionCard";
import { useTime, useIsClient } from "@/lib/hooks";

interface MessageBubbleProps {
  message: ConversationMessage;
}

// Simple markdown to HTML (enough for structured messages)
function renderMarkdown(text: string): string {
  let html = text
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-3 rounded-[8px] border-2 border-border font-mono text-xs overflow-x-auto my-2">$1</pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="font-heading font-700 text-base mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-heading font-700 text-lg mt-3 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-heading font-800 text-xl mt-3 mb-1">$1</h1>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-2" />');

  // Tables
  html = html.replace(
    /((?:^\|.+\|$\n?)+)/gm,
    (match) => {
      const rows = match.trim().split("\n").filter((r) => !r.match(/^\|[-\s|]+\|$/));
      if (rows.length === 0) return match;
      const header = rows[0];
      const body = rows.slice(1);
      const headerCells = header.split("|").filter((c) => c.trim()).map((c) => `<th>${c.trim()}</th>`).join("");
      const bodyRows = body.map((row) => {
        const cells = row.split("|").filter((c) => c.trim()).map((c) => `<td>${c.trim()}</td>`).join("");
        return `<tr>${cells}</tr>`;
      }).join("");
      return `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    }
  );

  // Lists
  html = html.replace(
    /^(• |- |\d+\. )(.+)$/gm,
    '<li>$2</li>'
  );
  html = html.replace(
    /(<li>.*<\/li>\n?)+/g,
    (match) => {
      const isOrdered = match.includes("1.");
      return `<${isOrdered ? "ol" : "ul"} class="pl-5 my-1.5">${match}</${isOrdered ? "ol" : "ul"}>`;
    }
  );

  // Paragraphs — split on double newline for blocks, single newline for line breaks
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      block = block.trim();
      if (!block) return "";
      // If block already starts with an HTML tag, leave it alone
      if (block.startsWith("<") && !block.startsWith("<li")) return block;
      // Convert single newlines to <br/>
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length === 0) return "";
      // If first line is a header-like bold line, render as a section header
      if (lines[0].startsWith("<strong>") && lines.length === 1) {
        return `<p class="mb-2">${lines[0]}</p>`;
      }
      // Check if all lines are list items
      const allListItems = lines.every((l) => l.startsWith("<li"));
      if (allListItems) {
        return `<div class="my-2">${lines.join("")}</div>`;
      }
      // Render as paragraph with line breaks
      return `<p>${lines.join("<br/>")}</p>`;
    })
    .filter(Boolean)
    .join("\n");

  return html;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const time = useTime();
  const isClient = useIsClient();

  const displayTime = isClient ? (time.formatted || "") : "";

  return (
    <div className={`animate-slide-in ${isUser ? "flex justify-end" : ""}`}>
      <div
        className={`${
          isUser
            ? "max-w-[70%] bg-accent text-white border-2 border-[#6D28D9] rounded-[16px_16px_4px_16px] shadow-[3px_3px_0_#6D28D9] px-4 py-3"
            : "max-w-[85%] bg-card text-foreground border-2 border-foreground rounded-[16px_16px_16px_4px] shadow-[4px_4px_0_var(--foreground)] px-4 py-3"
        }`}
      >
        {/* Tool calls */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <ToolExecutionCard toolCalls={message.toolCalls} />
        )}

        {/* Message content */}
        <div
          className={`message-content text-sm leading-relaxed ${isUser ? "text-white" : ""}`}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
        />

        {/* Timestamp */}
        <div className={`mt-2 text-[0.6rem] font-mono ${isUser ? "text-white/60" : "text-muted-foreground"}`}>
          {displayTime}
        </div>
      </div>
    </div>
  );
}
