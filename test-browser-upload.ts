import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";

async function run() {
  const fileBuffer = fs.readFileSync("policy_test.pdf");
  const formData = new FormData();
  formData.append("file", fileBuffer, { filename: "policy_test.pdf", contentType: "application/pdf" });

  const res = await fetch("http://localhost:3001/api/documents/upload", {
    method: "POST",
    body: formData as any
  });

  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}
run();
