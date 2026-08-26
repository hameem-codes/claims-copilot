import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load from .env.local
const envLocal = fs.readFileSync(".env.local", "utf-8");
const supabaseUrl = envLocal.split("\n").find(l => l.startsWith("NEXT_PUBLIC_SUPABASE_URL"))?.split("=")[1]?.trim();
const supabaseKey = envLocal.split("\n").find(l => l.startsWith("SUPABASE_SERVICE_ROLE_KEY"))?.split("=")[1]?.trim();

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const testUser = users?.users.find(u => u.email === "test@example.com");
  
  const { data: chunks } = await supabase.from("document_chunks").select("*");
  console.log(`Total chunks in DB: ${chunks?.length}`);
  
  const { data: docs } = await supabase.from("documents").select("*").eq("user_id", testUser?.id);
  console.log(`Total docs for user: ${docs?.length}`);
  console.log(docs);
  
  if (docs && docs.length > 0) {
    const { data: dc } = await supabase.from("document_chunks").select("*").in("document_id", docs.map(d => d.id));
    console.log(`Total chunks for user: ${dc?.length}`);
  }
}
check().catch(console.error);
