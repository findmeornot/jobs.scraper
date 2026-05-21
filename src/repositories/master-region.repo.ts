import { db } from "@/db/index";
import type { MasterRegion } from "../types";

export async function findAllRegions(): Promise<MasterRegion[]> {
  return db<MasterRegion[]>`SELECT * FROM master_region ORDER BY name ASC`;
}

export async function findRegionsByProvinceId(provinceId: number): Promise<MasterRegion[]> {
  return db<MasterRegion[]>`
    SELECT * FROM master_region WHERE province_id = ${provinceId} ORDER BY name ASC
  `;
}

export async function findRegionsByGroupId(groupId: number): Promise<MasterRegion[]> {
  return db<MasterRegion[]>`
    SELECT * FROM master_region WHERE group_id = ${groupId} ORDER BY name ASC
  `;
}

export async function findRegionById(id: number): Promise<MasterRegion | null> {
  const rows = await db<MasterRegion[]>`
    SELECT * FROM master_region WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findRegionsWithDetails(): Promise<
  Array<
    MasterRegion & {
      province_name: string;
      group_name: string | null;
      account_count: number;
    }
  >
> {
  return db<
    Array<
      MasterRegion & { province_name: string; group_name: string | null; account_count: number }
    >
  >`
    SELECT
      mr.*,
      mp.name as province_name,
      mg.name as group_name,
      COUNT(ra.id) as account_count
    FROM master_region mr
    JOIN master_province mp ON mp.id = mr.province_id
    LEFT JOIN master_group mg ON mg.id = mr.group_id
    LEFT JOIN region_account ra ON ra.region_id = mr.id
    GROUP BY mr.id, mp.name, mg.name
    ORDER BY mp.name ASC, mr.name ASC
  `;
}

export async function createRegion(data: {
  name: string;
  province_id: number;
  group_id?: number | null;
  js_loker?: number | null;
}): Promise<MasterRegion | null> {
  const rows = await db<Array<{ id: number }>>`
    INSERT INTO master_region (name, province_id, group_id, js_loker)
    VALUES (${data.name}, ${data.province_id}, ${data.group_id ?? null}, ${data.js_loker ?? null})
    RETURNING id
  `;
  const id = Number(rows[0]?.id ?? 0);
  if (!id) return null;
  return findRegionById(id);
}

export async function updateRegion(
  id: number,
  data: {
    name?: string;
    province_id?: number;
    group_id?: number | null;
    js_loker?: number | null;
  },
): Promise<void> {
  if (data.name !== undefined) {
    await db`UPDATE master_region SET name = ${data.name} WHERE id = ${id}`;
  }
  if (data.province_id !== undefined) {
    await db`UPDATE master_region SET province_id = ${data.province_id} WHERE id = ${id}`;
  }
  if (data.group_id !== undefined) {
    await db`UPDATE master_region SET group_id = ${data.group_id} WHERE id = ${id}`;
  }
  if (data.js_loker !== undefined) {
    await db`UPDATE master_region SET js_loker = ${data.js_loker} WHERE id = ${id}`;
  }
}

export async function deleteRegion(id: number): Promise<void> {
  await db`DELETE FROM master_region WHERE id = ${id}`;
}

export async function getRandomRegionByGroupId(groupId: number): Promise<MasterRegion | null> {
  const rows = await db<MasterRegion[]>`
    SELECT * FROM master_region WHERE group_id = ${groupId}
    ORDER BY RANDOM() LIMIT 1
  `;
  return rows[0] ?? null;
}
