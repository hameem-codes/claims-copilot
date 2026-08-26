"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await authClient.signIn.email({
        email: email.trim(),
        password: password,
        rememberMe,
      });

      if (signInError) {
        // Use generic error for security
        setError("Invalid email or password.");
      } else {
        // Successful login, redirect to main application root
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Sign in failed:", err);
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="p-3 rounded-[var(--radius-sm)] border-2 border-error bg-error/10 text-error text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      <div className="flex flex-col">
        <label htmlFor="email" className="text-overline mb-1.5 text-left font-mono">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          required
          disabled={loading}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          placeholder="example@email.com"
          className="w-full px-4 py-3 text-sm font-body bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder:text-muted-foreground disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="password" className="text-overline mb-1.5 text-left font-mono">
          Password
        </label>
        <input
          id="password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          disabled={loading}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          placeholder="••••••••"
          className="w-full px-4 py-3 text-sm font-body bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder:text-muted-foreground disabled:opacity-50"
        />
      </div>

      <div className="flex items-center gap-2 mt-1">
        <input
          id="remember-me"
          type="checkbox"
          disabled={loading}
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="w-4 h-4 rounded border-2 border-foreground accent-accent cursor-pointer disabled:opacity-50"
        />
        <label htmlFor="remember-me" className="text-xs font-semibold select-none cursor-pointer text-foreground disabled:opacity-50">
          Remember me
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full py-3 mt-2 text-sm font-semibold !rounded-[var(--radius-sm)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Signing In...
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
