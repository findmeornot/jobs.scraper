import { instagramConfig } from "@/config/instagram";
import { puppeteerProfileId } from "@/scraper/puppeteer";
import {
  findAllAccounts,
  findAccountsMissingInstagramId,
  upsertAccount,
} from "@/repositories/instagram-account.repo";
import { wsManager } from "@/ws/manager";
import { logger } from "@/utils/logger";

export type SyncMode = "all" | "empty";

interface SyncState {
  running: boolean;
  total: number;
  processed: number;
  failed: number;
  current: string | null;
  stopRequested: boolean;
  mode: SyncMode;
  canResume: boolean;
  pendingCount: number;
}

type SyncAccount = { id: number; username: string; instagram_id: string | null };

let syncState: SyncState = {
  running: false,
  total: 0,
  processed: 0,
  failed: 0,
  current: null,
  stopRequested: false,
  mode: "all",
  canResume: false,
  pendingCount: 0,
};

let pendingAccounts: SyncAccount[] = [];
let _stopRequested = false;
let _syncController: AbortController | null = null;

export function getSyncState(): SyncState {
  return { ...syncState };
}

export function requestSyncStop(): void {
  if (!syncState.running) return;
  _stopRequested = true;
  _syncController?.abort();
  syncState = { ...syncState, stopRequested: true };
  broadcastSyncProgress();
}

function broadcastSyncProgress() {
  wsManager.broadcast({ type: "sync_progress", ...syncState });
}

async function stopAwareDelay(ms: number): Promise<void> {
  const step = 200;
  let remaining = ms;
  while (remaining > 0 && !_stopRequested) {
    await new Promise<void>((r) => setTimeout(r, Math.min(step, remaining)));
    remaining -= step;
  }
}

const WEB_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const IG_APP_ID = "936619743392459";

function buildCookieHeader(): string {
  if (instagramConfig.cookie) return instagramConfig.cookie;
  return [
    instagramConfig.sessionId && `sessionid=${instagramConfig.sessionId}`,
    instagramConfig.csrfToken && `csrftoken=${instagramConfig.csrfToken}`,
  ]
    .filter(Boolean)
    .join("; ");
}

function hasProxy(): boolean {
  return !!(instagramConfig.proxyUrl && instagramConfig.proxyApiKey);
}

/**
 * Fetch wrapper that routes through the haiboss proxy when configured.
 * Logs proxy status and a body snippet so failures are diagnosable in prod.
 */
async function igFetch(
  url: string,
  headers: Record<string, string>,
  signal?: AbortSignal,
): Promise<Response> {
  if (!hasProxy()) {
    return fetch(url, { headers, signal: signal ?? AbortSignal.timeout(15_000) });
  }

  logger.debug({ url, proxy: instagramConfig.proxyUrl }, "igFetch: routing through proxy");

  const res = await fetch(`${instagramConfig.proxyUrl}/proxy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": instagramConfig.proxyApiKey,
    },
    body: JSON.stringify({ url, method: "GET", headers }),
    signal: signal ?? AbortSignal.timeout(20_000),
  });

  logger.info(
    { url, proxyStatus: res.status, contentType: res.headers.get("content-type") },
    "igFetch: proxy response",
  );

  return res;
}

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

const MOBILE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

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

function parseWebProfileInfo(json: WebProfileInfoResponse): ResolvedId {
  const user = json?.data?.user;
  if (!user?.id) throw new Error("No user.id in web_profile_info response");
  return {
    id: String(user.id),
    followers: Number(user.follower_count ?? user.edge_followed_by?.count ?? 0),
    following: Number(user.following_count ?? user.edge_follow?.count ?? 0),
  };
}

/** Strategy 1 — web_profile_info via www (desktop) */
async function resolveViaWebApi(username: string, signal?: AbortSignal): Promise<ResolvedId> {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
  const cookie = buildCookieHeader();

  const res = await igFetch(url, {
    "User-Agent": WEB_UA,
    "x-ig-app-id": instagramConfig.appId || IG_APP_ID,
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: `https://www.instagram.com/${username}/`,
    "X-Requested-With": "XMLHttpRequest",
    ...(cookie && { Cookie: cookie }),
    ...(instagramConfig.csrfToken && { "x-csrftoken": instagramConfig.csrfToken }),
  }, signal);

  if (!res.ok) throw new Error(`web_profile_info (www) returned HTTP ${res.status}`);
  const text = await res.text();
  logger.debug({ username, strategy: "www", bodySnippet: text.slice(0, 300) }, "raw response body");
  return parseWebProfileInfo(JSON.parse(text) as WebProfileInfoResponse);
}

/** Strategy 2 — web_profile_info via i.instagram.com (mobile endpoint, different rate limits) */
async function resolveViaMobileApi(username: string, signal?: AbortSignal): Promise<ResolvedId> {
  const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
  const cookie = buildCookieHeader();

  const res = await igFetch(url, {
    "User-Agent": MOBILE_UA,
    "x-ig-app-id": instagramConfig.appId || IG_APP_ID,
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    ...(cookie && { Cookie: cookie }),
  }, signal);

  if (!res.ok) throw new Error(`web_profile_info (i.instagram.com) returned HTTP ${res.status}`);
  return parseWebProfileInfo((await res.json()) as WebProfileInfoResponse);
}

/**
 * Strategy 3 — proxy fetch with curl TLS fingerprint, or direct curl when no proxy.
 * When proxy is set, routes through haiboss (clean IP) instead of using the server's blocked IP.
 */
async function resolveViaCurl(username: string, signal?: AbortSignal): Promise<ResolvedId> {
  const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
  const appId = instagramConfig.appId || IG_APP_ID;
  const cookie = buildCookieHeader();

  if (hasProxy()) {
    // Proxy already gives us a clean IP — no need for curl's TLS trick
    const res = await igFetch(url, {
      "User-Agent": MOBILE_UA,
      "x-ig-app-id": appId,
      "Accept-Language": "en-US,en;q=0.9",
      ...(cookie && { Cookie: cookie }),
    }, signal);
    if (!res.ok) throw new Error(`web_profile_info via proxy returned HTTP ${res.status}`);
    return parseWebProfileInfo((await res.json()) as WebProfileInfoResponse);
  }

  // No proxy — use curl's different TLS fingerprint for local/dev
  const args = [
    "curl", "-sf", "--max-time", "15",
    "-A", MOBILE_UA,
    "-H", `x-ig-app-id: ${appId}`,
    "-H", "Accept-Language: en-US,en;q=0.9",
    ...(cookie ? ["-H", `Cookie: ${cookie}`] : []),
    url,
  ];

  const result = await Bun.$`${args}`.text();
  const json = JSON.parse(result) as WebProfileInfoResponse;
  return parseWebProfileInfo(json);
}

/** Strategy 4 — Extract ID from raw profile HTML (multiple regex patterns) */
async function resolveViaHtmlParse(username: string, signal?: AbortSignal): Promise<ResolvedId> {
  const cookie = buildCookieHeader();
  const res = await igFetch(`${instagramConfig.baseUrl}/${username}/`, {
    "User-Agent": WEB_UA,
    "Accept-Language": "en-US,en;q=0.9",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    ...(cookie && { Cookie: cookie }),
  }, signal);

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

/** Strategy 4 — Puppeteer (intercepts web_profile_info response, fallback to HTML) */
async function resolveViaPuppeteer(username: string): Promise<ResolvedId> {
  const profile = await puppeteerProfileId(username);
  return {
    id: profile.id,
    followers: Number(profile.followers) || 0,
    following: Number(profile.following) || 0,
  };
}

/** Strategy 2.5 — Magic Parameters (?__a=1&__d=dis) */
async function resolveViaMagic(username: string, signal?: AbortSignal): Promise<ResolvedId> {
  const url = `${instagramConfig.baseUrl}/${encodeURIComponent(username)}/?__a=1&__d=dis`;
  const cookie = buildCookieHeader();

  const res = await igFetch(url, {
    "User-Agent": WEB_UA,
    "x-ig-app-id": instagramConfig.appId || IG_APP_ID,
    "Accept-Language": "en-US,en;q=0.9",
    ...(cookie && { Cookie: cookie }),
  }, signal);

  if (!res.ok) throw new Error(`Magic API returned HTTP ${res.status}`);
  const json = await res.json() as any;
  const user = json?.graphql?.user || json?.user || json?.data?.user;
  if (!user?.id) throw new Error("No user.id in magic response");

  return {
    id: String(user.id),
    followers: Number(user.edge_followed_by?.count ?? user.follower_count ?? 0),
    following: Number(user.edge_follow?.count ?? user.following_count ?? 0),
  };
}

/**
 * Resolves the Instagram numeric user ID for a given username.
 * Tries in order: www fetch → mobile fetch → curl (different TLS fingerprint) → HTML parse → Puppeteer.
 */
export async function resolveInstagramId(username: string, signal?: AbortSignal): Promise<ResolvedId> {
  const strategies = [
    { name: "web_profile_info (www)", fn: () => resolveViaWebApi(username, signal) },
    { name: "web_profile_info (mobile)", fn: () => resolveViaMobileApi(username, signal) },
    { name: "magic_api (?__a=1)", fn: () => resolveViaMagic(username, signal) },
    { name: "curl (mobile UA)", fn: () => resolveViaCurl(username) },
    { name: "HTML parse", fn: () => resolveViaHtmlParse(username, signal) },
    { name: "Puppeteer", fn: () => resolveViaPuppeteer(username) },
  ];

  let lastError: unknown;

  for (const { name, fn } of strategies) {
    try {
      const result = await fn();
      logger.info({ username, id: result.id, strategy: name }, "Instagram ID resolved");
      return result;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") throw err;
      logger.warn(
        { username, strategy: name, error: err instanceof Error ? err.message : err },
        "Strategy failed",
      );
      lastError = err;
    }
  }

  throw new Error(
    `All strategies failed for @${username}: ${lastError instanceof Error ? lastError.message : "Unknown error"
    }`,
  );
}

export async function syncAccounts(options: {
  mode: SyncMode;
  resume?: boolean;
}): Promise<{ processed: number; skipped: number; failed: string[] }> {
  if (syncState.running) {
    logger.warn("Sync already in progress — skipping");
    return { processed: 0, skipped: 0, failed: [] };
  }

  _stopRequested = false;
  _syncController = new AbortController();
  const signal = _syncController.signal;
  const failed: string[] = [];

  let accounts: SyncAccount[];
  if (options.resume && pendingAccounts.length > 0) {
    accounts =
      options.mode === "empty"
        ? pendingAccounts.filter((a) => a.instagram_id === null)
        : [...pendingAccounts];
  } else {
    accounts =
      options.mode === "all"
        ? await findAllAccounts()
        : await findAccountsMissingInstagramId();
  }
  pendingAccounts = [];

  syncState = {
    running: true,
    total: accounts.length,
    processed: 0,
    failed: 0,
    current: null,
    stopRequested: false,
    mode: options.mode,
    canResume: false,
    pendingCount: 0,
  };
  broadcastSyncProgress();
  logger.info({ count: accounts.length, mode: options.mode, resume: options.resume ?? false }, "Sync started");

  let stopped = false;

  try {
    for (const [i, account] of accounts.entries()) {
      if (_stopRequested) {
        pendingAccounts = accounts.slice(i);
        stopped = true;
        break;
      }

      syncState.current = account.username;
      broadcastSyncProgress();

      let aborted = false;
      try {
        const { id } = await resolveInstagramId(account.username, signal);
        await upsertAccount({ instagram_id: id, username: account.username, followers: 0, following: 0 });
        syncState.processed++;
        broadcastSyncProgress();
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          aborted = true;
        } else {
          const msg = `@${account.username}: ${err instanceof Error ? err.message : "Unknown error"}`;
          logger.warn({ username: account.username }, `All strategies failed — skipping — ${msg}`);
          failed.push(msg);
          syncState.failed++;
          broadcastSyncProgress();
        }
      }

      if (aborted || _stopRequested) {
        pendingAccounts = accounts.slice(i);
        stopped = true;
        break;
      }

      await stopAwareDelay(3000 + Math.floor(Math.random() * 3000)); // 3-6s delay to prevent proxy ban
    }
  } finally {
    syncState = {
      ...syncState,
      running: false,
      current: null,
      canResume: stopped && pendingAccounts.length > 0,
      pendingCount: pendingAccounts.length,
    };
    broadcastSyncProgress();
  }

  logger.info({ processed: syncState.processed, skipped: syncState.failed, stopped }, "Sync finished");
  return { processed: syncState.processed, skipped: syncState.failed, failed };
}
