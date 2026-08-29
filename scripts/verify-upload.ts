import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync, readFileSync } from "fs";
import fetch from "node-fetch";
import FormData from "form-data";
import * as path from "path";
import { fileURLToPath } from "url";

// Node 20 environment loading
process.loadEnvFile(path.resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminClient = createClient(supabaseUrl, supabaseKey);

async function createPDF(filename: string, text: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 50, y: 350, size: 12, font });
  const pdfBytes = await pdfDoc.save();
  writeFileSync(filename, pdfBytes);
  console.log(`Created ${filename} (${pdfBytes.length} bytes)`);
  return pdfBytes.length;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  const report: string[] = [];
  report.push("=== VERIFICATION REPORT ===");

  // 1. Create PDFs
  const policySize = await createPDF("policy_test.pdf", "Deductible: $500\nPersonal property coverage limit: $10,000");
  const claimSize = await createPDF("claim_test.pdf", "Claim amount: $1,500\nDate of loss: 2026-08-01");

  // 2. Auth setup
  const email = "test@example.com";
  const password = "hameem";
  
  const loginRes = await fetch("http://localhost:3001/api/test-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const cookies = loginRes.headers.get("set-cookie") || "";
  const authHeaders = { "Cookie": cookies };

  // Fetch the user ID for DB checks
  const { data: users } = await adminClient.auth.admin.listUsers();
  const userId = users.users.find(u => u.email === email)?.id;

  if (!userId) {
    throw new Error("Could not find test user in DB");
  }

  // 3. Create Analysis Session (or reuse recent)
  const { data: sessionInsert, error: sessionErr } = await adminClient
    .from("analysis_sessions")
    .insert({ user_id: userId, title: "Test Session" })
    .select("id")
    .single();
    
  if (sessionErr) throw sessionErr;
    
  const sessionId = sessionInsert!.id;
  report.push(`Created Analysis Session: ${sessionId}`);

  // 4. Upload Policy
  const policyFormData = new FormData();
  policyFormData.append("file", readFileSync("policy_test.pdf"), "policy_test.pdf");
  policyFormData.append("analysis_session_id", sessionId);
  policyFormData.append("document_type", "policy");

  const policyUpRes = await fetch("http://localhost:3001/api/documents/upload", {
    method: "POST",
    headers: { ...authHeaders, ...policyFormData.getHeaders() },
    body: policyFormData
  });
  const policyUpData = await policyUpRes.json();
  report.push(`Policy Upload Result: ${policyUpRes.status} ${JSON.stringify(policyUpData)}`);

  // 5. Upload Claim
  const claimFormData = new FormData();
  claimFormData.append("file", readFileSync("claim_test.pdf"), "claim_test.pdf");
  claimFormData.append("analysis_session_id", sessionId);
  claimFormData.append("document_type", "claim");

  const claimUpRes = await fetch("http://localhost:3001/api/documents/upload", {
    method: "POST",
    headers: { ...authHeaders, ...claimFormData.getHeaders() },
    body: claimFormData
  });
  const claimUpData = await claimUpRes.json();
  report.push(`Claim Upload Result: ${claimUpRes.status} ${JSON.stringify(claimUpData)}`);

  // 6. Verify DB
  const { data: dbDocs } = await adminClient.from("documents").select("*").in("id", [policyUpData.documentId, claimUpData.documentId]);
  report.push(`Documents DB Rows: ${JSON.stringify(dbDocs?.map(d => ({ id: d.id, size: d.size, type: d.file_type, doc_type: d.document_type })))}`);

  const { data: dbChunks } = await adminClient.from("document_chunks").select("id, document_id, content").in("document_id", [policyUpData.documentId, claimUpData.documentId]);
  report.push(`Chunks Created: ${dbChunks?.length}`);

  const { data: dbSession } = await adminClient.from("analysis_sessions").select("policy_document_id, claim_document_id").eq("id", sessionId).single();
  report.push(`Session Association: Policy=${dbSession?.policy_document_id === policyUpData.documentId}, Claim=${dbSession?.claim_document_id === claimUpData.documentId}`);

  // 7. RAG Tests
  const ask = async (q: string) => {
    const chatRes = await fetch("http://localhost:3001/api/chat", {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: q }],
        analysisSessionId: sessionId
      })
    });
    const chatData = await chatRes.json();
    report.push(`Q: ${q}`);
    report.push(`A: ${chatData.content}`);
    report.push(`Sources: ${chatData.sources?.map((s: any) => s.documentType).join(", ")}`);
  };

  await ask("What is the deductible?");
  await sleep(3000);
  await ask("What is the claim amount?");
  await sleep(3000);
  await ask("What is the claimant's phone number?");

  // 8. Regression Tests (Extraction, Compare, etc.)
  report.push("\n--- Regression Tests ---");
  const extRes = await fetch(`http://localhost:3001/api/analysis-sessions/${sessionId}/extract?regenerate=true`, { method: "POST", headers: authHeaders });
  report.push(`Extraction: ${extRes.status}`);

  await sleep(4000);
  const compRes = await fetch(`http://localhost:3001/api/analysis-sessions/${sessionId}/compare?regenerate=true`, { method: "POST", headers: authHeaders });
  report.push(`Compare: ${compRes.status}`);

  // Write report
  writeFileSync("verify-upload-report.txt", report.join("\n"));
  console.log("Wrote verify-upload-report.txt");
}

main().catch(e => console.error("FATAL ERROR", e));
