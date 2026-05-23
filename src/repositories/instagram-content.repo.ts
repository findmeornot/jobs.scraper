import { db } from "@/db/index";
import type { InstagramContent, ContentRow } from "../types";

export async function findContentByInstagramId(
  instagramId: number,
): Promise<InstagramContent | null> {
  const rows = await db<InstagramContent[]>`
    SELECT * FROM instagram_content WHERE instagram_id = ${instagramId} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findContentWithRelations(id: number): Promise<
  | (InstagramContent & {
      account_username: string;
      region_id: number | null;
      province_id: number | null;
      js_loker: number | null;
    })
  | null
> {
  type Row = InstagramContent & {
    account_username: string;
    region_id: number | null;
    province_id: number | null;
    js_loker: number | null;
  };
  const rows = await db<Row[]>`
    SELECT ic.*,
           ia.username as account_username,
           mr.id as region_id,
           mr.province_id,
           mr.js_loker
    FROM instagram_content ic
    LEFT JOIN instagram_account ia ON ia.id = ic.account_id
    LEFT JOIN region_account ra ON ra.account_id = ia.id
    LEFT JOIN master_region mr ON mr.id = ra.region_id
    WHERE ic.id = ${id}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function saveContent(data: {
  instagram_id?: number | null;
  caption?: string | null;
  shortcode?: string | null;
  display_url: string;
  account_id?: number | null;
  posted_at?: Date | null;
}): Promise<InstagramContent | null> {
  if (data.instagram_id) {
    const existing = await findContentByInstagramId(data.instagram_id);
    if (existing) return existing;
  }

  const insertRows = await db<Array<{ id: number }>>`
    INSERT INTO instagram_content
      (instagram_id, caption, shortcode, display_url, account_id, posted_at)
    VALUES
      (${data.instagram_id ?? null},
       ${data.caption ?? null},
       ${data.shortcode ?? null},
       ${data.display_url},
       ${data.account_id ?? null},
       ${data.posted_at ?? null})
    RETURNING id
  `;

  const id = Number(insertRows[0]?.id ?? 0);
  if (!id) return null;

  const rows = await db<InstagramContent[]>`
    SELECT * FROM instagram_content WHERE id = ${id}
  `;
  return rows[0] ?? null;
}

export async function confirmContent(id: number, user: string): Promise<void> {
  await db`
    UPDATE instagram_content
    SET confirmed_at = NOW(), rejected_at = NULL, action_by = ${user}, remote_url = NULL
    WHERE id = ${id}
  `;
}

export async function updateContentRemoteUrl(id: number, remoteUrl: string): Promise<void> {
  await db`UPDATE instagram_content SET remote_url = ${remoteUrl} WHERE id = ${id}`;
}

export async function rejectContent(id: number): Promise<void> {
  await db`DELETE FROM instagram_content WHERE id = ${id}`;
}

export async function deleteContentSince(since: Date): Promise<number> {
  const rows = await db<Array<{ id: number }>>`
    DELETE FROM instagram_content
    WHERE created_at >= ${since} AND confirmed_at IS NULL
    RETURNING id
  `;
  return rows.length;
}

export async function getContentGroupedByGroup(filters: {
  date?: string;
}): Promise<ContentRow[]> {
  const { date } = filters;

  if (date) {
    return db<ContentRow[]>`
      SELECT
        mg.id as group_id, mg.name as group_name,
        mr.id as region_id, mr.name as region_name,
        ia.id as account_id, ia.username,
        ic.id, ic.instagram_id, ic.caption, ic.display_url,
        ic.remote_url, ic.shortcode, ic.posted_at,
        ic.confirmed_at, ic.rejected_at, ic.action_by,
        ic.created_at as content_created_at
      FROM master_group mg
      LEFT JOIN master_region mr ON mr.group_id = mg.id
      LEFT JOIN region_account ra ON ra.region_id = mr.id
      LEFT JOIN instagram_account ia ON ia.id = ra.account_id
      LEFT JOIN instagram_content ic ON ic.account_id = ia.id
        AND ic.rejected_at IS NULL
        AND ic.created_at::date = ${date}::date
      ORDER BY mg.name ASC, ia.username ASC, ic.posted_at DESC
    `;
  }

  return db<ContentRow[]>`
    SELECT
      mg.id as group_id, mg.name as group_name,
      mr.id as region_id, mr.name as region_name,
      ia.id as account_id, ia.username,
      ic.id, ic.instagram_id, ic.caption, ic.display_url,
      ic.remote_url, ic.shortcode, ic.posted_at,
      ic.confirmed_at, ic.rejected_at, ic.action_by,
      ic.created_at as content_created_at
    FROM master_group mg
    LEFT JOIN master_region mr ON mr.group_id = mg.id
    LEFT JOIN region_account ra ON ra.region_id = mr.id
    LEFT JOIN instagram_account ia ON ia.id = ra.account_id
    LEFT JOIN instagram_content ic ON ic.account_id = ia.id
      AND ic.rejected_at IS NULL
    ORDER BY mg.name ASC, ia.username ASC, ic.posted_at DESC
  `;
}

export async function getContentByGroup(groupId: number, date: string): Promise<ContentRow[]> {
  return db<ContentRow[]>`
    SELECT
      mg.id as group_id, mg.name as group_name,
      mr.id as region_id, mr.name as region_name,
      ia.id as account_id, ia.username,
      ic.id, ic.instagram_id, ic.caption, ic.display_url,
      ic.remote_url, ic.shortcode, ic.posted_at,
      ic.confirmed_at, ic.rejected_at, ic.action_by,
      ic.created_at as content_created_at
    FROM master_group mg
    JOIN master_region mr ON mr.group_id = mg.id
    JOIN region_account ra ON ra.region_id = mr.id
    JOIN instagram_account ia ON ia.id = ra.account_id
    JOIN instagram_content ic ON ic.account_id = ia.id
      AND ic.rejected_at IS NULL
      AND ic.created_at::date = ${date}::date
    WHERE mg.id = ${groupId}
    ORDER BY ic.posted_at DESC
  `;
}

export async function saveManualContent(data: {
  display_url: string;
  account_id: number;
  posted_at: Date;
}): Promise<InstagramContent | null> {
  const insertRows = await db<Array<{ id: number }>>`
    INSERT INTO instagram_content (display_url, account_id, posted_at, created_at)
    VALUES (${data.display_url}, ${data.account_id}, ${data.posted_at}, ${data.posted_at})
    RETURNING id
  `;
  const id = Number(insertRows[0]?.id ?? 0);
  if (!id) return null;

  const rows = await db<InstagramContent[]>`
    SELECT * FROM instagram_content WHERE id = ${id}
  `;
  return rows[0] ?? null;
}

export async function getGroupsWithContentStats(date: string): Promise<
  Array<{
    group_id: number;
    group_name: string;
    content_count: number;
    confirmed_count: number;
    has_manual_input: number;
  }>
> {
  type StatsRow = {
    group_id: number;
    group_name: string;
    content_count: number;
    confirmed_count: number;
    has_manual_input: number;
  };
  return db<StatsRow[]>`
    SELECT
      mg.id as group_id,
      mg.name as group_name,
      COUNT(ic.id) as content_count,
      SUM(CASE WHEN ic.confirmed_at IS NOT NULL THEN 1 ELSE 0 END) as confirmed_count,
      MAX(CASE WHEN ia.username LIKE 'manual_upload_%' THEN 1 ELSE 0 END) as has_manual_input
    FROM master_group mg
    LEFT JOIN master_region mr ON mr.group_id = mg.id
    LEFT JOIN region_account ra ON ra.region_id = mr.id
    LEFT JOIN instagram_account ia ON ia.id = ra.account_id
    LEFT JOIN instagram_content ic ON ic.account_id = ia.id
      AND ic.rejected_at IS NULL
      AND ic.created_at::date = ${date}::date
    GROUP BY mg.id, mg.name
    ORDER BY
      CASE WHEN COUNT(ic.id) = 0 THEN 1 ELSE 0 END ASC,
      mg.name ASC
  `;
}

export async function getEmptyGroupNames(date?: string): Promise<string[]> {
  const rows = date
    ? await db<Array<{ group_name: string }>>`
        SELECT mg.name as group_name
        FROM master_group mg
        WHERE mg.id NOT IN (
          SELECT DISTINCT mg2.id
          FROM master_group mg2
          JOIN master_region mr ON mr.group_id = mg2.id
          JOIN region_account ra ON ra.region_id = mr.id
          JOIN instagram_account ia ON ia.id = ra.account_id
          JOIN instagram_content ic ON ic.account_id = ia.id
            AND ic.rejected_at IS NULL
            AND ic.created_at::date = ${date}::date
        )
        ORDER BY mg.name ASC
      `
    : await db<Array<{ group_name: string }>>`
        SELECT mg.name as group_name
        FROM master_group mg
        WHERE mg.id NOT IN (
          SELECT DISTINCT mg2.id
          FROM master_group mg2
          JOIN master_region mr ON mr.group_id = mg2.id
          JOIN region_account ra ON ra.region_id = mr.id
          JOIN instagram_account ia ON ia.id = ra.account_id
          JOIN instagram_content ic ON ic.account_id = ia.id
            AND ic.rejected_at IS NULL
        )
        ORDER BY mg.name ASC
      `;

  return rows.map((r) => r.group_name);
}

export async function getDashboardStats(date?: string): Promise<{
  total_accounts: number;
  total_content: number;
  pending_content: number;
  confirmed_content: number;
  external_accounts: number;
}> {
  type StatsResult = {
    total_accounts: number;
    external_accounts: number;
    total_content: number;
    pending_content: number;
    confirmed_content: number;
  };

  const rows = date
    ? await db<StatsResult[]>`
        SELECT
          (SELECT COUNT(*)::int FROM instagram_account WHERE is_active = 1) as total_accounts,
          (SELECT COUNT(*)::int FROM instagram_account WHERE is_external = 1 AND is_active = 1) as external_accounts,
          (SELECT COUNT(*)::int FROM instagram_content WHERE rejected_at IS NULL AND created_at::date = ${date}::date) as total_content,
          (SELECT COUNT(*)::int FROM instagram_content WHERE confirmed_at IS NULL AND rejected_at IS NULL AND created_at::date = ${date}::date) as pending_content,
          (SELECT COUNT(*)::int FROM instagram_content WHERE confirmed_at IS NOT NULL AND created_at::date = ${date}::date) as confirmed_content
      `
    : await db<StatsResult[]>`
        SELECT
          (SELECT COUNT(*)::int FROM instagram_account WHERE is_active = 1) as total_accounts,
          (SELECT COUNT(*)::int FROM instagram_account WHERE is_external = 1 AND is_active = 1) as external_accounts,
          (SELECT COUNT(*)::int FROM instagram_content WHERE rejected_at IS NULL) as total_content,
          (SELECT COUNT(*)::int FROM instagram_content WHERE confirmed_at IS NULL AND rejected_at IS NULL) as pending_content,
          (SELECT COUNT(*)::int FROM instagram_content WHERE confirmed_at IS NOT NULL) as confirmed_content
      `;

  const row = rows[0];
  return row
    ? {
        total_accounts: Number(row.total_accounts),
        external_accounts: Number(row.external_accounts),
        total_content: Number(row.total_content),
        pending_content: Number(row.pending_content),
        confirmed_content: Number(row.confirmed_content),
      }
    : { total_accounts: 0, external_accounts: 0, total_content: 0, pending_content: 0, confirmed_content: 0 };
}
