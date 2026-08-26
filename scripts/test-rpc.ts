import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load from .env.local
const envLocal = fs.readFileSync(".env.local", "utf-8");
const supabaseUrl = envLocal.split("\n").find(l => l.startsWith("NEXT_PUBLIC_SUPABASE_URL"))?.split("=")[1]?.trim();
const supabaseKey = envLocal.split("\n").find(l => l.startsWith("SUPABASE_SERVICE_ROLE_KEY"))?.split("=")[1]?.trim();

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
  // We need to embed the query first.
  const query = "Does the policy cover rental car expenses?";
  const res = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + envLocal.split("\n").find(l => l.startsWith("JINA_API_KEY"))?.split("=")[1]?.trim()
    },
    body: JSON.stringify({
      model: "jina-embeddings-v3",
      input: [query]
    })
  });
  const json = await res.json();
  const queryEmbedding = json.data[0].embedding;
  
  // Call RPC as service role just to see if it returns rows
  const { data: users } = await supabase.auth.admin.listUsers();
  const testUser = users?.users.find(u => u.email === "test@example.com");

  // Since we use service role, auth.uid() in RPC might be null!
  // Oh, auth.uid() is null for service role unless we impersonate!
  console.log("Calling rpc with service role (auth.uid will be null in RPC unless we use a JWT)");
}
check().catch(console.error);
