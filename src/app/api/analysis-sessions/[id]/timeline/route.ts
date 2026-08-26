import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateObject } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { TimelineSchema } from "@/types";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // 1. Authenticate User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const analysisSessionId = resolvedParams.id;

    if (!analysisSessionId) {
      return NextResponse.json({ error: "Missing analysis_session_id" }, { status: 400 });
    }

    const searchParams = req.nextUrl.searchParams;
    const regenerate = searchParams.get("regenerate") === "true";

    // 2. Fetch session and extracted data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: session, error: sessionError } = await (supabase as any)
      .from("analysis_sessions")
      .select("policy_extracted_data, claim_extracted_data, timeline_data, created_at")
      .eq("id", analysisSessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Analysis session not found or unauthorized" }, { status: 403 });
    }

    if (session.timeline_data && !regenerate) {
      return NextResponse.json(session.timeline_data);
    }

    const policyData = session.policy_extracted_data;
    const claimData = session.claim_extracted_data;

    if (!policyData && !claimData) {
      return NextResponse.json({ error: "No extracted data available to generate a timeline" }, { status: 400 });
    }

    // 3. Generate timeline deterministically using LLM for formatting and conflict detection
    const systemPrompt = `You are a highly precise insurance claims AI assistant.
Your task is to generate a chronological timeline of events based ONLY on the provided extracted facts.
You MUST output valid JSON matching the requested schema.

Rules:
1. ONLY use the dates and events provided in the extracted data. Do NOT invent or guess any dates.
2. If a date is completely unknown, do not fabricate one.
3. Preserve the exact date strings as provided in the source data.
4. For EVERY event, you MUST carry over the exact source reference from the provided extracted data. If an event comes from metadata rather than a document chunk (like analysis_created), set source to null.
5. If two documents contain conflicting dates (e.g., policy says X, claim says Y for the same event type), include both events in the timeline and explicitly note the conflict in the "conflicts" array.
6. Evaluate the incident_timing carefully based on the incident date and the policy effective/expiration dates.
7. Sort the events chronologically to the best of your ability.
8. Include an "analysis_created" event using the session's created_at timestamp.

Provided Extracted Data:
Session Created At: ${session.created_at}

Policy Extracted Data:
${JSON.stringify(policyData, null, 2)}

Claim Extracted Data:
${JSON.stringify(claimData, null, 2)}`;

    const { object: timelineResult } = await generateObject({
      model: groq("openai/gpt-oss-120b"),
      schema: TimelineSchema,
      system: systemPrompt,
      messages: [{ role: "user", content: "Generate the chronological claim timeline based on the provided extracted facts." }],
      temperature: 0.0,
    });

    // 4. Save to database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("analysis_sessions")
      .update({ timeline_data: timelineResult })
      .eq("id", analysisSessionId);

    if (updateError) {
      console.error("Failed to save timeline:", updateError);
      // We can still return the result even if caching fails
    }

    return NextResponse.json(timelineResult);

  } catch (error: unknown) {
    console.error("Timeline API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
