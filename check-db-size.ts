import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envLocal = fs.readFileSync(".env.local", "utf-8");
const supabaseUrl = envLocal.split("\n").find(l => l.startsWith("NEXT_PUBLIC_SUPABASE_URL"))?.split("=")[1]?.trim();
const supabaseKey = envLocal.split("\n").find(l => l.startsWith("SUPABASE_SERVICE_ROLE_KEY"))?.split("=")[1]?.trim();

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  const { error } = await supabase.from("documents").select("size").limit(1);
  console.log("Size error:", error);
  const { error: error2 } = await supabase.from("documents").select("file_size").limit(1);
  console.log("File_size error:", error2);
}
run();
