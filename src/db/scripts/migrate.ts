import { db } from "../index.ts";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

async function runMigrations() {
  try {
    // Ensure migrations table exists
    await db`
      CREATE TABLE IF NOT EXISTS \`_migrations\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(255) NOT NULL,
        \`applied_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY (\`name\`)
      ) ENGINE=InnoDB;
    `;

    const migrationsDir = join(import.meta.dir, "..", "migrations");
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();

    for (const file of sqlFiles) {
      const existing = await db`SELECT id FROM \`_migrations\` WHERE name = ${file}`;

      if (existing.length === 0) {
        console.log(`Applying migration: ${file}...`);
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

        await db`INSERT INTO \`_migrations\` (name) VALUES (${file})`;
        console.log(`Migration ${file} applied successfully.`);
      } else {
        console.log(`Migration ${file} already applied, skipping.`);
      }
    }

    console.log("All migrations are up to date!");
    process.exit(0);
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
}

await runMigrations();
