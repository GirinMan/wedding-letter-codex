import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { closeDatabase, getDatabase } from "../db.js";

const migrationsDirectory = fileURLToPath(new URL("../../migrations/", import.meta.url));
const sql = getDatabase();

await sql`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`;

const applied = new Set(
  (await sql<{ filename: string }[]>`SELECT filename FROM schema_migrations`)
    .map((row) => row.filename),
);
const files = (await readdir(migrationsDirectory))
  .filter((filename) => filename.endsWith(".sql"))
  .sort();

for (const filename of files) {
  if (applied.has(filename)) {
    continue;
  }

  const migration = await readFile(new URL(`../../migrations/${filename}`, import.meta.url), "utf8");
  await sql.begin(async (transaction) => {
    await transaction.unsafe(migration);
    await transaction`INSERT INTO schema_migrations (filename) VALUES (${filename})`;
  });
  process.stdout.write(`applied ${filename}\n`);
}

await closeDatabase();
