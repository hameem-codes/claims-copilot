import { createClient } from "@supabase/supabase-js";
import path from "path";

process.loadEnvFile(path.resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const adminClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== PHASE 8 VERIFICATION ===");
  
  const email = "test@example.com";
  const password = "hameem";
  
  const loginRes = await fetch("http://localhost:3000/api/test-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  
  const loginData = await loginRes.json();
  const cookies = loginRes.headers.get("set-cookie");

  if (!loginData.success) {
    console.error("Login failed via test-login API");
    return;
  }
  
  console.log("Logged in successfully. Cookies obtained.");
  
  // Get user ID to inject mock data
  const { data: users } = await adminClient.auth.admin.listUsers();
  const testUser = users.users.find(u => u.email === email);
  if (!testUser) {
    console.error("Test user not found in admin list.");
    return;
  }
  
  const testUserId = testUser.id;
  console.log("Created User ID:", testUserId);
  
  // Create mock documents
  const { data: policyDoc, error: pErr } = await adminClient.from("documents").insert({
    user_id: testUserId,
    original_filename: "test_policy.pdf",
    document_type: "policy",
    storage_path: "mock_path_1",
    ocr_status: "completed"
  }).select().single();
  if (pErr) console.error("Policy Doc Error:", pErr);

  const { data: claimDoc, error: cErr } = await adminClient.from("documents").insert({
    user_id: testUserId,
    original_filename: "test_claim.pdf",
    document_type: "claim",
    storage_path: "mock_path_2",
    ocr_status: "completed"
  }).select().single();
  if (cErr) console.error("Claim Doc Error:", cErr);

  // Create analysis session
  const { data: session, error: sErr } = await adminClient.from("analysis_sessions").insert({
    user_id: testUserId,
    policy_document_id: policyDoc?.id,
    claim_document_id: claimDoc?.id,
    status: "completed",
    title: "Test Session"
  }).select().single();
  if (sErr) console.error("Session Error:", sErr);

  console.log("Created Analysis Session:", session!.id);

  // We need chunks. We will insert mock chunks with embeddings.
  // We can just use the embedText function to get real embeddings.
  const { embedText } = await import("../src/lib/rag/embed");
  
  const chunks = [
    { text: "The policy deductible is $500.", docId: policyDoc!.id },
    { text: "The coverage limit for personal property is $10,000.", docId: policyDoc!.id },
    { text: "This policy covers water damage and fire damage. [Page 2]", docId: policyDoc!.id },
    { text: "Exclusions apply for wear and tear, and intentional acts.", docId: policyDoc!.id },
    
    { text: "The claim amount is $1,500.", docId: claimDoc!.id },
    { text: "The incident occurred on 2023-10-15.", docId: claimDoc!.id },
    { text: "The claim happened when water leaked from the roof.", docId: claimDoc!.id },
    
    { text: "The incident date in the claim is 2023-10-15, but the policy started on 2023-11-01.", docId: claimDoc!.id }, // Conflict scenario
  ];

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await embedText(chunks[i].text);
    await adminClient.from("document_chunks").insert({
      document_id: chunks[i].docId,
      chunk_index: i,
      content: chunks[i].text,
      embedding: embedding
    });
  }

  console.log("Mock data inserted. Running tests...");

  // Helper to make API requests
  async function askQuestion(question: string, sendSessionId: boolean = true) {
    const res = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cookie": cookies || ""
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: question }],
        analysisSessionId: sendSessionId ? session!.id : undefined
      })
    });
    
    if (!res.ok) {
        console.error("API Error:", res.status, await res.text());
        return null;
    }
    return res.json();
  }
  
  console.log("\n--- Questions ---");
  const questions = [
    "What is the deductible?",
    "What is the coverage limit?",
    "What does the policy cover?",
    "What exclusions apply?",
    "What is the claim amount?",
    "When did the incident occur?",
    "Is this claim covered?",
    "Why is this claim likely covered or not covered?",
    "What is the claimant's phone number?"
  ];

  for (const q of questions) {
    console.log(`\nQ: ${q}`);
    const res = await askQuestion(q);
    console.log("A:", res?.content);
    console.log("Sources:", JSON.stringify(res?.sources, null, 2));
  }

  console.log("\nDone.");
  process.exit(0);
}

main().catch(console.error);
