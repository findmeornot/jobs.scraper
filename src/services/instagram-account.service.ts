import {
  findAccountByUsername,
  findAllAccounts,
  upsertAccount,
  updateInstagramId,
  findAccountsMissingInstagramId,
  updateAccount,
  deleteAccount as deleteAccountRepo,
  insertAccountIfNotExists,
} from "@/repositories/instagram-account.repo";
import type { InstagramAccount } from "../types";
import { logger } from "@/utils/logger";

export async function getAccountByUsername(username: string): Promise<InstagramAccount | null> {
  return findAccountByUsername(username);
}

export async function getAllAccounts(isExternal?: boolean): Promise<InstagramAccount[]> {
  if (isExternal !== undefined) {
    return findAllAccounts({ isExternal, isActive: true });
  }
  return findAllAccounts();
}

export async function saveOrUpdateAccount(data: {
  instagram_id: string;
  username: string;
  followers: number;
  following: number;
}): Promise<InstagramAccount> {
  return upsertAccount(data);
}

export async function editAccount(
  id: number,
  data: { username?: string; is_active?: boolean; is_external?: boolean },
): Promise<void> {
  await updateAccount(id, data);
}

export async function removeAccount(id: number): Promise<void> {
  await deleteAccountRepo(id);
}

export interface ImportAccountRow {
  username: string;
  type: "external" | "internal";
}

export interface ImportResult {
  imported: number;
  duplicates: number;
  invalid: number;
  errors: string[];
}

export async function importAccounts(rows: ImportAccountRow[]): Promise<ImportResult> {
  let imported = 0;
  let duplicates = 0;
  let invalid = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const username = row.username?.trim().replace(/^@/, "").toLowerCase();
    if (!username) {
      invalid++;
      continue;
    }

    try {
      const inserted = await insertAccountIfNotExists({
        username,
        is_external: row.type === "external",
      });
      if (inserted) {
        imported++;
      } else {
        duplicates++;
      }
    } catch (err) {
      invalid++;
      errors.push(`@${username}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return { imported, duplicates, invalid, errors };
}

export async function syncMissingInstagramIds(
  scrapeProfile: (username: string) => Promise<{ id: string }>,
): Promise<{ processed: number; errors: string[] }> {
  const accounts = await findAccountsMissingInstagramId();
  const errors: string[] = [];
  let processed = 0;

  for (const account of accounts) {
    try {
      const data = await scrapeProfile(account.username);
      await updateInstagramId(account.username, data.id);
      processed++;
      await new Promise((r) => setTimeout(r, 5000));
    } catch (error) {
      const msg = `Failed to process ${account.username}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      logger.error({ error }, msg);
      errors.push(msg);
      await new Promise((r) => setTimeout(r, 10000));
    }
  }

  return { processed, errors };
}
