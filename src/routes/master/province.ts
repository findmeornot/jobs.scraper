import { z } from "zod";
import { ok, okResults, err, serverErr } from "@/utils/response";
import { logger } from "@/utils/logger";
import { getParams, parseBody } from "@/utils/request";
import { findAllProvinces, findProvinceById, createProvince, updateProvince, deleteProvince } from "@/repositories/master-province.repo";

const provinceSchema = z.object({
  name: z.string().min(1, "name is required"),
  is_active: z.number().int().min(0).max(1).optional(),
});

export async function provinceGet(req: Request): Promise<Response> {
  try {
    const activeOnly = new URL(req.url).searchParams.get("active_only") === "true";
    const provinces = await findAllProvinces(activeOnly);
    return okResults(provinces);
  } catch (error) {
    logger.error({ error }, "provinceGet failed");
    return serverErr("Failed to fetch provinces");
  }
}

export async function provincePost(req: Request): Promise<Response> {
  try {
    const raw = await parseBody(req);
    const parsed = provinceSchema.pick({ name: true }).safeParse(raw);
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");
    const province = await createProvince(parsed.data.name);
    return ok(province);
  } catch (error) {
    logger.error({ error }, "provincePost failed");
    return serverErr("Failed to create province");
  }
}

export async function provincePut(req: Request): Promise<Response> {
  try {
    const id = Number(getParams(req).id);
    if (!id) return err("id is required");
    const raw = await parseBody(req);
    const parsed = provinceSchema.partial().safeParse(raw);
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");
    await updateProvince(id, parsed.data);
    const updated = await findProvinceById(id);
    return ok(updated);
  } catch (error) {
    logger.error({ error }, "provincePut failed");
    return serverErr("Failed to update province");
  }
}

export async function provinceDelete(req: Request): Promise<Response> {
  try {
    const id = Number(getParams(req).id);
    if (!id) return err("id is required");
    await deleteProvince(id);
    return ok({ deleted: true });
  } catch (error) {
    logger.error({ error }, "provinceDelete failed");
    return serverErr("Failed to delete province");
  }
}
