import { createClient } from "@supabase/supabase-js";
import path from "path";

process.loadEnvFile(path.resolve(__dirname, "../.env.local"));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function test() {
  console.log("Testing Supabase connection and RPC...");
  
  // Create a dummy 384-d vector of zeros
  const dummyVector = new Array(384).fill(0);
  
  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: dummyVector,
    match_count: 1
  });

  if (error) {
    console.error("RPC Error:", error);
    process.exit(1);
  }

  console.log("RPC Success. Data:", data);
}

test().catch(console.error);
