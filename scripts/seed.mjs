import { pathToFileURL } from "node:url";
import { assertSafeLocalDatabase, waitForDatabase } from "./db.mjs";
import { seedDatabase } from "./seed-data.mjs";

export async function runSeed() {
  assertSafeLocalDatabase("Local demo seed");
  await waitForDatabase();
  const summary = await seedDatabase();
  console.log(
    `Seeded fictional ClinicFlow demo data: ${summary.users} users, ${summary.patients} patients, ${summary.providers} providers, ${summary.appointments} appointments, ${summary.departments} departments, ${summary.availability} availability windows.`
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runSeed();
}
