import { getDashboardStats } from "@/repositories/instagram-content.repo";
import { ok, serverErr } from "@/utils/response";
import { logger } from "@/utils/logger";

export async function dashboardStatsGet(): Promise<Response> {
  try {
    const stats = await getDashboardStats();
    return ok(stats);
  } catch (error) {
    logger.error({ error }, "dashboardStatsGet failed");
    return serverErr("Failed to fetch stats");
  }
}
