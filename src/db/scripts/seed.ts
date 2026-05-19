import { db } from "../index.ts";
import { join } from "node:path";

async function seedData() {
  try {
    console.log("Starting database seeding...");
    const dataDir = join(import.meta.dir, "..", "data");

    // 1. Master Category
    console.log("Seeding master_category...");
    const categories = await Bun.file(join(dataDir, "master-category.json")).json();
    for (let i = 0; i < categories.length; i += 500) {
      const chunk = categories.slice(i, i + 500);
      await Promise.all(chunk.map((item: any) => db`
        INSERT INTO master_category (id, name, created_at, updated_at) 
        VALUES (${item.id}, ${item.name}, ${item.created_at}, ${item.updated_at})
        ON DUPLICATE KEY UPDATE name=${item.name}, updated_at=${item.updated_at}
      `));
      process.stdout.write('.');
    }
    console.log(`\nFinished master_category (${categories.length})`);

    // 2. Master Province
    console.log("Seeding master_province...");
    const provinces = await Bun.file(join(dataDir, "master-province.json")).json();
    for (let i = 0; i < provinces.length; i += 500) {
      const chunk = provinces.slice(i, i + 500);
      await Promise.all(chunk.map((item: any) => db`
        INSERT INTO master_province (id, name, is_active, created_at, updated_at) 
        VALUES (${item.id}, ${item.name}, ${item.is_active}, ${item.created_at}, ${item.updated_at})
        ON DUPLICATE KEY UPDATE name=${item.name}, is_active=${item.is_active}, updated_at=${item.updated_at}
      `));
      process.stdout.write('.');
    }
    console.log(`\nFinished master_province (${provinces.length})`);

    // 3. Master Group
    console.log("Seeding master_group...");
    const groups = await Bun.file(join(dataDir, "master-group.json")).json();
    for (let i = 0; i < groups.length; i += 500) {
      const chunk = groups.slice(i, i + 500);
      await Promise.all(chunk.map((item: any) => db`
        INSERT INTO master_group (id, name, is_active, created_at, updated_at) 
        VALUES (${item.id}, ${item.name}, ${item.is_active}, ${item.created_at}, ${item.updated_at})
        ON DUPLICATE KEY UPDATE name=${item.name}, is_active=${item.is_active}, updated_at=${item.updated_at}
      `));
      process.stdout.write('.');
    }
    console.log(`\nFinished master_group (${groups.length})`);

    // 4. Master Region
    console.log("Seeding master_region...");
    const regions = await Bun.file(join(dataDir, "master-region.json")).json();
    for (let i = 0; i < regions.length; i += 500) {
      const chunk = regions.slice(i, i + 500);
      await Promise.all(chunk.map((item: any) => db`
        INSERT INTO master_region (id, name, province_id, js_loker, group_id, created_at, updated_at) 
        VALUES (${item.id}, ${item.name}, ${item.province_id}, ${item.js_loker}, ${item.group_id}, ${item.created_at}, ${item.updated_at})
        ON DUPLICATE KEY UPDATE name=${item.name}, province_id=${item.province_id}, js_loker=${item.js_loker}, group_id=${item.group_id}, updated_at=${item.updated_at}
      `));
      process.stdout.write('.');
    }
    console.log(`\nFinished master_region (${regions.length})`);

    // 5. Instagram Account
    console.log("Seeding instagram_account...");
    const accounts = await Bun.file(join(dataDir, "instagram-account.json")).json();
    for (let i = 0; i < accounts.length; i += 500) {
      const chunk = accounts.slice(i, i + 500);
      await Promise.all(chunk.map((item: any) => db`
        INSERT INTO instagram_account (id, instagram_id, username, followers, following, is_external, is_active, is_manual_input, created_at, updated_at) 
        VALUES (${item.id}, ${item.instagram_id}, ${item.username}, ${item.followers}, ${item.following}, ${item.is_external}, ${item.is_active}, ${item.is_manual_input}, ${item.created_at}, ${item.updated_at})
        ON DUPLICATE KEY UPDATE instagram_id=${item.instagram_id}, username=${item.username}, followers=${item.followers}, following=${item.following}, is_external=${item.is_external}, is_active=${item.is_active}, is_manual_input=${item.is_manual_input}, updated_at=${item.updated_at}
      `));
      process.stdout.write('.');
    }
    console.log(`\nFinished instagram_account (${accounts.length})`);

    // 6. Region Account
    console.log("Seeding region_account...");
    const regionAccounts = await Bun.file(join(dataDir, "region-account.json")).json();
    for (let i = 0; i < regionAccounts.length; i += 500) {
      const chunk = regionAccounts.slice(i, i + 500);
      await Promise.all(chunk.map((item: any) => db`
        INSERT INTO region_account (id, region_id, account_id, created_at, updated_at) 
        VALUES (${item.id}, ${item.region_id}, ${item.account_id}, ${item.created_at}, ${item.updated_at})
        ON DUPLICATE KEY UPDATE region_id=${item.region_id}, account_id=${item.account_id}, updated_at=${item.updated_at}
      `));
      process.stdout.write('.');
    }
    console.log(`\nFinished region_account (${regionAccounts.length})`);

    console.log("Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\nError during seeding:", error);
    process.exit(1);
  }
}

await seedData();
