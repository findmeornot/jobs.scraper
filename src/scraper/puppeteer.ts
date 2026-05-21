import puppeteer, { type PuppeteerLaunchOptions } from "puppeteer";
import { instagramConfig } from "@/config/instagram";
import { urlToBase64 } from "@/utils/image";
import type { ScrapedProfile, ScrapedPost, ScrapedPostsResponse } from "./types";
import { extractCountsFromHtml } from "@/services/instagram-id.service";

const LAUNCH_OPTIONS: PuppeteerLaunchOptions = {
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-web-security",
    "--disable-features=IsolateOrigins,site-per-process",
  ],
};

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function puppeteerProfileId(username: string): Promise<ScrapedProfile> {
  const browser = await puppeteer.launch(LAUNCH_OPTIONS);
  try {
    const page = await browser.newPage();
    await page.setUserAgent(instagramConfig.userAgent);
    await page.goto(`${instagramConfig.baseUrl}/${username}/`, {
      waitUntil: "networkidle2",
      timeout: 30_000,
    });

    const content = await page.content();

    const idMatch =
      content.match(/"profilePage_(\d+)"/) ??
      content.match(/"profile_id":"(\d+)"/) ??
      content.match(/"user_id":"(\d+)"/);
    if (!idMatch?.[1]) throw new Error(`Could not find user ID for @${username}`);

    const { followers, following } = extractCountsFromHtml(content);
    return { id: idMatch[1], followers: String(followers), following: String(following) };
  } finally {
    await browser.close();
  }
}

export async function puppeteerHashtag(
  hashtag: string,
  first?: number,
  afterDate?: Date,
): Promise<ScrapedPostsResponse> {
  const browser = await puppeteer.launch({
    ...LAUNCH_OPTIONS,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
    ],
  });

  try {
    await delay(2000 + Math.floor(Math.random() * 8000));

    const page = await browser.newPage();
    await page.setUserAgent(instagramConfig.userAgent);

    const sessionId = instagramConfig.sessionId;
    if (sessionId) {
      await page.setCookie({
        name: "sessionid",
        value: sessionId,
        domain: ".instagram.com",
      });
    }

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    });

    await page.goto(`${instagramConfig.baseUrl}/explore/search/keyword/?q=%23${hashtag}`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    await page.waitForSelector("article", { timeout: 30000, visible: true });

    const rawPosts = await page.evaluate(() => {
      const images = document.querySelectorAll("div.PolarisPhoto._aagv img.PolarisResponsiveImage");
      const data: Array<{ shortcode: string; display_url: string; text: string }> = [];
      images.forEach((img) => {
        if (img instanceof HTMLImageElement) {
          const article = img.closest("article");
          const link = article?.querySelector("a");
          const shortcode = link?.href?.split("/p/")?.[1]?.replace(/\//g, "");
          if (shortcode) {
            data.push({ shortcode, display_url: img.src, text: img.alt ?? "" });
          }
        }
      });
      return data;
    });

    const enriched = await Promise.all(
      rawPosts.map(async (post) => {
        try {
          await delay(2000 + Math.floor(Math.random() * 8000));
          const postPage = await browser.newPage();
          await postPage.setUserAgent(instagramConfig.userAgent);
          await postPage.goto(`${instagramConfig.baseUrl}/p/${post.shortcode}/`);

          const postData = await postPage.evaluate(() => {
            const script = document.querySelector('script[type="application/ld+json"]');
            if (!script) return null;
            const json = JSON.parse(script.textContent ?? "{}");
            return {
              created_at: json.uploadDate ?? new Date().toISOString(),
              id: json.identifier ?? "",
            };
          });

          await postPage.close();

          if (!postData) return null;

          const base64 = await urlToBase64(post.display_url);
          return {
            id: postData.id || 0,
            caption: post.text,
            display_url: post.display_url,
            shortcode: post.shortcode,
            base64,
            created_at: postData.created_at,
          } as ScrapedPost;
        } catch {
          return null;
        }
      }),
    );

    const valid = enriched.filter(
      (p): p is ScrapedPost => p !== null && (!afterDate || new Date(p.created_at) >= afterDate),
    );

    const limited = first ? valid.slice(0, first) : valid;
    return { first: limited.length, total: rawPosts.length, result: limited };
  } finally {
    await browser.close();
  }
}
