import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

// Load from .env.local
const envLocal = fs.readFileSync(".env.local", "utf-8");
const supabaseUrl = envLocal.split("\n").find(l => l.startsWith("NEXT_PUBLIC_SUPABASE_URL"))?.split("=")[1]?.trim();
const supabaseKey = envLocal.split("\n").find(l => l.startsWith("SUPABASE_SERVICE_ROLE_KEY"))?.split("=")[1]?.trim();

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function diagnose() {
  console.log("--- 1. Authenticated User ---");
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  const testUser = users?.users.find(u => u.email === "test@example.com");
  console.log("Test User ID:", testUser?.id);

  console.log("\n--- 2. Documents for Test User ---");
  const { data: docs, error: docError } = await supabase
    .from("documents")
    .select("id, original_filename, created_at, user_id")
    .eq("user_id", testUser?.id)
    .order("created_at", { ascending: false });
  console.log(docs);

  console.log("\n--- 3. Document Chunks for Test User's Latest Docs ---");
  if (docs && docs.length > 0) {
    const latestDocId = docs[0].id;
    const { data: chunks, error: chunkError } = await supabase
      .from("document_chunks")
      .select("id, document_id, chunk_index, content")
      .in("document_id", docs.map(d => d.id));
    
    console.log(`Found ${chunks?.length} total chunks across ${docs.length} documents.`);
    docs.forEach(d => {
        const docChunks = chunks?.filter(c => c.document_id === d.id);
        console.log(`Document ${d.original_filename} (${d.id}) has ${docChunks?.length} chunks.`);
    });
  }
}

diagnose().catch(console.error);
