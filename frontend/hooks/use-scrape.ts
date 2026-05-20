import { toast } from "@/components/ui/toast";
import { useScrapeStatus } from "@/hooks/use-scrape-status";

export function useScrape() {
  const { isScraping } = useScrapeStatus();

  async function triggerScrape() {
    if (isScraping) return;
    try {
      const r = await fetch("/api/instagram/content/scrape", { method: "POST" });
      if (r.status === 409) {
        toast.error("Already running", "A scrape is already in progress.");
        return;
      }
      if (!r.ok) throw new Error("Failed");
      toast.success("Scraping started!", "Real-time logs available on the Logs page.");
    } catch {
      toast.error("Failed to start scraping", "Please try again.");
    }
  }

  return { isScraping, triggerScrape };
}
