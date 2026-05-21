import { useState } from "react";
import { Play, Pause, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useConfirm } from "@/hooks/use-confirm";

async function scrapeAction(action: "pause" | "resume" | "reset") {
  const r = await fetch("/api/scrape/control", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    toast.error("Control failed", d.message ?? "Unknown error");
  }
  return r.ok;
}

interface ScrapeControlsProps {
  isPaused: boolean;
  isScraping: boolean;
  onTrigger: () => void;
}

export function ScrapeControls({ isPaused, isScraping, onTrigger }: ScrapeControlsProps) {
  const confirm = useConfirm();
  const [controlling, setControlling] = useState(false);

  async function handlePause() {
    setControlling(true);
    await scrapeAction("pause");
    setControlling(false);
  }

  async function handleResume() {
    setControlling(true);
    await scrapeAction("resume");
    setControlling(false);
  }

  async function handleReset() {
    const ok = await confirm({
      title: "Stop and reset?",
      description: "The scrape will be stopped and all content scraped in this session will be deleted (excluding confirmed items).",
      variant: "destructive",
      confirmLabel: "Stop & Delete",
    });
    if (!ok) return;
    setControlling(true);
    const success = await scrapeAction("reset");
    if (success) toast.success("Session reset", "Scrape stopped and session content deleted.");
    setControlling(false);
  }

  if (isScraping) {
    return (
      <>
        {isPaused ? (
          <Button variant="outline" size="xs" onClick={handleResume} disabled={controlling} className="gap-1">
            <Play className="size-3" />Resume
          </Button>
        ) : (
          <Button variant="outline" size="xs" onClick={handlePause} disabled={controlling} className="gap-1">
            <Pause className="size-3" />Pause
          </Button>
        )}
        <Button
          variant="outline" size="xs"
          onClick={handleReset}
          disabled={controlling}
          className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
        >
          <RotateCcw className="size-3" />Reset
        </Button>
      </>
    );
  }

  return (
    <Button size="sm" onClick={onTrigger} disabled={isScraping}>
      {isScraping
        ? isPaused
          ? <><Pause className="size-4" />Paused</>
          : <><Loader2 className="size-4 animate-spin" />Scraping…</>
        : <><Play className="size-4" />Trigger Scrape</>
      }
    </Button>
  );
}
