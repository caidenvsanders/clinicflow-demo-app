import fs from "node:fs/promises";
import path from "node:path";
import { fail, ok } from "@/lib/api";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const schema = await fs.readFile(path.join(process.cwd(), "database/schema.sql"), "utf8");
    const seed = await fs.readFile(path.join(process.cwd(), "database/seed.sql"), "utf8");
    await query(schema);
    await query(seed);
    return ok({ reset: true }, "Database reset to the PDF seed data.");
  } catch (error) {
    return fail(error);
  }
}
