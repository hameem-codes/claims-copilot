"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Mismatched / invalid inputs checks
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await authClient.signUp.email({
        email: email.trim(),
        password: password,
        name: name.trim(),
      });

      if (signUpError) {
        setError(signUpError.message || "Failed to create account. Please try again.");
      } else {
        // Automatically redirects or prompts log in
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Sign up failed:", err);
      setError("An unexpected error occurred. Please try again.");
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
        <label htmlFor="name" className="text-overline mb-1.5 text-left font-mono">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          name="name"
          autoComplete="name"
          required
          disabled={loading}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder="John Doe"
          className="w-full px-4 py-3 text-sm font-body bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder:text-muted-foreground disabled:opacity-50"
        />
      </div>

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
          autoComplete="new-password"
          required
          disabled={loading}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          placeholder="Minimum 8 characters"
          className="w-full px-4 py-3 text-sm font-body bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder:text-muted-foreground disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="confirmPassword" className="text-overline mb-1.5 text-left font-mono">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          disabled={loading}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError(null);
          }}
          placeholder="Re-enter password"
          className="w-full px-4 py-3 text-sm font-body bg-input border-2 border-foreground rounded-[var(--radius-sm)] focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder:text-muted-foreground disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full py-3 mt-2 text-sm font-semibold !rounded-[var(--radius-sm)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Creating Account...
          </>
        ) : (
          "Create Account"
        )}
      </button>
    </form>
  );
}
