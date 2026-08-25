import path from "path";
import fs from "fs";
import { embedText } from "../src/lib/rag/embed";

process.loadEnvFile(path.resolve(__dirname, "../.env.local"));

async function testEmbed() {
  try {
    const embedding = await embedText("Hello world, this is a test chunk.");
    console.log("Embedding successful, length:", embedding.length);
  } catch (err) {
    console.error("Embedding failed:", err);
  }
}

testEmbed();
