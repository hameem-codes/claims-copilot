import fs from "fs";

async function testUploadLocalhost() {
  try {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync("test.pdf");
    const blob = new Blob([fileBuffer], { type: "application/pdf" });
    formData.append("file", blob, "test.pdf");

    const response = await fetch("http://localhost:3000/api/documents/upload", {
      method: "POST",
      body: formData,
    });

    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}
testUploadLocalhost();
