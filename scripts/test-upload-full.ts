import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { embedText } from "../src/lib/rag/embed";

process.loadEnvFile(path.resolve(__dirname, "../.env.local"));

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testUploadFull() {
  const { data: users } = await adminClient.auth.admin.listUsers();
  if (users.users.length === 0) {
    console.error("No users found");
    return;
  }
  const userId = users.users[0].id;
  
  const documentId = randomUUID();
  const storagePath = `${userId}/${randomUUID()}-test.pdf`;

  // 1. Insert row into documents
  const { data: docRow, error: docError } = await adminClient
    .from("documents")
    .insert({
      storage_path: storagePath,
      original_filename: "test.pdf",
      user_id: userId,
      ocr_status: "processing",
    })
    .select("id")
    .single();

  if (docError) {
    console.error("Document DB insert failed:", docError);
    return;
  }
  console.log("Document inserted:", docRow.id);

  // 2. Extract text
  const fileBuffer = fs.readFileSync("test.pdf");
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(fileBuffer));
  const { text } = await extractText(pdf, { mergePages: true });
  let extractedText = Array.isArray(text) ? text.join("\n") : text;
  
  extractedText = extractedText.trim();
  if (!extractedText) {
      console.error("Empty extracted text");
      return;
  }

  // 3. Chunk
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
  console.log("Chunks created:", chunks.length);

  // 4. Embed chunks
  const insertData = [];
  for (let i = 0; i < chunks.length; i++) {
    let embedding = null;
    try {
      embedding = await embedText(chunks[i]);
      console.log(`Chunk ${i} embedded successfully, length:`, embedding.length);
    } catch (e) {
      console.error(`[upload] Embedding failed for chunk ${i}:`, e);
    }
    
    insertData.push({
      document_id: docRow.id,
      chunk_index: i,
      content: chunks[i],
      embedding: embedding,
    });
  }

  // 5. Batch insert chunks
  console.log("Attempting to insert chunks...");
  const { error: insertError } = await adminClient.from("document_chunks").insert(insertData);
  
  if (insertError) {
    console.error("Chunks DB insert failed:", insertError);
  } else {
    console.log("Chunks inserted successfully");
    const { data: verifyChunks } = await adminClient.from("document_chunks").select("id").eq("document_id", docRow.id);
    console.log(`Verified chunks in DB: ${verifyChunks?.length}`);
  }

  // cleanup
  // await adminClient.from("documents").delete().eq("id", docRow.id);
}

testUploadFull().catch(console.error);
