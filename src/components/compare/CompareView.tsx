"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { claims, policies } from "@/data/mock-data";

type CompareTab = "policy-vs-claim" | "claim-vs-estimate" | "policy-vs-policy" | "multi-doc";

const tabs: { id: CompareTab; label: string; icon: string }[] = [
  { id: "policy-vs-claim",    label: "Policy vs Claim",         icon: "⊞" },
  { id: "claim-vs-estimate",  label: "Claim vs Estimate",        icon: "◈" },
  { id: "policy-vs-policy",   label: "Policy vs Policy",         icon: "▤" },
  { id: "multi-doc",          label: "Multi-Document",           icon: "▧" },
];

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function CompareView() {
  const { currentCustomer, sendMessage, setView, saveAnalysis } = useApp();
  const [activeTab, setActiveTab] = useState<CompareTab>("policy-vs-claim");
  const [selectedClaimId, setSelectedClaimId] = useState("");
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [selectedPolicy2Id, setSelectedPolicy2Id] = useState("");
  const [estimateAmount, setEstimateAmount] = useState("");
  const [multiQuery, setMultiQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const customerClaims = claims.filter(c => c.customerId === currentCustomer?.id);
  const customerPolicies = policies.filter(p => p.customerId === currentCustomer?.id);

  const selectedClaim = customerClaims.find(c => c.id === selectedClaimId) || customerClaims[0];
  const selectedPolicy = customerPolicies.find(p => p.id === selectedPolicyId) || customerPolicies[0];
  const selectedPolicy2 = customerPolicies.find(p => p.id === selectedPolicy2Id);

  const runAnalysis = async (prompt: string, analysisName: string) => {
    setRunning(true);
    setResult(null);
    try {
      setView("copilot");
      setTimeout(() => sendMessage(prompt), 100);
      saveAnalysis({
        name: analysisName,
        type: activeTab === "policy-vs-claim" ? "policy-vs-claim" :
              activeTab === "claim-vs-estimate" ? "discrepancy-report" :
              activeTab === "policy-vs-policy" ? "document-comparison" : "ai-summary",
        documents: [selectedClaim?.id || "", selectedPolicy?.id || ""].filter(Boolean),
        summary: `${analysisName} — initiated from Compare & Analyze`,
        confidence: 80,
        content: prompt,
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg)] relative">
      <div className="geo-dot-grid absolute inset-0 opacity-20 pointer-events-none" />
      <div className="relative z-10 px-6 py-6 max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading font-800 text-2xl tracking-tight">Compare & Analyze</h1>
            <p className="text-muted-foreground text-sm mt-1">AI-powered document comparison and gap analysis</p>
          </div>
          <span className="pill pill-accent shrink-0">⊞ Analysis</span>
        </div>

        {/* Tab Bar */}
        <div className="flex flex-wrap gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setResult(null); }}
              className={`px-4 py-2 text-xs font-semibold rounded-[var(--radius-sm)] border-2 transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-accent text-white border-[#6D28D9]"
                  : "bg-card border-foreground hover:bg-muted"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ─── Policy vs Claim ─── */}
        {activeTab === "policy-vs-claim" && (
          <div className="card p-6 bg-card space-y-5">
            <h2 className="font-heading font-700 text-lg">Policy vs Claim Assessment</h2>
            <p className="text-sm text-muted-foreground">Check whether your claim is covered by the selected policy, including limits, deductibles, and exclusions.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-overline mb-1.5 block">Select Claim</label>
                <select
                  value={selectedClaimId}
                  onChange={e => setSelectedClaimId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {customerClaims.map(c => <option key={c.id} value={c.id}>{c.id} — {c.type}</option>)}
                </select>
              </div>
              <div>
                <label className="text-overline mb-1.5 block">Select Policy</label>
                <select
                  value={selectedPolicyId}
                  onChange={e => setSelectedPolicyId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {customerPolicies.map(p => <option key={p.id} value={p.id}>{p.id} — {p.typeName}</option>)}
                </select>
              </div>
            </div>
            {/* Quick summary */}
            {selectedClaim && selectedPolicy && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Claim Amount", value: fmt(selectedClaim.amount) },
                  { label: "Policy Limit", value: fmt(selectedPolicy.coverages[0]?.limit || 0) },
                  { label: "Deductible", value: fmt(selectedPolicy.coverages[0]?.deductible || 0) },
                  { label: "Net Eligible", value: fmt(Math.max(0, selectedClaim.amount - (selectedPolicy.coverages[0]?.deductible || 0))) },
                ].map(r => (
                  <div key={r.label} className="bg-muted/60 rounded-[var(--radius-sm)] px-3 py-2">
                    <p className="text-overline">{r.label}</p>
                    <p className="text-sm font-semibold mt-0.5">{r.value}</p>
                  </div>
                ))}
              </div>
            )}
            {selectedClaim && selectedPolicy && (
              <div className="space-y-2">
                <p className="text-overline">Exclusions to Check</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPolicy.exclusions.map(e => (
                    <span key={e} className="pill pill-muted text-xs">{e}</span>
                  ))}
                </div>
              </div>
            )}
            <button
              disabled={running || customerClaims.length === 0}
              onClick={() => runAnalysis(
                `Compare claim ${selectedClaim?.id} (${selectedClaim?.type}, amount: ${fmt(selectedClaim?.amount || 0)}) against policy ${selectedPolicy?.id} (${selectedPolicy?.typeName}). Assess: coverage eligibility, claim amount vs policy limits, deductible impact, any exclusions that apply, and whether the claim should be approved. List any gaps or discrepancies.`,
                `Policy vs Claim — ${selectedClaim?.id}`
              )}
              className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {running ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Analyzing...</> : "⊞ Run Coverage Assessment"}
            </button>
          </div>
        )}

        {/* ─── Claim vs Estimate ─── */}
        {activeTab === "claim-vs-estimate" && (
          <div className="card p-6 bg-card space-y-5">
            <h2 className="font-heading font-700 text-lg">Claim vs Estimate Comparison</h2>
            <p className="text-sm text-muted-foreground">Compare your submitted claim amount against a repair estimate to identify discrepancies.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-overline mb-1.5 block">Select Claim</label>
                <select
                  value={selectedClaimId}
                  onChange={e => setSelectedClaimId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {customerClaims.map(c => <option key={c.id} value={c.id}>{c.id} — {c.type} ({fmt(c.amount)})</option>)}
                </select>
              </div>
              <div>
                <label className="text-overline mb-1.5 block">Estimate Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 9500"
                  value={estimateAmount}
                  onChange={e => setEstimateAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            {selectedClaim && estimateAmount && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Claimed", value: fmt(selectedClaim.amount) },
                  { label: "Estimate", value: fmt(Number(estimateAmount)) },
                  { label: "Difference", value: fmt(Math.abs(selectedClaim.amount - Number(estimateAmount))) },
                ].map(r => (
                  <div key={r.label} className="bg-muted/60 rounded-[var(--radius-sm)] px-3 py-2 text-center">
                    <p className="text-overline">{r.label}</p>
                    <p className="text-sm font-semibold mt-0.5">{r.value}</p>
                  </div>
                ))}
              </div>
            )}
            <button
              disabled={running || !estimateAmount || customerClaims.length === 0}
              onClick={() => runAnalysis(
                `Compare claim ${selectedClaim?.id} (submitted amount: ${fmt(selectedClaim?.amount || 0)}) against a repair estimate of ${fmt(Number(estimateAmount))}. Identify amount differences, check for inconsistencies, and flag anything that could affect claim approval.`,
                `Claim vs Estimate — ${selectedClaim?.id}`
              )}
              className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {running ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Analyzing...</> : "◈ Compare Amounts"}
            </button>
          </div>
        )}

        {/* ─── Policy vs Policy ─── */}
        {activeTab === "policy-vs-policy" && (
          <div className="card p-6 bg-card space-y-5">
            <h2 className="font-heading font-700 text-lg">Policy vs Policy Comparison</h2>
            <p className="text-sm text-muted-foreground">Compare two policies to identify coverage differences, limit changes, and exclusion variations.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-overline mb-1.5 block">Policy 1</label>
                <select
                  value={selectedPolicyId}
                  onChange={e => setSelectedPolicyId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select policy...</option>
                  {customerPolicies.map(p => <option key={p.id} value={p.id}>{p.id} — {p.typeName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-overline mb-1.5 block">Policy 2</label>
                <select
                  value={selectedPolicy2Id}
                  onChange={e => setSelectedPolicy2Id(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select policy...</option>
                  {customerPolicies.map(p => <option key={p.id} value={p.id}>{p.id} — {p.typeName}</option>)}
                </select>
              </div>
            </div>
            {selectedPolicy && selectedPolicy2 && (
              <div className="space-y-2">
                <p className="text-overline">Coverage Comparison</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-2 border-foreground rounded-[var(--radius-sm)]">
                    <thead>
                      <tr className="bg-muted/60">
                        <th className="text-left px-3 py-2 border-b-2 border-foreground">Coverage</th>
                        <th className="text-right px-3 py-2 border-b-2 border-foreground">{selectedPolicy.id}</th>
                        <th className="text-right px-3 py-2 border-b-2 border-foreground">{selectedPolicy2.id}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPolicy.coverages.map(cov => {
                        const cov2 = selectedPolicy2.coverages.find(c => c.name === cov.name);
                        return (
                          <tr key={cov.name} className="border-b border-border">
                            <td className="px-3 py-2 font-medium">{cov.name}</td>
                            <td className="px-3 py-2 text-right font-mono">{fmt(cov.limit)}</td>
                            <td className="px-3 py-2 text-right font-mono">{cov2 ? fmt(cov2.limit) : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <button
              disabled={running || !selectedPolicyId || !selectedPolicy2Id}
              onClick={() => runAnalysis(
                `Compare policy ${selectedPolicy?.id} (${selectedPolicy?.typeName}) with policy ${selectedPolicy2?.id} (${selectedPolicy2?.typeName}). Identify differences in coverage limits, deductibles, exclusions, and premiums. Highlight any important changes the customer should be aware of.`,
                `Policy vs Policy — ${selectedPolicy?.id} / ${selectedPolicy2?.id}`
              )}
              className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {running ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Analyzing...</> : "▤ Compare Policies"}
            </button>
          </div>
        )}

        {/* ─── Multi-Document ─── */}
        {activeTab === "multi-doc" && (
          <div className="card p-6 bg-card space-y-5">
            <h2 className="font-heading font-700 text-lg">Multi-Document Analysis</h2>
            <p className="text-sm text-muted-foreground">Ask complex questions across all your claims, policies, and uploaded documents simultaneously.</p>
            <div>
              <label className="text-overline mb-1.5 block">Your Analysis Question</label>
              <textarea
                rows={4}
                placeholder="e.g. Are there any inconsistencies between my claim dates and policy effective dates? Do my claims exceed my policy limits?"
                value={multiQuery}
                onChange={e => setMultiQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>
            <div className="space-y-2">
              <p className="text-overline">Quick Analysis Prompts</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Check for date inconsistencies across all my claims and documents",
                  "Are there contradictions between my claim descriptions and policy exclusions?",
                  "Summarize all my coverage gaps across all policies",
                  "What documents am I missing across all my active claims?",
                ].map(prompt => (
                  <button key={prompt} onClick={() => setMultiQuery(prompt)} className="pill pill-muted text-xs cursor-pointer hover:bg-muted transition-colors">
                    {prompt.slice(0, 50)}...
                  </button>
                ))}
              </div>
            </div>
            <button
              disabled={running || !multiQuery.trim()}
              onClick={() => runAnalysis(multiQuery, `Multi-Doc Analysis — ${new Date().toLocaleDateString()}`)}
              className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {running ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Analyzing...</> : "▧ Run Cross-Document Analysis"}
            </button>
          </div>
        )}

        {result && (
          <div className="card p-5 bg-card border-accent/40">
            <p className="text-overline mb-2">Analysis Result</p>
            <p className="text-sm whitespace-pre-wrap">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
