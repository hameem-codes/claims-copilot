import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { Client } from "pg";

const envLocal = fs.readFileSync(".env.local", "utf-8");
const dbUrl = envLocal.split("\n").find(l => l.startsWith("DATABASE_URL"))?.split("=")[1]?.trim();

async function check() {
  if (dbUrl) {
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    const res = await client.query(`
      SELECT pg_get_functiondef(oid)
      FROM pg_proc
      WHERE proname = 'match_document_chunks';
    `);
    console.log(res.rows[0].pg_get_functiondef);
    await client.end();
  } else {
    console.log("No DATABASE_URL found");
  }
}
check().catch(console.error);
