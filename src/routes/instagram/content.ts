import { z } from "zod";
import { ok, err, serverErr } from "@/utils/response";
import { logger } from "@/utils/logger";
import { getParams, parseBody } from "@/utils/request";
import { getContentForReview, saveInstagramContent } from "@/services/instagram-content.service";
import { saveManualContent, confirmContent, rejectContent } from "@/repositories/instagram-content.repo";
import { getRandomRegionByGroupId } from "@/repositories/master-region.repo";
import { createManualAccount } from "@/repositories/instagram-account.repo";
import { processContentInBackground } from "@/services/content-processing.service";
import { scrapePosts } from "@/scraper/index";
import { scrapeAllExternalAccounts } from "@/crons/instagram-content.cron";
import { scrapeLogService } from "@/services/scrape-log.service";
import { saveUploadedFile, ensureDir } from "@/utils/image";
import { appConfig } from "@/config/app";
import { join, basename } from "path";

const contentPostSchema = z.object({
  profile_id: z.string().min(1),
  first: z.number().int().positive().optional(),
  after_date: z.string().optional(),
});

const contentActionsSchema = z.object({
  content_id: z.number().int().positive(),
  action: z.enum(["confirm", "reject"]),
  user: z.string().min(1),
});

export async function contentGet(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date") ?? undefined;
    const showUnverifiedOnly = url.searchParams.get("show_unverified_only") === "true";

    const data = await getContentForReview({ date, showUnverifiedOnly });

    return Response.json({
      success: true,
      date: date ?? "all",
      total_content: data.total_content,
      confirmed: data.confirmed,
      empty_groups: data.empty_groups,
      results: data.groups,
    });
  } catch (error) {
    logger.error({ error }, "contentGet failed");
    return serverErr("Failed to fetch content");
  }
}

export async function contentPost(req: Request): Promise<Response> {
  try {
    const raw = await parseBody(req);
    const parsed = contentPostSchema.safeParse(raw);
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

    const { profile_id, first, after_date } = parsed.data;
    const afterDate = after_date ? new Date(after_date) : undefined;
    const posts = await scrapePosts(profile_id, first, afterDate);

    return Response.json({ success: true, ...posts });
  } catch (error) {
    logger.error({ error }, "contentPost failed");
    return serverErr("Failed to scrape content");
  }
}

export async function contentScrape(_req: Request): Promise<Response> {
  if (scrapeLogService.isScraping) {
    return Response.json({ success: false, message: "A scrape is already in progress" }, { status: 409 });
  }
  logger.info("Manual scrape triggered");
  void scrapeAllExternalAccounts();
  return Response.json({
    success: true,
    message: "Instagram scraping process started",
    started_at: new Date().toISOString(),
  }, { status: 202 });
}

export async function contentSubmit(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();
    const groupId = Number(formData.get("group_id"));
    const date = formData.get("date") as string | null;
    const files = formData.getAll("contents") as File[];

    if (!groupId || !date || !files.length) {
      return err("Missing required fields: group_id, date, or contents files");
    }

    const region = await getRandomRegionByGroupId(groupId);
    if (!region) return err("Group not found or has no regions", 404);

    const manualUsername = `manual_upload_${region.id}`;
    const account = await createManualAccount({ username: manualUsername, region_id: region.id });

    const uploadDir = join(process.cwd(), "storage", "contents");
    await ensureDir(uploadDir);

    const contents = await Promise.all(
      files
        .filter((f) => f.type.startsWith("image/"))
        .map(async (file) => {
          const filename = await saveUploadedFile(file, "storage/contents");
          const display_url = `${appConfig.url}/api/instagram/content/file/${filename}`;
          return saveManualContent({ display_url, account_id: account.id, posted_at: new Date(date) });
        }),
    );

    return ok({ uploaded_files: contents.length, contents: contents.filter(Boolean) });
  } catch (error) {
    logger.error({ error }, "contentSubmit failed");
    return serverErr("File upload failed");
  }
}

export async function contentActions(req: Request): Promise<Response> {
  try {
    const raw = await parseBody(req);
    const parsed = contentActionsSchema.safeParse(raw);
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

    const { content_id, action, user } = parsed.data;

    if (action === "reject") {
      await rejectContent(content_id);
      return Response.json({ success: true, message: "Content rejected" });
    }

    await confirmContent(content_id, user);
    void processContentInBackground(content_id);
    return Response.json({ success: true, message: "Content confirmed, processing in background" });
  } catch (error) {
    logger.error({ error }, "contentActions failed");
    return serverErr("Action failed");
  }
}

export async function contentFileGet(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const rawName = url.pathname.split("/").pop() ?? "";
    const filename = basename(rawName);
    if (!filename) return err("Filename required", 400);

    const filePath = join(process.cwd(), "storage", "contents", filename);
    const file = Bun.file(filePath);

    if (!(await file.exists())) return err("File not found", 404);

    return new Response(file);
  } catch (error) {
    logger.error({ error }, "contentFileGet failed");
    return serverErr("Failed to serve file");
  }
}
