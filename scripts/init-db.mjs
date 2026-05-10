import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgres://permit_radar:permit_radar@localhost:5433/permit_radar";
const sql = postgres(databaseUrl, {
  max: 1,
  idle_timeout: 5,
  connect_timeout: 10,
});
const schemaPath = path.join(process.cwd(), "db", "init", "001_schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

try {
  let lastError;

  for (let attempt = 1; attempt <= 15; attempt += 1) {
    try {
      await sql`SELECT 1`;
      await sql.unsafe(schema);
      console.log("Local Postgres schema is ready.");
      lastError = undefined;
      break;
    } catch (error) {
      lastError = error;
      await wait(1000);
    }
  }

  if (lastError) {
    throw lastError;
  }
} finally {
  await sql.end();
}
