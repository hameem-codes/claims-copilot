"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { supportArticles } from "@/data/mock-data";

export function SupportView() {
  const { setView } = useApp();
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? supportArticles.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.content.toLowerCase().includes(search.toLowerCase()) ||
          a.tags.some((t) => t.includes(search.toLowerCase()))
      )
    : supportArticles;

  const categories = [...new Set(filtered.map((a) => a.category))];

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg)] relative">
      <div className="geo-dot-grid absolute inset-0 opacity-20 pointer-events-none" />
      <div className="relative z-10 px-6 py-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-800 text-2xl tracking-tight">Support Resources</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {supportArticles.length} articles available
            </p>
          </div>
          <button onClick={() => setView("copilot")} className="btn btn-sm">
            ← Back to Copilot
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search support articles..."
            className="w-full px-4 py-3 text-sm font-body bg-input border-2 border-foreground rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder:text-muted-foreground"
          />
        </div>

        {/* Articles by Category */}
        {categories.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-heading font-700 text-lg mb-1">No results found</p>
            <p className="text-sm text-muted-foreground">Try a different search term.</p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category} className="mb-6">
              <h2 className="font-heading font-700 text-lg mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                {category}
              </h2>
              <div className="space-y-2">
                {filtered
                  .filter((a) => a.category === category)
                  .map((article) => (
                    <div key={article.id} className="card card-hover p-4">
                      <h3 className="font-heading font-700 text-sm mb-1.5">
                        {article.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                        {article.content}
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        {article.tags.map((tag) => (
                          <span key={tag} className="pill pill-muted !text-[0.5rem]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
