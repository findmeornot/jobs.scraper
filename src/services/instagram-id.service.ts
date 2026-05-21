import { instagramConfig } from "@/config/instagram";
import { puppeteerProfileId } from "@/scraper/puppeteer";
import {
  findAllAccounts,
  upsertAccount,
  deleteAccount,
} from "@/repositories/instagram-account.repo";
import { logger } from "@/utils/logger";

const WEB_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const IG_APP_ID = "936619743392459";

function parseCount(raw: string): number {
  const s = raw.replace(/,/g, "").trim();
  if (/k$/i.test(s)) return Math.round(parseFloat(s) * 1_000);
  if (/m$/i.test(s)) return Math.round(parseFloat(s) * 1_000_000);
  return parseInt(s, 10) || 0;
}

export function extractCountsFromHtml(html: string): { followers: number; following: number } {
  // Primary: og:description — "51K Followers, 384 Following, 2,858 Posts"
  const desc =
    html.match(/property="og:description"[^>]*content="([^"]+)"/i)?.[1] ??
    html.match(/content="([^"]+)"[^>]*property="og:description"/i)?.[1];
  if (desc) {
    const fm = desc.match(/([\d.,KMkm]+)\s*Followers/i);
    const fwm = desc.match(/([\d.,KMkm]+)\s*Following/i);
    const followers = fm?.[1] ? parseCount(fm[1]) : 0;
    const following = fwm?.[1] ? parseCount(fwm[1]) : 0;
    if (followers > 0 || following > 0) return { followers, following };
  }
  // Fallback: exact counts in embedded JSON
  const followers = Number(
    html.match(/"follower_count":(\d+)/)?.[1] ??
      html.match(/"edge_followed_by":\{"count":(\d+)\}/)?.[1] ??
      0,
  );
  const following = Number(
    html.match(/"following_count":(\d+)/)?.[1] ??
      html.match(/"edge_follow":\{"count":(\d+)\}/)?.[1] ??
      0,
  );
  return { followers, following };
}

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

  interface WebProfileInfoResponse {
    data?: {
      user?: {
        id?: string;
        follower_count?: number;
        following_count?: number;
        edge_followed_by?: { count: number };
        edge_follow?: { count: number };
      };
    };
  }
  const json = (await res.json()) as WebProfileInfoResponse;
  const user = json?.data?.user;

  if (!user?.id) throw new Error("No user.id in web_profile_info response");

  return {
    id: String(user.id),
    followers: Number(user.follower_count ?? user.edge_followed_by?.count ?? 0),
    following: Number(user.following_count ?? user.edge_follow?.count ?? 0),
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

  const idPatterns = [
    /"profilePage_(\d+)"/,
    /"profile_id":"(\d+)"/,
    /"user_id":"(\d+)"/,
    /"target_id":"(\d+)"/,
    /"owner":\{"id":"(\d+)"/,
  ];

  let id: string | null = null;
  for (const pattern of idPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      id = match[1];
      break;
    }
  }

  if (!id) throw new Error(`No ID pattern matched in HTML for @${username}`);

  const { followers, following } = extractCountsFromHtml(html);
  return { id, followers, following };
}

/** Strategy 3 — Puppeteer (slow, last resort) */
async function resolveViaPuppeteer(username: string): Promise<ResolvedId> {
  const profile = await puppeteerProfileId(username);
  return {
    id: profile.id,
    followers: Number(profile.followers) || 0,
    following: Number(profile.following) || 0,
  };
}

/**
 * Resolves the Instagram numeric user ID for a given username.
 * Tries three strategies in order: web API → HTML parse → Puppeteer.
 */
export async function resolveInstagramId(username: string): Promise<ResolvedId> {
  const strategies = [
    { name: "web_profile_info API", fn: () => resolveViaWebApi(username) },
    { name: "HTML parse", fn: () => resolveViaHtmlParse(username) },
    { name: "Puppeteer", fn: () => resolveViaPuppeteer(username) },
  ];

  let lastError: unknown;

  for (const { name, fn } of strategies) {
    try {
      const result = await fn();
      logger.info({ username, id: result.id, strategy: name }, "Instagram ID resolved");
      return result;
    } catch (err) {
      logger.warn(
        { username, strategy: name, error: err instanceof Error ? err.message : err },
        "Strategy failed",
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
 * Syncs Instagram IDs for ALL accounts.
 * If an account's ID cannot be resolved by any strategy, the account is deleted.
 */
export async function syncMissingIds(): Promise<{
  processed: number;
  deleted: number;
  failed: string[];
}> {
  const accounts = await findAllAccounts();
  const failed: string[] = [];
  let processed = 0;
  let deleted = 0;

  logger.info({ count: accounts.length }, "Syncing accounts");

  for (const account of accounts) {
    try {
      const { id, followers, following } = await resolveInstagramId(account.username);
      await upsertAccount({ instagram_id: id, username: account.username, followers, following });
      processed++;
      await new Promise((r) => setTimeout(r, 3_000));
    } catch (err) {
      const msg = `@${account.username}: ${err instanceof Error ? err.message : "Unknown error"}`;
      logger.error({ username: account.username }, `All strategies failed — deleting — ${msg}`);
      failed.push(msg);
      try {
        await deleteAccount(account.id);
        deleted++;
      } catch (delErr) {
        logger.error({ username: account.username, error: delErr }, "Could not delete account");
      }
      await new Promise((r) => setTimeout(r, 5_000));
    }
  }

  logger.info({ processed, deleted, failed: failed.length }, "Sync complete");
  return { processed, deleted, failed };
}
