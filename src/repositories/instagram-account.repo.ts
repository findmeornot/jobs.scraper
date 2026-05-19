import { db } from "@/db/index";
import type { InstagramAccount } from "@/types/index";

export async function findAccountByUsername(
  username: string,
): Promise<InstagramAccount | null> {
  const rows = await db<InstagramAccount[]>`
    SELECT * FROM instagram_account WHERE username = ${username} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findAccountByInstagramId(
  instagramId: string,
): Promise<InstagramAccount | null> {
  const rows = await db<InstagramAccount[]>`
    SELECT * FROM instagram_account WHERE instagram_id = ${instagramId} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findAccountById(
  id: number,
): Promise<InstagramAccount | null> {
  const rows = await db<InstagramAccount[]>`
    SELECT * FROM instagram_account WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findAllAccounts(filters?: {
  isExternal?: boolean;
  isActive?: boolean;
}): Promise<InstagramAccount[]> {
  if (filters?.isExternal !== undefined && filters?.isActive !== undefined) {
    return db<InstagramAccount[]>`
      SELECT * FROM instagram_account
      WHERE is_external = ${filters.isExternal ? 1 : 0}
        AND is_active = ${filters.isActive ? 1 : 0}
      ORDER BY created_at DESC
    `;
  }
  if (filters?.isExternal !== undefined) {
    return db<InstagramAccount[]>`
      SELECT * FROM instagram_account
      WHERE is_external = ${filters.isExternal ? 1 : 0}
      ORDER BY created_at DESC
    `;
  }
  if (filters?.isActive !== undefined) {
    return db<InstagramAccount[]>`
      SELECT * FROM instagram_account
      WHERE is_active = ${filters.isActive ? 1 : 0}
      ORDER BY created_at DESC
    `;
  }
  return db<InstagramAccount[]>`
    SELECT * FROM instagram_account ORDER BY created_at DESC
  `;
}

export async function findAccountsMissingInstagramId(): Promise<
  InstagramAccount[]
> {
  return db<InstagramAccount[]>`
    SELECT * FROM instagram_account
    WHERE instagram_id IS NULL AND is_active = 1
  `;
}

export async function upsertAccount(data: {
  instagram_id: string;
  username: string;
  followers: number;
  following: number;
}): Promise<InstagramAccount> {
  const existing = await db<InstagramAccount[]>`
    SELECT * FROM instagram_account
    WHERE instagram_id = ${data.instagram_id} OR username = ${data.username}
    LIMIT 1
  `;

  if (existing[0]) {
    await db`
      UPDATE instagram_account
      SET followers = ${data.followers},
          following = ${data.following}
      WHERE id = ${existing[0].id}
    `;
    return { ...existing[0], followers: data.followers, following: data.following };
  }

  const result = await db`
    INSERT INTO instagram_account (instagram_id, username, followers, following)
    VALUES (${data.instagram_id}, ${data.username}, ${data.followers}, ${data.following})
  `;
  const id = Number(result.lastInsertRowid);
  return (await findAccountById(id))!;
}

export async function updateInstagramId(
  username: string,
  instagramId: string,
): Promise<void> {
  await db`
    UPDATE instagram_account SET instagram_id = ${instagramId} WHERE username = ${username}
  `;
}

export async function createManualAccount(data: {
  username: string;
  region_id: number;
}): Promise<InstagramAccount> {
  const existing = await findAccountByUsername(data.username);
  if (existing) return existing;

  const result = await db`
    INSERT INTO instagram_account (username, is_external, is_active, is_manual_input)
    VALUES (${data.username}, 0, 0, 1)
  `;
  const id = Number(result.lastInsertRowid);

  await db`
    INSERT IGNORE INTO region_account (region_id, account_id)
    VALUES (${data.region_id}, ${id})
  `;

  return (await findAccountById(id))!;
}

export async function updateAccount(
  id: number,
  data: Partial<Pick<InstagramAccount, "is_active" | "is_external" | "instagram_id" | "followers" | "following">>,
): Promise<void> {
  if (data.instagram_id !== undefined) {
    await db`UPDATE instagram_account SET instagram_id = ${data.instagram_id} WHERE id = ${id}`;
  }
  if (data.followers !== undefined) {
    await db`UPDATE instagram_account SET followers = ${data.followers} WHERE id = ${id}`;
  }
  if (data.following !== undefined) {
    await db`UPDATE instagram_account SET following = ${data.following} WHERE id = ${id}`;
  }
  if (data.is_active !== undefined) {
    await db`UPDATE instagram_account SET is_active = ${data.is_active ? 1 : 0} WHERE id = ${id}`;
  }
  if (data.is_external !== undefined) {
    await db`UPDATE instagram_account SET is_external = ${data.is_external ? 1 : 0} WHERE id = ${id}`;
  }
}
