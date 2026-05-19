import { ok, okResults, err, serverErr } from "@/utils/response";
import {
  findAllGroups,
  findGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
} from "@/repositories/master-group.repo";

export async function masterGroupGet(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const activeOnly = url.searchParams.get("active_only") === "true";
    const groups = await findAllGroups(activeOnly);
    return okResults(groups);
  } catch (error) {
    console.error("masterGroupGet error:", error);
    return serverErr("Failed to fetch groups");
  }
}

export async function masterGroupPost(req: Request): Promise<Response> {
  try {
    const { name } = (await req.json().catch(() => ({}))) as { name?: string };
    if (!name) return err("name is required");
    const group = await createGroup(name);
    return ok(group);
  } catch (error) {
    console.error("masterGroupPost error:", error);
    return serverErr("Failed to create group");
  }
}

export async function masterGroupPut(req: Request & { params: { id: string } }): Promise<Response> {
  try {
    const id = Number((req as any).params?.id);
    if (!id) return err("id is required");
    const body = (await req.json().catch(() => ({}))) as { name?: string; is_active?: boolean };
    await updateGroup(id, body);
    const updated = await findGroupById(id);
    return ok(updated);
  } catch (error) {
    console.error("masterGroupPut error:", error);
    return serverErr("Failed to update group");
  }
}

export async function masterGroupDelete(req: Request & { params: { id: string } }): Promise<Response> {
  try {
    const id = Number((req as any).params?.id);
    if (!id) return err("id is required");
    await deleteGroup(id);
    return ok({ deleted: true });
  } catch (error) {
    console.error("masterGroupDelete error:", error);
    return serverErr("Failed to delete group");
  }
}
