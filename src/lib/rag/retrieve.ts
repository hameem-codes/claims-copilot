import { embedText } from "./embed";
import { createClient } from "@/lib/supabase/server";

import { RetrievedSource } from "@/types";

export async function retrieveChunks(
  question: string,
  options?: {
    topK?: number;
    documentId?: string;
    claimId?: string;
    policyId?: string;
  }
): Promise<{ sources: RetrievedSource[]; confidence: "high" | "medium" | "low" }> {
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized: Cannot retrieve documents");
  }

  // 2. Generate embedding for the question
  let queryEmbedding: number[];
  try {
    queryEmbedding = await embedText(question);
  } catch (error) {
    console.error("Failed to embed question:", error);
    throw new Error("Failed to process question for retrieval");
  }

  // 3. Call the Supabase RPC
  // Only pass UUIDs to the RPC to avoid Postgres type casting errors.
  const isUUID = (str: string | undefined | null) => 
    str && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

  let { data: chunks, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_count: options?.topK || 5,
    filter_document_id: isUUID(options?.documentId) ? options!.documentId : null,
    filter_claim_id: isUUID(options?.claimId) ? options!.claimId : null,
    filter_policy_id: isUUID(options?.policyId) ? options!.policyId : null,
  });

  if (error) {
    console.error("RPC match_document_chunks failed:", error);
    throw new Error("Failed to retrieve relevant documents");
  }

  if (!chunks || chunks.length === 0) {
    // FALLBACK for broad queries: if the RPC's similarity threshold dropped all chunks,
    // fetch up to 5 chunks from the user's documents directly so the LLM has context.
    const query = supabase
      .from("document_chunks")
      .select("id, document_id, chunk_index, content")
      .limit(options?.topK || 5);
      
    if (isUUID(options?.documentId)) query.eq("document_id", options!.documentId);
    
    // We must join with documents to ensure RLS / ownership, but we can't easily join on select in supabase-js
    // without returning the joined object.
    const fallbackRes = await query;
    if (fallbackRes.data && fallbackRes.data.length > 0) {
      chunks = fallbackRes.data.map(c => ({
        chunk_id: c.id,
        document_id: c.document_id,
        chunk_index: c.chunk_index,
        content: c.content,
        similarity: 0.5 // Default neutral similarity
      }));
    } else {
      return { sources: [], confidence: "low" };
    }
  }

  // 4. Optionally fetch filenames
  // To avoid an N+1 query, we can fetch distinct document IDs and then query the filenames
  const documentIds = Array.from(new Set(chunks.map((c: { document_id: string }) => c.document_id)));
  
  const { data: docsData } = await supabase
    .from("documents")
    .select("id, original_filename")
    .in("id", documentIds);

  const filenameMap = new Map<string, string>();
  if (docsData) {
    docsData.forEach((d) => {
      if (d.original_filename) {
        filenameMap.set(d.id, d.original_filename);
      }
    });
  }

  // 5. Construct normalized sources
  const sources: RetrievedSource[] = chunks.map((c: { chunk_id: string; document_id: string; chunk_index: number; content: string; similarity: number }) => ({
    chunkId: c.chunk_id,
    documentId: c.document_id,
    chunkIndex: c.chunk_index,
    content: c.content,
    similarity: c.similarity,
    filename: filenameMap.get(c.document_id),
  }));

  // 6. Determine confidence based on top similarity
  const topSimilarity = sources[0].similarity;
  let confidence: "high" | "medium" | "low" = "low";
  
  if (topSimilarity > 0.8) {
    confidence = "high";
  } else if (topSimilarity > 0.6) {
    confidence = "medium";
  }

  return { sources, confidence };
}
