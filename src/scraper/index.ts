import { fetchProfileId, fetchInstagramPosts } from "./fetch";
import { puppeteerProfileId, puppeteerHashtag } from "./puppeteer";
import type { ScrapedProfile, ScrapedPostsResponse } from "./types";
import { logger } from "@/utils/logger";

export type { ScrapedPost, ScrapedPostsResponse, ScrapedProfile } from "./types";

export async function scrapeProfile(username: string): Promise<ScrapedProfile> {
  try {
    return await fetchProfileId(username);
  } catch (fetchErr) {
    logger.warn(
      { error: fetchErr },
      `fetch profile failed for @${username}, falling back to Puppeteer`,
    );
    return puppeteerProfileId(username);
  }
}

export async function scrapePosts(
  profileId: string,
  first?: number,
  afterDate?: Date,
  cursor?: string | null,
): Promise<ScrapedPostsResponse> {
  return fetchInstagramPosts(profileId, first, afterDate, cursor);
}

export async function scrapeHashtag(
  hashtag: string,
  first?: number,
  afterDate?: Date,
): Promise<ScrapedPostsResponse> {
  return puppeteerHashtag(hashtag, first, afterDate);
}
