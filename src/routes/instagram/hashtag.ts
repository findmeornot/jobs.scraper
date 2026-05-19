import { err, serverErr } from "@/utils/response";
import { scrapeHashtag } from "@/scraper/index";

export async function hashtagGet(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const hashtag = url.searchParams.get("hashtag");
    const first = url.searchParams.get("first");
    const afterDateStr = url.searchParams.get("after_date");

    if (!hashtag) return err("hashtag is required");

    const afterDate = afterDateStr ? new Date(afterDateStr) : undefined;
    const posts = await scrapeHashtag(hashtag, first ? Number(first) : undefined, afterDate);

    return Response.json({ success: true, ...posts });
  } catch (error) {
    console.error("hashtagGet error:", error);
    return serverErr("Hashtag scrape failed");
  }
}
