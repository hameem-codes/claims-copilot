import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!); // Use service role for fast mock user fetch if needed

async function main() {
  console.log("=== FINAL REGRESSION VERIFICATION ===");
  
  const email = "test@example.com";
  const password = "hameem";
  
  const loginRes = await fetch("http://localhost:3000/api/test-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  
  if (!loginRes.ok) {
    console.error("Failed to login", await loginRes.text());
    return;
  }
  const cookies = loginRes.headers.get("set-cookie");
  
  const { data: sessionData } = await supabase
    .from("analysis_sessions")
    .select("id")
    .not("policy_document_id", "is", null)
    .not("claim_document_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);
    
  if (!sessionData || sessionData.length === 0) {
    console.error("No analysis session found.");
    return;
  }
  
  const sessionId = sessionData[0].id;
  console.log(`Using Session ID: ${sessionId}`);

  // Fetch with cookies to auth
  const authHeaders = {
    "Cookie": cookies || "",
    "Content-Type": "application/json"
  };

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  // 1. Phase 4 - Extraction
  console.log("\n--- Testing Phase 4: Extraction ---");
  const extRes = await fetch(`http://localhost:3000/api/analysis-sessions/${sessionId}/extract?regenerate=true`, { method: "POST", headers: authHeaders });
  const extData = await extRes.json();
  console.log("Extraction Success:", extRes.ok);
  console.log("Extraction Output:", JSON.stringify(extData).substring(0, 100));
  
  await sleep(8000);
  
  // 2. Phase 5 - Compare
  console.log("\n--- Testing Phase 5: Compare ---");
  const compRes = await fetch(`http://localhost:3000/api/analysis-sessions/${sessionId}/compare?regenerate=true`, { method: "POST", headers: authHeaders });
  const compData = await compRes.json();
  console.log("Compare Success:", compRes.ok);
  
  await sleep(8000);

  // 3. Phase 6 - Discrepancies
  console.log("\n--- Testing Phase 6: Discrepancies ---");
  const discRes = await fetch(`http://localhost:3000/api/analysis-sessions/${sessionId}/discrepancies?regenerate=true`, { method: "POST", headers: authHeaders });
  const discData = await discRes.json();
  console.log("Discrepancies Success:", discRes.ok);

  await sleep(8000);

  // 4. Phase 7 - Assessment
  console.log("\n--- Testing Phase 7: Assessment ---");
  const assmtRes = await fetch(`http://localhost:3000/api/analysis-sessions/${sessionId}/assessment?regenerate=true`, { method: "POST", headers: authHeaders });
  const assmtData = await assmtRes.json();
  console.log("Assessment Success:", assmtRes.ok);
  console.log("Assessment Status:", assmtData.status);

  await sleep(8000);

  // 5. Phase 8 - Chat
  console.log("\n--- Testing Phase 8: Chat ---");
  const chatQ = [
    "What is the deductible?",
    "What does the policy cover?",
    "What is the claim amount?",
    "When did the incident occur?",
    "What is the name of the president of France?"
  ];
  for (const q of chatQ) {
    console.log(`Q: ${q}`);
    await sleep(2000);
    const chatRes = await fetch(`http://localhost:3000/api/chat`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        messages: [{ role: "user", content: q }],
        analysisSessionId: sessionId
      })
    });
    console.log(`Q: ${q}`);
    console.log(`Status: ${chatRes.status}`);
  }

  await sleep(8000);

  // 6. Phase 9 - Timeline
  console.log("\n--- Testing Phase 9: Timeline ---");
  const timeRes = await fetch(`http://localhost:3000/api/analysis-sessions/${sessionId}/timeline?regenerate=true`, { method: "POST", headers: authHeaders });
  const timeData = await timeRes.json();
  console.log("Timeline Success:", timeRes.ok);
  
  // Security checks
  console.log("\n--- Testing Security ---");
  const secRes = await fetch(`http://localhost:3000/api/analysis-sessions/${sessionId}/timeline?regenerate=true`, { method: "POST" });
  console.log("Unauthenticated Request Status:", secRes.status);
}

main().catch(console.error);
