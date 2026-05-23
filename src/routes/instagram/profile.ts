import { z } from "zod";
import { ok, okResults, err, serverErr } from "@/utils/response";
import { logger } from "@/utils/logger";
import { getParams, parseBody } from "@/utils/request";
import {
  getAllAccounts,
  saveOrUpdateAccount,
  editAccount,
  removeAccount,
  importAccounts,
} from "@/services/instagram-account.service";
import { resolveInstagramId, syncAccounts, requestSyncStop } from "@/services/instagram-id.service";
import { findRegionAccountsByAccountId } from "@/repositories/region-account.repo";

const profilePostSchema = z.object({
  usernames: z.array(z.string().min(1)).min(1),
});

const profileImportSchema = z.object({
  rows: z
    .array(z.object({ username: z.string(), type: z.enum(["external", "internal"]) }))
    .min(1)
    .max(10_000),
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
    const failed = results.filter((r) => !r.success);

    if (failed.length === results.length) {
      return Response.json({ success: false, results }, { status: 422 });
    }
    if (failed.length > 0) {
      return Response.json({ success: false, results }, { status: 207 });
    }
    return Response.json({ success: true, results });
  } catch (error) {
    logger.error({ error }, "profilePost failed");
    return serverErr("Failed to process usernames");
  }
}

const syncIdsSchema = z.object({
  mode: z.enum(["all", "empty"]).default("all"),
  resume: z.boolean().optional(),
});

export async function profileSyncIds(req: Request): Promise<Response> {
  const raw = await parseBody(req);
  const parsed = syncIdsSchema.safeParse(raw);
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

  syncAccounts(parsed.data).catch((e) =>
    logger.error({ error: e }, "profileSyncIds background sync failed"),
  );
  return Response.json({ success: true, message: "Sync started in background" }, { status: 202 });
}

export async function profileImport(req: Request): Promise<Response> {
  try {
    const raw = await parseBody(req);
    const parsed = profileImportSchema.safeParse(raw);
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");

    const result = await importAccounts(parsed.data.rows);
    return ok(result);
  } catch (error) {
    logger.error({ error }, "profileImport failed");
    return serverErr("Failed to import accounts");
  }
}

export function profileSyncStop(): Response {
  requestSyncStop();
  return Response.json({ success: true, message: "Stop requested" });
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
    const { id, followers, following } = await resolveInstagramId(username);
    await saveOrUpdateAccount({ instagram_id: id, username, followers, following });
    return { success: true, userId: id, username };
  } catch (error) {
    return {
      success: false,
      username,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
