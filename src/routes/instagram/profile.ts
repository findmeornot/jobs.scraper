import { ok, okResults, err, serverErr } from "@/utils/response";
import { getAllAccounts, saveOrUpdateAccount, editAccount, removeAccount } from "@/services/instagram-account.service";
import { resolveInstagramId, syncMissingIds } from "@/services/instagram-id.service";
import { fetchUserInfo } from "@/scraper/fetch";
import { instagramConfig } from "@/config/instagram";
import { findRegionAccountsByAccountId } from "@/repositories/region-account.repo";

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

export async function profileSyncIds(): Promise<Response> {
  // Kick off background sync and return 202 immediately
  syncMissingIds().catch((err) =>
    console.error("[profileSyncIds] Background sync error:", err),
  );
  return Response.json(
    { success: true, message: "ID sync started in background" },
    { status: 202 },
  );
}

export async function profilePut(req: Request & { params: { id: string } }): Promise<Response> {
  try {
    const id = Number((req as any).params?.id);
    if (!id) return err("id is required");
    const body = (await req.json().catch(() => ({}))) as {
      username?: string;
      is_active?: boolean;
      is_external?: boolean;
    };
    await editAccount(id, body);
    return ok({ updated: true });
  } catch (error) {
    console.error("profilePut error:", error);
    return serverErr("Failed to update account");
  }
}

export async function profileDelete(req: Request & { params: { id: string } }): Promise<Response> {
  try {
    const id = Number((req as any).params?.id);
    if (!id) return err("id is required");
    await removeAccount(id);
    return ok({ deleted: true });
  } catch (error) {
    console.error("profileDelete error:", error);
    return serverErr("Failed to delete account");
  }
}

export async function profileAccountRegions(req: Request & { params: { id: string } }): Promise<Response> {
  try {
    const id = Number((req as any).params?.id);
    if (!id) return err("id is required");
    const regions = await findRegionAccountsByAccountId(id);
    return okResults(regions);
  } catch (error) {
    console.error("profileAccountRegions error:", error);
    return serverErr("Failed to fetch account regions");
  }
}

async function processUsername(username: string) {
  try {
    const profile = await resolveInstagramId(username);
    const profileId = profile.id;

    const followers = profile.followers;
    const following = profile.following;

    // Optionally enrich with session-based follower count
    if (instagramConfig.sessionId && instagramConfig.sessionId.length > 0 && profileId && followers === 0) {
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

    await saveOrUpdateAccount({ instagram_id: profileId, username, followers, following });
    return { success: true, userId: profileId, username, followers: String(followers), following: String(following) };
  } catch (error) {
    return {
      success: false,
      username,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
