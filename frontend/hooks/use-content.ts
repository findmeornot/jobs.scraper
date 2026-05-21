import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import type { ContentGroup, ContentItem } from "@/types";

async function fetchContent(date: string, showPendingOnly: boolean): Promise<ContentGroup[]> {
  const params = new URLSearchParams({ date });
  if (showPendingOnly) params.set("show_unverified_only", "true");
  const data = await apiFetch<{ results: ContentGroup[] }>(`/api/instagram/content?${params}`);
  const groups: ContentGroup[] = data.results ?? [];
  return groups.map((g) => ({
    ...g,
    content: g.content.map((c) => ({
      ...c,
      processingDone: c.confirmed_at !== null,
    })),
  }));
}

export function useContent(date: string, showPendingOnly: boolean) {
  return useQuery({
    queryKey: ["content", date, showPendingOnly],
    queryFn: () => fetchContent(date, showPendingOnly),
    meta: { onError: () => toast.error("Failed to load content") },
  });
}

export function useConfirmContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reviewer }: { id: number; reviewer: string }) =>
      apiFetch("/api/instagram/content/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_id: id, action: "confirm", user: reviewer }),
      }),
    onMutate: async ({ id, reviewer }) => {
      const keys = qc.getQueriesData<ContentGroup[]>({ queryKey: ["content"] });
      const snapshots = keys.map(([key, data]) => ({ key, data }));

      for (const [key, prev] of keys) {
        qc.setQueryData<ContentGroup[]>(key, (groups) =>
          groups?.map((g) => ({
            ...g,
            content: g.content.map((c) =>
              c.id === id
                ? { ...c, confirmed_at: new Date().toISOString(), action_by: reviewer, processingDone: false, processingError: undefined }
                : c,
            ),
          })),
        );
      }

      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      toast.error("Failed to confirm");
      for (const { key, data } of ctx?.snapshots ?? []) {
        qc.setQueryData(key, data);
      }
    },
  });
}

export function useRejectContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch("/api/instagram/content/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_id: id, action: "reject", user: "system" }),
      }),
    onMutate: async (id) => {
      const keys = qc.getQueriesData<ContentGroup[]>({ queryKey: ["content"] });
      const snapshots = keys.map(([key, data]) => ({ key, data }));

      for (const [key] of keys) {
        qc.setQueryData<ContentGroup[]>(key, (groups) =>
          groups?.map((g) => ({
            ...g,
            content: g.content.filter((c) => c.id !== id),
            content_count: g.content.some((c) => c.id === id) ? g.content_count - 1 : g.content_count,
          })),
        );
      }

      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      toast.error("Failed to reject");
      for (const { key, data } of ctx?.snapshots ?? []) {
        qc.setQueryData(key, data);
      }
    },
  });
}

export function applyContentUpdate(
  qc: ReturnType<typeof useQueryClient>,
  contentId: number,
  remoteUrl: string | null,
  error?: string,
  skipReason?: string,
) {
  const keys = qc.getQueriesData<ContentGroup[]>({ queryKey: ["content"] });
  for (const [key] of keys) {
    qc.setQueryData<ContentGroup[]>(key, (groups) =>
      groups?.map((g) => ({
        ...g,
        content: g.content.map((c): ContentItem =>
          c.id === contentId
            ? {
                ...c,
                remote_url: remoteUrl ?? c.remote_url,
                processingDone: true,
                processingError: error,
                skipReason,
              }
            : c,
        ),
      })),
    );
  }
}
