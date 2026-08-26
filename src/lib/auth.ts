import { betterAuth } from "better-auth";
import { DatabaseSync } from "node:sqlite";

declare global {
  var dbInstance: DatabaseSync | undefined;
}

const db = globalThis.dbInstance ?? new DatabaseSync("database.sqlite");
if (process.env.NODE_ENV !== "production") {
  globalThis.dbInstance = db;
}

export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
  },
});
