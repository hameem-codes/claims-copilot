export type QuestionIntent =
  | "claim_information"
  | "policy_coverage"
  | "documents_needed"
  | "deductible_limits"
  | "discrepancies"
  | "general_query";

export interface AnalyzedQuery {
  intent: QuestionIntent;
  expandedQueries: string[];
  resolvedQuestion: string;
}

/**
 * Derives a lightweight, structured representation of the user's question,
 * resolving conversational references and generating retrieval-oriented query variations.
 */
export function analyzeQuestion(
  question: string,
  history?: Array<{ role: string; content: string }>
): AnalyzedQuery {
  const cleanQ = question.trim();
  const lowerQ = cleanQ.toLowerCase();

  // 1. Conversational Anaphora Resolution (Context Resolution)
  let resolvedQuestion = cleanQ;
  let contextTopic: "claim" | "policy" | "document" | null = null;

  if (history && history.length > 0) {
    const recentMessages = history.slice(-4);
    for (const msg of recentMessages.reverse()) {
      const text = msg.content.toLowerCase();
      if (text.includes("claim")) {
        contextTopic = "claim";
        break;
      } else if (text.includes("policy") || text.includes("cover")) {
        contextTopic = "policy";
        break;
      }
    }
  }

  // If question is a short follow-up or uses pronouns ("its status", "is it approved", "how much?")
  const pronounRegex = /\b(it|its|this|that|they|their)\b/i;
  const isShortFollowup = cleanQ.split(" ").length <= 4 || pronounRegex.test(cleanQ);

  if (isShortFollowup && contextTopic) {
    if (contextTopic === "claim" && !lowerQ.includes("claim")) {
      resolvedQuestion = `${cleanQ} for claim`;
    } else if (contextTopic === "policy" && !lowerQ.includes("policy")) {
      resolvedQuestion = `${cleanQ} for policy coverage`;
    }
  }

  // 2. Intent Recognition (check specific terms before broad claim keywords)
  let intent: QuestionIntent = "general_query";

  if (
    lowerQ.includes("discrepancy") ||
    lowerQ.includes("discrepancies") ||
    lowerQ.includes("conflict") ||
    lowerQ.includes("mismatch") ||
    lowerQ.includes("difference")
  ) {
    intent = "discrepancies";
  } else if (
    lowerQ.includes("deductible") ||
    lowerQ.includes("limit") ||
    lowerQ.includes("out of pocket") ||
    lowerQ.includes("maximum")
  ) {
    intent = "deductible_limits";
  } else if (
    lowerQ.includes("document") ||
    lowerQ.includes("proof") ||
    lowerQ.includes("invoice") ||
    lowerQ.includes("receipt") ||
    lowerQ.includes("requirement") ||
    lowerQ.includes("need")
  ) {
    intent = "documents_needed";
  } else if (
    lowerQ.includes("policy") ||
    lowerQ.includes("cover") ||
    lowerQ.includes("exclusion") ||
    lowerQ.includes("clause")
  ) {
    intent = "policy_coverage";
  } else if (
    lowerQ.includes("claim") ||
    lowerQ.includes("incident") ||
    lowerQ.includes("loss") ||
    lowerQ.includes("damage") ||
    lowerQ.includes("status") ||
    lowerQ.includes("approved") ||
    lowerQ.includes("denied")
  ) {
    intent = "claim_information";
  }

  // 3. Dynamic Query Expansion
  const expandedQueries: string[] = [resolvedQuestion];

  switch (intent) {
    case "claim_information":
      expandedQueries.push(
        "claim number claim id claim status claim amount total claimed incident date loss description",
        "submitted claim details vehicle property damage estimate total payout status"
      );
      break;

    case "policy_coverage":
      expandedQueries.push(
        "policy number policy type effective date expiration date coverage limits premium",
        "policy coverage covered events exclusions limitations terms and conditions"
      );
      break;

    case "documents_needed":
      expandedQueries.push(
        "required documents missing evidence proof invoices receipts documentation requirements",
        "supporting documentation claim requirements police report photos receipts"
      );
      break;

    case "deductible_limits":
      expandedQueries.push(
        "deductible amount policy limit applicable limit out of pocket expense",
        "coverage limit maximum payout deductible clause terms"
      );
      break;

    case "discrepancies":
      expandedQueries.push(
        "estimate vs claim discrepancy amount difference date conflict description mismatch",
        "conflicting evidence missing documentation policy vs claim comparison"
      );
      break;

    case "general_query":
    default:
      // Generate a generic expanded query incorporating insurance terminology
      expandedQueries.push(
        `${resolvedQuestion} insurance policy claim coverage details`
      );
      break;
  }

  return {
    intent,
    expandedQueries: Array.from(new Set(expandedQueries)),
    resolvedQuestion,
  };
}
