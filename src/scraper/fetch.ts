import { instagramConfig } from "@/config/instagram";
import { urlToBase64 } from "@/utils/image";
import { fromUnix } from "@/utils/date";
import type { ScrapedProfile, ScrapedPost, ScrapedPostsResponse } from "./types";

const MOBILE_UA =
  "Instagram 10.3.2 (iPhone7,2; iPhone OS 9_3_3; en_US; en-US; scale=2.00; 750x1334) AppleWebKit/420+";

export class InstagramNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Instagram user not found: ${identifier}`);
    this.name = "InstagramNotFoundError";
  }
}

function randomDelay(min = 2000, max = 5000): Promise<void> {
  return new Promise((r) => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min));
}

function hasProxy(): boolean {
  return !!(instagramConfig.proxyUrl && instagramConfig.proxyApiKey);
}

async function proxyFetch(targetUrl: string, headers: Record<string, string>): Promise<Response> {
  return fetch(`${instagramConfig.proxyUrl}/proxy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": instagramConfig.proxyApiKey,
    },
    body: JSON.stringify({ url: targetUrl, method: "GET", headers }),
    signal: AbortSignal.timeout(30000),
  });
}

export async function fetchProfileId(username: string): Promise<ScrapedProfile> {
  const targetUrl = `${instagramConfig.baseUrl}/${username}/`;
  const reqHeaders = {
    "User-Agent": instagramConfig.userAgent,
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
  };

  const response = hasProxy()
    ? await proxyFetch(targetUrl, reqHeaders)
    : await fetch(targetUrl, {
        headers: reqHeaders,
        signal: AbortSignal.timeout(instagramConfig.timeout),
      });

  if (!response.ok) throw new Error(`Profile fetch failed: ${response.status}`);

  // Proxy may return the raw HTML body or wrap it; handle both
  let html: string;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json = (await response.json()) as { body?: string; content?: string; data?: string };
    html = json.body ?? json.content ?? json.data ?? "";
  } else {
    html = await response.text();
  }

  const match = html.match(/"profilePage_(\d+)"/);
  if (!match) throw new Error(`Could not extract user ID for @${username}`);

  return { id: match[1]!, followers: "0", following: "0" };
}

export async function fetchUserInfo(
  userId: string,
  sessionId: string,
): Promise<{ follower_count: number; following_count: number }> {
  const targetUrl = `https://i.instagram.com/api/v1/users/${userId}/info/`;
  const reqHeaders: Record<string, string> = {
    "User-Agent": MOBILE_UA,
    Cookie: `sessionid=${sessionId}`,
  };

  const response = hasProxy()
    ? await proxyFetch(targetUrl, reqHeaders)
    : await fetch(targetUrl, {
        headers: reqHeaders,
        signal: AbortSignal.timeout(instagramConfig.timeout),
      });

  if (!response.ok) throw new Error(`User info fetch failed: ${response.status}`);

  const data = (await response.json()) as {
    user?: { follower_count?: number; following_count?: number };
  };
  return {
    follower_count: data.user?.follower_count ?? 0,
    following_count: data.user?.following_count ?? 0,
  };
}

export async function fetchInstagramPosts(
  profileId: string,
  first = 12,
  afterDate?: Date,
  cursor: string | null = null,
): Promise<ScrapedPostsResponse> {
  if (!hasProxy()) {
    throw new Error("PROXY_URL and PROXY_API_KEY must be configured for post scraping.");
  }

  await randomDelay();

  const variables = { id: profileId, after: cursor, first: Math.min(first, 12) };
  const targetUrl = `${instagramConfig.baseUrl}/graphql/query/?doc_id=${instagramConfig.graphqlDocId}&variables=${encodeURIComponent(JSON.stringify(variables))}`;

  const response = await proxyFetch(targetUrl, {
    "User-Agent": instagramConfig.userAgent,
    "X-IG-App-ID": instagramConfig.appId,
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "X-Instagram-AJAX": "1",
    "X-Requested-With": "XMLHttpRequest",
    Referer: "https://www.instagram.com/",
    Origin: "https://www.instagram.com",
    Cookie: `sessionid=${instagramConfig.sessionId}`,
  });

  if (!response.ok) throw new Error(`Proxy request failed: ${response.status}`);

  const result = await response.json();

  if (result.status === "fail") {
    throw new Error(`Instagram API error: ${result.message ?? "unknown"}`);
  }

  // Only treat data.user === null as "not found" when there are no API-level errors.
  // A 401/403 from Instagram typically surfaces as status:"fail" above; reaching here
  // with user===null means the account genuinely does not exist.
  if (result?.data?.user === null) {
    if (result?.errors?.length) {
      throw new Error(`Instagram blocked request for profile ${profileId}`);
    }
    throw new InstagramNotFoundError(profileId);
  }

  const timeline = result?.data?.user?.edge_owner_to_timeline_media;
  if (!timeline?.edges) throw new Error("Invalid Instagram API response structure");

  interface TimelineEdge {
    node: {
      id: string;
      taken_at_timestamp: number;
      display_url: string;
      shortcode: string;
      edge_media_to_caption: { edges: Array<{ node: { text: string } }> };
    };
  }

  const edges = timeline.edges as TimelineEdge[];
  const filteredEdges = edges.filter((edge) => {
    if (!afterDate) return true;
    return !fromUnix(edge.node.taken_at_timestamp).isBefore(afterDate);
  });

  const posts: ScrapedPost[] = await Promise.all(
    filteredEdges.map(async (edge) => {
      const { node } = edge;
      let base64 = "";
      try {
        base64 = await urlToBase64(node.display_url);
      } catch {
        // non-fatal
      }
      return {
        id: Number(node.id),
        caption: node.edge_media_to_caption.edges[0]?.node.text ?? "",
        display_url: node.display_url,
        shortcode: node.shortcode,
        base64,
        created_at: fromUnix(node.taken_at_timestamp).format("DD-MMM-YYYY"),
      };
    }),
  );

  return { first: posts.length, total: timeline.count, result: posts };
}
