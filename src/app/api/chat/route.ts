import { NextRequest, NextResponse } from "next/server";
import { retrieveChunks } from "@/lib/rag/retrieve";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createClient } from "@/lib/supabase/server";
import { RetrievedSource } from "@/types";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export const maxDuration = 60; // Max duration for AI response

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate incoming message payload
    const body = await req.json();
    const { messages, activeClaimId, activePolicyId, analysisSessionId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user" || !lastMessage.content) {
      return NextResponse.json({ error: "Last message must be from user with content" }, { status: 400 });
    }

    const question = lastMessage.content;

    let targetPolicyDocId: string | null = null;
    let targetClaimDocId: string | null = null;

    // 2b. If analysisSessionId is provided, prioritize session documents
    if (analysisSessionId) {
      const { data: session } = await supabase
        .from("analysis_sessions")
        .select("policy_document_id, claim_document_id")
        .eq("id", analysisSessionId)
        .single<{ policy_document_id: string; claim_document_id: string }>();

      if (session) {
        targetPolicyDocId = session.policy_document_id;
        targetClaimDocId = session.claim_document_id;
      }
    }

    // 3. Retrieve relevant chunks using adaptive multi-query RAG
    let allSources: RetrievedSource[] = [];

    try {
      if (analysisSessionId && (targetPolicyDocId || targetClaimDocId)) {
        if (targetPolicyDocId) {
          const res = await retrieveChunks(question, {
            topK: 4,
            documentId: targetPolicyDocId,
            history: messages,
          });
          allSources.push(...res.sources);
        }
        if (targetClaimDocId) {
          const res = await retrieveChunks(question, {
            topK: 4,
            documentId: targetClaimDocId,
            history: messages,
          });
          allSources.push(...res.sources);
        }
      } else {
        const res = await retrieveChunks(question, {
          topK: 6,
          claimId: activeClaimId,
          policyId: activePolicyId,
          history: messages,
        });
        allSources = res.sources;
      }
    } catch (err: unknown) {
      console.error("Retrieval error:", err);
      return NextResponse.json({ error: "Failed to retrieve documents" }, { status: 500 });
    }

    // Sort combined sources by similarity
    allSources.sort((a: RetrievedSource, b: RetrievedSource) => b.similarity - a.similarity);

    // Deduplicate top unique chunks by id
    const uniqueChunks = Array.from(
      new Map(allSources.map((c) => [`${c.documentId}-${c.chunkIndex}`, c])).values()
    ).slice(0, 6);

    const topSimilarity = uniqueChunks.length > 0 ? uniqueChunks[0].similarity : 0;
    const confidence = topSimilarity > 0.75 ? "high" : topSimilarity > 0.5 ? "medium" : "low";

    // 4. Handle complete absence of user documents
    if (uniqueChunks.length === 0) {
      return NextResponse.json({
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: "The provided documents do not contain information to answer this question.",
        timestamp: new Date().toISOString(),
        sources: [],
        confidence: "low",
      });
    }

    // 5. Construct grounded context text
    const contextText = uniqueChunks
      .map(
        (s: RetrievedSource, i: number) =>
          `--- Document [${i + 1}] (${s.documentType ? s.documentType.toUpperCase() : "DOCUMENT"}: ${
            s.documentName || s.filename || "Unknown"
          }) ---\n${s.content}`
      )
      .join("\n\n");

    const systemPrompt = `You are a highly precise, objective insurance AI assistant.
Your goal is to answer the user's question using ONLY the provided document context below.

RULES FOR EVIDENCE-GROUNDED ANSWERING:
1. STRICTLY NO CHAIN OF THOUGHT. Do not output internal reasoning, thoughts, or step-by-step logic.
2. Be direct and concise (1-3 sentences).
3. UNDERSTAND INTENT & CONTEXT: Answer natural-language questions (e.g. "What is my claim?", "What's the status?", "What documents do I need?") using the supported facts in the document context.
4. PARTIAL ANSWERS: If context contains some requested information but lacks other parts, answer what is present and explicitly state what details are missing (e.g. "Your claim ID is CLM-2026-00123 and status is Under Review. A completion date is not specified in the uploaded documents.").
5. MISSING FIELDS: If a specific field (e.g. adjuster phone number, specific missing document) is absent, state clearly that it is not present in the uploaded files.
6. ZERO HALLUCINATIONS: NEVER invent policy terms, deductibles, coverage limits, exclusions, dates, claim amounts, or claim numbers that are not in the context.
7. CONFLICT RESOLUTION: If policy and claim details conflict, state the conflict explicitly.

Context:
${contextText}`;

    // 6. Call Groq model with system prompt and message history
    const { text } = await generateText({
      model: groq("openai/gpt-oss-120b"),
      system: systemPrompt,
      messages: messages.map((m: { role: "system" | "user" | "assistant"; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: 0.1,
    });

    // 7. Strip <think> reasoning blocks if present
    const finalContent = text.replace(/<think>[\s\S]*?<\/think>\s*/gi, "");

    // 8. Return answer with sources and confidence
    return NextResponse.json({
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: finalContent.trim(),
      timestamp: new Date().toISOString(),
      sources: uniqueChunks,
      confidence,
    });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
