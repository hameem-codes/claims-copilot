import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

// Load from .env.local
const envLocal = fs.readFileSync(".env.local", "utf-8");
const supabaseUrl = envLocal.split("\n").find(l => l.startsWith("NEXT_PUBLIC_SUPABASE_URL"))?.split("=")[1]?.trim();
const supabaseKey = envLocal.split("\n").find(l => l.startsWith("SUPABASE_SERVICE_ROLE_KEY"))?.split("=")[1]?.trim();

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function cleanup() {
  console.log("--- 1. Authenticated User ---");
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  const testUser = users?.users.find(u => u.email === "test@example.com");
  
  if (!testUser) {
    console.error("Test user not found!");
    return;
  }
  
  console.log("Test User ID:", testUser.id);

  console.log("\n--- 2. Finding test.pdf documents ---");
  const { data: docsToDelete, error: getError } = await supabase
    .from("documents")
    .select("id, original_filename")
    .eq("user_id", testUser.id)
    .eq("original_filename", "test.pdf");
    
  if (docsToDelete && docsToDelete.length > 0) {
    console.log(`Found ${docsToDelete.length} 'test.pdf' documents. Deleting them...`);
    const docIds = docsToDelete.map(d => d.id);
    
    // Note: If you have ON DELETE CASCADE on document_chunks, deleting the document 
    // will automatically delete the chunks. If not, delete chunks first.
    // Let's delete chunks first to be safe.
    await supabase.from("document_chunks").delete().in("document_id", docIds);
    await supabase.from("documents").delete().in("id", docIds);
    console.log("Deleted test.pdf duplicates.");
  } else {
    console.log("No 'test.pdf' duplicates found.");
  }

  console.log("\n--- 3. Verifying remaining documents ---");
  const { data: remainingDocs } = await supabase
    .from("documents")
    .select("id, original_filename")
    .eq("user_id", testUser.id);
    
  console.log("Remaining docs:", remainingDocs);
  
  if (remainingDocs) {
    const docIds = remainingDocs.map(d => d.id);
    const { data: remainingChunks } = await supabase
      .from("document_chunks")
      .select("id, document_id")
      .in("document_id", docIds);
    console.log(`Remaining chunks count: ${remainingChunks?.length}`);
  }
}

cleanup().catch(console.error);
