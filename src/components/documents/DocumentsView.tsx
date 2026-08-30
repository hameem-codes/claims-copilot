"use client";

import { useEffect, useState, useRef } from "react";
import { useApp } from "@/context/AppContext";

interface DocumentInfo {
  id: string;
  documentId?: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  documentType?: "claim" | "policy";
  claimId?: string | null;
  projectId?: string | null;
  customerId?: string | null;
  isPinned?: boolean;
}

export function DocumentsView() {
  const { setView } = useApp();
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Document type selector state: ONLY "claim" or "policy"
  const [documentType, setDocumentType] = useState<"claim" | "policy">("claim");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      await Promise.resolve();
      setLoading(true);
      setError(null);
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      setDocuments(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred while loading documents.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload document");
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchDocuments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred during upload.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleTogglePin = async (id: string, currentlyPinned?: boolean) => {
    try {
      setError(null);
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !currentlyPinned }),
      });
      if (!res.ok) throw new Error("Failed to update pin state");
      setDocuments(prev => prev.map(d => d.id === id ? { ...d, isPinned: !currentlyPinned } : d));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating pin state";
      setError(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      setDeletingId(id);
      setError(null);
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete document");
      }

      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred while deleting.";
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg)] relative">
      <div className="geo-dot-grid absolute inset-0 opacity-20 pointer-events-none" />
      <div className="relative z-10 px-6 py-6 max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-800 text-2xl tracking-tight">Documents</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage claims documents and files
            </p>
          </div>
          <button onClick={() => setView("copilot")} className="btn btn-sm">
            ← Back to Copilot
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-[var(--radius-sm)] border-2 border-error bg-error/10 text-error text-sm font-medium">
            <span className="font-bold mr-1">Error:</span> {error}
          </div>
        )}

        {/* Upload Controls */}
        <div className="card p-5 mb-6 bg-card flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full md:w-auto">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
              DOCUMENT TYPE:
            </span>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as "claim" | "policy")}
              className="px-3 py-1.5 text-xs font-body bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="claim">Claim</option>
              <option value="policy">Policy</option>
            </select>
          </div>

          <div className="w-full md:w-auto flex justify-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className={`btn btn-primary flex items-center gap-2 text-xs md:text-sm ${
                uploading ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {uploading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Uploading...
                </>
              ) : (
                <>
                  <span>+</span> Upload Document
                </>
              )}
            </button>
          </div>
        </div>

        {/* Documents Table / Grid */}
        {loading ? (
          <div className="text-center py-20">
            <span className="animate-spin inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full mb-3" />
            <p className="text-muted-foreground text-sm">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="card p-12 text-center bg-card shadow-sm">
            <div className="text-4xl mb-3">📂</div>
            <p className="font-heading font-700 text-lg mb-1">No documents found</p>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a claim or policy document to get started.
            </p>
            <button onClick={handleUploadClick} className="btn btn-sm">
              Upload First Document
            </button>
          </div>
        ) : (
          <div className="card overflow-hidden bg-card border-2 border-foreground">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-muted/70 border-b-2 border-foreground font-mono text-[0.65rem] text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">File Format</th>
                    <th className="px-4 py-3 font-semibold">Size</th>
                    <th className="px-4 py-3 font-semibold">Uploaded</th>
                    <th className="px-4 py-3 font-semibold">Document Type</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-foreground">
                  {[...documents].sort((a, b) => {
                    if (a.isPinned === b.isPinned) return 0;
                    return a.isPinned ? -1 : 1;
                  }).map((doc) => {
                    const isPolicy = doc.documentType === "policy" || doc.projectId;
                    return (
                      <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3.5 font-medium min-w-[150px]">
                          <a
                            href={`/api/documents/${doc.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-heading font-700 text-accent hover:underline flex items-center gap-1.5"
                          >
                            📄 {doc.name} {doc.isPinned && <span className="ml-1 text-xs" title="Pinned">📌</span>}
                          </a>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground font-mono text-[0.7rem]">
                          {doc.type.split("/")[1] || doc.type}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[0.7rem] text-muted-foreground">
                          {formatSize(doc.size)}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {formatDate(doc.uploadDate)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`pill ${isPolicy ? "pill-accent" : "pill-muted"} !text-[0.65rem] capitalize`}>
                            {isPolicy ? "Policy" : "Claim"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleTogglePin(doc.id, doc.isPinned)}
                              className={`btn btn-sm !py-1 !px-2.5 !text-[0.7rem] ${doc.isPinned ? "bg-accent text-white hover:bg-accent/80" : ""}`}
                            >
                              {doc.isPinned ? "Unpin" : "Pin"}
                            </button>
                            <a
                              href={`/api/documents/${doc.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm !py-1 !px-2.5 !text-[0.7rem]"
                            >
                              Open
                            </a>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              disabled={deletingId === doc.id}
                              className={`btn btn-sm !py-1 !px-2.5 !text-[0.7rem] hover:bg-error hover:text-white hover:border-error ${
                                deletingId === doc.id ? "opacity-60 cursor-not-allowed" : ""
                              }`}
                            >
                              {deletingId === doc.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
