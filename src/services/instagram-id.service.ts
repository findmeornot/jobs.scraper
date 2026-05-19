import { instagramConfig } from "@/config/instagram";
import { puppeteerProfileId } from "@/scraper/puppeteer";
import { updateInstagramId, findAccountsMissingInstagramId } from "@/repositories/instagram-account.repo";

const WEB_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const IG_APP_ID = "936619743392459";

interface ResolvedId {
  id: string;
  followers: number;
  following: number;
}

/** Strategy 1 — Instagram web_profile_info API (fastest, no auth needed) */
async function resolveViaWebApi(username: string): Promise<ResolvedId> {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": WEB_UA,
      "x-ig-app-id": IG_APP_ID,
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: `https://www.instagram.com/${username}/`,
      "X-Requested-With": "XMLHttpRequest",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) throw new Error(`web_profile_info returned HTTP ${res.status}`);

  const json: unknown = await res.json();
  const user = (json as any)?.data?.user;

  if (!user?.id) throw new Error("No user.id in web_profile_info response");

  return {
    id: String(user.id),
    followers: Number(user.edge_followed_by?.count ?? 0),
    following: Number(user.edge_follow?.count ?? 0),
  };
}

/** Strategy 2 — Extract ID from raw profile HTML (multiple regex patterns) */
async function resolveViaHtmlParse(username: string): Promise<ResolvedId> {
  const res = await fetch(`${instagramConfig.baseUrl}/${username}/`, {
    headers: { "User-Agent": WEB_UA },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error(`Profile page returned HTTP ${res.status}`);

  const html = await res.text();

  const patterns = [
    /"profilePage_(\d+)"/,
    /"profile_id":"(\d+)"/,
    /"user_id":"(\d+)"/,
    /"target_id":"(\d+)"/,
    /"owner":\{"id":"(\d+)"/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return { id: match[1], followers: 0, following: 0 };
  }

  throw new Error(`No ID pattern matched in HTML for @${username}`);
}

/** Strategy 3 — Puppeteer (slow, last resort) */
async function resolveViaPuppeteer(username: string): Promise<ResolvedId> {
  const profile = await puppeteerProfileId(username);
  return { id: profile.id, followers: 0, following: 0 };
}

/**
 * Resolves the Instagram numeric user ID for a given username.
 * Tries three strategies in order: web API → HTML parse → Puppeteer.
 */
export async function resolveInstagramId(username: string): Promise<ResolvedId> {
  const strategies = [
    { name: "web_profile_info API", fn: () => resolveViaWebApi(username) },
    { name: "HTML parse",           fn: () => resolveViaHtmlParse(username) },
    { name: "Puppeteer",            fn: () => resolveViaPuppeteer(username) },
  ];

  let lastError: unknown;

  for (const { name, fn } of strategies) {
    try {
      const result = await fn();
      console.log(`[resolveInstagramId] @${username} → ${result.id} (via ${name})`);
      return result;
    } catch (err) {
      console.warn(
        `[resolveInstagramId] ${name} failed for @${username}:`,
        err instanceof Error ? err.message : err,
      );
      lastError = err;
    }
  }

  throw new Error(
    `All strategies failed for @${username}: ${
      lastError instanceof Error ? lastError.message : "Unknown error"
    }`,
  );
}

/**
 * Syncs Instagram IDs for all accounts that are missing one.
 * Runs sequentially with delays to avoid rate-limiting.
 */
export async function syncMissingIds(): Promise<{ processed: number; failed: string[] }> {
  const accounts = await findAccountsMissingInstagramId();
  const failed: string[] = [];
  let processed = 0;

  console.log(`[syncMissingIds] Found ${accounts.length} accounts without Instagram ID`);

  for (const account of accounts) {
    try {
      const { id } = await resolveInstagramId(account.username);
      await updateInstagramId(account.username, id);
      processed++;
      // Polite delay between requests
      await new Promise((r) => setTimeout(r, 3_000));
    } catch (err) {
      const msg = `@${account.username}: ${err instanceof Error ? err.message : "Unknown error"}`;
      console.error(`[syncMissingIds] Failed — ${msg}`);
      failed.push(msg);
      await new Promise((r) => setTimeout(r, 5_000));
    }
  }

  console.log(`[syncMissingIds] Done — ${processed} synced, ${failed.length} failed`);
  return { processed, failed };
}
