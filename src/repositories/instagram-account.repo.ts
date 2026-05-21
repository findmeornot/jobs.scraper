import { db } from "@/db/index";
import type { InstagramAccount } from "../types";

export async function findAccountByUsername(username: string): Promise<InstagramAccount | null> {
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

export async function findAccountById(id: number): Promise<InstagramAccount | null> {
  const rows = await db<InstagramAccount[]>`
    SELECT * FROM instagram_account WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findAllAccounts(filters?: {
  isExternal?: boolean;
  isActive?: boolean;
}): Promise<(InstagramAccount & { region_count: number })[]> {
  const extFilter = filters?.isExternal !== undefined ? (filters.isExternal ? 1 : 0) : null;
  const activeFilter = filters?.isActive !== undefined ? (filters.isActive ? 1 : 0) : null;

  return db<(InstagramAccount & { region_count: number })[]>`
    SELECT ia.*, COUNT(ra.id) as region_count
    FROM instagram_account ia
    LEFT JOIN region_account ra ON ra.account_id = ia.id
    WHERE (${extFilter} IS NULL OR ia.is_external = ${extFilter})
      AND (${activeFilter} IS NULL OR ia.is_active = ${activeFilter})
    GROUP BY ia.id
    ORDER BY ia.created_at DESC
  `;
}

export async function findAccountsMissingInstagramId(): Promise<InstagramAccount[]> {
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
      SET instagram_id = ${data.instagram_id},
          followers   = ${data.followers},
          following   = ${data.following}
      WHERE id = ${existing[0].id}
    `;
    return {
      ...existing[0],
      instagram_id: data.instagram_id,
      followers: data.followers,
      following: data.following,
    };
  }

  const rows = await db<Array<{ id: number }>>`
    INSERT INTO instagram_account (instagram_id, username, followers, following)
    VALUES (${data.instagram_id}, ${data.username}, ${data.followers}, ${data.following})
    RETURNING id
  `;
  const id = Number(rows[0]?.id ?? 0);
  return (await findAccountById(id))!;
}

export async function updateInstagramId(username: string, instagramId: string): Promise<void> {
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

  const rows = await db<Array<{ id: number }>>`
    INSERT INTO instagram_account (username, is_external, is_active, is_manual_input)
    VALUES (${data.username}, 0, 0, 1)
    RETURNING id
  `;
  const id = Number(rows[0]?.id ?? 0);

  await db`
    INSERT INTO region_account (region_id, account_id)
    VALUES (${data.region_id}, ${id})
    ON CONFLICT DO NOTHING
  `;

  return (await findAccountById(id))!;
}

export async function deleteAccount(id: number): Promise<void> {
  await db`DELETE FROM region_account WHERE account_id = ${id}`;
  await db`DELETE FROM instagram_account WHERE id = ${id}`;
}

export async function updateAccount(
  id: number,
  data: Partial<
    Pick<
      InstagramAccount,
      "username" | "is_active" | "is_external" | "instagram_id" | "followers" | "following"
    >
  >,
): Promise<void> {
  await db`
    UPDATE instagram_account SET
      username     = COALESCE(${data.username ?? null}, username),
      instagram_id = COALESCE(${data.instagram_id ?? null}, instagram_id),
      followers    = COALESCE(${data.followers ?? null}, followers),
      following    = COALESCE(${data.following ?? null}, following),
      is_active    = COALESCE(${data.is_active !== undefined ? (data.is_active ? 1 : 0) : null}, is_active),
      is_external  = COALESCE(${data.is_external !== undefined ? (data.is_external ? 1 : 0) : null}, is_external)
    WHERE id = ${id}
  `;
}
