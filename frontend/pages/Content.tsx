import { useState, useEffect, useCallback } from "react";
import {
  Check, X, CheckCircle2, Loader2, ImageOff, ExternalLink,
  ChevronDown, ChevronUp, FileImage, User, RefreshCw,
} from "lucide-react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useContent, type ContentItem, type ContentGroup } from "@/hooks/use-content";
import { useConfirm } from "@/hooks/use-confirm";
import { cn } from "@/lib/utils";

// ─── Reviewer name (persisted) ───────────────────────────────────────────────

function useReviewer() {
  const [reviewer, setReviewerState] = useState<string>(
    () => localStorage.getItem("content_reviewer") ?? "",
  );
  const setReviewer = useCallback((name: string) => {
    localStorage.setItem("content_reviewer", name);
    setReviewerState(name);
  }, []);
  return { reviewer, setReviewer };
}

function proxyUrl(url: string): string {
  return `/api/proxy/image?url=${encodeURIComponent(url)}`;
}

// ─── Image component with fallback ───────────────────────────────────────────

function ContentImage({ src, alt, onClick }: { src: string; alt?: string; onClick?: () => void }) {
  const [error, setError] = useState(false);
  return error ? (
    <div
      className="w-full h-full flex flex-col items-center justify-center bg-muted gap-2 cursor-pointer"
      onClick={onClick}
    >
      <ImageOff className="size-8 text-muted-foreground/40" />
      <span className="text-xs text-muted-foreground/60">Image unavailable</span>
    </div>
  ) : (
    <img
      src={proxyUrl(src)}
      alt={alt ?? ""}
      className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.03]"
      onError={() => setError(true)}
      onClick={onClick}
    />
  );
}

// ─── Content card ─────────────────────────────────────────────────────────────

interface ContentCardProps {
  item: ContentItem;
  reviewer: string;
  onConfirm: (id: number) => void;
  onReject: (id: number) => void;
  onLightbox: (url: string) => void;
  pending: boolean;
}

function ContentCard({ item, reviewer, onConfirm, onReject, onLightbox, pending }: ContentCardProps) {
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const isConfirmed = !!item.confirmed_at;
  const hasCdcUrl = !!item.remote_url;

  return (
    <div
      className={cn(
        "group flex flex-col rounded-2xl overflow-hidden border border-border bg-card transition-all duration-200",
        isConfirmed ? "ring-2 ring-green-500/30" : "hover:shadow-lg hover:border-border/80",
        pending && "opacity-60 pointer-events-none",
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted/50">
        <ContentImage
          src={item.display_url}
          alt={item.caption ?? ""}
          onClick={() => onLightbox(item.display_url)}
        />
        {isConfirmed && (
          <div className="absolute inset-0 bg-green-500/15 flex items-end justify-start p-2">
            <Badge className="bg-green-600/90 text-white text-[10px] gap-1 backdrop-blur-sm">
              <CheckCircle2 className="size-2.5" />
              {hasCdcUrl ? "Published" : "Confirmed"}
            </Badge>
          </div>
        )}
        {item.shortcode && (
          <a
            href={`https://instagram.com/p/${item.shortcode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity size-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="size-3 text-white" />
          </a>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        {/* Meta */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold text-foreground truncate">@{item.username}</span>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {item.posted_at ? dayjs(item.posted_at).format("DD MMM") : "—"}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground leading-none">{item.region_name}</span>

        {/* Caption */}
        {item.caption ? (
          <div className="flex-1">
            <p className={cn("text-xs text-foreground/75 leading-relaxed break-words", !captionExpanded && "line-clamp-3")}>
              {item.caption}
            </p>
            {item.caption.length > 120 && (
              <button
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 mt-0.5"
                onClick={() => setCaptionExpanded((v) => !v)}
              >
                {captionExpanded ? <><ChevronUp className="size-3" />Less</> : <><ChevronDown className="size-3" />More</>}
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/40 italic flex-1">No caption</p>
        )}

        {/* Actions */}
        <div className="pt-1">
          {isConfirmed ? (
            <div className="flex items-center gap-1 text-[10px] text-green-600">
              <CheckCircle2 className="size-3 shrink-0" />
              <span className="truncate">by {item.action_by}</span>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <Button
                size="sm"
                className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white gap-1"
                onClick={() => onConfirm(item.id)}
                disabled={!reviewer || pending}
              >
                <Check className="size-3" />Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2.5 text-xs hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                onClick={() => onReject(item.id)}
                disabled={pending}
              >
                <X className="size-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Group section ────────────────────────────────────────────────────────────

function GroupSection({
  group, reviewer, pendingIds, onConfirm, onReject, onLightbox,
}: {
  group: ContentGroup;
  reviewer: string;
  pendingIds: Set<number>;
  onConfirm: (id: number) => void;
  onReject: (id: number) => void;
  onLightbox: (url: string) => void;
}) {
  const confirmed = group.content.filter((c) => c.confirmed_at !== null).length;
  const total = group.content.length;

  if (total === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No content in this group
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold">{group.name}</h3>
        <span className="text-xs text-muted-foreground">{confirmed}/{total} confirmed</span>
        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: total > 0 ? `${(confirmed / total) * 100}%` : "0%" }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {group.content.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            reviewer={reviewer}
            onConfirm={onConfirm}
            onReject={onReject}
            onLightbox={onLightbox}
            pending={pendingIds.has(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Content() {
  const {
    groups, loading, date, setDate, pendingOnly, setPendingOnly,
    refetch, confirmItem, rejectItem, totalItems, confirmedItems, pendingItems,
  } = useContent();

  const { reviewer, setReviewer } = useReviewer();
  const confirm = useConfirm();
  const [reviewerDraft, setReviewerDraft] = useState(reviewer);
  const [editingReviewer, setEditingReviewer] = useState(!reviewer);
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [activeGroup, setActiveGroup] = useState<number | "all">("all");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Reset active group when groups change
  useEffect(() => {
    setActiveGroup("all");
  }, [date, pendingOnly]);

  function addPending(id: number) {
    setPendingIds((p) => new Set(p).add(id));
  }
  function removePending(id: number) {
    setPendingIds((p) => { const n = new Set(p); n.delete(id); return n; });
  }

  async function handleConfirm(id: number) {
    if (!reviewer) { setEditingReviewer(true); return; }
    const ok = await confirm({
      title: "Confirm this content?",
      description: "It will be published and forwarded to the system.",
      confirmLabel: "Confirm",
    });
    if (!ok) return;
    addPending(id);
    await confirmItem(id, reviewer);
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
    await rejectItem(id);
    removePending(id);
  }

  function saveReviewer() {
    if (!reviewerDraft.trim()) return;
    setReviewer(reviewerDraft.trim());
    setEditingReviewer(false);
  }

  const displayedGroups = activeGroup === "all"
    ? groups.filter((g) => g.content.length > 0)
    : groups.filter((g) => g.id === activeGroup && g.content.length > 0);

  const progressPct = totalItems > 0 ? Math.round((confirmedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Content Review</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Loading…" : `${pendingItems} pending · ${confirmedItems} confirmed · ${groups.filter(g => g.content.length > 0).length} groups`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Reviewer name */}
          {editingReviewer ? (
            <div className="flex items-center gap-1.5">
              <Input
                className="h-8 w-36 text-xs"
                placeholder="Your name…"
                autoFocus
                value={reviewerDraft}
                onChange={(e) => setReviewerDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveReviewer(); if (e.key === "Escape") setEditingReviewer(false); }}
              />
              <Button size="xs" onClick={saveReviewer} disabled={!reviewerDraft.trim()}>Save</Button>
            </div>
          ) : (
            <button
              onClick={() => { setReviewerDraft(reviewer); setEditingReviewer(true); }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <User className="size-3" />
              {reviewer || <span className="italic">Set name</span>}
            </button>
          )}

          {/* Date picker */}
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 rounded-lg border border-border px-3 text-xs text-foreground bg-background appearance-none cursor-pointer hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Pending only toggle */}
          <button
            onClick={() => setPendingOnly((v) => !v)}
            className={cn(
              "h-8 rounded-full px-3.5 text-xs font-medium transition-colors border",
              pendingOnly
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-muted",
            )}
          >
            Pending only
          </button>

          {/* Refresh */}
          <Button variant="outline" size="icon-sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      {!loading && totalItems > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{confirmedItems} of {totalItems} confirmed</span>
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

      {/* ── Reviewer prompt ── */}
      {!reviewer && !editingReviewer && (
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

      {/* ── Group tabs ── */}
      {!loading && groups.length > 0 && (
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
          {groups.filter((g) => g.content.length > 0).map((g) => {
            const gConfirmed = g.content.filter((c) => c.confirmed_at !== null).length;
            const allDone = gConfirmed === g.content.length && g.content.length > 0;
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

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : displayedGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <FileImage className="size-7 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No content to review</p>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingOnly ? "All content has been reviewed for this date." : "No content scraped for this date."}
            </p>
          </div>
          {pendingOnly && (
            <Button size="sm" variant="outline" onClick={() => setPendingOnly(false)}>
              Show all content
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {displayedGroups.map((group) => (
            <GroupSection
              key={group.id}
              group={group}
              reviewer={reviewer}
              pendingIds={pendingIds}
              onConfirm={handleConfirm}
              onReject={handleReject}
              onLightbox={setLightboxUrl}
            />
          ))}
        </div>
      )}

      {/* ── Lightbox ── */}
      <Dialog open={!!lightboxUrl} onOpenChange={(o) => { if (!o) setLightboxUrl(null); }}>
        <DialogContent
          className="p-0 border-0 bg-transparent shadow-none max-w-none w-auto"
          showCloseButton={false}
        >
          <div
            className="flex items-center justify-center"
            onClick={() => setLightboxUrl(null)}
          >
            <img
              src={lightboxUrl ? proxyUrl(lightboxUrl) : ""}
              alt=""
              className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
