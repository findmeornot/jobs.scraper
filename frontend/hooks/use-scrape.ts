import { useState } from "react";
import { toast } from "@/components/ui/toast";

export function useScrape() {
  const [isScraping, setIsScraping] = useState(false);

  async function triggerScrape() {
    setIsScraping(true);
    try {
      const r = await fetch("/api/instagram/content/scrape", { method: "POST" });
      if (!r.ok) throw new Error("Failed");
      toast.success("Scraping started!", "Background job is running.");
    } catch {
      toast.error("Failed to start scraping", "Please try again.");
    } finally {
      setIsScraping(false);
    }
  }

  return { isScraping, triggerScrape };
}
