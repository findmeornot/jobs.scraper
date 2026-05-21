import { okResults, ok, err, serverErr } from "@/utils/response";
import { logger } from "@/utils/logger";
import { getParams } from "@/utils/request";
import { findRecentSessions, findLogsBySession, findSessionById } from "@/repositories/scrape-log.repo";
import { scrapeLogService } from "@/services/scrape-log.service";

export async function scrapeStatusGet(): Promise<Response> {
  return ok(scrapeLogService.currentState());
}

export async function scrapeSessionsGet(): Promise<Response> {
  try {
    const sessions = await findRecentSessions(100);
    return okResults(sessions);
  } catch (error) {
    logger.error({ error }, "scrapeSessionsGet failed");
    return serverErr("Failed to fetch scrape sessions");
  }
}

export async function scrapeSessionLogsGet(req: Request): Promise<Response> {
  try {
    const id = getParams(req).id;
    if (!id) return err("id is required");
    const [session, logs] = await Promise.all([findSessionById(id), findLogsBySession(id)]);
    if (!session) return err("Session not found", 404);
    return Response.json({ success: true, session, logs });
  } catch (error) {
    logger.error({ error }, "scrapeSessionLogsGet failed");
    return serverErr("Failed to fetch session logs");
  }
}
