import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const clinicTimeZone = "America/Los_Angeles";

export const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://healthcare:healthcare@localhost:5433/healthcare_scheduling";

const localHosts = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "postgres",
  "healthcare-scheduling-postgres"
]);

const blockedHostPatterns = [
  /amazonaws\.com/i,
  /render\.com/i,
  /railway\.app/i,
  /supabase\./i,
  /neon\.tech/i,
  /aivencloud\.com/i,
  /herokuapp\.com/i,
  /azure\.com/i,
  /googleapis\.com/i
];

export function assertSafeLocalDatabase(action = "database reset") {
  if ((process.env.NODE_ENV ?? "").toLowerCase() === "production") {
    throw new Error(`${action} is blocked because NODE_ENV=production.`);
  }

  const parsed = new URL(databaseUrl);
  const hostname = parsed.hostname.toLowerCase();
  const databaseName = parsed.pathname.replace(/^\//, "");
  const target = `${hostname}/${databaseName}`;

  if (blockedHostPatterns.some((pattern) => pattern.test(databaseUrl))) {
    throw new Error(
      `${action} refused because DATABASE_URL appears to point at a hosted database (${target}).`
    );
  }

  const looksLocalName = /(local|dev|demo|test|healthcare_scheduling)/i.test(databaseName);
  if (!localHosts.has(hostname) && !looksLocalName) {
    throw new Error(
      `${action} refused because DATABASE_URL is not clearly local/demo (${target}).`
    );
  }
}

export async function withClient(callback) {
  const client = new Client({
    connectionString: databaseUrl,
    options: `-c timezone=${clinicTimeZone}`
  });
  await client.connect();
  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}

export async function runSqlFile(relativePath) {
  const sql = await fs.readFile(path.join(process.cwd(), relativePath), "utf8");
  await withClient(async (client) => {
    await client.query(sql);
  });
}

export async function waitForDatabase() {
  const deadline = Date.now() + 30_000;
  let lastError;
  while (Date.now() < deadline) {
    const client = new Client({
      connectionString: databaseUrl,
      options: `-c timezone=${clinicTimeZone}`
    });
    try {
      await client.connect();
      await client.query("SELECT 1");
      await client.end();
      return;
    } catch (error) {
      lastError = error;
      await client.end().catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw lastError;
}
