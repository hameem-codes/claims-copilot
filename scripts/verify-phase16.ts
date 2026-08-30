try {
  process.loadEnvFile(path.resolve(__dirname, "../.env.local"));
} catch {
  // .env.local optional
}

import { analyzeQuestion } from "../src/lib/rag/query-understanding";

async function runPhase16Tests() {
  console.log("=== PHASE 16: ADAPTIVE / INTENT-AWARE RAG VERIFICATION ===\n");

  const testCases = [
    { question: "What is my claim?", expectedIntent: "claim_information" },
    { question: "Tell me about my claim.", expectedIntent: "claim_information" },
    { question: "What's the status of my claim?", expectedIntent: "claim_information" },
    { question: "How much is my claim for?", expectedIntent: "claim_information" },
    { question: "What does my policy cover?", expectedIntent: "policy_coverage" },
    { question: "What's my deductible?", expectedIntent: "deductible_limits" },
    { question: "What documents do I need?", expectedIntent: "documents_needed" },
    { question: "Are there any discrepancies in my claim?", expectedIntent: "discrepancies" },
  ];

  let passed = 0;

  console.log("--- 1. Testing Intent Recognition & Query Expansion ---");
  for (const tc of testCases) {
    const analysis = analyzeQuestion(tc.question);
    const intentOk = analysis.intent === tc.expectedIntent;
    const expansionOk = analysis.expandedQueries.length > 1;

    if (intentOk && expansionOk) {
      console.log(`[PASS] "${tc.question}" -> Intent: ${analysis.intent} | Expanded queries: ${analysis.expandedQueries.length}`);
      passed++;
    } else {
      console.error(`[FAIL] "${tc.question}" -> Got intent: ${analysis.intent}, expected: ${tc.expectedIntent}`);
    }
  }

  console.log("\n--- 2. Testing Follow-up Context Resolution ---");
  const followUpAnalysis = analyzeQuestion("What's its status?", [
    { role: "user", content: "Tell me about my claim" },
    { role: "assistant", content: "Your claim CLM-123 is currently under review." },
  ]);

  if (followUpAnalysis.resolvedQuestion.includes("claim") && followUpAnalysis.intent === "claim_information") {
    console.log(`[PASS] "What's its status?" resolved to: "${followUpAnalysis.resolvedQuestion}"`);
    passed++;
  } else {
    console.error(`[FAIL] Follow-up resolution failed: "${followUpAnalysis.resolvedQuestion}"`);
  }

  console.log(`\nVerification complete. Passed ${passed}/${testCases.length + 1} checks.`);
  if (passed !== testCases.length + 1) {
    process.exit(1);
  }
}

runPhase16Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
