import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ScrapeSession } from "@/types";

async function fetchSessions(): Promise<ScrapeSession[]> {
  const data = await apiFetch<{ results: ScrapeSession[] }>("/api/scrape/sessions");
  return data.results ?? [];
}

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });
}
