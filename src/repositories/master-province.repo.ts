import { db } from "@/db/index";
import type { MasterProvince } from "@/types/index";

export async function findAllProvinces(activeOnly = false): Promise<MasterProvince[]> {
  if (activeOnly) {
    return db<MasterProvince[]>`
      SELECT * FROM master_province WHERE is_active = 1 ORDER BY name ASC
    `;
  }
  return db<MasterProvince[]>`SELECT * FROM master_province ORDER BY name ASC`;
}

export async function findProvinceById(id: number): Promise<MasterProvince | null> {
  const rows = await db<MasterProvince[]>`
    SELECT * FROM master_province WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function createProvince(name: string): Promise<MasterProvince | null> {
  await db`INSERT INTO master_province (name) VALUES (${name})`;
  const idRows = await db<Array<{ id: number }>>`SELECT LAST_INSERT_ID() as id`;
  const id = Number(idRows[0]?.id ?? 0);
  if (!id) return null;
  return findProvinceById(id);
}

export async function updateProvince(
  id: number,
  data: { name?: string; is_active?: boolean },
): Promise<void> {
  if (data.name !== undefined && data.is_active !== undefined) {
    await db`UPDATE master_province SET name = ${data.name}, is_active = ${data.is_active ? 1 : 0} WHERE id = ${id}`;
  } else if (data.name !== undefined) {
    await db`UPDATE master_province SET name = ${data.name} WHERE id = ${id}`;
  } else if (data.is_active !== undefined) {
    await db`UPDATE master_province SET is_active = ${data.is_active ? 1 : 0} WHERE id = ${id}`;
  }
}

export async function deleteProvince(id: number): Promise<void> {
  await db`DELETE FROM master_province WHERE id = ${id}`;
}
