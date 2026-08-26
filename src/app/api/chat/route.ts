import { NextRequest, NextResponse } from "next/server";
import { retrieveChunks } from "@/lib/rag/retrieve";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createClient } from "@/lib/supabase/server";

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
    const { messages, activeClaimId, activePolicyId } = body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user" || !lastMessage.content) {
      return NextResponse.json({ error: "Last message must be from user with content" }, { status: 400 });
    }

    const question = lastMessage.content;

    // 3. Retrieve relevant chunks
    let retrievalResult;
    try {
      retrievalResult = await retrieveChunks(question, {
        topK: 5,
        claimId: activeClaimId,
        policyId: activePolicyId,
      });
    } catch (err: unknown) {
      console.error("Retrieval error:", err);
      return NextResponse.json({ error: "Failed to retrieve documents" }, { status: 500 });
    }

    const { sources, confidence } = retrievalResult;

    // 4. Handle cases where no useful context is found
    if (sources.length === 0) {
      return NextResponse.json({
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: "I'm sorry, but I couldn't find any relevant information in your documents to answer that question.",
        timestamp: new Date().toISOString(),
        sources: [],
        confidence: "low",
      });
    }

    // 5. Construct a grounded prompt
    const contextText = sources.map((s, i) => 
      `--- Document [${i + 1}]${s.filename ? ` (${s.filename})` : ''} ---\n${s.content}`
    ).join("\n\n");
    const systemPrompt = `You are a helpful and professional insurance claims AI assistant. 
You are strictly grounded in the provided documents. 
You must answer the user's question using ONLY the provided context below.

Rules:
- STRICTLY NO CHAIN OF THOUGHT. Do not output any internal reasoning, thoughts, or step-by-step logic.
- Be concise. For simple factual questions (e.g. "What is the deductible?"), answer directly in a single sentence (e.g. "The deductible is $500."). Do not add unnecessary explanations, disclaimers, or summaries.
- For broad/intent-based questions (e.g. "Explain my coverage", "What does my policy cover?"), generate a brief 2-4 sentence explanation summarizing the relevant coverage, limits, deductible, and important exclusions found ONLY in the retrieved context. Do not require an exact keyword match.
- For more complex questions, provide enough explanation to be useful but remain direct.
- Answer using ONLY the supplied retrieved context.
- Do NOT invent policy provisions, claim numbers, or dollar amounts.
- If the retrieved context does not contain enough information to answer the question, respond clearly by stating exactly what is missing from the documents (e.g. "The uploaded documents do not mention rental car coverage, so I can't confirm whether it is covered."). Do not guess or infer.
- Never pretend uncertainty is certainty.
- If possible, refer to the document filenames in your response.

Context:
${contextText}`;

    // 6. Call Groq
    const { text } = await generateText({
      model: groq("qwen/qwen3.6-27b"),
      system: systemPrompt,
      messages: messages.map((m: { role: "system" | "user" | "assistant"; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: 0.1, // Keep it grounded
    });

    // 7. Strip <think> reasoning blocks if present (for reasoning models)
    const finalContent = text.replace(/<think>[\s\S]*?<\/think>\s*/gi, '');

    // 8. Return answer with sources
    return NextResponse.json({
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: finalContent.trim(),
      timestamp: new Date().toISOString(),
      sources,
      confidence,
    });

  } catch (error: unknown) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
