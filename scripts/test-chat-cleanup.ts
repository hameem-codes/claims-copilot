import fs from "fs";

async function runE2E() {
  let cookieString = "";
  
  console.log("1. Logging in with real Supabase test user...");
  const loginRes = await fetch("http://localhost:3000/api/test-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", password: "hameem" })
  });
  
  if (!loginRes.ok) throw new Error("Login failed");
  
  // Extract all set-cookie headers
  const cookies = loginRes.headers.getSetCookie();
  cookieString = cookies.map(c => c.split(";")[0]).join("; ");
  console.log("Session acquired.");

  console.log("2. Chatting: Asking 'What does my policy cover?'...");
  const chatRes = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "cookie": cookieString
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "What does my policy cover?" }]
    }),
  });

  const chatData = await chatRes.json();
  console.log("Chat status:", chatRes.status);
  if (chatRes.status !== 200) {
    throw new Error("Chat failed: " + JSON.stringify(chatData));
  }
  
  console.log("Chat Answer:", chatData.content);
  console.log("Sources retrieved:", chatData.sources?.length || 0);
  
  if (chatData.sources?.length === 0) {
      console.log("Warning: No sources retrieved.");
  }

  // Log exactly the source filenames
  chatData.sources?.forEach((s: any, i: number) => {
    console.log(`Source ${i+1}: ${s.filename} (ID: ${s.documentId})`);
  });

  console.log("E2E FLOW SUCCESSFUL.");
}

runE2E().catch(console.error);
