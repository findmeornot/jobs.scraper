import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "@/components/ui/toast";
import dayjs from "dayjs";

export interface ContentItem {
  id: number;
  instagram_id: number | null;
  username: string;
  display_url: string;
  caption: string | null;
  shortcode: string | null;
  posted_at: string | null;
  confirmed_at: string | null;
  remote_url: string | null;
  action_by: string | null;
  content_created_at: string;
  group_id: number;
  group_name: string;
  region_id: number;
  region_name: string;
  account_id: number;
  // client-only fields populated from WebSocket events
  processingDone?: boolean;
  processingError?: string;
  skipReason?: string;
}

export interface ContentGroup {
  id: number;
  name: string;
  content_count: number;
  content: ContentItem[];
}

export function useContent() {
  const [groups, setGroups] = useState<ContentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [pendingOnly, setPendingOnly] = useState(true);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ date });
    if (pendingOnly) params.set("show_unverified_only", "true");

    fetch(`/api/instagram/content?${params}`)
      .then((r) => r.json())
      .then((d) => {
        const groups: ContentGroup[] = d.results ?? [];
        // Items already in DB are past the processing window — mark done
        // so they never show the infinite "Processing…" spinner
        setGroups(groups.map((g) => ({
          ...g,
          content: g.content.map((c) => ({
            ...c,
            processingDone: c.confirmed_at !== null,
          })),
        })));
      })
      .catch(() => toast.error("Failed to load content"))
      .finally(() => setLoading(false));
  }, [date, pendingOnly, tick]);

  function optimisticConfirm(id: number, reviewer: string) {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        content: g.content.map((c) =>
          c.id === id
            ? { ...c, confirmed_at: new Date().toISOString(), action_by: reviewer, processingDone: false, processingError: undefined }
            : c,
        ),
      })),
    );
  }

  function optimisticReject(id: number) {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        content: g.content.filter((c) => c.id !== id),
        content_count: g.content.some((c) => c.id === id) ? g.content_count - 1 : g.content_count,
      })),
    );
  }

  async function confirmItem(id: number, reviewer: string): Promise<boolean> {
    optimisticConfirm(id, reviewer);
    try {
      const r = await fetch("/api/instagram/content/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_id: id, action: "confirm", user: reviewer }),
      });
      if (!r.ok) throw new Error();
      return true;
    } catch {
      toast.error("Failed to confirm");
      refetch(); // revert optimistic update on failure
      return false;
    }
  }

  async function rejectItem(id: number): Promise<boolean> {
    optimisticReject(id);
    try {
      const r = await fetch("/api/instagram/content/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_id: id, action: "reject", user: "system" }),
      });
      if (!r.ok) throw new Error();
      return true;
    } catch {
      toast.error("Failed to reject");
      refetch();
      return false;
    }
  }

  const allContent = groups.flatMap((g) => g.content);
  const totalItems = allContent.length;
  const confirmedItems = allContent.filter((c) => c.confirmed_at !== null).length;
  const pendingItems = totalItems - confirmedItems;

  const applyContentUpdate = useCallback((contentId: number, remoteUrl: string | null, error?: string, skipReason?: string) => {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        content: g.content.map((c) =>
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
  }, []);

  return {
    groups,
    loading,
    date,
    setDate,
    pendingOnly,
    setPendingOnly,
    refetch,
    confirmItem,
    rejectItem,
    applyContentUpdate,
    totalItems,
    confirmedItems,
    pendingItems,
  };
}
