import { assertSafeLocalDatabase, runSqlFile, waitForDatabase } from "./db.mjs";

assertSafeLocalDatabase("Schema apply");
await waitForDatabase();
await runSqlFile("database/schema.sql");
console.log("Schema applied.");
