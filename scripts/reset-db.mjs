import { pathToFileURL } from "node:url";
import { assertSafeLocalDatabase, runSqlFile, waitForDatabase } from "./db.mjs";
import { seedDatabase } from "./seed-data.mjs";

export async function runReset() {
  assertSafeLocalDatabase("Local demo reset");
  await waitForDatabase();
  await runSqlFile("database/schema.sql");
  const summary = await seedDatabase();
  console.log(
    `Database reset with report schema and fictional demo data: ${summary.users} users, ${summary.patients} patients, ${summary.providers} providers, ${summary.appointments} appointments.`
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runReset();
}
