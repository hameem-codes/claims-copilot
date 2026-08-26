import fs from "fs";

async function loginAndChat() {
  try {
    console.log("Logging in...");
    const loginRes = await fetch("http://192.168.1.15:3000/api/test-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "hameem" })
    });
    
    const loginData = await loginRes.json();
    const cookies = loginRes.headers.get("set-cookie");

    if (!loginData.success) {
      console.log("Stopping because login failed.");
      return;
    }

    console.log("Chatting...");
    const chatRes = await fetch("http://192.168.1.15:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cookie": cookies || ""
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "What does the document say?" }]
      }),
    });

    const chatText = await chatRes.text();
    console.log("Chat status:", chatRes.status);
    console.log("Chat response:", chatText);
  } catch (err) {
    console.error("Error:", err);
  }
}

loginAndChat();
