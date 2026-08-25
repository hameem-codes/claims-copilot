import fs from "fs";

const envLocal = fs.readFileSync(".env.local", "utf-8");
const groqKey = envLocal.split("\n").find(l => l.startsWith("GROQ_API_KEY"))?.split("=")[1]?.trim();

fetch('https://api.groq.com/openai/v1/models', { 
  headers: { 'Authorization': 'Bearer ' + groqKey } 
})
.then(r => r.json())
.then(d => {
  if (d.data) {
    console.log(d.data.map((m: any) => m.id).join('\n'));
  } else {
    console.log("Error:", d);
  }
})
.catch(console.error);
