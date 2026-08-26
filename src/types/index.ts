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

