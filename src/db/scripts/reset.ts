import { db } from "../index.ts";

async function resetDatabase() {
  try {
    console.log("Resetting database...");
    
    // Disable foreign key checks
    await db.unsafe("SET FOREIGN_KEY_CHECKS = 0");

    // Get all tables
    const tables = await db.unsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = (SELECT DATABASE())
    `);

    // Drop each table
    for (const table of tables as any[]) {
      const tableName = table.table_name ?? table.TABLE_NAME;
      if (tableName) {
        console.log(`Dropping table ${tableName}...`);
        await db.unsafe(`DROP TABLE IF EXISTS \`${tableName}\``);
      }
    }

    // Re-enable foreign key checks
    await db.unsafe("SET FOREIGN_KEY_CHECKS = 1");

    console.log("Database reset complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  }
}

await resetDatabase();
