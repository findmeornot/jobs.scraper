import { z } from "zod";
import { ok, okResults, err, serverErr } from "@/utils/response";
import { logger } from "@/utils/logger";
import { getParams, parseBody } from "@/utils/request";
import { findAllGroups, findGroupById, createGroup, updateGroup, deleteGroup } from "@/repositories/master-group.repo";

const groupSchema = z.object({
  name: z.string().min(1, "name is required"),
  is_active: z.number().int().min(0).max(1).optional(),
});

export async function masterGroupGet(req: Request): Promise<Response> {
  try {
    const activeOnly = new URL(req.url).searchParams.get("active_only") === "true";
    const groups = await findAllGroups(activeOnly);
    return okResults(groups);
  } catch (error) {
    logger.error({ error }, "masterGroupGet failed");
    return serverErr("Failed to fetch groups");
  }
}

export async function masterGroupPost(req: Request): Promise<Response> {
  try {
    const raw = await parseBody(req);
    const parsed = groupSchema.pick({ name: true }).safeParse(raw);
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");
    const group = await createGroup(parsed.data.name);
    return ok(group);
  } catch (error) {
    logger.error({ error }, "masterGroupPost failed");
    return serverErr("Failed to create group");
  }
}

export async function masterGroupPut(req: Request): Promise<Response> {
  try {
    const id = Number(getParams(req).id);
    if (!id) return err("id is required");
    const raw = await parseBody(req);
    const parsed = groupSchema.partial().safeParse(raw);
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid input");
    await updateGroup(id, parsed.data);
    const updated = await findGroupById(id);
    return ok(updated);
  } catch (error) {
    logger.error({ error }, "masterGroupPut failed");
    return serverErr("Failed to update group");
  }
}

export async function masterGroupDelete(req: Request): Promise<Response> {
  try {
    const id = Number(getParams(req).id);
    if (!id) return err("id is required");
    await deleteGroup(id);
    return ok({ deleted: true });
  } catch (error) {
    logger.error({ error }, "masterGroupDelete failed");
    return serverErr("Failed to delete group");
  }
}
