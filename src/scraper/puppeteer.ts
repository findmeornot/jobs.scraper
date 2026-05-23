import puppeteer, { type Page, type PuppeteerLaunchOptions } from "puppeteer";
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

// Routes all Instagram requests through the custom proxy API via request interception.
async function withProxyInterception(page: Page): Promise<void> {
  if (!instagramConfig.proxyUrl || !instagramConfig.proxyApiKey) return;

  await page.setRequestInterception(true);

  page.on("request", async (req) => {
    const url = req.url();
    const isInstagram =
      url.includes("instagram.com") ||
      url.includes("cdninstagram.com") ||
      url.includes("fbcdn.net");

    if (!isInstagram) {
      await req.continue();
      return;
    }

    try {
      const resp = await fetch(`${instagramConfig.proxyUrl}/proxy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": instagramConfig.proxyApiKey,
        },
        body: JSON.stringify({
          url,
          method: req.method(),
          headers: req.headers(),
          body: req.postData() ?? undefined,
        }),
        signal: AbortSignal.timeout(30000),
      });

      const body = Buffer.from(await resp.arrayBuffer());
      const headers: Record<string, string> = {};
      resp.headers.forEach((v, k) => {
        headers[k] = v;
      });

      await req.respond({ status: resp.status, headers, body });
    } catch {
      await req.abort();
    }
  });
}

export async function puppeteerProfileId(username: string): Promise<ScrapedProfile> {
  const browser = await puppeteer.launch(LAUNCH_OPTIONS);
  try {
    const page = await browser.newPage();
    await withProxyInterception(page);
    await page.setUserAgent(instagramConfig.userAgent);
    if (instagramConfig.sessionId) {
      await page.setCookie({ name: "sessionid", value: instagramConfig.sessionId, domain: ".instagram.com" });
    }
    if (instagramConfig.csrfToken) {
      await page.setCookie({ name: "csrftoken", value: instagramConfig.csrfToken, domain: ".instagram.com" });
    }

    let intercepted: ScrapedProfile | null = null;

    // Intercept the web_profile_info API that Instagram fires automatically on page load
    page.on("response", async (response) => {
      if (intercepted) return;
      if (!response.url().includes("web_profile_info")) return;
      try {
        const json = await response.json() as {
          data?: { user?: { id?: string; follower_count?: number; following_count?: number } };
        };
        const user = json?.data?.user;
        if (user?.id) {
          intercepted = {
            id: user.id,
            followers: String(user.follower_count ?? 0),
            following: String(user.following_count ?? 0),
          };
        }
      } catch {}
    });

    await page.goto(`${instagramConfig.baseUrl}/${username}/`, {
      waitUntil: "networkidle2",
      timeout: 15_000,
    });

    if (intercepted) return intercepted;

    // Fallback: parse rendered HTML
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
    headless: true,
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
    await withProxyInterception(page);
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
          await withProxyInterception(postPage);
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
