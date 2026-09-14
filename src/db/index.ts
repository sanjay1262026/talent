import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { createMockDb } from "./mock-db";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsDb?: any;
};

let localPool: Pool | null = null;
let databaseInstance: any = null;

if (databaseUrl) {
  try {
    localPool =
      globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
      });

    if (process.env.NODE_ENV !== "production") {
      globalForDb.__arenaNextJsPostgresqlPool = localPool;
    }

    databaseInstance = drizzle(localPool);
  } catch (error) {
    console.warn("[TalentOS] PostgreSQL connection failed, falling back to mock:", error);
    databaseInstance = createMockDb();
  }
} else {
  console.info("[TalentOS] No DATABASE_URL provided — using in-memory database store.");
  databaseInstance = globalForDb.__arenaNextJsDb ?? createMockDb();
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsDb = databaseInstance;
  }
}

export const pool = localPool;
export const db = databaseInstance;
