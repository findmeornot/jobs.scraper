import { ok, err, serverErr } from "@/utils/response";
import { logger } from "@/utils/logger";
import { getParams } from "@/utils/request";
import {
  getGroupsWithContentStats,
  getEmptyGroupNames,
  getContentByGroup,
} from "@/repositories/instagram-content.repo";

export async function groupGet(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date");
    if (!date) return err("date is required");

    const groups = await getGroupsWithContentStats(date);
    const total_content = groups.reduce((s, g) => s + Number(g.content_count), 0);
    const total_confirmed = groups.reduce((s, g) => s + Number(g.confirmed_count), 0);

    return ok({
      date,
      total_content,
      confirmed: total_confirmed,
      groups: groups.map((g) => ({
        id: g.group_id,
        name: g.group_name,
        content_count: Number(g.content_count),
        confirmed: Number(g.confirmed_count),
        has_manual_input: Boolean(g.has_manual_input),
      })),
    });
  } catch (error) {
    logger.error({ error }, "groupGet failed");
    return serverErr("Failed to fetch groups");
  }
}

export async function groupMissingGet(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date") ?? undefined;
    const data = await getEmptyGroupNames(date);
    return Response.json({ success: true, date: date ?? "all", data });
  } catch (error) {
    logger.error({ error }, "groupMissingGet failed");
    return serverErr("Failed to fetch empty groups");
  }
}

export async function groupContentGet(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date");
    const groupId = Number(getParams(req).group_id);

    if (!date) return err("date is required");
    if (!groupId) return err("group_id is required");

    const rows = await getContentByGroup(groupId, date);

    const data = rows.map((row) => ({
      id: row.id,
      caption: row.caption,
      instagram_id: row.instagram_id != null ? String(row.instagram_id) : null,
      shortcode: row.shortcode,
      display_url: row.display_url,
      remote_url: row.remote_url,
      account_id: row.account_id,
      created_at: row.content_created_at,
      posted_at: row.posted_at,
      confirmed_at: row.confirmed_at,
      rejected_at: row.rejected_at,
      action_by: row.action_by,
      username: row.username,
      is_manual_input: row.username?.startsWith("manual_upload_") ?? false,
      filename: `${crypto.randomUUID()}.jpg`,
    }));

    return Response.json({ success: true, total: data.length, data });
  } catch (error) {
    logger.error({ error }, "groupContentGet failed");
    return serverErr("Failed to fetch group content");
  }
}
