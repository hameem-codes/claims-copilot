import { createClient } from "@supabase/supabase-js";
import path from "path";
import { randomUUID } from "crypto";
import { embedText } from "../src/lib/rag/embed";

process.loadEnvFile(path.resolve(__dirname, "../.env.local"));

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testUpload() {
  // Use a hardcoded dummy user ID, or fetch one from auth if possible. 
  // Let's just create a dummy doc without user_id or see if it requires it.
  const { data: users } = await adminClient.auth.admin.listUsers();
  if (users.users.length === 0) {
    console.error("No users found");
    return;
  }
  const userId = users.users[0].id;
  
  const documentId = randomUUID();
  const storagePath = `${userId}/${randomUUID()}-test.txt`;

  // 1. Insert row into documents
  const { data: docRow, error: docError } = await adminClient
    .from("documents")
    .insert({
      storage_path: storagePath,
      original_filename: "test.txt",
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

  // 2. Embed chunk
  const chunkText = "This is a test document chunk.";
  const embedding = await embedText(chunkText);
  console.log("Embedded successfully, length", embedding.length);

  const insertData = [{
    document_id: docRow.id,
    chunk_index: 0,
    content: chunkText,
    embedding: embedding,
  }];

  // 3. Batch insert chunks
  console.log("Attempting to insert chunks...", JSON.stringify(insertData[0]).slice(0, 100) + "...");
  const { error: insertError } = await adminClient.from("document_chunks").insert(insertData);
  
  if (insertError) {
    console.error("Chunks DB insert failed:", insertError);
  } else {
    console.log("Chunks inserted successfully");
  }

  // cleanup
  await adminClient.from("documents").delete().eq("id", docRow.id);
}

testUpload().catch(console.error);
