// ============================================================
// Mock Insurance Data
// ============================================================

import type {
  Customer,
  Policy,
  Claim,
  Conversation,
  MemoryEntry,
  SupportArticle,
  AIInsight,
} from "@/types";

// --- Customers ---
export const customers: Customer[] = [
  {
    id: "cust-001",
    name: "Sarah Mitchell",
    email: "sarah.mitchell@email.com",
    phone: "(555) 234-8901",
    customerSince: "2022-03-15",
    preferredContact: "email",
    avatarColor: "#8B5CF6",
  },
  {
    id: "cust-002",
    name: "James Rodriguez",
    email: "james.r@email.com",
    phone: "(555) 345-6789",
    customerSince: "2021-07-22",
    preferredContact: "phone",
    avatarColor: "#F472B6",
  },
  {
    id: "cust-003",
    name: "Emily Chen",
    email: "emily.chen@email.com",
    phone: "(555) 456-1234",
    customerSince: "2023-01-10",
    preferredContact: "sms",
    avatarColor: "#34D399",
  },
  {
    id: "cust-004",
    name: "Marcus Williams",
    email: "marcus.w@email.com",
    phone: "(555) 567-8901",
    customerSince: "2020-11-05",
    preferredContact: "email",
    avatarColor: "#FBBF24",
  },
];

// --- Policies ---
export const policies: Policy[] = [
  {
    id: "POL-839204",
    customerId: "cust-001",
    type: "auto",
    typeName: "Comprehensive Auto Insurance",
    status: "active",
    effectiveDate: "2025-11-14",
    renewalDate: "2026-11-14",
    premium: 142.5,
    coverages: [
      { name: "Collision", limit: 50000, deductible: 500 },
      { name: "Comprehensive", limit: 50000, deductible: 250 },
      { name: "Liability", limit: 100000, deductible: 0 },
      { name: "Uninsured Motorist", limit: 25000, deductible: 0 },
      { name: "Medical Payments", limit: 10000, deductible: 0 },
    ],
    exclusions: [
      "Intentional damage",
      "Racing or speed contests",
      "Commercial use",
      "Wear and tear",
      "Nuclear hazard",
    ],
  },
  {
    id: "POL-839205",
    customerId: "cust-001",
    type: "home",
    typeName: "Homeowner's Insurance",
    status: "active",
    effectiveDate: "2025-06-01",
    renewalDate: "2026-06-01",
    premium: 210.0,
    coverages: [
      { name: "Dwelling", limit: 350000, deductible: 1000 },
      { name: "Personal Property", limit: 175000, deductible: 500 },
      { name: "Liability", limit: 300000, deductible: 0 },
      { name: "Additional Living Expenses", limit: 50000, deductible: 0 },
    ],
    exclusions: [
      "Flood damage",
      "Earthquake damage",
      "Neglect or poor maintenance",
      "Government action",
    ],
  },
  {
    id: "POL-839310",
    customerId: "cust-002",
    type: "auto",
    typeName: "Standard Auto Insurance",
    status: "active",
    effectiveDate: "2025-08-20",
    renewalDate: "2026-08-20",
    premium: 98.75,
    coverages: [
      { name: "Collision", limit: 30000, deductible: 1000 },
      { name: "Liability", limit: 50000, deductible: 0 },
      { name: "Medical Payments", limit: 5000, deductible: 0 },
    ],
    exclusions: [
      "Intentional damage",
      "Racing",
      "Commercial use",
    ],
  },
  {
    id: "POL-839450",
    customerId: "cust-003",
    type: "auto",
    typeName: "Comprehensive Auto Insurance",
    status: "active",
    effectiveDate: "2025-04-10",
    renewalDate: "2026-04-10",
    premium: 165.0,
    coverages: [
      { name: "Collision", limit: 75000, deductible: 500 },
      { name: "Comprehensive", limit: 75000, deductible: 250 },
      { name: "Liability", limit: 200000, deductible: 0 },
      { name: "Roadside Assistance", limit: 500, deductible: 0 },
    ],
    exclusions: [
      "Intentional damage",
      "Racing",
      "Commercial use",
      "Wear and tear",
    ],
  },
  {
    id: "POL-839500",
    customerId: "cust-004",
    type: "home",
    typeName: "Homeowner's Insurance Plus",
    status: "active",
    effectiveDate: "2025-01-01",
    renewalDate: "2026-01-01",
    premium: 285.0,
    coverages: [
      { name: "Dwelling", limit: 500000, deductible: 500 },
      { name: "Personal Property", limit: 250000, deductible: 250 },
      { name: "Liability", limit: 500000, deductible: 0 },
      { name: "Flood Rider", limit: 100000, deductible: 2500 },
    ],
    exclusions: [
      "Earthquake",
      "Neglect",
    ],
  },
];

// --- Claims ---
export const claims: Claim[] = [
  {
    id: "CLM-20481",
    customerId: "cust-001",
    policyId: "POL-839204",
    type: "Vehicle Collision",
    status: "under_review",
    amount: 8450,
    description:
      "Rear-ended at intersection on Main St. Damage to rear bumper, trunk, and left taillight assembly.",
    incidentDate: "2026-08-10",
    submittedDate: "2026-08-12",
    lastUpdated: "2026-08-20",
    adjuster: "David Park",
    documents: [
      { name: "Claim Form", status: "received", date: "2026-08-12" },
      { name: "Photos of Damage", status: "received", date: "2026-08-12" },
      { name: "Police Report", status: "missing" },
      { name: "Repair Estimate", status: "missing" },
    ],
    timeline: [
      {
        id: "tl-1",
        date: "2026-08-12",
        title: "Claim submitted",
        description: "Claim filed online with incident photos",
        status: "completed",
      },
      {
        id: "tl-2",
        date: "2026-08-14",
        title: "Documents received",
        description: "Initial documentation acknowledged",
        status: "completed",
      },
      {
        id: "tl-3",
        date: "2026-08-16",
        title: "Adjuster assigned",
        description: "David Park assigned as field adjuster",
        status: "completed",
      },
      {
        id: "tl-4",
        date: "2026-08-18",
        title: "Under review",
        description: "Awaiting police report and repair estimate",
        status: "current",
      },
      {
        id: "tl-5",
        date: "",
        title: "Decision",
        description: "Coverage determination pending",
        status: "upcoming",
      },
    ],
    missingDocuments: ["Police Report", "Repair Estimate"],
  },
  {
    id: "CLM-18392",
    customerId: "cust-001",
    policyId: "POL-839204",
    type: "Windshield Damage",
    status: "closed",
    amount: 420,
    description:
      "Cracked windshield from road debris on highway. Full windshield replacement needed.",
    incidentDate: "2025-11-02",
    submittedDate: "2025-11-03",
    lastUpdated: "2025-11-15",
    adjuster: "Lisa Tran",
    documents: [
      { name: "Claim Form", status: "received", date: "2025-11-03" },
      { name: "Photos", status: "received", date: "2025-11-03" },
      { name: "Repair Invoice", status: "received", date: "2025-11-10" },
    ],
    timeline: [
      {
        id: "tl-1",
        date: "2025-11-03",
        title: "Claim submitted",
        description: "Filed online",
        status: "completed",
      },
      {
        id: "tl-2",
        date: "2025-11-06",
        title: "Adjuster assigned",
        description: "Lisa Tran",
        status: "completed",
      },
      {
        id: "tl-3",
        date: "2025-11-10",
        title: "Approved",
        description: "Coverage confirmed under comprehensive",
        status: "completed",
      },
      {
        id: "tl-4",
        date: "2025-11-15",
        title: "Closed",
        description: "Reimbursement processed — $370 paid",
        status: "completed",
      },
    ],
    missingDocuments: [],
  },
  {
    id: "CLM-20601",
    customerId: "cust-002",
    policyId: "POL-839310",
    type: "Parking Lot Damage",
    status: "documents_requested",
    amount: 2300,
    description:
      "Vehicle scratched and dented by unknown party in shopping center parking lot.",
    incidentDate: "2026-08-05",
    submittedDate: "2026-08-06",
    lastUpdated: "2026-08-15",
    adjuster: "Maria Santos",
    documents: [
      { name: "Claim Form", status: "received", date: "2026-08-06" },
      { name: "Photos", status: "received", date: "2026-08-06" },
      { name: "Police Report", status: "missing" },
      { name: "Repair Estimate", status: "missing" },
      { name: "Witness Statement", status: "missing" },
    ],
    timeline: [
      {
        id: "tl-1",
        date: "2026-08-06",
        title: "Claim submitted",
        description: "Filed with incident photos",
        status: "completed",
      },
      {
        id: "tl-2",
        date: "2026-08-10",
        title: "Documents requested",
        description: "Additional documents needed",
        status: "current",
      },
      {
        id: "tl-3",
        date: "",
        title: "Adjuster review",
        description: "Pending document submission",
        status: "upcoming",
      },
      {
        id: "tl-4",
        date: "",
        title: "Decision",
        description: "",
        status: "upcoming",
      },
    ],
    missingDocuments: ["Police Report", "Repair Estimate", "Witness Statement"],
  },
  {
    id: "CLM-20720",
    customerId: "cust-003",
    policyId: "POL-839450",
    type: "Vehicle Theft Attempt",
    status: "approved",
    amount: 3200,
    description:
      "Broken window and attempted theft of stereo system. Vehicle was parked overnight.",
    incidentDate: "2026-07-28",
    submittedDate: "2026-07-29",
    lastUpdated: "2026-08-18",
    adjuster: "Robert Kim",
    documents: [
      { name: "Claim Form", status: "received", date: "2026-07-29" },
      { name: "Police Report", status: "received", date: "2026-07-29" },
      { name: "Photos", status: "received", date: "2026-07-29" },
      { name: "Repair Estimate", status: "received", date: "2026-08-05" },
    ],
    timeline: [
      {
        id: "tl-1",
        date: "2026-07-29",
        title: "Claim submitted",
        description: "Filed with police report",
        status: "completed",
      },
      {
        id: "tl-2",
        date: "2026-08-02",
        title: "Adjuster assigned",
        description: "Robert Kim",
        status: "completed",
      },
      {
        id: "tl-3",
        date: "2026-08-10",
        title: "Under review",
        description: "All documents received",
        status: "completed",
      },
      {
        id: "tl-4",
        date: "2026-08-18",
        title: "Approved",
        description: "Claim approved — $2,950 reimbursement",
        status: "completed",
      },
    ],
    missingDocuments: [],
  },
  {
    id: "CLM-20755",
    customerId: "cust-004",
    policyId: "POL-839500",
    type: "Water Damage",
    status: "appealed",
    amount: 15800,
    description:
      "Burst pipe in basement causing significant water damage to finished basement and stored items.",
    incidentDate: "2026-06-15",
    submittedDate: "2026-06-16",
    lastUpdated: "2026-08-10",
    adjuster: "Angela Torres",
    documents: [
      { name: "Claim Form", status: "received", date: "2026-06-16" },
      { name: "Photos", status: "received", date: "2026-06-16" },
      { name: "Plumber Report", status: "received", date: "2026-06-20" },
      { name: "Repair Estimate", status: "received", date: "2026-06-25" },
      { name: "Contents Inventory", status: "received", date: "2026-06-28" },
    ],
    timeline: [
      {
        id: "tl-1",
        date: "2026-06-16",
        title: "Claim submitted",
        description: "Filed with plumber report",
        status: "completed",
      },
      {
        id: "tl-2",
        date: "2026-06-22",
        title: "Adjuster assigned",
        description: "Angela Torres",
        status: "completed",
      },
      {
        id: "tl-3",
        date: "2026-07-15",
        title: "Denied",
        description: "Claim denied — deemed wear and tear",
        status: "completed",
      },
      {
        id: "tl-4",
        date: "2026-07-20",
        title: "Appeal filed",
        description: "Customer appealed with additional plumber documentation",
        status: "completed",
      },
      {
        id: "tl-5",
        date: "2026-08-10",
        title: "Appeal under review",
        description: "Senior adjuster reviewing appeal",
        status: "current",
      },
      {
        id: "tl-6",
        date: "",
        title: "Appeal decision",
        description: "",
        status: "upcoming",
      },
    ],
    missingDocuments: [],
  },
];

// --- Default Conversations ---
export const defaultConversations: Conversation[] = [
  {
    id: "conv-001",
    title: "Vehicle damage claim review",
    customerId: "cust-001",
    createdAt: "2026-08-20T10:30:00Z",
    updatedAt: "2026-08-20T10:45:00Z",
    activeClaimId: "CLM-20481",
    messages: [
      {
        id: "msg-001",
        role: "user",
        content: "What's happening with my car accident claim?",
        timestamp: "2026-08-20T10:30:00Z",
      },
      {
        id: "msg-002",
        role: "assistant",
        content: `**CLAIM STATUS — CLM-20481**

Your vehicle collision claim is currently **Under Review**.

**Claim Details:**
| Field | Value |
|-------|-------|
| Type | Vehicle Collision |
| Amount | $8,450 |
| Adjuster | David Park |
| Submitted | Aug 12, 2026 |
| Last Update | Aug 20, 2026 |

**WHAT'S BLOCKING IT**
• Police report — not yet received
• Repair estimate — not yet received

**NEXT ACTION**
Upload both documents to move the claim forward. Once received, the adjuster can complete the review.`,
        timestamp: "2026-08-20T10:30:05Z",
        toolCalls: [
          { id: "tc-1", tool: "retrieve_claim", description: "Retrieving claim status", status: "success", result: "Claim CLM-20481 found" },
          { id: "tc-2", tool: "retrieve_policy", description: "Checking policy details", status: "success", result: "Policy POL-839204 found" },
        ],
        referencedClaimId: "CLM-20481",
      },
      {
        id: "msg-003",
        role: "user",
        content: "What documents do I still need?",
        timestamp: "2026-08-20T10:32:00Z",
      },
      {
        id: "msg-004",
        role: "assistant",
        content: `For **CLM-20481**, you're still missing:

1. **Police Report** — You can request a copy from the local police department or online portal
2. **Repair Estimate** — Get this from any licensed auto body shop

Once both are uploaded, your claim will move to the next stage.

Need help finding a repair shop nearby?`,
        timestamp: "2026-08-20T10:32:05Z",
        toolCalls: [
          { id: "tc-3", tool: "check_missing_docs", description: "Checking missing documents", status: "success", result: "2 documents missing" },
        ],
        referencedClaimId: "CLM-20481",
      },
    ],
  },
  {
    id: "conv-002",
    title: "Coverage question — home policy",
    customerId: "cust-001",
    createdAt: "2026-08-19T14:00:00Z",
    updatedAt: "2026-08-19T14:20:00Z",
    messages: [
      {
        id: "msg-010",
        role: "user",
        content: "Is water damage from a burst pipe covered under my home policy?",
        timestamp: "2026-08-19T14:00:00Z",
      },
      {
        id: "msg-011",
        role: "assistant",
        content: `Yes, **sudden and accidental** water damage from a burst pipe is generally covered under your Homeowner's Insurance (POL-839205).

**Coverage Summary:**
• Dwelling coverage: up to $350,000
• Personal Property: up to $175,000
• Deductible: $1,000

**Important Notes:**
• Gradual leaks or long-term water damage may NOT be covered
• The key factor is whether the pipe burst was sudden vs. due to neglect
• Document everything immediately — photos, receipts, timeline

Would you like me to help you file a claim?`,
        timestamp: "2026-08-19T14:00:08Z",
        toolCalls: [
          { id: "tc-10", tool: "retrieve_policy", description: "Looking up home policy", status: "success", result: "Policy POL-839205 found" },
          { id: "tc-11", tool: "check_coverage", description: "Checking coverage eligibility", status: "success", result: "Eligible — sudden water damage" },
        ],
        referencedPolicyId: "POL-839205",
      },
    ],
  },
  {
    id: "conv-003",
    title: "Previous claim — windshield",
    customerId: "cust-001",
    createdAt: "2026-08-15T09:00:00Z",
    updatedAt: "2026-08-15T09:15:00Z",
    messages: [
      {
        id: "msg-020",
        role: "user",
        content: "How much was I reimbursed for my windshield claim?",
        timestamp: "2026-08-15T09:00:00Z",
      },
      {
        id: "msg-021",
        role: "assistant",
        content: `For your windshield claim **CLM-18392**:

**Reimbursement: $370**

The claim was processed under your Comprehensive coverage with a $250 deductible. The total repair cost was $420.

This claim was closed on Nov 15, 2025.`,
        timestamp: "2026-08-15T09:00:06Z",
        toolCalls: [
          { id: "tc-20", tool: "retrieve_claim", description: "Retrieving claim details", status: "success", result: "Claim CLM-18392 found" },
        ],
        referencedClaimId: "CLM-18392",
      },
    ],
  },
];

// --- Memory ---
export const defaultMemories: MemoryEntry[] = [
  { id: "mem-001", customerId: "cust-001", key: "preferred_contact", value: "Email", source: "policy", createdAt: "2026-08-20T00:00:00Z" },
  { id: "mem-002", customerId: "cust-001", key: "active_claim", value: "CLM-20481 — Vehicle Collision, Under Review", source: "claim", createdAt: "2026-08-20T00:00:00Z" },
  { id: "mem-003", customerId: "cust-001", key: "previous_claim", value: "CLM-18392 — Windshield, Closed, $370 reimbursed", source: "claim", createdAt: "2026-08-15T00:00:00Z" },
  { id: "mem-004", customerId: "cust-001", key: "communication_style", value: "Customer prefers concise, direct updates", source: "conversation", createdAt: "2026-08-20T00:00:00Z" },
  { id: "mem-005", customerId: "cust-001", key: "last_topic", value: "Discussed deductible amounts on Aug 19", source: "conversation", createdAt: "2026-08-19T00:00:00Z" },
  { id: "mem-006", customerId: "cust-001", key: "vehicles", value: "2023 Honda Civic — primary vehicle", source: "claim", createdAt: "2026-08-12T00:00:00Z" },
  { id: "mem-007", customerId: "cust-002", key: "active_claim", value: "CLM-20601 — Parking Lot Damage, Documents Requested", source: "claim", createdAt: "2026-08-06T00:00:00Z" },
  { id: "mem-008", customerId: "cust-003", key: "active_claim", value: "CLM-20720 — Vehicle Theft Attempt, Approved", source: "claim", createdAt: "2026-07-29T00:00:00Z" },
  { id: "mem-009", customerId: "cust-004", key: "active_claim", value: "CLM-20755 — Water Damage, Appealed", source: "claim", createdAt: "2026-06-16T00:00:00Z" },
];

// --- Support Articles ---
export const supportArticles: SupportArticle[] = [
  {
    id: "sa-001",
    title: "How to Submit Vehicle Damage Photos",
    category: "Claims Process",
    content: "Take clear photos from multiple angles: front, back, sides, and close-ups of all damage. Include your license plate in at least one photo. Ensure good lighting and avoid using flash on reflective surfaces.",
    tags: ["photos", "documentation", "vehicle", "claims"],
  },
  {
    id: "sa-002",
    title: "Understanding Your Deductible",
    category: "Policy Basics",
    content: "Your deductible is the amount you pay out-of-pocket before insurance coverage kicks in. For example, with a $500 deductible on a $5,000 claim, you pay $500 and insurance covers $4,500.",
    tags: ["deductible", "payments", "policy"],
  },
  {
    id: "sa-003",
    title: "What Happens During Claim Review?",
    category: "Claims Process",
    content: "During claim review, an assigned adjuster examines your claim documentation, verifies coverage, may request additional information, and determines the eligible reimbursement amount.",
    tags: ["review", "adjuster", "process"],
  },
  {
    id: "sa-004",
    title: "Required Documents for Reimbursement",
    category: "Claims Process",
    content: "Common required documents include: completed claim form, photos of damage, police report (for accidents/theft), repair estimates, receipts for temporary repairs, and witness statements when applicable.",
    tags: ["documents", "reimbursement", "requirements"],
  },
  {
    id: "sa-005",
    title: "How Claim Decisions Are Made",
    category: "Claims Process",
    content: "Claims are evaluated based on your policy coverage, the nature of the incident, submitted documentation, and policy terms. Approvals, denials, and partial approvals all include written explanations.",
    tags: ["decision", "approval", "denial", "process"],
  },
  {
    id: "sa-006",
    title: "Filing a Claim After an Accident",
    category: "Getting Started",
    content: "Ensure safety first, call police if needed, exchange information with other parties, document everything with photos, and file your claim within 24-48 hours for fastest processing.",
    tags: ["accident", "filing", "getting started"],
  },
];

// --- Default AI Insights ---
export function getInsightsForCustomer(customerId: string): AIInsight[] {
  const customerClaims = claims.filter(
    (c) => c.customerId === customerId && c.status !== "closed"
  );
  const insights: AIInsight[] = [];

  customerClaims.forEach((claim) => {
    if (claim.missingDocuments.length > 0) {
      insights.push({
        id: `ins-${claim.id}-docs`,
        type: "warning",
        title: `${claim.id}: Missing Documents`,
        description: `${claim.missingDocuments.length} document(s) still needed: ${claim.missingDocuments.join(", ")}`,
      });
    }
    if (claim.status === "appealed") {
      insights.push({
        id: `ins-${claim.id}-appeal`,
        type: "action",
        title: `${claim.id}: Appeal In Progress`,
        description: "This claim was denied and is currently under appeal review. Consider providing additional documentation.",
      });
    }
    if (claim.status === "approved") {
      insights.push({
        id: `ins-${claim.id}-approved`,
        type: "success",
        title: `${claim.id}: Approved`,
        description: `Claim approved. Reimbursement is being processed.`,
      });
    }
  });

  if (insights.length === 0) {
    insights.push({
      id: `ins-${customerId}-ok`,
      type: "info",
      title: "No Active Issues",
      description: "All claims are in good standing. No immediate action needed.",
    });
  }

  return insights;
}
