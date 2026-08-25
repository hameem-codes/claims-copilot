import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

// Load from .env.local
const envLocal = fs.readFileSync(".env.local", "utf-8");
const supabaseUrl = envLocal.split("\n").find(l => l.startsWith("NEXT_PUBLIC_SUPABASE_URL"))?.split("=")[1]?.trim();
const supabaseKey = envLocal.split("\n").find(l => l.startsWith("SUPABASE_SERVICE_ROLE_KEY"))?.split("=")[1]?.trim();

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function cleanupTestDoc() {
  console.log("--- 1. Authenticated User ---");
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  const testUser = users?.users.find(u => u.email === "test@example.com");
  
  if (!testUser) {
    console.error("Test user not found!");
    return;
  }
  
  console.log("Test User ID:", testUser.id);

  console.log("\n--- 2. Finding test-doc.pdf documents ---");
  const { data: docs, error: getError } = await supabase
    .from("documents")
    .select("id, original_filename, created_at")
    .eq("user_id", testUser.id)
    .eq("original_filename", "test-doc.pdf")
    .order("created_at", { ascending: false });
    
  if (docs && docs.length > 0) {
    console.log(`Found ${docs.length} 'test-doc.pdf' documents.`);
    
    // Keep the most recently created one (docs[0])
    const docToKeep = docs[0];
    const docsToDelete = docs.slice(1);
    
    if (docsToDelete.length > 0) {
      console.log(`Keeping document ID: ${docToKeep.id}`);
      console.log(`Deleting ${docsToDelete.length} duplicates...`);
      
      const idsToDelete = docsToDelete.map(d => d.id);
      
      // Delete chunks first
      await supabase.from("document_chunks").delete().in("document_id", idsToDelete);
      
      // Delete documents
      await supabase.from("documents").delete().in("id", idsToDelete);
      
      console.log("Deleted duplicates.");
    } else {
      console.log("Only 1 'test-doc.pdf' found. No duplicates to delete.");
    }
  } else {
    console.log("No 'test-doc.pdf' documents found.");
  }

  console.log("\n--- 3. Verifying remaining test-doc.pdf documents ---");
  const { data: remainingDocs } = await supabase
    .from("documents")
    .select("id, original_filename")
    .eq("user_id", testUser.id)
    .eq("original_filename", "test-doc.pdf");
    
  console.log("Remaining test-doc.pdf docs:", remainingDocs);
  
  if (remainingDocs && remainingDocs.length > 0) {
    const docIds = remainingDocs.map(d => d.id);
    const { data: remainingChunks } = await supabase
      .from("document_chunks")
      .select("id, document_id")
      .in("document_id", docIds);
    console.log(`Remaining chunks for test-doc.pdf: ${remainingChunks?.length}`);
  }
}

cleanupTestDoc().catch(console.error);
