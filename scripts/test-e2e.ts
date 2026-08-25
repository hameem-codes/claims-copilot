import fs from "fs";

async function runE2E() {
  let cookieString = "";
  
  console.log("1. Checking unauthenticated /api/chat...");
  const unauthChatRes = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: "Hi" }] })
  });
  console.log("Unauthenticated /api/chat status:", unauthChatRes.status);
  if (unauthChatRes.status !== 401) {
    throw new Error("Expected 401 Unauthorized for /api/chat");
  }

  console.log("2. Logging in with real Supabase test user...");
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

  console.log("3. Uploading PDF with session...");
  const formData = new FormData();
  const fileBuffer = fs.readFileSync("test.pdf");
  const blob = new Blob([fileBuffer], { type: "application/pdf" });
  formData.append("file", blob, "test.pdf");

  const uploadRes = await fetch("http://localhost:3000/api/documents/upload", {
    method: "POST",
    headers: { "cookie": cookieString },
    body: formData,
  });

  const uploadData = await uploadRes.json();
  console.log("Upload status:", uploadRes.status);
  console.log("Upload data:", uploadData);

  if (uploadRes.status !== 200) {
    throw new Error("Upload failed: " + JSON.stringify(uploadData));
  }

  // Check if upload corrupted the cookies (it shouldn't now, but if it sends a Set-Cookie, let's merge it)
  const uploadCookies = uploadRes.headers.getSetCookie();
  if (uploadCookies.length > 0) {
      console.log("Upload returned new cookies:", uploadCookies);
      // Merge cookies
      for (const c of uploadCookies) {
          const part = c.split(";")[0];
          const name = part.split("=")[0];
          const regex = new RegExp(`${name}=[^;]+`);
          if (cookieString.match(regex)) {
              cookieString = cookieString.replace(regex, part);
          } else {
              cookieString += `; ${part}`;
          }
      }
  }

  console.log("4. Chatting: Asking 'What is the deductible?'...");
  const chatRes = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "cookie": cookieString
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "What is the deductible?" }]
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

  console.log("E2E FLOW SUCCESSFUL.");
}

runE2E().catch(console.error);
