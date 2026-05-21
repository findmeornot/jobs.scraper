import { useState } from "react";
import {
  Check, X, CheckCircle2, Loader2, ImageOff, ExternalLink,
  ChevronDown, ChevronUp, AlertCircle,
} from "lucide-react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ContentItem } from "@/types";

export function proxyUrl(url: string): string {
  return `/api/proxy/image?url=${encodeURIComponent(url)}`;
}

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

interface ContentCardProps {
  item: ContentItem;
  reviewer: string;
  onConfirm: (id: number) => void;
  onReject: (id: number) => void;
  onLightbox: (url: string) => void;
  pending: boolean;
}

export function ContentCard({ item, reviewer, onConfirm, onReject, onLightbox, pending }: ContentCardProps) {
  const [captionExpanded, setCaptionExpanded] = useState(false);

  const isConfirmed = !!item.confirmed_at;
  const hasCdcUrl = !!item.remote_url;
  const isProcessing = isConfirmed && !item.processingDone && !hasCdcUrl;
  const isSkipped = isConfirmed && item.processingDone && !hasCdcUrl && !item.processingError;
  const isFailed = isConfirmed && item.processingDone && !hasCdcUrl && !!item.processingError;

  return (
    <div
      className={cn(
        "group flex flex-col rounded-2xl overflow-hidden border border-border bg-card transition-all duration-200",
        isConfirmed ? "ring-2 ring-green-500/30" : "hover:shadow-lg hover:border-border/80",
        pending && "opacity-60 pointer-events-none",
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted/50">
        <ContentImage
          src={item.display_url}
          alt={item.caption ?? ""}
          onClick={() => onLightbox(item.display_url)}
        />
        {isConfirmed && (
          <div className={cn(
            "absolute inset-0 flex items-end justify-start p-2",
            hasCdcUrl ? "bg-green-500/15" : isFailed ? "bg-destructive/10" : isProcessing ? "bg-yellow-500/10" : "bg-muted/20",
          )}>
            <Badge className={cn(
              "text-white text-[10px] gap-1 backdrop-blur-sm",
              hasCdcUrl ? "bg-green-600/90" : isFailed ? "bg-destructive/90" : isProcessing ? "bg-yellow-600/90" : "bg-foreground/60",
            )}>
              {hasCdcUrl
                ? <><CheckCircle2 className="size-2.5" />Published</>
                : isFailed
                ? <><AlertCircle className="size-2.5" />Failed</>
                : isProcessing
                ? <><Loader2 className="size-2.5 animate-spin" />Processing</>
                : <><CheckCircle2 className="size-2.5" />Confirmed</>
              }
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

      <div className="flex flex-col flex-1 p-3 gap-2">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold text-foreground truncate">@{item.username}</span>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {item.posted_at ? dayjs(item.posted_at).format("DD MMM") : "—"}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground leading-none">{item.region_name}</span>

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
                {captionExpanded
                  ? <><ChevronUp className="size-3" />Less</>
                  : <><ChevronDown className="size-3" />More</>
                }
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/40 italic flex-1">No caption</p>
        )}

        <div className="pt-1">
          {!isConfirmed ? (
            <div className="flex gap-1.5">
              <Button
                size="sm"
                className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white gap-1"
                onClick={() => onConfirm(item.id)}
                disabled={!reviewer || pending}
              >
                {pending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                Confirm
              </Button>
              <Button
                size="sm" variant="outline"
                className="h-8 px-2.5 text-xs hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                onClick={() => onReject(item.id)}
                disabled={pending}
              >
                <X className="size-3" />
              </Button>
            </div>
          ) : hasCdcUrl ? (
            <div className="flex items-center gap-1 text-[10px] text-green-600">
              <CheckCircle2 className="size-3 shrink-0" />
              <span className="truncate">Published · {item.action_by}</span>
            </div>
          ) : isFailed ? (
            <div className="space-y-1.5">
              <p className="text-[10px] text-destructive flex items-start gap-1" title={item.processingError}>
                <AlertCircle className="size-3 shrink-0 mt-px" />
                <span className="truncate">{item.processingError}</span>
              </p>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white gap-1"
                  onClick={() => onConfirm(item.id)}
                  disabled={!reviewer || pending}
                >
                  <Check className="size-3" />Retry
                </Button>
                <Button
                  size="sm" variant="outline"
                  className="h-8 px-2.5 text-xs hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                  onClick={() => onReject(item.id)}
                  disabled={pending}
                >
                  <X className="size-3" />
                </Button>
              </div>
            </div>
          ) : isSkipped ? (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <CheckCircle2 className="size-3 shrink-0" />
              <span className="truncate">Confirmed · {item.skipReason ?? "skipped"}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Loader2 className="size-3 animate-spin shrink-0" />
              <span>Processing…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContentCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-border bg-card animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-muted rounded w-2/3" />
        <div className="h-2 bg-muted rounded w-1/2" />
        <div className="h-2 bg-muted rounded w-full" />
        <div className="h-2 bg-muted rounded w-3/4" />
        <div className="h-8 bg-muted rounded mt-2" />
      </div>
    </div>
  );
}
