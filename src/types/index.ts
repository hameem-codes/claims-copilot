// ============================================================
// Insurance Claims AI Copilot — Type Definitions
// ============================================================

// --- Customer ---
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  customerSince: string;
  preferredContact: "email" | "phone" | "sms";
  avatarColor: string;
}

// --- Policy ---
export type PolicyType = "auto" | "home" | "health" | "life";

export interface PolicyCoverage {
  name: string;
  limit: number;
  deductible: number;
}

export interface Policy {
  id: string;
  customerId: string;
  type: PolicyType;
  typeName: string;
  status: "active" | "expired" | "cancelled";
  effectiveDate: string;
  renewalDate: string;
  premium: number;
  coverages: PolicyCoverage[];
  exclusions: string[];
}

// --- Claim ---
export type ClaimStatus =
  | "submitted"
  | "under_review"
  | "adjuster_assigned"
  | "documents_requested"
  | "approved"
  | "denied"
  | "closed"
  | "appealed";

export interface ClaimDocument {
  name: string;
  status: "received" | "pending" | "missing";
  date?: string;
}

export interface ClaimTimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  status: "completed" | "current" | "upcoming";
}

export interface Claim {
  id: string;
  customerId: string;
  policyId: string;
  type: string;
  status: ClaimStatus;
  amount: number;
  description: string;
  incidentDate: string;
  submittedDate: string;
  lastUpdated: string;
  adjuster: string;
  documents: ClaimDocument[];
  timeline: ClaimTimelineEvent[];
  missingDocuments: string[];
}

// --- Conversation & Messages ---
export type MessageRole = "user" | "assistant" | "system";

export interface ToolCall {
  id: string;
  tool: string;
  description: string;
  status: "pending" | "running" | "success" | "error";
  result?: string;
}

export interface RetrievedSource {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  similarity: number;
  filename?: string;
}

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
  referencedClaimId?: string;
  referencedPolicyId?: string;
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: number;
  }[];
  sources?: RetrievedSource[];
  confidence?: "high" | "medium" | "low";
}

export interface Conversation {
  id: string;
  title: string;
  customerId: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
  activeClaimId?: string;
  activePolicyId?: string;
}

// --- Memory ---
export interface MemoryEntry {
  id: string;
  customerId: string;
  key: string;
  value: string;
  source: "conversation" | "claim" | "policy" | "explicit";
  createdAt: string;
}

// --- App State ---
export type AppView =
  | "dashboard"
  | "claims-policies"
  | "documents"
  | "copilot"
  | "compare"
  | "timeline"
  | "saved"
  | "settings"
  // legacy aliases kept for backward-compat with existing code
  | "claims"
  | "policies"
  | "ai-insights"
  | "support";

export type ClaimViewMode = "list" | "detail";

export interface AIInsight {
  id: string;
  type: "warning" | "info" | "action" | "success";
  title: string;
  description: string;
}

// --- Saved Analysis ---
export type AnalysisType =
  | "policy-analysis"
  | "claim-analysis"
  | "coverage-assessment"
  | "policy-vs-claim"
  | "document-comparison"
  | "discrepancy-report"
  | "ai-summary";

export interface SavedAnalysis {
  id: string;
  name: string;
  type: AnalysisType;
  createdAt: string;
  documents: string[];
  summary: string;
  confidence: number; // 0-100
  content: string;    // full analysis text
}

export interface AnalysisSession {
  id: string;
  user_id: string;
  title: string;
  status: string;
  policy_document_id: string | null;
  claim_document_id: string | null;
  policy_extracted_data?: Record<string, unknown> | null;
  claim_extracted_data?: Record<string, unknown> | null;
  comparison_data?: Record<string, unknown> | null;
  discrepancy_data?: Record<string, unknown> | null;
  assessment_data?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// --- Support Resources ---
export interface SupportArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
}

// --- Knowledge Base ---
export interface KnowledgeBaseEntry {
  id: string;
  title: string;
  category: string;
  content: string;
}

// --- Zod Schemas for Fact Extraction & Comparison ---
import { z } from "zod";

const SourceSchema = z.object({
  document_id: z.string().describe("The ID of the document where this fact was found"),
  chunk_index: z.number().describe("The chunk index where this fact was found"),
  context_snippet: z.string().describe("A brief, exact quote from the document proving this fact")
});

export const PolicyExtractionSchema = z.object({
  policy_number: z.object({ value: z.string().nullable(), source: SourceSchema.nullable() }).describe("The policy number."),
  policy_type: z.object({ value: z.string().nullable(), source: SourceSchema.nullable() }).describe("The type of policy (e.g., auto, home)."),
  effective_date: z.object({ value: z.string().nullable(), source: SourceSchema.nullable() }).describe("The effective date of the policy."),
  expiration_date: z.object({ value: z.string().nullable(), source: SourceSchema.nullable() }).describe("The expiration date of the policy."),
  premium: z.object({ value: z.string().nullable(), source: SourceSchema.nullable() }).describe("The policy premium amount."),
  coverage_types: z.array(z.object({ value: z.string(), source: SourceSchema })).describe("List of coverage types included."),
  coverage_limits: z.array(z.object({ value: z.string(), source: SourceSchema })).describe("List of coverage limits."),
  deductible: z.object({ value: z.string().nullable(), source: SourceSchema.nullable() }).describe("The deductible amount."),
  exclusions: z.array(z.object({ value: z.string(), source: SourceSchema })).describe("List of exclusions mentioned in the policy."),
  covered_events: z.array(z.object({ value: z.string(), source: SourceSchema })).describe("List of specifically covered events."),
  important_clauses: z.array(z.object({ value: z.string(), source: SourceSchema })).describe("Important clauses or conditions.")
});

export const ClaimExtractionSchema = z.object({
  claim_number: z.object({ value: z.string().nullable(), source: SourceSchema.nullable() }).describe("The claim number."),
  incident_date: z.object({ value: z.string().nullable(), source: SourceSchema.nullable() }).describe("The date the incident occurred."),
  incident_type: z.object({ value: z.string().nullable(), source: SourceSchema.nullable() }).describe("The type of incident (e.g., collision, theft, water damage)."),
  claim_amount: z.object({ value: z.string().nullable(), source: SourceSchema.nullable() }).describe("The total amount claimed."),
  incident_description: z.object({ value: z.string().nullable(), source: SourceSchema.nullable() }).describe("A description of the incident."),
  property_or_vehicle_details: z.object({ value: z.string().nullable(), source: SourceSchema.nullable() }).describe("Details of the property or vehicle involved."),
  damages: z.array(z.object({ value: z.string(), source: SourceSchema })).describe("List of specific damages reported."),
  requested_coverage: z.array(z.object({ value: z.string(), source: SourceSchema })).describe("List of coverages requested under this claim."),
  supporting_evidence: z.array(z.object({ value: z.string(), source: SourceSchema })).describe("List of supporting evidence mentioned (e.g., photos, police report)."),
  relevant_dates: z.array(z.object({ value: z.string(), source: SourceSchema })).describe("Other relevant dates mentioned in the claim.")
});

export const ComparisonSchema = z.object({
  coverage_status: z.enum(["covered", "not_covered", "uncertain"]).describe("Is the claimed incident/event covered by the policy?"),
  coverage_reason: z.string().describe("Which policy coverage supports the assessment? Or why is it uncertain?"),
  deductible: z.object({
    policy_deductible: z.string().nullable().describe("The policy deductible amount."),
    applicable_deductible: z.string().nullable().describe("The deductible applicable to this specific claim."),
    explanation: z.string().describe("Explain how the deductible relates to the claim.")
  }),
  limit_analysis: z.object({
    applicable_limit: z.string().nullable().describe("The policy coverage limit applicable to this claim."),
    claim_amount: z.string().nullable().describe("The amount claimed."),
    exceeds_limit: z.boolean().nullable().describe("Determine whether the claim exceeds the applicable limit."),
    explanation: z.string().describe("Explain the limit analysis.")
  }),
  exclusion_analysis: z.object({
    relevant_exclusions: z.array(z.string()).describe("Identify policy exclusions relevant to the claim."),
    applicable: z.boolean().nullable().describe("Does an exclusion appear applicable?"),
    explanation: z.string().describe("Explain whether an exclusion appears applicable. Never assume an exclusion applies without evidence.")
  }),
  date_analysis: z.object({
    issues: z.boolean().describe("Are there any date issues (e.g. incident occurred outside policy period)?"),
    explanation: z.string().describe("Compare policy effective date, expiration date, incident date, and claim submission date.")
  }),
  incident_analysis: z.object({
    matching_coverage: z.boolean().nullable().describe("Does the incident description/type match the policy's covered events?"),
    explanation: z.string().describe("Compare the claim's incident description/type against the policy's covered events.")
  }),
  important_clauses: z.array(z.string()).describe("Identify policy clauses that materially affect the claim."),
  missing_information: z.array(z.string()).describe("Identify information required to make a stronger assessment."),
  overall_assessment: z.string().describe("Overall assessment summarizing the comparison."),
  confidence: z.number().min(0).max(100).describe("Confidence score of the assessment from 0 to 100."),
  sources: z.array(z.object({
    document_id: z.string().describe("The document ID of the source."),
    document_type: z.enum(["policy", "claim"]).describe("The type of document."),
    chunk_index: z.number().describe("The chunk index of the source."),
    context_snippet: z.string().describe("A brief exact quote proving the conclusion.")
  })).describe("Sources that support material conclusions.")
});

export const DiscrepancySchema = z.object({
  discrepancies: z.array(z.object({
    type: z.enum(["Amounts", "Dates", "Coverage", "Claim Details", "Missing Evidence"]).describe("The category of the discrepancy."),
    severity: z.enum(["low", "medium", "high"]).describe("The severity of the discrepancy."),
    title: z.string().describe("A brief title for the discrepancy."),
    description: z.string().describe("A clear description of the discrepancy."),
    policy_value: z.string().nullable().describe("The value or clause stated in the policy."),
    claim_value: z.string().nullable().describe("The value or statement from the claim."),
    explanation: z.string().describe("Explanation of why this is a discrepancy or potential issue."),
    confidence: z.number().min(0).max(100).describe("Confidence score of this finding from 0 to 100."),
    sources: z.array(z.object({
      document_id: z.string().describe("The document ID of the source."),
      document_type: z.enum(["policy", "claim"]).describe("The type of document."),
      chunk_index: z.number().describe("The chunk index of the source."),
      context_snippet: z.string().describe("A brief exact quote proving the conclusion.")
    })).describe("Sources supporting this discrepancy.")
  })).describe("List of discrepancies detected between the policy and claim.")
});

export const AssessmentSchema = z.object({
  status: z.enum(["likely_covered", "likely_not_covered", "uncertain"]).describe("The overall assessment status of the claim."),
  confidence: z.number().min(0).max(100).describe("Confidence score of the overall assessment from 0 to 100."),
  summary: z.string().describe("A concise summary of the assessment (maximum 3 sentences)."),
  supporting_factors: z.array(z.string()).describe("Short evidence-backed points supporting the assessment."),
  concerns: z.array(z.string()).describe("Short evidence-backed points indicating potential issues or concerns."),
  missing_information: z.array(z.string()).describe("A short list of missing information required for a final decision."),
  recommended_next_steps: z.array(z.string()).describe("A short list of recommended next steps."),
  sources: z.array(z.object({
    document_id: z.string().describe("The document ID of the source."),
    document_type: z.enum(["policy", "claim"]).describe("The type of document."),
    chunk_index: z.number().describe("The chunk index of the source."),
    context_snippet: z.string().describe("A brief exact quote proving the conclusion.")
  })).describe("Sources supporting material conclusions in this assessment.")
});
