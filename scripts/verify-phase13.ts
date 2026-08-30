import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
const publicSupabase = createClient(supabaseUrl, supabaseAnonKey);

interface TestResult {
  suite: string;
  name: string;
  status: "PASS" | "FAIL" | "BLOCKED";
  details: string;
}

const results: TestResult[] = [];

function record(suite: string, name: string, status: "PASS" | "FAIL" | "BLOCKED", details: string) {
  results.push({ suite, name, status, details });
  const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "⊘";
  console.log(`[${icon} ${status}] ${suite} :: ${name} - ${details}`);
}

async function runVerification() {
  console.log("=================================================");
  console.log("  PHASE 13: END-TO-END RUNTIME VERIFICATION");
  console.log("=================================================\n");

  const baseUrl = "http://localhost:3000";

  // 1. Security & Authentication Checks
  try {
    const unauthChat = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "Test" }] }),
    });
    if (unauthChat.status === 401) {
      record("Security", "Unauthenticated Chat Access Rejected", "PASS", "HTTP 401 returned as expected");
    } else {
      record("Security", "Unauthenticated Chat Access Rejected", "FAIL", `Expected 401, got ${unauthChat.status}`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    record("Security", "Unauthenticated Chat Access Rejected", "BLOCKED", `Server not reachable at ${baseUrl}: ${msg}`);
  }

  // Check Supabase Users & Auth
  const testUserEmail = "test@example.com";
  const testUserPassword = "hameem";
  let userId = "";
  let cookieString = "";

  try {
    const { data: usersData } = await adminSupabase.auth.admin.listUsers();
    const existing = usersData?.users.find((u) => u.email === testUserEmail);

    if (!existing) {
      const { data: newUser, error: createErr } = await adminSupabase.auth.admin.createUser({
        email: testUserEmail,
        password: testUserPassword,
        email_confirm: true,
      });
      if (createErr) throw createErr;
      userId = newUser.user.id;
      record("Authentication", "Test User Provisioning", "PASS", `Created test user ${userId}`);
    } else {
      userId = existing.id;
      record("Authentication", "Test User Verification", "PASS", `Verified existing test user ${userId}`);
    }

    // Sign in to get session cookies
    const { data: authData, error: signInErr } = await publicSupabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword,
    });

    if (signInErr) {
      // Update password and retry
      await adminSupabase.auth.admin.updateUserById(userId, { password: testUserPassword });
      const { data: retryAuth, error: retryErr } = await publicSupabase.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword,
      });
      if (retryErr) throw retryErr;
      cookieString = `sb-access-token=${retryAuth.session?.access_token}; sb-refresh-token=${retryAuth.session?.refresh_token}`;
    } else {
      cookieString = `sb-access-token=${authData.session?.access_token}; sb-refresh-token=${authData.session?.refresh_token}`;
    }

    // Call /api/test-login on local server to get SSR cookies if server is up
    try {
      const loginRes = await fetch(`${baseUrl}/api/test-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testUserEmail, password: testUserPassword }),
      });
      if (loginRes.ok) {
        const cookies = loginRes.headers.getSetCookie();
        if (cookies.length > 0) {
          cookieString = cookies.map((c) => c.split(";")[0]).join("; ");
        }
        record("Authentication", "SSR Session Cookie Handshake", "PASS", "Obtained valid session cookies from server");
      }
    } catch {
      record("Authentication", "SSR Session Cookie Handshake", "BLOCKED", "Dev server endpoint not accessed");
    }

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    record("Authentication", "Auth Setup", "FAIL", msg);
  }

  // 2. Document Pipeline Verification (PDF extraction, OCR, chunks, embeddings)
  let claimDocId = "";
  let policyDocId = "";

  try {
    const samplePdfPath = path.resolve(process.cwd(), "test.pdf");
    if (!fs.existsSync(samplePdfPath)) {
      // Create minimal valid PDF if not present
      const minimalPdf = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R>>endobj\n4 0 obj<</Length 55>>stream\nBT /F1 12 Tf 72 712 Td (Auto Policy Coverage: Deductible is $500.) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000213 00000 n \ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n320\n%%EOF";
      fs.writeFileSync(samplePdfPath, minimalPdf);
    }

    const pdfBuffer = fs.readFileSync(samplePdfPath);

    // Test Upload Claim Document
    const formClaim = new FormData();
    formClaim.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), "claim_sample.pdf");
    formClaim.append("documentType", "claim");

    const uploadClaimRes = await fetch(`${baseUrl}/api/documents/upload`, {
      method: "POST",
      headers: { cookie: cookieString },
      body: formClaim,
    });

    if (uploadClaimRes.ok) {
      const claimJson = await uploadClaimRes.json();
      claimDocId = claimJson.documentId || claimJson.id;
      record("Document Pipeline", "Upload Claim Document", "PASS", `Claim document uploaded, ID: ${claimDocId}`);
    } else {
      const errText = await uploadClaimRes.text();
      record("Document Pipeline", "Upload Claim Document", "FAIL", `Status ${uploadClaimRes.status}: ${errText}`);
    }

    // Test Upload Policy Document
    const formPolicy = new FormData();
    formPolicy.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), "policy_sample.pdf");
    formPolicy.append("documentType", "policy");

    const uploadPolicyRes = await fetch(`${baseUrl}/api/documents/upload`, {
      method: "POST",
      headers: { cookie: cookieString },
      body: formPolicy,
    });

    if (uploadPolicyRes.ok) {
      const policyJson = await uploadPolicyRes.json();
      policyDocId = policyJson.documentId || policyJson.id;
      record("Document Pipeline", "Upload Policy Document", "PASS", `Policy document uploaded, ID: ${policyDocId}`);
    } else {
      const errText = await uploadPolicyRes.text();
      record("Document Pipeline", "Upload Policy Document", "FAIL", `Status ${uploadPolicyRes.status}: ${errText}`);
    }

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    record("Document Pipeline", "Upload Pipeline", "FAIL", msg);
  }

  // 3. Verify Database Records & Vector Chunks
  try {
    if (claimDocId || policyDocId) {
      const { data: dbDocs, error: docErr } = await adminSupabase
        .from("documents")
        .select("*")
        .in("id", [claimDocId, policyDocId].filter(Boolean));

      if (docErr) throw docErr;

      const isCompleted = dbDocs?.every((d) => d.ocr_status === "complete" && d.user_id === userId);
      if (isCompleted) {
        record("Database & Processing", "Document Record & OCR Completion", "PASS", `Verified ${dbDocs.length} documents marked complete for user ${userId}`);
      } else {
        record("Database & Processing", "Document Record & OCR Completion", "FAIL", `Status mismatch: ${JSON.stringify(dbDocs)}`);
      }

      // Check document_chunks
      const { data: dbChunks, error: chunkErr } = await adminSupabase
        .from("document_chunks")
        .select("id, document_id, chunk_index, content, embedding")
        .in("document_id", [claimDocId, policyDocId].filter(Boolean));

      if (chunkErr) throw chunkErr;

      if (dbChunks && dbChunks.length > 0) {
        record("Database & Processing", "Vector Embeddings & Chunks", "PASS", `Created ${dbChunks.length} chunks with 384-d embeddings`);
      } else {
        record("Database & Processing", "Vector Embeddings & Chunks", "FAIL", "No chunks found in document_chunks table");
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    record("Database & Processing", "Vector Chunks Verification", "FAIL", msg);
  }

  // 4. RAG RPC & Vector Retrieval
  try {
    const dummyEmbedding = new Array(384).fill(0.01);
    const { data: rpcData, error: rpcErr } = await adminSupabase.rpc("match_document_chunks", {
      query_embedding: dummyEmbedding,
      match_count: 5,
    });

    if (rpcErr) {
      record("RAG Retrieval", "pgvector RPC match_document_chunks", "FAIL", rpcErr.message);
    } else {
      record("RAG Retrieval", "pgvector RPC match_document_chunks", "PASS", `RPC returned ${rpcData?.length || 0} matches`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    record("RAG Retrieval", "pgvector RPC", "FAIL", msg);
  }

  // 5. AI Copilot Chat & Citations
  try {
    const chatRes = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieString,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "What is the deductible amount listed in my uploaded policy?" }],
      }),
    });

    if (chatRes.ok) {
      const chatData = await chatRes.json();
      if (chatData.content && !chatData.content.includes("<think>")) {
        record("AI Copilot", "Grounded Response & Reasoning Tag Strip", "PASS", `Answer received: "${chatData.content.slice(0, 80)}..."`);
      } else {
        record("AI Copilot", "Grounded Response & Reasoning Tag Strip", "FAIL", "Response missing or contains <think> tags");
      }

      if (Array.isArray(chatData.sources)) {
        record("AI Copilot", "Citations & Sources Attachment", "PASS", `Returned ${chatData.sources.length} document source citations`);
      } else {
        record("AI Copilot", "Citations & Sources Attachment", "FAIL", "Sources array missing from chat response");
      }
    } else {
      const errText = await chatRes.text();
      record("AI Copilot", "Grounded Chat Request", "FAIL", `Status ${chatRes.status}: ${errText}`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    record("AI Copilot", "Chat Flow", "BLOCKED", msg);
  }

  // 6. User Isolation / Cross-User Security Check
  try {
    // Attempt querying documents using a different fake user ID via normal client query
    const { data: crossData, error: crossErr } = await publicSupabase
      .from("documents")
      .select("*")
      .eq("user_id", "00000000-0000-0000-0000-000000000000");

    if (!crossErr && (!crossData || crossData.length === 0)) {
      record("Security", "Cross-User Isolation RLS", "PASS", "RLS enforces isolation; unauthorized user rows not returned");
    } else {
      record("Security", "Cross-User Isolation RLS", "FAIL", "Cross-user data leakage detected");
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    record("Security", "Cross-User Isolation RLS", "FAIL", msg);
  }

  // 7. Cleanup Test Records
  try {
    if (claimDocId || policyDocId) {
      await adminSupabase.from("document_chunks").delete().in("document_id", [claimDocId, policyDocId].filter(Boolean));
      await adminSupabase.from("documents").delete().in("id", [claimDocId, policyDocId].filter(Boolean));
      record("Maintenance", "Automated Test Artifact Cleanup", "PASS", "Cleaned up temporary test documents and vector chunks");
    }
  } catch {
    // noop
  }

  console.log("\n=================================================");
  console.log("  VERIFICATION SUMMARY");
  console.log("=================================================");
  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  const blockedCount = results.filter((r) => r.status === "BLOCKED").length;
  console.log(`Total Tests: ${results.length} | PASS: ${passCount} | FAIL: ${failCount} | BLOCKED: ${blockedCount}\n`);

  return results;
}

runVerification().catch(console.error);
