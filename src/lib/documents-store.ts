import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

export interface DocumentInfo {
  id: string;
  documentId?: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  uploadedAt: string;
  documentType?: "claim" | "policy";
  customerId?: string | null;
  claimId?: string | null;
  projectId?: string | null;
  document_type?: "policy" | "claim" | null;
  filePath: string;
  isPinned?: boolean;
}

// In-memory fallback if Supabase is unconfigured in development
const inMemoryDocs: DocumentInfo[] = [];
const inMemoryFiles: Map<string, { buffer: Buffer; type: string }> = new Map();

function getAdminOrNull() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export async function listDocuments(customerId?: string | null): Promise<DocumentInfo[]> {
  try {
    const admin = getAdminOrNull();
    if (admin) {
      let query = admin.from("documents").select("*").order("created_at", { ascending: false });
      if (customerId) {
        query = query.eq("user_id", customerId);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data.map((d: Record<string, unknown>) => {
          const docType: "claim" | "policy" = 
            (d.document_type === "policy" || d.policy_id) ? "policy" : "claim";

          return {
            id: String(d.id),
            documentId: String(d.id),
            name: String(d.original_filename || d.name || "Untitled"),
            type: String(d.file_type || (String(d.original_filename || "").endsWith(".pdf") ? "application/pdf" : "image/jpeg")),
            size: typeof d.size === "number" ? d.size : 0,
            uploadDate: String(d.created_at || new Date().toISOString()),
            uploadedAt: String(d.created_at || new Date().toISOString()),
            documentType: docType,
            claimId: (d.claim_id as string) || null,
            projectId: (d.policy_id as string) || (d.project_id as string) || null,
            customerId: (d.user_id as string) || null,
            filePath: (d.storage_path as string) || "",
            isPinned: Boolean(d.is_pinned),
          };
        });
      }
    }
  } catch (err) {
    console.warn("Supabase listDocuments fallback:", err);
  }

  // Fallback
  if (customerId) {
    return inMemoryDocs.filter((d) => d.customerId === customerId);
  }
  return inMemoryDocs;
}

export async function getDocument(id: string): Promise<DocumentInfo | null> {
  try {
    const admin = getAdminOrNull();
    if (admin) {
      const { data, error } = await admin.from("documents").select("*").eq("id", id).single();
      if (!error && data) {
        const docType: "claim" | "policy" = 
          (data.document_type === "policy" || data.policy_id) ? "policy" : "claim";

        return {
          id: String(data.id),
          documentId: String(data.id),
          name: String(data.original_filename || data.name || "Untitled"),
          type: String(data.file_type || (String(data.original_filename || "").endsWith(".pdf") ? "application/pdf" : "image/jpeg")),
          size: typeof data.size === "number" ? data.size : 0,
          uploadDate: String(data.created_at || new Date().toISOString()),
          uploadedAt: String(data.created_at || new Date().toISOString()),
          documentType: docType,
          claimId: (data.claim_id as string) || null,
          projectId: (data.policy_id as string) || (data.project_id as string) || null,
          customerId: (data.user_id as string) || null,
          filePath: (data.storage_path as string) || "",
          isPinned: Boolean(data.is_pinned),
        };
      }
    }
  } catch (err) {
    console.warn("Supabase getDocument fallback:", err);
  }

  return inMemoryDocs.find((d) => d.id === id) || null;
}

export async function getDocumentFileBuffer(doc: DocumentInfo): Promise<{ buffer: Buffer; type: string } | null> {
  try {
    const admin = getAdminOrNull();
    if (admin && doc.filePath) {
      const { data, error } = await admin.storage.from("documents").download(doc.filePath);
      if (!error && data) {
        const arrayBuf = await data.arrayBuffer();
        return { buffer: Buffer.from(arrayBuf), type: doc.type };
      }
    }
  } catch (err) {
    console.warn("Supabase getDocumentFileBuffer fallback:", err);
  }

  const inMem = inMemoryFiles.get(doc.id);
  if (inMem) return inMem;
  return null;
}

export async function saveDocument(
  fileBuffer: Buffer,
  name: string,
  type: string,
  size: number,
  options?: { documentType?: "claim" | "policy"; claimId?: string | null; projectId?: string | null }
): Promise<DocumentInfo> {
  const id = randomUUID();
  const isoString = new Date().toISOString();
  const storagePath = `uploads/${id}-${name}`;
  const docType = options?.documentType || (options?.projectId ? "policy" : "claim");

  try {
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    const userId = user?.id || null;

    const admin = getAdminOrNull();
    if (admin) {
      // 1. Upload to Supabase Storage
      const { error: uploadErr } = await admin.storage.from("documents").upload(storagePath, fileBuffer, {
        contentType: type,
        upsert: true,
      });

      if (!uploadErr) {
        // 2. Insert into documents table
        const { data: docRow, error: insertErr } = await admin
          .from("documents")
          .insert({
            id,
            storage_path: storagePath,
            original_filename: name,
            size: size,
            file_type: type,
            user_id: userId,
            claim_id: options?.claimId || null,
            policy_id: options?.projectId || null,
            ocr_status: "complete",
          })
          .select()
          .single();

        if (!insertErr && docRow) {
          return {
            id: String(docRow.id),
            documentId: String(docRow.id),
            name,
            type,
            size,
            uploadDate: isoString,
            uploadedAt: isoString,
            documentType: docType,
            claimId: options?.claimId || null,
            projectId: options?.projectId || null,
            customerId: userId,
            filePath: storagePath,
            isPinned: false,
          };
        }
      }
    }
  } catch (err) {
    console.warn("Supabase saveDocument fallback:", err);
  }

  const fallbackDoc: DocumentInfo = {
    id,
    documentId: id,
    name,
    type,
    size,
    uploadDate: isoString,
    uploadedAt: isoString,
    documentType: docType,
    claimId: options?.claimId || null,
    projectId: options?.projectId || null,
    customerId: null,
    filePath: storagePath,
    isPinned: false,
  };

  inMemoryDocs.unshift(fallbackDoc);
  inMemoryFiles.set(id, { buffer: fileBuffer, type });
  return fallbackDoc;
}

export async function deleteDocument(id: string): Promise<boolean> {
  try {
    const admin = getAdminOrNull();
    if (admin) {
      const doc = await getDocument(id);
      if (doc?.filePath) {
        await admin.storage.from("documents").remove([doc.filePath]);
      }
      const { error } = await admin.from("documents").delete().eq("id", id);
      if (!error) return true;
    }
  } catch (err) {
    console.warn("Supabase deleteDocument fallback:", err);
  }

  const idx = inMemoryDocs.findIndex((d) => d.id === id);
  if (idx !== -1) {
    inMemoryDocs.splice(idx, 1);
    inMemoryFiles.delete(id);
    return true;
  }
  return false;
}

export async function updateDocument(id: string, updates: Partial<DocumentInfo>): Promise<DocumentInfo | null> {
  try {
    const admin = getAdminOrNull();
    if (admin) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
      if (updates.name !== undefined) dbUpdates.original_filename = updates.name;

      const { data, error } = await admin.from("documents").update(dbUpdates).eq("id", id).select().single();
      if (!error && data) {
        return {
          id: String(data.id),
          documentId: String(data.id),
          name: String(data.original_filename || data.name || updates.name || "Untitled"),
          type: String(data.file_type || (String(data.original_filename || "").endsWith(".pdf") ? "application/pdf" : "image/jpeg")),
          size: typeof data.size === "number" ? data.size : 0,
          uploadDate: String(data.created_at || new Date().toISOString()),
          uploadedAt: String(data.created_at || new Date().toISOString()),
          claimId: (data.claim_id as string) || null,
          projectId: (data.policy_id as string) || (data.project_id as string) || null,
          customerId: (data.user_id as string) || null,
          filePath: (data.storage_path as string) || "",
          isPinned: Boolean(data.is_pinned),
        };
      }
    }
  } catch (err) {
    console.warn("Supabase updateDocument fallback:", err);
  }

  const idx = inMemoryDocs.findIndex((d) => d.id === id);
  if (idx !== -1) {
    inMemoryDocs[idx] = { ...inMemoryDocs[idx], ...updates };
    return inMemoryDocs[idx];
  }
  return null;
}
