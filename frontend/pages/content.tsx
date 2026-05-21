import { useState, useEffect, useRef } from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentSkeleton } from "@/components/ui/skeletons";
import {
  useContent,
  useConfirmContent,
  useRejectContent,
  applyContentUpdate,
} from "@/hooks/use-content";
import { useConfirm } from "@/hooks/use-confirm";
import { useContentStore } from "@/stores/content.store";
import { useScrapeStore } from "@/stores/scrape.store";
import { queryClient } from "@/lib/query-client";
import { ContentFilters } from "@/components/features/content/content-filters";
import { ContentGrid } from "@/components/features/content/content-grid";
import { ContentLightbox } from "@/components/features/content/content-lightbox";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { ContentProcessedDetail } from "@/types";

export default function Content() {
  const {
    selectedDate,
    showPendingOnly,
    reviewerName,
    setSelectedDate,
    setShowPendingOnly,
    setReviewerName,
  } = useContentStore();
  const connected = useScrapeStore((s) => s.connected);

  const { data: groups = [], isLoading, refetch } = useContent(selectedDate, showPendingOnly);
  const confirmContent = useConfirmContent();
  const rejectContent = useRejectContent();
  const confirm = useConfirm();

  const [reviewerDraft, setReviewerDraft] = useState(reviewerName);
  const [editingReviewer, setEditingReviewer] = useState(!reviewerName);
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [activeGroup, setActiveGroup] = useState<number | "all">("all");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    setActiveGroup("all");
  }, [selectedDate, showPendingOnly]);

  const hasConnectedRef = useRef(false);
  useEffect(() => {
    if (connected) {
      if (hasConnectedRef.current) refetch();
      hasConnectedRef.current = true;
    }
  }, [connected, refetch]);

  useEffect(() => {
    function handler(e: Event) {
      const { contentId, remoteUrl, error, skipReason } = (e as CustomEvent<ContentProcessedDetail>)
        .detail;
      applyContentUpdate(queryClient, contentId, remoteUrl, error, skipReason);
      if (error) toast.error("Processing failed", error);
    }
    window.addEventListener("content:processed", handler);
    return () => window.removeEventListener("content:processed", handler);
  }, []);

  function addPending(id: number) {
    setPendingIds((p) => new Set(p).add(id));
  }
  function removePending(id: number) {
    setPendingIds((p) => {
      const n = new Set(p);
      n.delete(id);
      return n;
    });
  }

  async function handleConfirm(id: number) {
    if (!reviewerName) {
      setEditingReviewer(true);
      return;
    }
    const ok = await confirm({
      title: "Confirm this content?",
      description: "It will be published and forwarded to the system.",
      confirmLabel: "Confirm",
    });
    if (!ok) return;
    addPending(id);
    await confirmContent.mutateAsync({ id, reviewer: reviewerName }).catch(() => {});
    removePending(id);
  }

  async function handleReject(id: number) {
    const ok = await confirm({
      title: "Delete this content?",
      description: "This post will be permanently removed and not published.",
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!ok) return;
    addPending(id);
    await rejectContent.mutateAsync(id).catch(() => {});
    removePending(id);
  }

  function saveReviewer() {
    if (!reviewerDraft.trim()) return;
    setReviewerName(reviewerDraft.trim());
    setEditingReviewer(false);
  }

  const allContent = groups.flatMap((g) => g.content);
  const totalItems = allContent.length;
  const confirmedItems = allContent.filter((c) => c.confirmed_at !== null).length;
  const pendingItems = totalItems - confirmedItems;
  const progressPct = totalItems > 0 ? Math.round((confirmedItems / totalItems) * 100) : 0;
  const groupsWithContent = groups.filter((g) => g.content.length > 0);

  const displayedGroups =
    activeGroup === "all"
      ? groupsWithContent
      : groups.filter((g) => g.id === activeGroup && g.content.length > 0);

  return (
    <div className="space-y-5">
      {/* Header row: title left, filter controls right */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Content Review</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading
              ? "Loading…"
              : `${pendingItems} pending · ${confirmedItems} confirmed · ${groupsWithContent.length} groups`}
          </p>
        </div>
        <ContentFilters
          reviewer={reviewerName}
          reviewerDraft={reviewerDraft}
          editingReviewer={editingReviewer}
          date={selectedDate}
          showPendingOnly={showPendingOnly}
          loading={isLoading}
          onReviewerDraftChange={setReviewerDraft}
          onSaveReviewer={saveReviewer}
          onEditReviewer={() => {
            setReviewerDraft(reviewerName);
            setEditingReviewer(true);
          }}
          onCancelEditReviewer={() => setEditingReviewer(false)}
          onDateChange={setSelectedDate}
          onTogglePendingOnly={() => setShowPendingOnly(!showPendingOnly)}
          onRefresh={() => refetch()}
        />
      </div>

      {/* Progress bar — only when there's content */}
      {!isLoading && totalItems > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {confirmedItems} of {totalItems} confirmed
            </span>
            <span className="font-medium">{progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Reviewer prompt */}
      {!reviewerName && !editingReviewer && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900/40 px-4 py-3 flex items-center gap-3">
          <User className="size-4 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200 flex-1">
            Set your name to start confirming content.
          </p>
          <Button size="xs" variant="outline" onClick={() => setEditingReviewer(true)}>
            Set name
          </Button>
        </div>
      )}

      {/* Group tabs — only when there is actual content to browse */}
      {!isLoading && totalItems > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveGroup("all")}
            className={cn(
              "h-8 rounded-full px-3.5 text-xs font-medium transition-colors border",
              activeGroup === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
            )}
          >
            All
            <span className="ml-1.5 opacity-60">{totalItems}</span>
          </button>
          {groupsWithContent.map((g) => {
            const gConfirmed = g.content.filter((c) => c.confirmed_at !== null).length;
            const allDone = gConfirmed === g.content.length;
            return (
              <button
                key={g.id}
                onClick={() => setActiveGroup(g.id)}
                className={cn(
                  "h-8 rounded-full px-3.5 text-xs font-medium transition-colors border",
                  activeGroup === g.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                )}
              >
                {g.name}
                <span className={cn("ml-1.5 opacity-60", allDone && "text-green-500 opacity-100")}>
                  {allDone ? "✓" : g.content.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <ContentSkeleton />
      ) : (
        <ContentGrid
          groups={displayedGroups}
          reviewer={reviewerName}
          pendingIds={pendingIds}
          pendingOnly={showPendingOnly}
          onConfirm={handleConfirm}
          onReject={handleReject}
          onLightbox={setLightboxUrl}
          onShowAll={() => setShowPendingOnly(false)}
        />
      )}

      <ContentLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  );
}
