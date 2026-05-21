import { z } from "zod";
import { ok, okResults, err, serverErr } from "@/utils/response";
import { logger } from "@/utils/logger";
import { getParams, parseBody } from "@/utils/request";
import {
  getAllAccounts,
  saveOrUpdateAccount,
  editAccount,
  removeAccount,
} from "@/services/instagram-account.service";
import { resolveInstagramId, syncMissingIds } from "@/services/instagram-id.service";
import { fetchUserInfo } from "@/scraper/fetch";
import { instagramConfig } from "@/config/instagram";
import { findRegionAccountsByAccountId } from "@/repositories/region-account.repo";

const profilePostSchema = z.object({
  usernames: z.array(z.string().min(1)).min(1),
});

const profilePutSchema = z.object({
  username: z.string().min(1).optional(),
  is_external: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export async function profileGet(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const isExternal = type === "true" ? true : type === "false" ? false : undefined;
    const accounts = await getAllAccounts(isExternal);
    return okResults(accounts);
  } catch (error) {
    logger.error({ error }, "profileGet failed");
    return serverErr("Failed to fetch profiles");
  }
}

export async function profilePost(req: Request): Promise<Response> {
  try {
    const raw = await parseBody(req);
    const parsed = profilePostSchema.safeParse(raw);
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

    const results = await Promise.all(parsed.data.usernames.map(processUsername));
    return Response.json({ success: true, results });
  } catch (error) {
    logger.error({ error }, "profilePost failed");
    return serverErr("Failed to process usernames");
  }
}

export async function profileSyncIds(): Promise<Response> {
  syncMissingIds().catch((e) =>
    logger.error({ error: e }, "profileSyncIds background sync failed"),
  );
  return Response.json(
    { success: true, message: "ID sync started in background" },
    { status: 202 },
  );
}

export async function profilePut(req: Request): Promise<Response> {
  try {
    const id = Number(getParams(req).id);
    if (!id) return err("id is required");
    const raw = await parseBody(req);
    const parsed = profilePutSchema.safeParse(raw);
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");
    await editAccount(id, parsed.data);
    return ok({ updated: true });
  } catch (error) {
    logger.error({ error }, "profilePut failed");
    return serverErr("Failed to update account");
  }
}

export async function profileDelete(req: Request): Promise<Response> {
  try {
    const id = Number(getParams(req).id);
    if (!id) return err("id is required");
    await removeAccount(id);
    return ok({ deleted: true });
  } catch (error) {
    logger.error({ error }, "profileDelete failed");
    return serverErr("Failed to delete account");
  }
}

export async function profileAccountRegions(req: Request): Promise<Response> {
  try {
    const id = Number(getParams(req).id);
    if (!id) return err("id is required");
    const regions = await findRegionAccountsByAccountId(id);
    return okResults(regions);
  } catch (error) {
    logger.error({ error }, "profileAccountRegions failed");
    return serverErr("Failed to fetch account regions");
  }
}

async function processUsername(username: string) {
  try {
    const profile = await resolveInstagramId(username);
    const { id: profileId, followers, following } = profile;

    if (
      instagramConfig.sessionId &&
      instagramConfig.sessionId.length > 0 &&
      profileId &&
      followers === 0
    ) {
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
        // session info fetch failed — fall through to basic save
      }
    }

    await saveOrUpdateAccount({ instagram_id: profileId, username, followers, following });
    return {
      success: true,
      userId: profileId,
      username,
      followers: String(followers),
      following: String(following),
    };
  } catch (error) {
    return {
      success: false,
      username,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
