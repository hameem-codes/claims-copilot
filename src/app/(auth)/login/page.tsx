import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign In — Claims Copilot",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-[100dvh] w-screen items-center justify-center bg-background px-4 py-12 select-none overflow-hidden">
      {/* Playful dot grid background to match app style */}
      <div className="geo-dot-grid absolute inset-0 opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-[400px]">
        {/* Branding header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-accent rounded-[12px] border-2 border-foreground shadow-[3px_3px_0_var(--foreground)] flex items-center justify-center text-white font-heading font-800 text-lg mb-2">
            CC
          </div>
          <h1 className="font-heading font-800 text-2xl tracking-tight leading-none text-foreground">
            Claims Copilot
          </h1>
          <p className="text-overline mt-1">
            Insurance AI Assistant
          </p>
        </div>

        {/* Center Card */}
        <div className="card p-6 bg-card border-2 border-foreground rounded-[var(--radius-md)] shadow-[6px_6px_0_var(--foreground)] flex flex-col gap-4">
          <div>
            <h2 className="font-heading font-700 text-lg leading-tight mb-1">
              Welcome Back
            </h2>
            <p className="text-xs text-muted-foreground">
              Sign in to manage your insurance claims and policies.
            </p>
          </div>

          <LoginForm />

          <div className="border-t-2 border-border my-1" />

          <p className="text-xs text-center text-muted-foreground select-none">
            {"Don't"} have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-accent hover:underline"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
