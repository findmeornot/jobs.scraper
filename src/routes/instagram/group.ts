import { ok, err, serverErr } from "@/utils/response";
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
      groups,
    });
  } catch (error) {
    console.error("groupGet error:", error);
    return serverErr("Failed to fetch groups");
  }
}

export async function groupMissingGet(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date") ?? undefined;
    const emptyGroups = await getEmptyGroupNames(date);
    return ok({ date: date ?? "all", empty_groups: emptyGroups });
  } catch (error) {
    console.error("groupMissingGet error:", error);
    return serverErr("Failed to fetch empty groups");
  }
}

export async function groupContentGet(req: Request & { params: { group_id: string } }): Promise<Response> {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date");
    const groupId = Number((req as any).params?.group_id);

    if (!date) return err("date is required");
    if (!groupId) return err("group_id is required");

    const rows = await getContentByGroup(groupId, date);

    const content = rows.map((row) => ({
      ...row,
      is_manual_input: row.username?.includes("manual_upload") ?? false,
      filename: `${crypto.randomUUID()}.jpg`,
    }));

    return ok({ total: content.length, content });
  } catch (error) {
    console.error("groupContentGet error:", error);
    return serverErr("Failed to fetch group content");
  }
}
