import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envLocal = fs.readFileSync(".env.local", "utf-8");
const supabaseUrl = envLocal.split("\n").find(l => l.startsWith("NEXT_PUBLIC_SUPABASE_URL"))?.split("=")[1]?.trim();
const supabaseKey = envLocal.split("\n").find(l => l.startsWith("SUPABASE_SERVICE_ROLE_KEY"))?.split("=")[1]?.trim();

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
  const hfKey = process.env.HUGGINGFACE_API_KEY || envLocal.split("\n").find(l => l.startsWith("HUGGINGFACE_API_KEY"))?.split("=")[1]?.trim();
  const res = await fetch("https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${hfKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: "Does the policy cover rental car expenses?" }),
  });
  const embedding = await res.json();
  const flatResult = Array.isArray(embedding) && Array.isArray(embedding[0]) ? embedding[0] : embedding;
  console.log("Embedding length:", flatResult.length);

  const { data: users } = await supabase.auth.admin.listUsers();
  const testUser = users?.users.find(u => u.email === "test@example.com");

  // Call the table directly just to see what distances are for the chunks!
  const { data: chunks } = await supabase.from("document_chunks").select("id, embedding").limit(5);
  console.log("Chunks in DB:", chunks?.length);

  // We can calculate cosine similarity in JS just to see!
  const dotProduct = (a: number[], b: number[]) => a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitude = (a: number[]) => Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  
  if (chunks && chunks[0]) {
      const dbEmb = JSON.parse(chunks[0].embedding);
      const sim = dotProduct(flatResult, dbEmb) / (magnitude(flatResult) * magnitude(dbEmb));
      console.log("Cosine Similarity between query and chunk[0]:", sim);
  }
}
check().catch(console.error);
