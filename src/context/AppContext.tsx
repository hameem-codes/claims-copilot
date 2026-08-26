"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import type { Customer, Conversation, ConversationMessage, MemoryEntry, AIInsight, AppView, ClaimViewMode, SavedAnalysis } from "@/types";
import { customers as mockCustomers, defaultConversations, defaultMemories, getInsightsForCustomer, claims as allClaims } from "@/data/mock-data";

interface AppState {
  view: AppView;
  setView: (view: AppView) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentCustomer: Customer | null;
  selectCustomer: (customer: Customer) => void;
  conversations: Conversation[];
  currentConversation: Conversation | null;
  createConversation: () => void;
  selectConversation: (id: string) => void;
  sendMessage: (content: string, attachment?: { id: string, name: string, type: string, size: number }) => Promise<void>;
  isProcessing: boolean;
  memories: MemoryEntry[];
  getMemoriesForCustomer: (customerId: string) => MemoryEntry[];
  activeClaimId: string | null;
  setActiveClaimId: (id: string | null) => void;
  claimViewMode: ClaimViewMode;
  setClaimViewMode: (mode: ClaimViewMode) => void;
  insights: AIInsight[];
  savedAnalyses: SavedAnalysis[];
  saveAnalysis: (analysis: Omit<SavedAnalysis, "id" | "createdAt">) => void;
  deleteAnalysis: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children, user }: { children: ReactNode; user?: import("@supabase/supabase-js").User | null }) {
  const initialCustomer: Customer | null = user ? {
    id: user.id,
    name: user.email?.split("@")[0] || "User",
    email: user.email || "",
    phone: "",
    customerSince: new Date().getFullYear().toString(),
    preferredContact: "email",
    avatarColor: "bg-blue-500",
  } : null;

  const [view, setView] = useState<AppView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(initialCustomer);
  const [conversations, setConversations] = useState<Conversation[]>(defaultConversations);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(defaultConversations[0]);
  const [memories] = useState<MemoryEntry[]>(defaultMemories);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeClaimId, setActiveClaimId] = useState<string | null>(user ? null : "CLM-20481");
  const [claimViewMode, setClaimViewMode] = useState<ClaimViewMode>("list");
  const [insights, setInsights] = useState<AIInsight[]>(getInsightsForCustomer("cust-001"));
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const selectCustomer = useCallback((customer: Customer) => {
    setCurrentCustomer(customer);
    setInsights(getInsightsForCustomer(customer.id));
    const customerConversations = conversationsRef.current.filter((c) => c.customerId === customer.id);
    setCurrentConversation(customerConversations.length > 0 ? customerConversations[0] : null);
    const customerClaims = allClaims.filter((c) => c.customerId === customer.id);
    if (customerClaims.length > 0) {
      const activeClaim = customerClaims.find((c) => c.status !== "closed" && c.status !== "denied");
      setActiveClaimId(activeClaim?.id || customerClaims[0].id);
    } else setActiveClaimId(null);
  }, []);

  const createConversation = useCallback(() => {
    if (!currentCustomer) return;
    const newConv: Conversation = { id: `conv-${Date.now()}`, title: "New conversation", customerId: currentCustomer.id, messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setConversations((prev) => [newConv, ...prev]);
    setCurrentConversation(newConv);
    setView("copilot");
  }, [currentCustomer]);

  const selectConversation = useCallback((id: string) => {
    const conv = conversationsRef.current.find((c) => c.id === id);
    if (conv) { setCurrentConversation(conv); setView("copilot"); }
  }, []);

  const sendMessage = useCallback(async (content: string, attachment?: { id: string, name: string, type: string, size: number }) => {
    if (!currentCustomer) return;
    const userMessage: ConversationMessage = { id: `msg-${Date.now()}`, role: "user", content, timestamp: new Date().toISOString(), attachments: attachment ? [attachment] : undefined };
    let activeConv = currentConversation;
    if (!activeConv) {
      const newConv: Conversation = { id: `conv-${Date.now()}`, title: content.slice(0, 50) + (content.length > 50 ? "..." : ""), customerId: currentCustomer.id, messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), activeClaimId: activeClaimId || undefined };
      activeConv = newConv;
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversation(newConv);
    }
    const updatedMessages = [...activeConv.messages, userMessage];
    const updatedConv = { ...activeConv, messages: updatedMessages, updatedAt: new Date().toISOString() };
    setCurrentConversation(updatedConv);
    setConversations((prev) => prev.map((c) => (c.id === updatedConv.id ? updatedConv : c)));
    setIsProcessing(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          activeClaimId,
          activePolicyId: undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("API response error");
      }

      const responseData = await response.json();
      if (responseData.error) {
        throw new Error(responseData.error);
      }

      const finalConv = {
        ...updatedConv,
        messages: [...updatedMessages, responseData],
        updatedAt: new Date().toISOString(),
        activeClaimId: responseData.referencedClaimId || updatedConv.activeClaimId,
        activePolicyId: responseData.referencedPolicyId || updatedConv.activePolicyId,
      };
      setCurrentConversation(finalConv);
      setConversations((prev) => prev.map((c) => (c.id === finalConv.id ? finalConv : c)));
      if (responseData.referencedClaimId) setActiveClaimId(responseData.referencedClaimId);
    } catch {
      const errorMessage: ConversationMessage = { id: `msg-${Date.now()}`, role: "assistant", content: "I apologize, but I encountered an error processing your request. Please try again.", timestamp: new Date().toISOString() };
      const errorConv = { ...updatedConv, messages: [...updatedMessages, errorMessage] };
      setCurrentConversation(errorConv);
      setConversations((prev) => prev.map((c) => (c.id === errorConv.id ? errorConv : c)));
    } finally { setIsProcessing(false); }
  }, [currentCustomer, currentConversation, activeClaimId]);

  const getMemoriesForCustomer = useCallback((customerId: string) => memories.filter((m) => m.customerId === customerId), [memories]);

  const saveAnalysis = useCallback((analysis: Omit<SavedAnalysis, "id" | "createdAt">) => {
    const newAnalysis: SavedAnalysis = {
      ...analysis,
      id: `analysis-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSavedAnalyses((prev) => [newAnalysis, ...prev]);
  }, []);

  const deleteAnalysis = useCallback((id: string) => {
    setSavedAnalyses((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return <AppContext.Provider value={{ view, setView, sidebarOpen, setSidebarOpen, currentCustomer, selectCustomer, conversations, currentConversation, createConversation, selectConversation, sendMessage, isProcessing, memories, getMemoriesForCustomer, activeClaimId, setActiveClaimId, claimViewMode, setClaimViewMode, insights, savedAnalyses, saveAnalysis, deleteAnalysis }}>{children}</AppContext.Provider>;
}
