import { logger } from "@/utils/logger.ts";
import { db } from "../index.ts";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

async function runMigrations() {
  try {
    // Ensure migrations table exists
    await db`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (name)
      );
    `;

    const migrationsDir = join(import.meta.dir, "..", "migrations");
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();

    for (const file of sqlFiles) {
      const existing = await db`SELECT id FROM _migrations WHERE name = ${file}`;

      if (existing.length === 0) {
        logger.info(`Applying migration: ${file}...`);
        const filePath = join(migrationsDir, file);
        const schema = await Bun.file(filePath).text();

        const statements = schema
          .split(";")
          .map((stmt) => stmt.trim())
          .filter((stmt) => stmt.length > 0);

        for (const statement of statements) {
          if (statement) {
            await db.unsafe(statement);
          }
        }

        await db`INSERT INTO _migrations (name) VALUES (${file})`;
        logger.info(`Migration ${file} applied successfully.`);
      } else {
        logger.info(`Migration ${file} already applied, skipping.`);
      }
    }

    logger.info("All migrations are up to date!");
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Error running migrations");
    process.exit(1);
  }
}

await runMigrations();
