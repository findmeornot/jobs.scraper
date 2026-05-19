import { ok, okResults, err, serverErr } from "@/utils/response";
import {
  findAllRegions,
  findRegionsWithDetails,
  findRegionById,
  createRegion,
  updateRegion,
  deleteRegion,
} from "@/repositories/master-region.repo";
import {
  findRegionAccountsByRegionId,
  addAccountToRegion,
  removeAccountFromRegion,
} from "@/repositories/region-account.repo";

export async function regionGet(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const withDetails = url.searchParams.get("details") === "true";
    const data = withDetails ? await findRegionsWithDetails() : await findAllRegions();
    return okResults(data);
  } catch (error) {
    console.error("regionGet error:", error);
    return serverErr("Failed to fetch regions");
  }
}

export async function regionPost(req: Request): Promise<Response> {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      province_id?: number;
      group_id?: number | null;
      js_loker?: number | null;
    };
    if (!body.name) return err("name is required");
    if (!body.province_id) return err("province_id is required");
    const region = await createRegion(body as { name: string; province_id: number; group_id?: number | null; js_loker?: number | null });
    return ok(region);
  } catch (error) {
    console.error("regionPost error:", error);
    return serverErr("Failed to create region");
  }
}

export async function regionPut(req: Request & { params: { id: string } }): Promise<Response> {
  try {
    const id = Number((req as any).params?.id);
    if (!id) return err("id is required");
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      province_id?: number;
      group_id?: number | null;
      js_loker?: number | null;
    };
    await updateRegion(id, body);
    const updated = await findRegionById(id);
    return ok(updated);
  } catch (error) {
    console.error("regionPut error:", error);
    return serverErr("Failed to update region");
  }
}

export async function regionDelete(req: Request & { params: { id: string } }): Promise<Response> {
  try {
    const id = Number((req as any).params?.id);
    if (!id) return err("id is required");
    await deleteRegion(id);
    return ok({ deleted: true });
  } catch (error) {
    console.error("regionDelete error:", error);
    return serverErr("Failed to delete region");
  }
}

export async function regionAccountsGet(req: Request & { params: { id: string } }): Promise<Response> {
  try {
    const id = Number((req as any).params?.id);
    if (!id) return err("id is required");
    const accounts = await findRegionAccountsByRegionId(id);
    return okResults(accounts);
  } catch (error) {
    console.error("regionAccountsGet error:", error);
    return serverErr("Failed to fetch region accounts");
  }
}

export async function regionAccountAdd(req: Request & { params: { id: string } }): Promise<Response> {
  try {
    const regionId = Number((req as any).params?.id);
    if (!regionId) return err("region id is required");
    const { account_id } = (await req.json().catch(() => ({}))) as { account_id?: number };
    if (!account_id) return err("account_id is required");
    await addAccountToRegion(regionId, account_id);
    return ok({ added: true });
  } catch (error) {
    console.error("regionAccountAdd error:", error);
    return serverErr("Failed to add account to region");
  }
}

export async function regionAccountRemove(
  req: Request & { params: { id: string; account_id: string } },
): Promise<Response> {
  try {
    const regionId = Number((req as any).params?.id);
    const accountId = Number((req as any).params?.account_id);
    if (!regionId || !accountId) return err("region_id and account_id are required");
    await removeAccountFromRegion(regionId, accountId);
    return ok({ removed: true });
  } catch (error) {
    console.error("regionAccountRemove error:", error);
    return serverErr("Failed to remove account from region");
  }
}
