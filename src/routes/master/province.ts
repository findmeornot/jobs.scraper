import { ok, okResults, err, serverErr } from "@/utils/response";
import {
  findAllProvinces,
  findProvinceById,
  createProvince,
  updateProvince,
  deleteProvince,
} from "@/repositories/master-province.repo";

export async function provinceGet(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const activeOnly = url.searchParams.get("active_only") === "true";
    const provinces = await findAllProvinces(activeOnly);
    return okResults(provinces);
  } catch (error) {
    console.error("provinceGet error:", error);
    return serverErr("Failed to fetch provinces");
  }
}

export async function provincePost(req: Request): Promise<Response> {
  try {
    const { name } = (await req.json().catch(() => ({}))) as { name?: string };
    if (!name) return err("name is required");
    const province = await createProvince(name);
    return ok(province, {});
  } catch (error) {
    console.error("provincePost error:", error);
    return serverErr("Failed to create province");
  }
}

export async function provincePut(req: Request & { params: { id: string } }): Promise<Response> {
  try {
    const id = Number((req as any).params?.id);
    if (!id) return err("id is required");
    const body = (await req.json().catch(() => ({}))) as { name?: string; is_active?: boolean };
    await updateProvince(id, body);
    const updated = await findProvinceById(id);
    return ok(updated);
  } catch (error) {
    console.error("provincePut error:", error);
    return serverErr("Failed to update province");
  }
}

export async function provinceDelete(req: Request & { params: { id: string } }): Promise<Response> {
  try {
    const id = Number((req as any).params?.id);
    if (!id) return err("id is required");
    await deleteProvince(id);
    return ok({ deleted: true });
  } catch (error) {
    console.error("provinceDelete error:", error);
    return serverErr("Failed to delete province");
  }
}
