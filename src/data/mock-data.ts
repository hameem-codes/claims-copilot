import type {
  Customer,
  Policy,
  Claim,
  Conversation,
  MemoryEntry,
  SupportArticle,
  AIInsight,
} from "@/types";

export const customers: Customer[] = [];
export const policies: Policy[] = [];
export const claims: Claim[] = [];
export const defaultConversations: Conversation[] = [];
export const defaultMemories: MemoryEntry[] = [];
export const supportArticles: SupportArticle[] = [];

export function getInsightsForCustomer(_customerId: string): AIInsight[] {
  return [];
}
