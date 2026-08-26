import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { embedText } from "@/lib/rag/embed";
import Tesseract from "tesseract.js";
import { Buffer } from "buffer";

// Note: Next.js API route configuration
export const maxDuration = 300; // 5 minutes (max for Vercel Pro, ignored on standard free tier but good practice for OCR)

export async function POST(req: NextRequest) {
  let documentId: string | null = null;
  
  // Admin client for overriding RLS during server-side insertions/uploads
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Get authenticated user FIRST before reading the body
    const authClient = await createSupabaseServerClient();
    const cookieStore = await cookies();

    console.log("--- AUTH DEBUG START ---");
    console.log("[Upload API] Incoming Headers:", Array.from(req.headers.entries()));
    console.log("[Upload API] Incoming Cookies (req.cookies):", req.cookies.getAll());
    console.log("[Upload API] Parsed Cookies (next/headers):", cookieStore.getAll());
    const authResult = await authClient.auth.getUser();
    console.log("[Upload API] getUser() result:", JSON.stringify(authResult, null, 2));
    console.log("--- AUTH DEBUG END ---");

    const { data: { user } } = authResult;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    // 2. Accept multipart/form-data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const claimId = formData.get("claimId") as string | null;
    const policyId = formData.get("policyId") as string | null;

    // 3. Reject if no file
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 4. Reject unsupported file types
    const validTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    // 5. Upload file to Supabase Storage
    const originalFilename = file.name;
    const storagePath = `${userId}/${randomUUID()}-${originalFilename}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await adminClient
      .storage
      .from("documents")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed (check if 'documents' bucket exists and permissions are correct): ${uploadError.message}`);
    }

    // 6. Insert a row into documents
    const { data: docRow, error: docError } = await adminClient
      .from("documents")
      .insert({
        storage_path: storagePath,
        original_filename: originalFilename,
        user_id: userId,
        claim_id: claimId || null,
        policy_id: policyId || null,
        ocr_status: "processing",
      })
      .select("id")
      .single();

    if (docError || !docRow) {
      throw new Error(`Document DB insert failed: ${docError?.message}`);
    }
    documentId = docRow.id;

    // 7. Extract text with tesseract.js
    let extractedText = "";

    if (file.type === "application/pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: Buffer.from(fileBuffer) });
      const parsed = await parser.getText();
      await parser.destroy();
      extractedText = parsed.text;
    } else {
      // Direct image OCR for PNG/JPEG
      const { data: { text } } = await Tesseract.recognize(Buffer.from(fileBuffer), "eng");
      extractedText = text;
    }

    // 8. Handle empty extracted text
    extractedText = extractedText.trim();
    if (!extractedText) {
      await adminClient.from("documents").update({ ocr_status: "failed" }).eq("id", documentId);
      return NextResponse.json({ documentId, chunksCreated: 0, ocrStatus: "failed" }, { status: 200 });
    }

    // 9. Chunk the text (~2000 chars with ~200 chars overlap)
    const chunkSize = 2000;
    const overlap = 200;
    const chunks: string[] = [];
    let start = 0;
    
    while (start < extractedText.length) {
      const chunk = extractedText.substring(start, start + chunkSize);
      chunks.push(chunk);
      if (start + chunkSize >= extractedText.length) break;
      start += (chunkSize - overlap);
    }

    // 10. Embed each chunk
    const insertData = [];
    for (let i = 0; i < chunks.length; i++) {
      let embedding = null;
      try {
        embedding = await embedText(chunks[i]);
      } catch (e: unknown) {
        console.error(`[upload] Embedding failed for chunk ${i}:`, e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        throw new Error(`Embedding failed for chunk ${i}: ${errorMessage}`);
      }
      
      insertData.push({
        document_id: documentId,
        chunk_index: i,
        content: chunks[i],
        embedding: embedding,
      });
    }

    // 11. Batch insert all chunks
    if (insertData.length > 0) {
      const { error: insertError } = await adminClient.from("document_chunks").insert(insertData);
      if (insertError) {
        throw new Error(`Chunks DB insert failed: ${insertError.message}`);
      }
    }

    // 12. Update document ocr_status to complete
    await adminClient.from("documents").update({ ocr_status: "complete" }).eq("id", documentId);

    // 13. Return success
    return NextResponse.json({ documentId, chunksCreated: chunks.length, ocrStatus: "complete" }, { status: 200 });

  } catch (error: unknown) {
    // 14. Global try/catch error handling
    console.error("[upload] Unhandled error:", error);
    
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[upload] Upload error stack:", err.stack || err.message);

    if (documentId) {
      // Attempt to mark as failed if it was already created
      try {
        await adminClient.from("documents").update({ ocr_status: "failed" }).eq("id", documentId);
      } catch (updateError) {
        console.error("[upload] Failed to update document status to 'failed':", updateError);
      }
    }

    return NextResponse.json({ error: "Document processing failed" }, { status: 500 });
  }
}
