import { z } from "zod";
import { ok, err } from "@/utils/response";
import { parseBody } from "@/utils/request";
import { scrapeLogService } from "@/services/scrape-log.service";
import { deleteContentSince } from "@/repositories/instagram-content.repo";

const scrapeControlSchema = z.object({
  action: z.enum(["pause", "resume", "reset"]),
});

export async function scrapeControl(req: Request): Promise<Response> {
  const raw = await parseBody(req);
  const parsed = scrapeControlSchema.safeParse(raw);
  if (!parsed.success) return err("action must be one of: pause, resume, reset");

  const { action } = parsed.data;

  if (action === "pause") {
    if (!scrapeLogService.isScraping) return err("No scrape in progress");
    scrapeLogService.pause();
    return ok({ paused: true });
  }

  if (action === "resume") {
    if (!scrapeLogService.isPaused) return err("Scrape is not paused");
    scrapeLogService.resume();
    return ok({ paused: false });
  }

  // action === "reset"
  if (!scrapeLogService.isScraping) return err("No scrape in progress");
  const startedAt = scrapeLogService.sessionStartedAt;
  scrapeLogService.requestStop();
  const contentDeleted = startedAt ? await deleteContentSince(startedAt) : 0;
  return ok({ stopped: true, contentDeleted });
}
