import { ok, err, serverErr } from "@/utils/response";
import {
  getContentForReview,
  saveInstagramContent,
  processContentAction,
} from "@/services/instagram-content.service";
import { saveManualContent } from "@/repositories/instagram-content.repo";
import { getRandomRegionByGroupId } from "@/repositories/master-region.repo";
import { createManualAccount } from "@/repositories/instagram-account.repo";
import { buildCdcPayload, forwardToCdc } from "@/services/cdc.service";
import { scrapePosts } from "@/scraper/index";
import { scrapeAllExternalAccounts } from "@/crons/instagram-content.cron";
import { saveUploadedFile, ensureDir } from "@/utils/image";
import { appConfig } from "@/config/app";
import { join } from "path";

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
    console.error("contentGet error:", error);
    return serverErr("Failed to fetch content");
  }
}

export async function contentPost(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => null);
    const { profile_id, first, after_date } = body ?? {};

    if (!profile_id) return err("profile_id is required");

    const afterDate = after_date ? new Date(after_date) : undefined;
    const posts = await scrapePosts(profile_id, first, afterDate);

    return Response.json({ success: true, ...posts });
  } catch (error) {
    console.error("contentPost error:", error);
    return serverErr("Failed to scrape content");
  }
}

export async function contentScrape(req: Request): Promise<Response> {
  console.log("Manual scrape triggered");
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
    const account = await createManualAccount({
      username: manualUsername,
      region_id: region.id,
    });

    const uploadDir = join(process.cwd(), "storage", "contents");
    await ensureDir(uploadDir);

    const contents = await Promise.all(
      files
        .filter((f) => f.type.startsWith("image/"))
        .map(async (file) => {
          const filename = await saveUploadedFile(file, "storage/contents");
          const display_url = `${appConfig.url}/api/instagram/content/file/${filename}`;
          return saveManualContent({
            display_url,
            account_id: account.id,
            posted_at: new Date(date),
          });
        }),
    );

    return ok({
      uploaded_files: contents.length,
      contents: contents.filter(Boolean),
    });
  } catch (error) {
    console.error("contentSubmit error:", error);
    return serverErr("File upload failed");
  }
}

export async function contentActions(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => null);
    const { content_id, action, user } = body ?? {};

    if (!content_id || !action || !user) {
      return err("content_id, action, and user are required");
    }
    if (!["confirm", "reject"].includes(action)) {
      return err("action must be 'confirm' or 'reject'");
    }

    const result = await processContentAction(
      Number(content_id),
      action as "confirm" | "reject",
      user as string,
      async (content) => {
        if (!content || action !== "confirm") return undefined;
        try {
          const { payload } = await buildCdcPayload(
            content.display_url,
            {
              id: content.region_id,
              province_id: content.province_id,
              js_loker: content.js_loker,
            },
            content.caption,
          );
          if (!payload.nama) return undefined;
          return forwardToCdc(payload);
        } catch (err) {
          console.error("CDC forward error:", err);
          return undefined;
        }
      },
    );

    if (!result) {
      return err(`Content not found: ${content_id}`, 404);
    }

    return Response.json({
      success: true,
      message: `Content ${action}ed`,
      result,
    });
  } catch (error) {
    console.error("contentActions error:", error);
    return serverErr("Action failed");
  }
}

export async function contentFileGet(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const filename = url.pathname.split("/").pop();
    if (!filename) return err("Filename required", 400);

    const filePath = join(process.cwd(), "storage", "contents", filename);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      return err("File not found", 404);
    }

    return new Response(file);
  } catch {
    return serverErr("Failed to serve file");
  }
}
