import { db } from "@/db/index";
import type { RegionAccount } from "@/types/index";

export async function findRegionAccountsByRegionId(
  regionId: number,
): Promise<Array<RegionAccount & { username: string; instagram_id: string | null; is_active: boolean }>> {
  return db<any[]>`
    SELECT ra.*, ia.username, ia.instagram_id, ia.is_active
    FROM region_account ra
    JOIN instagram_account ia ON ia.id = ra.account_id
    WHERE ra.region_id = ${regionId}
    ORDER BY ia.username ASC
  `;
}

export async function findRegionAccountsByAccountId(
  accountId: number,
): Promise<Array<RegionAccount & { region_name: string }>> {
  return db<any[]>`
    SELECT ra.*, mr.name as region_name
    FROM region_account ra
    JOIN master_region mr ON mr.id = ra.region_id
    WHERE ra.account_id = ${accountId}
  `;
}

export async function addAccountToRegion(
  regionId: number,
  accountId: number,
): Promise<void> {
  await db`
    INSERT IGNORE INTO region_account (region_id, account_id)
    VALUES (${regionId}, ${accountId})
  `;
}

export async function removeAccountFromRegion(
  regionId: number,
  accountId: number,
): Promise<void> {
  await db`
    DELETE FROM region_account WHERE region_id = ${regionId} AND account_id = ${accountId}
  `;
}

export async function removeAllAccountsFromRegion(regionId: number): Promise<void> {
  await db`DELETE FROM region_account WHERE region_id = ${regionId}`;
}

export async function removeAllRegionsFromAccount(accountId: number): Promise<void> {
  await db`DELETE FROM region_account WHERE account_id = ${accountId}`;
}

export async function regionAccountExists(
  regionId: number,
  accountId: number,
): Promise<boolean> {
  const rows = await db<Array<{ count: number }>>`
    SELECT COUNT(*) as count FROM region_account
    WHERE region_id = ${regionId} AND account_id = ${accountId}
  `;
  return Number(rows[0]?.count ?? 0) > 0;
}
