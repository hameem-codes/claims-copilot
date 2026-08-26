"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to sign in");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border-2 border-foreground bg-card p-8 shadow-[4px_4px_0_var(--foreground)]">
        <h1 className="mb-2 text-2xl font-heading font-bold">Welcome Back</h1>
        <p className="mb-6 text-muted-foreground font-body text-sm">
          Sign in with your test account to continue.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium font-heading mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-[var(--radius-md)] border-2 border-foreground bg-input px-4 py-2 font-body text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="test@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium font-heading mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-[var(--radius-md)] border-2 border-foreground bg-input px-4 py-2 font-body text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-[var(--radius-sm)] bg-destructive/10 p-3 text-sm text-destructive border-2 border-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full !mt-6 disabled:opacity-50"
          >
            {loading ? <span className="tool-loading">◌</span> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
