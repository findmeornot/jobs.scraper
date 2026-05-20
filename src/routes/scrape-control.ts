import { ok, err } from "@/utils/response";
import { scrapeLogService } from "@/services/scrape-log.service";
import { deleteContentSince } from "@/repositories/instagram-content.repo";

export async function scrapeControl(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({})) as { action?: string };

  if (body.action === "pause") {
    if (!scrapeLogService.isScraping) return err("No scrape in progress");
    scrapeLogService.pause();
    return ok({ paused: true });
  }

  if (body.action === "resume") {
    if (!scrapeLogService.isPaused) return err("Scrape is not paused");
    scrapeLogService.resume();
    return ok({ paused: false });
  }

  if (body.action === "reset") {
    if (!scrapeLogService.isScraping) return err("No scrape in progress");
    const startedAt = scrapeLogService.sessionStartedAt;
    scrapeLogService.requestStop();
    const contentDeleted = startedAt ? await deleteContentSince(startedAt) : 0;
    return ok({ stopped: true, contentDeleted });
  }

  return err("action must be one of: pause, resume, reset");
}
