import { db } from "@/db/index";
import type { MasterGroup } from "../types";

export async function findAllGroups(activeOnly = false): Promise<MasterGroup[]> {
  if (activeOnly) {
    return db<MasterGroup[]>`
      SELECT * FROM master_group WHERE is_active = 1 ORDER BY name ASC
    `;
  }
  return db<MasterGroup[]>`SELECT * FROM master_group ORDER BY name ASC`;
}

export async function findGroupById(id: number): Promise<MasterGroup | null> {
  const rows = await db<MasterGroup[]>`
    SELECT * FROM master_group WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function createGroup(name: string): Promise<MasterGroup | null> {
  await db`INSERT INTO master_group (name) VALUES (${name})`;
  const idRows = await db<Array<{ id: number }>>`SELECT LAST_INSERT_ID() as id`;
  const id = Number(idRows[0]?.id ?? 0);
  if (!id) return null;
  return findGroupById(id);
}

export async function updateGroup(
  id: number,
  data: { name?: string; is_active?: boolean },
): Promise<void> {
  if (data.name !== undefined && data.is_active !== undefined) {
    await db`UPDATE master_group SET name = ${data.name}, is_active = ${data.is_active ? 1 : 0} WHERE id = ${id}`;
  } else if (data.name !== undefined) {
    await db`UPDATE master_group SET name = ${data.name} WHERE id = ${id}`;
  } else if (data.is_active !== undefined) {
    await db`UPDATE master_group SET is_active = ${data.is_active ? 1 : 0} WHERE id = ${id}`;
  }
}

export async function deleteGroup(id: number): Promise<void> {
  await db`DELETE FROM master_group WHERE id = ${id}`;
}
