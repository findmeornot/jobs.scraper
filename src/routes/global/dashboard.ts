import { getDashboardStats } from "@/repositories/instagram-content.repo";
import { ok, serverErr } from "@/utils/response";
import { logger } from "@/utils/logger";

export async function dashboardStatsGet(req: Request): Promise<Response> {
  try {
    const date = new URL(req.url).searchParams.get("date") ?? undefined;
    const stats = await getDashboardStats(date);
    return ok(stats);
  } catch (error) {
    logger.error({ error }, "dashboardStatsGet failed");
    return serverErr("Failed to fetch stats");
  }
}
