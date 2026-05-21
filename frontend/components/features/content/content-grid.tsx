import { FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentCard } from "./content-card";
import type { ContentGroup } from "@/types";

interface GroupSectionProps {
  group: ContentGroup;
  reviewer: string;
  pendingIds: Set<number>;
  onConfirm: (id: number) => void;
  onReject: (id: number) => void;
  onLightbox: (url: string) => void;
}

function GroupSection({
  group,
  reviewer,
  pendingIds,
  onConfirm,
  onReject,
  onLightbox,
}: GroupSectionProps) {
  const confirmed = group.content.filter((c) => c.confirmed_at !== null).length;
  const total = group.content.length;

  if (total === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">No content in this group</div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold">{group.name}</h3>
        <span className="text-xs text-muted-foreground">
          {confirmed}/{total} confirmed
        </span>
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

interface ContentGridProps {
  groups: ContentGroup[];
  reviewer: string;
  pendingIds: Set<number>;
  pendingOnly: boolean;
  onConfirm: (id: number) => void;
  onReject: (id: number) => void;
  onLightbox: (url: string) => void;
  onShowAll: () => void;
}

export function ContentGrid({
  groups,
  reviewer,
  pendingIds,
  pendingOnly,
  onConfirm,
  onReject,
  onLightbox,
  onShowAll,
}: ContentGridProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <FileImage className="size-7 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">No content to review</p>
          <p className="text-xs text-muted-foreground mt-1">
            {pendingOnly
              ? "All content has been reviewed for this date."
              : "No content scraped for this date."}
          </p>
        </div>
        {pendingOnly && (
          <Button size="sm" variant="outline" onClick={onShowAll}>
            Show all content
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <GroupSection
          key={group.id}
          group={group}
          reviewer={reviewer}
          pendingIds={pendingIds}
          onConfirm={onConfirm}
          onReject={onReject}
          onLightbox={onLightbox}
        />
      ))}
    </div>
  );
}
