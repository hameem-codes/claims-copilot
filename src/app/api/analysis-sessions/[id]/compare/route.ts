import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateObject } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { ComparisonSchema } from "@/types";

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

    // 2. Verify session ownership and retrieve document IDs/Data
    const { data: session, error: sessionError } = await supabase
      .from("analysis_sessions")
      .select("policy_document_id, claim_document_id, policy_extracted_data, claim_extracted_data, comparison_data")
      .eq("id", analysisSessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Analysis session not found or unauthorized" }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionAny = session as any;

    if (!regenerate && sessionAny.comparison_data) {
      return NextResponse.json({ comparison: sessionAny.comparison_data });
    }

    const { policy_document_id, claim_document_id } = session;

    if (!policy_document_id || !claim_document_id) {
      return NextResponse.json({ error: "Both policy and claim documents must exist to compare" }, { status: 400 });
    }

    if (!sessionAny.policy_extracted_data || !sessionAny.claim_extracted_data) {
      return NextResponse.json({ error: "Extracted facts must exist before comparing" }, { status: 400 });
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

    const systemPrompt = `You are an expert, highly precise AI insurance claims assessor.
Your task is to analyze the provided extracted facts and raw document evidence for a Policy and a Claim, and output a strict structured comparison evaluating coverage, limits, exclusions, dates, and material clauses.

IMPORTANT RULES:
1. Use the provided stored extracted Policy + Claim facts FIRST.
2. Use the raw document chunks when additional evidence is required (e.g. evaluating specific exclusion wording).
3. DO NOT invent missing policy terms, limits, deductibles, exclusions, dates, or claim facts.
4. If information is missing, explicitly state it in missing_information and leave optional fields null.
5. EVERY material conclusion MUST have supporting source evidence in the 'sources' array using the provided [Document ID] and [Chunk Index].
6. If evidence conflicts, explicitly report the conflict in the explanations.
7. DO NOT state that a claim is legally or definitively approved/denied. This is an AI assessment.
8. If evidence is insufficient to determine coverage, set coverage_status to 'uncertain'.

EXTRACTED POLICY FACTS:
${JSON.stringify(sessionAny.policy_extracted_data, null, 2)}

EXTRACTED CLAIM FACTS:
${JSON.stringify(sessionAny.claim_extracted_data, null, 2)}

RAW POLICY DOCUMENT CHUNKS:
${policyChunks}

RAW CLAIM DOCUMENT CHUNKS:
${claimChunks}
`;

    const { object: comparisonResult } = await generateObject({
      model: groq("llama3-8b-8192"),
      schema: ComparisonSchema,
      system: systemPrompt,
      messages: [{ role: "user", content: "Compare the policy and claim to assess coverage." }],
      temperature: 0.1,
    });

    // 3. Save comparison results
    const updatePayload = {
      comparison_data: comparisonResult
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("analysis_sessions")
      .update(updatePayload)
      .eq("id", analysisSessionId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save comparison results" }, { status: 500 });
    }

    return NextResponse.json({
      comparison: comparisonResult
    });

  } catch (error: unknown) {
    console.error("Comparison API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
