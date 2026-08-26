import fs from "fs";

async function loginAndUpload() {
  try {
    console.log("Logging in...");
    const loginRes = await fetch("http://localhost:3000/api/test-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "hameem" })
    });
    
    console.log("Login status:", loginRes.status);
    const loginData = await loginRes.json();
    console.log("Login response:", loginData);

    const cookies = loginRes.headers.get("set-cookie");
    console.log("Cookies received:", cookies);

    if (!loginData.success) {
      console.log("Stopping because login failed.");
      return;
    }

    console.log("Uploading...");
    const formData = new FormData();
    const fileBuffer = fs.readFileSync("test.pdf");
    const blob = new Blob([fileBuffer], { type: "application/pdf" });
    formData.append("file", blob, "test.pdf");

    const uploadRes = await fetch("http://localhost:3000/api/documents/upload", {
      method: "POST",
      headers: {
        "cookie": cookies || ""
      },
      body: formData,
    });

    const uploadText = await uploadRes.text();
    console.log("Upload status:", uploadRes.status);
    console.log("Upload response:", uploadText);
  } catch (err) {
    console.error("Error:", err);
  }
}

loginAndUpload();
