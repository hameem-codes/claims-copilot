import { NextRequest, NextResponse } from "next/server";
import { retrieveChunks } from "@/lib/rag/retrieve";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createClient } from "@/lib/supabase/server";
import { RetrievedSource } from "@/types";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export const maxDuration = 60; // Set a slightly longer max duration for AI response

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate the user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate incoming message
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

    // 2b. If analysisSessionId is provided, prioritize it and fetch its specific documents
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

    // 3. Retrieve relevant chunks
    let allSources: RetrievedSource[] = [];
    
    try {
      if (analysisSessionId && (targetPolicyDocId || targetClaimDocId)) {
        // Search specifically in the session's documents
        if (targetPolicyDocId) {
          const res = await retrieveChunks(question, { topK: 3, documentId: targetPolicyDocId });
          allSources.push(...res.sources);
        }
        if (targetClaimDocId) {
          const res = await retrieveChunks(question, { topK: 3, documentId: targetClaimDocId });
          allSources.push(...res.sources);
        }
      } else {
        // Fallback to general search if no analysis session
        const res = await retrieveChunks(question, {
          topK: 5,
          claimId: activeClaimId,
          policyId: activePolicyId,
        });
        allSources = res.sources;
      }
    } catch (err: unknown) {
      console.error("Retrieval error:", err);
      return NextResponse.json({ error: "Failed to retrieve documents" }, { status: 500 });
    }

    // Sort combined sources by similarity
    allSources.sort((a: RetrievedSource, b: RetrievedSource) => b.similarity - a.similarity);
    // Keep top 5 unique chunks by id
    const uniqueChunks = Array.from(new Map(allSources.map((c) => [`${c.documentId}-${c.chunkIndex}`, c])).values()).slice(0, 5);
    
    const topSimilarity = uniqueChunks.length > 0 ? uniqueChunks[0].similarity : 0;
    const confidence = topSimilarity > 0.8 ? "high" : topSimilarity > 0.6 ? "medium" : "low";

    // 4. Handle cases where no useful context is found
    if (uniqueChunks.length === 0) {
      return NextResponse.json({
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: "The provided documents do not contain enough information to answer this question.",
        timestamp: new Date().toISOString(),
        sources: [],
        confidence: "low",
      });
    }

    // 5. Construct a grounded prompt
    const contextText = uniqueChunks.map((s: RetrievedSource, i: number) => 
      `--- Document [${i + 1}] (${s.documentType ? s.documentType.toUpperCase() : 'DOCUMENT'}: ${s.documentName || s.filename || 'Unknown'}) ---\n${s.content}`
    ).join("\n\n");
    
    const systemPrompt = `You are a highly precise and objective insurance AI assistant.
Your sole purpose is to answer the user's question using ONLY the provided document context below.

CRITICAL RULES:
1. STRICTLY NO CHAIN OF THOUGHT. Do not output any internal reasoning, thoughts, or step-by-step logic.
2. Be extremely concise. Give the answer directly in 1-3 sentences.
3. NEVER invent policy terms, deductibles, coverage limits, exclusions, dates, claim amounts, or claim details.
4. If the retrieved context does not explicitly contain the answer, you MUST state: "The documents do not provide enough information to answer this question."
5. If the evidence between the policy and claim conflicts, explicitly state that there is conflicting information and cite what each document says.
6. Answer ONLY using the provided retrieved context.

Context:
${contextText}`;

    // 6. Call Groq
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
    const finalContent = text.replace(/<think>[\s\S]*?<\/think>\s*/gi, '');

    // 8. Return answer with sources
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
