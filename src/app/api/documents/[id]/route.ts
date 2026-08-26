import { NextRequest, NextResponse } from "next/server";
import { getDocument, deleteDocument, updateDocument } from "@/lib/documents-store";
import fs from "fs";
import path from "path";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const doc = await getDocument(id);
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const fullPath = path.join(process.cwd(), "data", "uploads", path.basename(doc.filePath));
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(fullPath);
    
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": doc.type,
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.name)}"`,
      },
    });
  } catch (error: unknown) {
    console.error("API document detail GET error:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch document";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const success = await deleteDocument(id);
    if (!success) {
      return NextResponse.json({ error: "Document not found or could not be deleted" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("API document detail DELETE error:", error);
    const msg = error instanceof Error ? error.message : "Failed to delete document";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const updates = await req.json();
    
    const doc = await updateDocument(id, updates);
    if (!doc) {
      return NextResponse.json({ error: "Document not found or could not be updated" }, { status: 404 });
    }
    
    return NextResponse.json(doc);
  } catch (error: unknown) {
    console.error("API document detail PATCH error:", error);
    const msg = error instanceof Error ? error.message : "Failed to update document";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

