import { useMutation } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { useScrapeStore } from "@/stores/scrape.store";

export function useScrape() {
  const isScraping = useScrapeStore((s) => s.isScraping);

  const trigger = useMutation({
    mutationFn: () => apiFetch("/api/instagram/content/scrape", { method: "POST" }),
    onSuccess: () => toast.success("Scraping started!", "Real-time logs available on the Logs page."),
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("Already running", "A scrape is already in progress.");
      } else {
        toast.error("Failed to start scraping", "Please try again.");
      }
    },
  });

  return {
    isScraping,
    triggerScrape: () => { if (!isScraping) trigger.mutate(); },
  };
}
