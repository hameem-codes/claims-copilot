import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("analysis_sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, policy_document_id, claim_document_id } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (policy_document_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: doc } = await (supabase as any).from("documents").select("id").eq("id", policy_document_id).single();
      if (!doc) return NextResponse.json({ error: "Invalid policy_document_id" }, { status: 400 });
    }

    if (claim_document_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: doc } = await (supabase as any).from("documents").select("id").eq("id", claim_document_id).single();
      if (!doc) return NextResponse.json({ error: "Invalid claim_document_id" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("analysis_sessions")
      .insert({
        user_id: user.id,
        title,
        policy_document_id: policy_document_id || null,
        claim_document_id: claim_document_id || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
