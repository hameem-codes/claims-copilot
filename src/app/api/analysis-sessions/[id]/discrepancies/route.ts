import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateObject } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { DiscrepancySchema } from "@/types";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export const maxDuration = 120;

export async function POST(
  req: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    // 1. Authenticate User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params if needed
    const resolvedParams = await context.params;
    const analysisSessionId = resolvedParams.id;

    if (!analysisSessionId) {
      return NextResponse.json({ error: "Missing analysis_session_id" }, { status: 400 });
    }

    // Parse regenerate flag
    let regenerate = false;
    try {
      const body = await req.json();
      regenerate = body.regenerate === true;
    } catch {
      // Ignore body parsing errors
    }

    // 2. Verify session ownership and retrieve data
    const { data: session, error: sessionError } = await supabase
      .from("analysis_sessions")
      .select("policy_document_id, claim_document_id, policy_extracted_data, claim_extracted_data, comparison_data, discrepancy_data")
      .eq("id", analysisSessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Analysis session not found or unauthorized" }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionAny = session as any;

    if (!regenerate && sessionAny.discrepancy_data) {
      return NextResponse.json({ discrepancies: sessionAny.discrepancy_data });
    }

    const { policy_document_id, claim_document_id } = session;

    if (!policy_document_id || !claim_document_id) {
      return NextResponse.json({ error: "Both policy and claim documents must exist to detect discrepancies" }, { status: 400 });
    }

    if (!sessionAny.policy_extracted_data || !sessionAny.claim_extracted_data || !sessionAny.comparison_data) {
      return NextResponse.json({ error: "Extracted facts and comparison data must exist before detecting discrepancies" }, { status: 400 });
    }

    // Load chunks for RAG context
    const loadChunks = async (documentId: string, docType: string) => {
      const { data: chunks, error } = await admin
        .from("document_chunks")
        .select("chunk_index, content")
        .eq("document_id", documentId)
        .order("chunk_index", { ascending: true });

      if (error || !chunks) return "";
      return chunks.map(c => `[${docType} Document ID: ${documentId} | Chunk Index: ${c.chunk_index}]\n${c.content}`).join("\n\n");
    };

    const policyChunks = await loadChunks(policy_document_id, "Policy");
    const claimChunks = await loadChunks(claim_document_id, "Claim");

    const systemPrompt = `You are a meticulous AI insurance fraud and discrepancy detection specialist.
Your task is to analyze the extracted facts, the comparison assessment, and the raw document evidence to detect discrepancies, contradictions, and missing evidence between the Policy and the Claim.

IMPORTANT RULES:
1. ONLY flag a discrepancy if it is supported by evidence in the provided data.
2. DO NOT invent discrepancies or hallucinate facts.
3. If evidence is insufficient, mark it as uncertain (or mention it under 'Missing Evidence') rather than assuming.
4. Distinguish clearly between an actual contradiction (e.g. claim amount exceeds limit) and missing information (e.g. incident date not stated).
5. EVERY discrepancy MUST include source references using the [Document ID] and [Chunk Index] provided in the text.
6. Do not make legal/definitive claim decisions (e.g. "claim is denied"). Frame them as observations.

EXTRACTED POLICY FACTS:
${JSON.stringify(sessionAny.policy_extracted_data, null, 2)}

EXTRACTED CLAIM FACTS:
${JSON.stringify(sessionAny.claim_extracted_data, null, 2)}

PREVIOUS COMPARISON RESULTS:
${JSON.stringify(sessionAny.comparison_data, null, 2)}

RAW POLICY DOCUMENT CHUNKS:
${policyChunks}

RAW CLAIM DOCUMENT CHUNKS:
${claimChunks}
`;

    const { object: discrepancyResult } = await generateObject({
      model: groq("groq/compound"),
      schema: DiscrepancySchema,
      system: systemPrompt,
      messages: [{ role: "user", content: "Detect discrepancies between the policy and claim." }],
      temperature: 0.1,
    });

    // 3. Save discrepancy results
    const updatePayload = {
      discrepancy_data: discrepancyResult
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("analysis_sessions")
      .update(updatePayload)
      .eq("id", analysisSessionId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save discrepancy results" }, { status: 500 });
    }

    return NextResponse.json({
      discrepancies: discrepancyResult
    });

  } catch (error: unknown) {
    console.error("Discrepancy API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
