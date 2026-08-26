import { NextRequest, NextResponse } from "next/server";
import { listDocuments, saveDocument } from "@/lib/documents-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const docs = await listDocuments(customerId);
    return NextResponse.json(docs);
  } catch (error: unknown) {
    console.error("API documents GET error:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch documents";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const claimId = formData.get("claimId") as string | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const savedDoc = await saveDocument(
      buffer,
      file.name,
      file.type || "application/octet-stream",
      file.size,
      { claimId, projectId }
    );

    return NextResponse.json(savedDoc, { status: 201 });
  } catch (error: unknown) {
    console.error("API documents POST error:", error);
    const msg = error instanceof Error ? error.message : "Failed to upload document";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
