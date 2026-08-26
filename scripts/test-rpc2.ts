import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envLocal = fs.readFileSync(".env.local", "utf-8");
const supabaseUrl = envLocal.split("\n").find(l => l.startsWith("NEXT_PUBLIC_SUPABASE_URL"))?.split("=")[1]?.trim();
const supabaseKey = envLocal.split("\n").find(l => l.startsWith("SUPABASE_SERVICE_ROLE_KEY"))?.split("=")[1]?.trim();

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: new Array(384).fill(0), // Dummy embedding
    match_count: 5,
    filter_document_id: null,
    filter_claim_id: null,
    filter_policy_id: null
  });
  console.log("RPC Data with zero vector:", data);
  console.log("RPC Error:", error);

  // Let's also check the actual SQL definition of the function in postgres
  // Actually, we can't easily do that without pg module, but we can try to call it with a real embedding and see if it drops items.
  const hfKey = process.env.HUGGINGFACE_API_KEY || envLocal.split("\n").find(l => l.startsWith("HUGGINGFACE_API_KEY"))?.split("=")[1]?.trim();
  const res = await fetch("https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5", {
    method: "POST",
    headers: { "Authorization": `Bearer ${hfKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: "Does the policy cover rental car expenses?" }),
  });
  const flatResult = await res.json();
  const emb = Array.isArray(flatResult) && Array.isArray(flatResult[0]) ? flatResult[0] : flatResult;
  
  // We have to authenticate as the user to make RLS pass!
  const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
      email: "test@example.com",
      password: "hameem" // password from test script
  });
  
  const userClient = createClient(supabaseUrl!, supabaseKey!, {
      global: { headers: { Authorization: `Bearer ${session?.access_token}` } }
  });

  const { data: chunks1 } = await userClient.rpc("match_document_chunks", {
      query_embedding: emb,
      match_count: 5
  });
  console.log("RPC with rental query returned:", chunks1?.length, "chunks");
  
  const res2 = await fetch("https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5", {
    method: "POST",
    headers: { "Authorization": `Bearer ${hfKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: "What is the deductible for this claim?" }),
  });
  const flatResult2 = await res2.json();
  const emb2 = Array.isArray(flatResult2) && Array.isArray(flatResult2[0]) ? flatResult2[0] : flatResult2;

  const { data: chunks2 } = await userClient.rpc("match_document_chunks", {
      query_embedding: emb2,
      match_count: 5
  });
  console.log("RPC with deductible query returned:", chunks2?.length, "chunks");

}
check().catch(console.error);
