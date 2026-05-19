import {
  saveContent,
  confirmContent,
  rejectContent,
  findContentWithRelations,
  getContentGroupedByGroup,
  getGroupsWithContentStats,
  getEmptyGroupNames,
  getDashboardStats,
} from "@/repositories/instagram-content.repo";
import type { ContentRow } from "@/types/index";

export async function saveInstagramContent(data: {
  instagram_id?: number | null;
  caption?: string | null;
  shortcode?: string | null;
  display_url: string;
  account_id?: number | null;
  posted_at?: Date | null;
}) {
  return saveContent(data);
}

export async function getContentForReview(filters: {
  date?: string;
  showUnverifiedOnly?: boolean;
}): Promise<{
  groups: Array<{
    id: number;
    name: string;
    content_count: number;
    content: ContentRow[];
  }>;
  total_content: number;
  confirmed: number;
  empty_groups: string[];
}> {
  const rows = await getContentGroupedByGroup(filters);

  const groupMap = new Map<
    number,
    { id: number; name: string; content: ContentRow[] }
  >();

  for (const row of rows) {
    if (!groupMap.has(row.group_id)) {
      groupMap.set(row.group_id, {
        id: row.group_id,
        name: row.group_name,
        content: [],
      });
    }
    if (row.id) {
      groupMap.get(row.group_id)!.content.push(row);
    }
  }

  const groups = Array.from(groupMap.values()).map((g) => ({
    ...g,
    content_count: g.content.length,
  }));

  const total_content = groups.reduce((s, g) => s + g.content_count, 0);
  const confirmed = groups.reduce(
    (s, g) => s + g.content.filter((c) => c.confirmed_at !== null).length,
    0,
  );
  const empty_groups = groups
    .filter((g) => g.content_count === 0)
    .map((g) => g.name);

  return { groups, total_content, confirmed, empty_groups };
}

export async function processContentAction(
  contentId: number,
  action: "confirm" | "reject",
  user: string,
  onConfirm: (
    content: Awaited<ReturnType<typeof findContentWithRelations>>,
  ) => Promise<string | undefined>,
) {
  if (action === "reject") {
    await rejectContent(contentId);
    return { id: contentId, action: "reject", action_by: user, action_at: new Date() };
  }

  const content = await findContentWithRelations(contentId);
  if (!content) return null;

  const remoteUrl = await onConfirm(content);
  await confirmContent(contentId, user, remoteUrl);

  return {
    id: contentId,
    action: "confirm",
    action_by: user,
    action_at: new Date(),
  };
}

export { getGroupsWithContentStats, getEmptyGroupNames, getDashboardStats };
