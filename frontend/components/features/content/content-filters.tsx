import { User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ContentFiltersProps {
  reviewer: string;
  reviewerDraft: string;
  editingReviewer: boolean;
  date: string;
  showPendingOnly: boolean;
  loading: boolean;
  onReviewerDraftChange: (v: string) => void;
  onSaveReviewer: () => void;
  onEditReviewer: () => void;
  onCancelEditReviewer: () => void;
  onDateChange: (date: string) => void;
  onTogglePendingOnly: () => void;
  onRefresh: () => void;
}

export function ContentFilters({
  reviewer,
  reviewerDraft,
  editingReviewer,
  date,
  showPendingOnly,
  loading,
  onReviewerDraftChange,
  onSaveReviewer,
  onEditReviewer,
  onCancelEditReviewer,
  onDateChange,
  onTogglePendingOnly,
  onRefresh,
}: ContentFiltersProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {editingReviewer ? (
        <div className="flex items-center gap-1.5">
          <Input
            className="h-8 w-36 text-xs"
            placeholder="Your name…"
            autoFocus
            value={reviewerDraft}
            onChange={(e) => onReviewerDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveReviewer();
              if (e.key === "Escape") onCancelEditReviewer();
            }}
          />
          <Button size="xs" onClick={onSaveReviewer} disabled={!reviewerDraft.trim()}>
            Save
          </Button>
        </div>
      ) : (
        <button
          onClick={onEditReviewer}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <User className="size-3" />
          {reviewer || <span className="italic">Set name</span>}
        </button>
      )}

      <input
        type="date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        className="h-8 rounded-lg border border-border px-3 text-xs text-foreground bg-background appearance-none cursor-pointer hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <button
        onClick={onTogglePendingOnly}
        className={cn(
          "h-8 rounded-full px-3.5 text-xs font-medium transition-colors border",
          showPendingOnly
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background text-muted-foreground border-border hover:bg-muted",
        )}
      >
        Pending only
      </button>

      <Button variant="outline" size="icon-sm" onClick={onRefresh} disabled={loading}>
        <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
      </Button>
    </div>
  );
}
