import { logger } from "@/utils/logger.ts";
import { db } from "../index.ts";

async function resetDatabase() {
  try {
    logger.info("Resetting database...");

    const tables = await db.unsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    // Drop each table
    for (const table of tables as any[]) {
      const tableName = table.table_name ?? table.TABLE_NAME;
      if (tableName) {
        logger.info(`Dropping table ${tableName}...`);
        await db.unsafe(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
      }
    }

    logger.info("Database reset complete.");
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Error resetting database");
    process.exit(1);
  }
}

await resetDatabase();
