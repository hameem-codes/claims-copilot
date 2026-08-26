import { createClient } from "@supabase/supabase-js";
import path from "path";

// Load environment variables from the .env.local file in the insurance-copilot folder
process.loadEnvFile(path.resolve(__dirname, "../.env.local"));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const email = process.env.TEST_USER_EMAIL || process.argv[2];
  const password = process.env.TEST_USER_PASSWORD || process.argv[3];

  if (!email || !password) {
    console.error("Please provide email and password via TEST_USER_EMAIL/TEST_USER_PASSWORD env vars or CLI arguments.");
    process.exit(1);
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login failed:", error.message);
    process.exit(1);
  }

  // Next.js @supabase/ssr expects the cookie to be named like this:
  // sb-[PROJECT-ID]-auth-token
  const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/https:\/\/(.*?)\.supabase\.co/)?.[1];
  
  if (!projectId) {
    console.error("Could not extract Supabase project ID from URL.");
    process.exit(1);
  }

  // The cookie value is a JSON array of the session tokens
  const cookieValue = JSON.stringify([
    data.session.access_token,
    data.session.refresh_token,
    null,
    null,
    null,
  ]);

  console.log(`\n✅ Login successful!`);
  console.log(`\nCOOKIE NAME: sb-${projectId}-auth-token`);
  console.log(`\nCOOKIE VALUE: base64-${Buffer.from(cookieValue).toString('base64')}`);
  console.log(`\nExample cURL flag: -H "Cookie: sb-${projectId}-auth-token=base64-${Buffer.from(cookieValue).toString('base64')}"\n`);
}

main().catch(console.error);
