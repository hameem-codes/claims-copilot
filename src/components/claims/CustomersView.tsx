"use client";

import { useApp } from "@/context/AppContext";
import { customers, claims, policies } from "@/data/mock-data";

export function CustomersView() {
  const { currentCustomer, selectCustomer, setView } = useApp();

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg)] relative">
      <div className="geo-dot-grid absolute inset-0 opacity-20 pointer-events-none" />
      <div className="relative z-10 px-6 py-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-800 text-2xl tracking-tight">Customers</h1>
            <p className="text-muted-foreground text-sm mt-1">{customers.length} customers</p>
          </div>
          <button onClick={() => setView("copilot")} className="btn btn-sm">
            ← Back to Copilot
          </button>
        </div>

        <div className="space-y-3">
          {customers.map((customer) => {
            const customerClaims = claims.filter((c) => c.customerId === customer.id);
            const customerPolicies = policies.filter((p) => p.customerId === customer.id);
            const isActive = currentCustomer?.id === customer.id;

            return (
              <button
                key={customer.id}
                onClick={() => {
                  selectCustomer(customer);
                  setView("copilot");
                }}
                className={`card card-hover w-full p-5 text-left relative overflow-hidden ${
                  isActive ? "!border-accent !shadow-[4px_4px_0_var(--accent)]" : ""
                }`}
              >
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none" style={{ background: `${customer.avatarColor}15` }} />
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full border-2 border-foreground flex items-center justify-center text-sm font-bold text-white shadow-[2px_2px_0_var(--foreground)] shrink-0"
                    style={{ background: customer.avatarColor }}
                  >
                    {customer.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-heading font-700 text-sm">{customer.name}</p>
                      {isActive && <span className="pill pill-accent !text-[0.5rem]">Current</span>}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mb-1.5">{customer.id}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{customerPolicies.length} policies</span>
                      <span>•</span>
                      <span>{customerClaims.length} claims</span>
                      <span>•</span>
                      <span>Since {customer.customerSince}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
