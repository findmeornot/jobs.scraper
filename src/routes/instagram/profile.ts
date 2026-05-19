import { okResults, err, serverErr } from "@/utils/response";
import { getAllAccounts, saveOrUpdateAccount } from "@/services/instagram-account.service";
import { scrapeProfile } from "@/scraper/index";
import { fetchUserInfo } from "@/scraper/fetch";
import { instagramConfig } from "@/config/instagram";

export async function profileGet(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const isExternal =
      type === "true" ? true : type === "false" ? false : undefined;

    const accounts = await getAllAccounts(isExternal);
    return okResults(accounts);
  } catch (error) {
    console.error("profileGet error:", error);
    return serverErr("Failed to fetch profiles");
  }
}

export async function profilePost(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => null);
    const usernames: string[] | undefined = body?.usernames;

    if (!Array.isArray(usernames) || !usernames.length) {
      return err("usernames must be a non-empty array");
    }

    const results = await Promise.all(usernames.map(processUsername));
    return Response.json({ success: true, results });
  } catch (error) {
    console.error("profilePost error:", error);
    return serverErr("Failed to process usernames");
  }
}

async function processUsername(username: string) {
  try {
    const profile = await scrapeProfile(username);
    const profileId = profile.id;

    if (instagramConfig.sessionId && profileId) {
      try {
        const info = await fetchUserInfo(profileId, instagramConfig.sessionId);
        await saveOrUpdateAccount({
          instagram_id: profileId,
          username,
          followers: info.follower_count,
          following: info.following_count,
        });
        return {
          success: true,
          userId: profileId,
          username,
          followers: String(info.follower_count),
          following: String(info.following_count),
        };
      } catch {
        // session info fetch failed, fall through to basic save
      }
    }

    await saveOrUpdateAccount({ instagram_id: profileId, username, followers: 0, following: 0 });
    return { success: true, userId: profileId, username };
  } catch (error) {
    return {
      success: false,
      username,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
