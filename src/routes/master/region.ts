import { z } from "zod";
import { ok, okResults, err, serverErr } from "@/utils/response";
import { logger } from "@/utils/logger";
import { getParams, parseBody } from "@/utils/request";
import { findAllRegions, findRegionsWithDetails, findRegionById, createRegion, updateRegion, deleteRegion } from "@/repositories/master-region.repo";
import { findRegionAccountsByRegionId, addAccountToRegion, removeAccountFromRegion } from "@/repositories/region-account.repo";

const regionSchema = z.object({
  name: z.string().min(1, "name is required"),
  province_id: z.number().int().positive("province_id is required"),
  group_id: z.number().int().positive().nullable().optional(),
  js_loker: z.number().int().positive().nullable().optional(),
});

const regionAccountAddSchema = z.object({
  account_id: z.number().int().positive("account_id is required"),
});

export async function regionGet(req: Request): Promise<Response> {
  try {
    const withDetails = new URL(req.url).searchParams.get("details") === "true";
    const data = withDetails ? await findRegionsWithDetails() : await findAllRegions();
    return okResults(data);
  } catch (error) {
    logger.error({ error }, "regionGet failed");
    return serverErr("Failed to fetch regions");
  }
}

export async function regionPost(req: Request): Promise<Response> {
  try {
    const raw = await parseBody(req);
    const parsed = regionSchema.safeParse(raw);
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");
    const region = await createRegion(parsed.data);
    return ok(region);
  } catch (error) {
    logger.error({ error }, "regionPost failed");
    return serverErr("Failed to create region");
  }
}

export async function regionPut(req: Request): Promise<Response> {
  try {
    const id = Number(getParams(req).id);
    if (!id) return err("id is required");
    const raw = await parseBody(req);
    const parsed = regionSchema.partial().safeParse(raw);
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");
    await updateRegion(id, parsed.data);
    const updated = await findRegionById(id);
    return ok(updated);
  } catch (error) {
    logger.error({ error }, "regionPut failed");
    return serverErr("Failed to update region");
  }
}

export async function regionDelete(req: Request): Promise<Response> {
  try {
    const id = Number(getParams(req).id);
    if (!id) return err("id is required");
    await deleteRegion(id);
    return ok({ deleted: true });
  } catch (error) {
    logger.error({ error }, "regionDelete failed");
    return serverErr("Failed to delete region");
  }
}

export async function regionAccountsGet(req: Request): Promise<Response> {
  try {
    const id = Number(getParams(req).id);
    if (!id) return err("id is required");
    const accounts = await findRegionAccountsByRegionId(id);
    return okResults(accounts);
  } catch (error) {
    logger.error({ error }, "regionAccountsGet failed");
    return serverErr("Failed to fetch region accounts");
  }
}

export async function regionAccountAdd(req: Request): Promise<Response> {
  try {
    const regionId = Number(getParams(req).id);
    if (!regionId) return err("region id is required");
    const raw = await parseBody(req);
    const parsed = regionAccountAddSchema.safeParse(raw);
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");
    await addAccountToRegion(regionId, parsed.data.account_id);
    return ok({ added: true });
  } catch (error) {
    logger.error({ error }, "regionAccountAdd failed");
    return serverErr("Failed to add account to region");
  }
}

export async function regionAccountRemove(req: Request): Promise<Response> {
  try {
    const params = getParams(req);
    const regionId = Number(params.id);
    const accountId = Number(params.account_id);
    if (!regionId || !accountId) return err("region_id and account_id are required");
    await removeAccountFromRegion(regionId, accountId);
    return ok({ removed: true });
  } catch (error) {
    logger.error({ error }, "regionAccountRemove failed");
    return serverErr("Failed to remove account from region");
  }
}
