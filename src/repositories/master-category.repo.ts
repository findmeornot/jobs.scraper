import { db } from "@/db/index";
import type { MasterCategory } from "@/types/index";

export async function findAllCategories(): Promise<MasterCategory[]> {
  return db<MasterCategory[]>`
    SELECT * FROM master_category ORDER BY name ASC
  `;
}

export async function findCategoriesByIds(ids: number[]): Promise<MasterCategory[]> {
  if (!ids.length) return [];
  return db<MasterCategory[]>`
    SELECT * FROM master_category WHERE id IN ${db(ids)}
  `;
}
