import { embedText } from "./embed";
import { createClient } from "@/lib/supabase/server";
import { RetrievedSource } from "@/types";
import { analyzeQuestion } from "./query-understanding";

export async function retrieveChunks(
  question: string,
  options?: {
    topK?: number;
    documentId?: string;
    claimId?: string;
    policyId?: string;
    history?: Array<{ role: string; content: string }>;
  }
): Promise<{ sources: RetrievedSource[]; confidence: "high" | "medium" | "low" }> {
  const supabase = await createClient();

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized: Cannot retrieve documents");
  }

  // 2. Perform query analysis and expansion
  const { expandedQueries } = analyzeQuestion(question, options?.history);

  const isUUID = (str: string | undefined | null) =>
    Boolean(str && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str));

  interface MatchedChunk {
    chunk_id: string;
    document_id: string;
    chunk_index: number;
    content: string;
    similarity: number;
  }

  const chunkMap = new Map<string, MatchedChunk>();
  const topK = options?.topK || 6;

  // 3. Multi-Query Vector Retrieval
  for (const queryStr of expandedQueries) {
    try {
      const queryEmbedding = await embedText(queryStr);

      // Attempt 1: Query with explicit filters if provided
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)("match_document_chunks", {
        query_embedding: queryEmbedding,
        match_count: topK,
        filter_document_id: isUUID(options?.documentId) ? options!.documentId : null,
        filter_claim_id: isUUID(options?.claimId) ? options!.claimId : null,
        filter_policy_id: isUUID(options?.policyId) ? options!.policyId : null,
      });

      let results: MatchedChunk[] = (data as MatchedChunk[]) || [];

      // Attempt 2: If metadata filters produced 0 results (e.g. document claim_id is null in DB),
      // fallback to user-level matching (RPC checks d.user_id = auth.uid())
      if ((!results || results.length === 0) && (options?.claimId || options?.policyId)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fallbackRpc = await (supabase.rpc as any)("match_document_chunks", {
          query_embedding: queryEmbedding,
          match_count: topK,
          filter_document_id: isUUID(options?.documentId) ? options!.documentId : null,
          filter_claim_id: null,
          filter_policy_id: null,
        });
        if (fallbackRpc.data) {
          results = fallbackRpc.data as MatchedChunk[];
        }
      }

      if (!error && results) {
        for (const c of results) {
          const existing = chunkMap.get(c.chunk_id);
          if (!existing || c.similarity > existing.similarity) {
            chunkMap.set(c.chunk_id, c);
          }
        }
      }
    } catch (err) {
      console.error(`Retrieval failed for query variation "${queryStr}":`, err);
    }
  }

  let sortedChunks = Array.from(chunkMap.values()).sort((a, b) => b.similarity - a.similarity);

  // 4. Fallback for broad queries if vector similarity returned 0 chunks across all queries
  if (sortedChunks.length === 0) {
    const query = supabase
      .from("document_chunks")
      .select("id, document_id, chunk_index, content")
      .limit(topK);

    if (isUUID(options?.documentId)) {
      query.eq("document_id", options!.documentId as string);
    }

    const fallbackRes = await query;
    if (fallbackRes.data && fallbackRes.data.length > 0) {
      sortedChunks = (fallbackRes.data as Array<{ id: string; document_id: string; chunk_index: number; content: string }>).map((c) => ({
        chunk_id: c.id,
        document_id: c.document_id,
        chunk_index: c.chunk_index,
        content: c.content,
        similarity: 0.5, // Neutral similarity score for direct fallback
      }));
    } else {
      return { sources: [], confidence: "low" };
    }
  }

  // Keep top K candidates
  const finalChunks = sortedChunks.slice(0, topK);

  // 5. Fetch filenames and document types for sources
  const documentIds = Array.from(new Set(finalChunks.map((c) => c.document_id)));

  const { data: docsData } = await supabase
    .from("documents")
    .select("id, original_filename, document_type")
    .in("id", documentIds);

  const filenameMap = new Map<string, string>();
  const docTypeMap = new Map<string, "policy" | "claim">();

  if (docsData) {
    (docsData as Array<{ id: string; original_filename?: string | null; document_type?: string | null }>).forEach((d) => {
      if (d.original_filename) {
        filenameMap.set(d.id, d.original_filename);
      }
      if (d.document_type === "policy" || d.document_type === "claim") {
        docTypeMap.set(d.id, d.document_type);
      }
    });
  }

  // 6. Construct normalized sources
  const sources: RetrievedSource[] = finalChunks.map((c) => {
    let pageNumber = undefined;
    const pageMatch = c.content.match(/\[Page (\d+)\]/i);
    if (pageMatch) {
      pageNumber = parseInt(pageMatch[1], 10);
    }

    return {
      chunkId: c.chunk_id,
      documentId: c.document_id,
      documentType: docTypeMap.get(c.document_id),
      documentName: filenameMap.get(c.document_id),
      chunkIndex: c.chunk_index,
      content: c.content,
      similarity: c.similarity,
      filename: filenameMap.get(c.document_id),
      pageNumber,
    };
  });

  // 7. Calculate confidence rating based on top similarity
  const topSimilarity = sources.length > 0 ? sources[0].similarity : 0;
  let confidence: "high" | "medium" | "low" = "low";
  if (topSimilarity > 0.75) {
    confidence = "high";
  } else if (topSimilarity > 0.5) {
    confidence = "medium";
  }

  return { sources, confidence };
}
