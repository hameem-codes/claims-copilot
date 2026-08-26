// ============================================================
// Mock AI Service — Simulates tool-calling AI copilot
// ============================================================

import type { ConversationMessage, ToolCall, Claim, Policy, Customer } from "@/types";
import { claims, policies, customers, supportArticles } from "@/data/mock-data";

// Simulate network delay
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeToolCall(tool: string, description: string, status: ToolCall["status"], result?: string): ToolCall {
  return { id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, tool, description, status, result };
}

// --- Simple keyword matching for AI responses ---
function findRelevantClaim(message: string, customerId?: string): Claim | undefined {
  const lower = message.toLowerCase();
  // Check for specific claim ID references
  for (const claim of claims) {
    if (lower.includes(claim.id.toLowerCase())) return claim;
  }
  // Check for keyword matches scoped to customer
  const customerClaims = customerId ? claims.filter(c => c.customerId === customerId) : claims;
  if (lower.includes("car") || lower.includes("vehicle") || lower.includes("collision") || lower.includes("accident")) {
    return customerClaims.find(c => c.type.toLowerCase().includes("collision") || c.type.toLowerCase().includes("vehicle"));
  }
  if (lower.includes("windshield") || lower.includes("glass")) {
    return customerClaims.find(c => c.type.toLowerCase().includes("windshield"));
  }
  if (lower.includes("water") || lower.includes("pipe") || lower.includes("flood") || lower.includes("basement")) {
    return customerClaims.find(c => c.type.toLowerCase().includes("water"));
  }
  if (lower.includes("theft") || lower.includes("stolen") || lower.includes("break")) {
    return customerClaims.find(c => c.type.toLowerCase().includes("theft"));
  }
  if (lower.includes("parking") || lower.includes("scratch") || lower.includes("dent")) {
    return customerClaims.find(c => c.type.toLowerCase().includes("parking"));
  }
  return customerClaims[0];
}

function findRelevantPolicy(message: string, customerId?: string): Policy | undefined {
  const lower = message.toLowerCase();
  for (const policy of policies) {
    if (lower.includes(policy.id.toLowerCase())) return policy;
  }
  const customerPolicies = customerId ? policies.filter(p => p.customerId === customerId) : policies;
  if (lower.includes("auto") || lower.includes("car")) {
    return customerPolicies.find(p => p.type === "auto");
  }
  if (lower.includes("home") || lower.includes("house") || lower.includes("property")) {
    return customerPolicies.find(p => p.type === "home");
  }
  return customerPolicies[0];
}

function findCustomer(customerId?: string): Customer | undefined {
  return customers.find(c => c.id === customerId);
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// --- Response generators ---
function generateClaimStatusResponse(claim: Claim, policy?: Policy): string {
  return `**CLAIM STATUS — ${claim.id}**

**Status:** ${statusLabel(claim.status)}
**Type:** ${claim.type}${policy ? `\n**Policy:** ${policy.id} (${policy.typeName})` : ""}
**Amount:** ${formatMoney(claim.amount)}
**Adjuster:** ${claim.adjuster}
**Submitted:** ${claim.submittedDate}
**Last Update:** ${claim.lastUpdated}

${claim.missingDocuments.length > 0
    ? `**WHAT'S BLOCKING IT**\n${claim.missingDocuments.map((d) => `• ${d}`).join("\n")}`
    : "**All documents received.** No blocking items."
  }

${claim.status === "approved" ? "**✅ Claim has been approved.** Reimbursement is being processed." : ""}
${claim.status === "denied" ? "**❌ Claim was denied.** You may appeal within 30 days." : ""}

**NEXT ACTION**
${claim.missingDocuments.length > 0
    ? `Upload the missing documents to move this claim forward.`
    : claim.status === "approved"
      ? "No action needed. Reimbursement will be issued shortly."
      : "Awaiting adjuster review. No action needed from you right now."
  }`;
}

function generateCoverageResponse(policy: Policy, claimType: string): string {
  const relevantCoverage = policy.coverages.find((c) =>
    claimType.toLowerCase().includes(c.name.toLowerCase())
  );
  const isEligible = !!relevantCoverage;

  return `**COVERAGE CHECK — ${policy.id}**

**Policy:** ${policy.typeName}
**Status:** ${statusLabel(policy.status)}
**Claim Type:** ${claimType}

${isEligible
    ? `✅ **Coverage appears eligible**

**Applicable Coverage:** ${relevantCoverage.name}
**Limit:** ${formatMoney(relevantCoverage.limit)}
**Deductible:** ${formatMoney(relevantCoverage.deductible)}

Your ${claimType.toLowerCase()} should be covered under this policy. The deductible of ${formatMoney(relevantCoverage.deductible)} will apply.`
    : `⚠️ **Coverage may not apply directly**

This claim type doesn't match a specific coverage in your policy. However, it may fall under a broader coverage category.

I recommend discussing this with your adjuster to confirm eligibility.`
  }

**EXCLUSIONS TO NOTE:**
${policy.exclusions.map((e) => `• ${e}`).join("\n")}`;
}

function generateDocsResponse(claim: Claim): string {
  const received = claim.documents.filter((d) => d.status === "received");
  const missing = claim.documents.filter((d) => d.status === "missing" || d.status === "pending");

  return `**DOCUMENTS FOR ${claim.id}**

${received.length > 0
    ? `**Received:**\n${received.map((d) => `✅ ${d.name}${d.date ? ` — ${d.date}` : ""}`).join("\n")}`
    : ""
  }

${missing.length > 0
    ? `**Still Needed:**\n${missing.map((d) => `⚠️ ${d.name} — ${d.status === "missing" ? "Not submitted" : "Pending review"}`).join("\n")}`
    : "✅ All documents received."
  }

${missing.length > 0 ? `\n**Tip:** Submit all missing documents together for fastest processing.` : ""}`;
}

function generatePolicyDetailsResponse(policy: Policy): string {
  return `**POLICY DETAILS — ${policy.id}**

**Type:** ${policy.typeName}
**Status:** ${statusLabel(policy.status)}
**Effective:** ${policy.effectiveDate}
**Renewal:** ${policy.renewalDate}
**Premium:** ${formatMoney(policy.premium)}/month

**COVERAGES:**
${policy.coverages.map((c) => `• **${c.name}** — ${formatMoney(c.limit)} (deductible: ${formatMoney(c.deductible)})`).join("\n")}

**EXCLUSIONS:**
${policy.exclusions.map((e) => `• ${e}`).join("\n")}`;
}

function generateCustomerProfileResponse(customer: Customer): string {
  const customerPolicies = policies.filter((p) => p.customerId === customer.id);
  const customerClaimsList = claims.filter((c) => c.customerId === customer.id);

  return `**CUSTOMER PROFILE — ${customer.name}**

**Email:** ${customer.email}
**Phone:** ${customer.phone}
**Customer Since:** ${customer.customerSince}
**Preferred Contact:** ${customer.preferredContact}

**Active Policies:** ${customerPolicies.length}
${customerPolicies.map((p) => `• ${p.id} — ${p.typeName}`).join("\n")}

**Claims:** ${customerClaimsList.length} total
${customerClaimsList.map((c) => `• ${c.id} — ${c.type} (${statusLabel(c.status)})`).join("\n")}`;
}

function generateTimelineResponse(claim: Claim): string {
  return `**CLAIM TIMELINE — ${claim.id}**

${claim.timeline.map((event) =>
    `${event.status === "completed" ? "●" : event.status === "current" ? "◉" : "○"} **${event.title}** — ${event.date || "Pending"}\n  ${event.description}`
  ).join("\n\n")}`;
}

function generateGenericResponse(message: string, customerId?: string): string {
  const customer = customerId ? findCustomer(customerId) : undefined;
  const name = customer?.name?.split(" ")[0] || "there";

  const lower = message.toLowerCase();

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return `Hello${customer ? " " + name : ""}! 👋

I'm your Claims Copilot. I can help you with:

• Checking claim status
• Reviewing policy details
• Verifying coverage
• Finding required documents
• Understanding the claims process

What would you like to know?`;
  }

  if (lower.includes("help") || lower.includes("what can you")) {
    return `I can help you with several insurance tasks:

**Claims**
• Check claim status and timeline
• View missing documents
• Track claim progress

**Policies**
• Review coverage details
• Check deductibles and limits
• Understand exclusions

**Coverage**
• Verify if an incident is covered
• Compare claim type to policy terms

**Support**
• Find required documents
• Get process guidance
• Request escalations

Try asking something like "What's the status of my claim?" or "Is water damage covered?"`;
  }

  if (lower.includes("thank")) {
    return `You're welcome! Is there anything else I can help you with regarding your claims or policy?`;
  }

  if (lower.includes("deadline") || lower.includes("how long") || lower.includes("timeline") || lower.includes("processing time")) {
    const claim = findRelevantClaim(message, customerId);
    if (claim) {
      return `**Processing Timeline — ${claim.id}**

Standard processing times vary by claim complexity:
• Simple claims: **5–10 business days**
• Standard claims: **15–21 business days**
• Complex claims: **30–45 business days**

Your claim is currently **${statusLabel(claim.status)}**.

${claim.missingDocuments.length > 0
    ? `⚠️ Processing cannot proceed until all documents are submitted.`
    : `All documents are in place. Expect an update within the standard timeframe.`
  }`;
    }
    return `Processing times depend on claim complexity:
• Simple: 5–10 business days
• Standard: 15–21 business days
• Complex: 30–45 business days

I can check a specific claim's timeline if you'd like. Which claim are you referring to?`;
  }

  if (lower.includes("escalat") || lower.includes("urgent") || lower.includes("supervisor")) {
    return `I understand you'd like to escalate.

**Escalation Options:**
• Speak with a claims supervisor
• Request expedited review
• File a formal complaint

I can note this in your case file. Would you like me to proceed with an escalation request?

Please provide a brief reason for the escalation, and I'll route it to the appropriate team.`;
  }

  return `I can help with that. Could you be more specific about what you'd like to know?

For example:
• "What's the status of claim CLM-20481?"
• "Is collision damage covered under my policy?"
• "What documents am I missing?"
• "Show me my policy details"

I have access to your claims, policies, and support documentation.`;
}

// --- Main chat handler ---
export async function processMessage(
  userMessage: string,
  customerId?: string,
  conversationHistory?: ConversationMessage[]
): Promise<ConversationMessage> {
  const lower = userMessage.toLowerCase();
  const toolCalls: ToolCall[] = [];

  // Determine which tools to call based on message content
  const needsClaim = lower.includes("claim") || lower.includes("status") || lower.includes("accident") || lower.includes("vehicle") || lower.includes("damage") || lower.includes("theft") || lower.includes("windshield") || lower.includes("water") || lower.includes("parking") || lower.includes("document");
  const needsPolicy = lower.includes("policy") || lower.includes("coverage") || lower.includes("covered") || lower.includes("deductible") || lower.includes("insured") || lower.includes("plan");
  const needsCoverage = lower.includes("cover") || lower.includes("eligible") || lower.includes("will it pay") || lower.includes("will this be paid");
  const needsDocs = lower.includes("document") || lower.includes("missing") || lower.includes("need to submit") || lower.includes("upload");
  const needsTimeline = lower.includes("timeline") || lower.includes("history") || lower.includes("what happened");
  const needsCustomer = lower.includes("customer") || lower.includes("profile") || lower.includes("account");
  const needsSearch = lower.includes("how to") || lower.includes("what is") || lower.includes("explain") || lower.includes("guide");

  // Check conversation context for implicit references
  const lastAssistant = conversationHistory?.filter((m) => m.role === "assistant").slice(-1)[0];
  const implicitClaimId = lastAssistant?.referencedClaimId;

  const claim = findRelevantClaim(userMessage, customerId);
  const policy = findRelevantPolicy(userMessage, customerId);
  const customer = customerId ? findCustomer(customerId) : undefined;

  // Simulate tool execution with delays
  if (needsClaim || (!needsPolicy && !needsDocs && !needsTimeline && !needsCustomer && !needsSearch && claim)) {
    await delay(300 + Math.random() * 400);
    if (claim) {
      toolCalls.push(makeToolCall("retrieve_claim", "Checking claim information", "success", `Found claim ${claim.id}`));
    } else if (implicitClaimId && !needsPolicy) {
      const contextClaim = claims.find((c) => c.id === implicitClaimId);
      if (contextClaim) {
        toolCalls.push(makeToolCall("retrieve_claim", "Checking claim information", "success", `Using context: ${contextClaim.id}`));
      }
    }
  }

  if (needsPolicy || needsCoverage || (claim && (needsClaim || needsDocs))) {
    await delay(200 + Math.random() * 300);
    const targetPolicy = policy || (claim ? policies.find((p) => p.id === claim.policyId) : undefined);
    if (targetPolicy) {
      toolCalls.push(makeToolCall("retrieve_policy", "Looking up policy details", "success", `Found policy ${targetPolicy.id}`));
    }
  }

  if (needsCoverage) {
    await delay(200 + Math.random() * 200);
    toolCalls.push(makeToolCall("check_coverage", "Verifying coverage eligibility", "success", "Coverage check complete"));
  }

  if (needsDocs) {
    await delay(200 + Math.random() * 200);
    const targetClaim = claim || (implicitClaimId ? claims.find((c) => c.id === implicitClaimId) : undefined);
    if (targetClaim) {
      toolCalls.push(makeToolCall("check_missing_docs", "Checking document status", "success", `${targetClaim.missingDocuments.length} documents missing`));
    }
  }

  if (needsTimeline) {
    await delay(300 + Math.random() * 300);
    toolCalls.push(makeToolCall("retrieve_timeline", "Loading claim timeline", "success", "Timeline loaded"));
  }

  if (needsCustomer) {
    await delay(200 + Math.random() * 200);
    toolCalls.push(makeToolCall("retrieve_customer", "Loading customer profile", "success", "Profile loaded"));
  }

  if (needsSearch) {
    await delay(400 + Math.random() * 400);
    const query = userMessage.slice(0, 50);
    toolCalls.push(makeToolCall("search_docs", "Searching support documentation", "success", `Found results for "${query}"`));
  }

  // Always add at least a small delay to feel natural
  if (toolCalls.length === 0) {
    await delay(500 + Math.random() * 500);
  }

  // Generate response
  let content = "";
  const effectiveClaim = claim || (implicitClaimId ? claims.find((c) => c.id === implicitClaimId) : undefined);
  const effectivePolicy = policy || (effectiveClaim ? policies.find((p) => p.id === effectiveClaim.policyId) : undefined);

  if (needsTimeline && effectiveClaim) {
    content = generateTimelineResponse(effectiveClaim);
  } else if (needsDocs && effectiveClaim) {
    content = generateDocsResponse(effectiveClaim);
  } else if (needsCustomer && customer) {
    content = generateCustomerProfileResponse(customer);
  } else if (needsCoverage && effectivePolicy) {
    content = generateCoverageResponse(effectivePolicy, effectiveClaim?.type || userMessage);
  } else if (needsPolicy && effectivePolicy) {
    content = generatePolicyDetailsResponse(effectivePolicy);
  } else if ((needsClaim || !needsPolicy) && effectiveClaim && effectivePolicy) {
    content = generateClaimStatusResponse(effectiveClaim, effectivePolicy);
  } else if (needsSearch) {
    const query = lower.replace(/(how to|what is|explain|help me with|guide)/gi, "").trim();
    const relevant = supportArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.tags.some((t) => query.includes(t)) ||
        a.content.toLowerCase().includes(query)
    );
    if (relevant.length > 0) {
      content = `**SUPPORT DOCUMENTATION**\n\n${relevant.map((a) => `**${a.title}**\n${a.content}`).join("\n\n---\n\n")}`;
    } else {
      content = `I searched our support documentation but couldn't find a specific article for your query.

Here are some related topics:
${supportArticles.slice(0, 3).map((a) => `• **${a.title}** — ${a.content.slice(0, 80)}...`).join("\n")}

Would you like more details on any of these?`;
    }
  } else {
    content = generateGenericResponse(userMessage, customerId);
  }

  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: "assistant",
    content,
    timestamp: new Date().toISOString(),
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    referencedClaimId: effectiveClaim?.id,
    referencedPolicyId: effectivePolicy?.id,
  };
}
