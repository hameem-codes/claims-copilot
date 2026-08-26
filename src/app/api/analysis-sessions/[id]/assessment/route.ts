import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateObject } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { AssessmentSchema } from "@/types";

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
      .select("policy_document_id, claim_document_id, policy_extracted_data, claim_extracted_data, comparison_data, discrepancy_data, assessment_data")
      .eq("id", analysisSessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Analysis session not found or unauthorized" }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionAny = session as any;

    if (!regenerate && sessionAny.assessment_data) {
      return NextResponse.json({ assessment: sessionAny.assessment_data });
    }

    const { policy_document_id, claim_document_id } = session;

    if (!policy_document_id || !claim_document_id) {
      return NextResponse.json({ error: "Both policy and claim documents must exist to assess" }, { status: 400 });
    }

    if (!sessionAny.policy_extracted_data || !sessionAny.claim_extracted_data || !sessionAny.comparison_data) {
      return NextResponse.json({ error: "Extracted facts and comparison data must exist before assessing" }, { status: 400 });
    }

    // Load chunks for RAG context in case specific source evidence needs to be cited
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

    const systemPrompt = `You are a concise, highly precise AI claims assessor.
Your task is to generate a final summary assessment based on the extracted facts, comparison data, and discrepancy analysis.

IMPORTANT RULES:
1. This is an AI-assisted assessment, NOT a definitive insurance approval or denial.
2. The summary MUST be concise (maximum 3 sentences). Do NOT generate a long essay.
3. NEVER claim certainty when evidence is insufficient or conflicts exist. If uncertain, clearly state it in 'concerns'.
4. DO NOT invent policy terms, coverage, limits, exclusions, dates, amounts, or claim facts.
5. EVERY material conclusion must be supported by existing comparison/discrepancy data or document evidence in the sources array.
6. Use the provided structured data first. Rely on raw document chunks only for providing explicit source citations or resolving nuance.
7. Missing information MUST remain missing (document it under 'missing_information').
8. Format outputs concisely (e.g. short bullets for supporting_factors and concerns).

EXTRACTED POLICY FACTS:
${JSON.stringify(sessionAny.policy_extracted_data, null, 2)}

EXTRACTED CLAIM FACTS:
${JSON.stringify(sessionAny.claim_extracted_data, null, 2)}

COMPARISON RESULTS:
${JSON.stringify(sessionAny.comparison_data, null, 2)}

DISCREPANCY RESULTS:
${sessionAny.discrepancy_data ? JSON.stringify(sessionAny.discrepancy_data, null, 2) : "No discrepancies identified."}

RAW POLICY DOCUMENT CHUNKS:
${policyChunks}

RAW CLAIM DOCUMENT CHUNKS:
${claimChunks}
`;

    const { object: assessmentResult } = await generateObject({
      model: groq("llama3-8b-8192"),
      schema: AssessmentSchema,
      system: systemPrompt,
      messages: [{ role: "user", content: "Generate the final claim assessment." }],
      temperature: 0.1,
    });

    // 3. Save assessment results
    const updatePayload = {
      assessment_data: assessmentResult
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("analysis_sessions")
      .update(updatePayload)
      .eq("id", analysisSessionId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save assessment results" }, { status: 500 });
    }

    return NextResponse.json({
      assessment: assessmentResult
    });

  } catch (error: unknown) {
    console.error("Assessment API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
