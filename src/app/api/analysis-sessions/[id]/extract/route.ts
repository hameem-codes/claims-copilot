import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateObject } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { PolicyExtractionSchema, ClaimExtractionSchema } from "@/types";

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

    // Await params object if Next.js version requires it (Next 15+)
    const resolvedParams = await context.params;
    const analysisSessionId = resolvedParams.id;

    if (!analysisSessionId) {
      return NextResponse.json({ error: "Missing analysis_session_id" }, { status: 400 });
    }

    // 2. Verify session ownership and retrieve document IDs
    const { data: session, error: sessionError } = await supabase
      .from("analysis_sessions")
      .select("policy_document_id, claim_document_id, policy_extracted_data, claim_extracted_data")
      .eq("id", analysisSessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Analysis session not found or unauthorized" }, { status: 403 });
    }

    const { policy_document_id, claim_document_id } = session;

    if (!policy_document_id && !claim_document_id) {
      return NextResponse.json({ error: "Missing both policy and claim documents" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractFacts = async (documentId: string, schema: any, documentType: string) => {
      // Retrieve chunks
      const { data: chunks, error: chunksError } = await admin
        .from("document_chunks")
        .select("chunk_index, content")
        .eq("document_id", documentId)
        .order("chunk_index", { ascending: true });

      if (chunksError || !chunks || chunks.length === 0) {
        throw new Error(`Failed to retrieve chunks for ${documentType} document`);
      }

      // Format context
      const contextText = chunks
        .map((c) => `[Chunk Index: ${c.chunk_index}]\n${c.content}`)
        .join("\n\n");

      const systemPrompt = `You are a highly precise insurance claims AI assistant. 
Your task is to extract structured facts from the provided ${documentType} document chunks.
You MUST output valid JSON matching the requested schema.

Rules:
1. Base all extractions ONLY on the provided document text.
2. DO NOT invent or guess missing information.
3. If a field's information is completely missing, return null or an empty array as required by the schema.
4. For EVERY extracted fact, you must provide its source context:
   - "document_id": exactly "${documentId}"
   - "chunk_index": the integer index of the chunk where you found the fact (listed as [Chunk Index: X] in the text)
   - "context_snippet": a brief, exact quote (max 20-30 words) from the text that proves the fact.
5. If the fact spans multiple chunks, use the most relevant chunk index.
6. If the value is null, the source must also be null.

Document Context:
${contextText}`;

      const { object } = await generateObject({
        model: groq("llama3-8b-8192"),
        schema,
        system: systemPrompt,
        messages: [{ role: "user", content: `Extract the ${documentType} facts from the provided text.` }],
        temperature: 0.1,
      });

      return object;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let policyFacts = (session as any).policy_extracted_data || null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let claimFacts = (session as any).claim_extracted_data || null;

    try {
      if (policy_document_id && !policyFacts) {
        policyFacts = await extractFacts(policy_document_id, PolicyExtractionSchema, "Policy");
      }
    } catch (e: unknown) {
      console.error("Policy extraction error:", e);
      return NextResponse.json({ error: `Policy extraction failed: ${(e as Error).message}` }, { status: 500 });
    }

    try {
      if (claim_document_id && !claimFacts) {
        claimFacts = await extractFacts(claim_document_id, ClaimExtractionSchema, "Claim");
      }
    } catch (e: unknown) {
      console.error("Claim extraction error:", e);
      return NextResponse.json({ error: `Claim extraction failed: ${(e as Error).message}` }, { status: 500 });
    }

    // 3. Save extraction results to the analysis session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: Record<string, any> = {};
    if (policyFacts) updatePayload.policy_extracted_data = policyFacts;
    if (claimFacts) updatePayload.claim_extracted_data = claimFacts;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("analysis_sessions")
      .update(updatePayload)
      .eq("id", analysisSessionId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save extraction results" }, { status: 500 });
    }

    return NextResponse.json({
      policy: policyFacts,
      claim: claimFacts,
    });

  } catch (error: unknown) {
    console.error("Extraction API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
