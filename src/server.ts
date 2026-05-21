import { withCors } from "@/routes/utils/cors";
import {
  profileGet,
  profilePost,
  profileSyncIds,
  profilePut,
  profileDelete,
  profileAccountRegions,
} from "@/routes/instagram/profile";
import {
  contentGet,
  contentPost,
  contentScrape,
  contentSubmit,
  contentActions,
  contentFileGet,
} from "@/routes/instagram/content";
import { groupGet, groupMissingGet, groupContentGet } from "@/routes/instagram/group";
import { hashtagGet } from "@/routes/instagram/hashtag";
import {
  regionGet,
  regionPost,
  regionPut,
  regionDelete,
  regionAccountsGet,
  regionAccountAdd,
  regionAccountRemove,
} from "@/routes/master/region";
import { provinceGet, provincePost, provincePut, provinceDelete } from "@/routes/master/province";
import {
  masterGroupGet,
  masterGroupPost,
  masterGroupPut,
  masterGroupDelete,
} from "@/routes/master/group";
import {
  scrapeStatusGet,
  scrapeSessionsGet,
  scrapeSessionLogsGet,
} from "@/routes/utils/scrape-logs";
import { scrapeControl } from "@/routes/utils/scrape-control";
import { imageProxy } from "@/routes/utils/image-proxy";
import { appConfig } from "@/config/app";
import { getDashboardStats } from "@/repositories/instagram-content.repo";
import { serverErr } from "@/utils/response";
import { wsManager } from "@/ws/manager";
import { scrapeLogService } from "@/services/scrape-log.service";
import { logger } from "@/utils/logger";

import frontendIndex from "../frontend/index.html";

const c = withCors;

function forbidden(): Response {
  return new Response("Forbidden", { status: 403 });
}

export function startServer(): void {
  const server = Bun.serve({
    port: appConfig.port,
    routes: {
      "/": frontendIndex,
      "/accounts": frontendIndex,
      "/regions": frontendIndex,
      "/logs": frontendIndex,
      "/content": frontendIndex,
      "/api/health": { GET: () => Response.json({ ok: true, ts: Date.now() }) },
      "/api/proxy/image": { GET: imageProxy },
      "/api/dashboard/stats": {
        GET: c(async () => {
          try {
            const stats = await getDashboardStats();
            return Response.json({ success: true, data: stats });
          } catch {
            return serverErr("Failed to fetch stats");
          }
        }),
      },
      "/api/scrape/status": { GET: c(scrapeStatusGet) },
      "/api/scrape/control": { POST: c(scrapeControl) },
      "/api/scrape/sessions": { GET: c(scrapeSessionsGet) },
      "/api/scrape/sessions/:id/logs": { GET: c(scrapeSessionLogsGet) },
      "/api/instagram/profile": {
        GET: c(profileGet),
        POST: c(profilePost),
      },
      "/api/instagram/profile/sync-ids": {
        POST: c(profileSyncIds),
      },
      "/api/instagram/profile/:id": {
        PUT: c(profilePut),
        DELETE: c(profileDelete),
      },
      "/api/instagram/profile/:id/regions": {
        GET: c(profileAccountRegions),
      },
      "/api/instagram/content": {
        GET: c(contentGet),
        POST: c(contentPost),
      },
      "/api/instagram/content/scrape": { POST: c(contentScrape) },
      "/api/instagram/content/submit": { POST: c(contentSubmit) },
      "/api/instagram/content/actions": { POST: c(contentActions) },
      "/api/instagram/content/file/:filename": { GET: c(contentFileGet) },
      "/api/instagram/group": { GET: c(groupGet) },
      "/api/instagram/group/missing": { GET: c(groupMissingGet) },
      "/api/instagram/group/:group_id/content": { GET: c(groupContentGet) },
      "/api/instagram/hashtag": { GET: c(hashtagGet) },
      "/api/master/region": {
        GET: c(regionGet),
        POST: c(regionPost),
      },
      "/api/master/region/:id": {
        PUT: c(regionPut),
        DELETE: c(regionDelete),
      },
      "/api/master/region/:id/accounts": {
        GET: c(regionAccountsGet),
        POST: c(regionAccountAdd),
      },
      "/api/master/region/:id/accounts/:account_id": {
        DELETE: c(regionAccountRemove),
      },
      "/api/master/province": {
        GET: c(provinceGet),
        POST: c(provincePost),
      },
      "/api/master/province/:id": {
        PUT: c(provincePut),
        DELETE: c(provinceDelete),
      },
      "/api/master/group": {
        GET: c(masterGroupGet),
        POST: c(masterGroupPost),
      },
      "/api/master/group/:id": {
        PUT: c(masterGroupPut),
        DELETE: c(masterGroupDelete),
      },
      "/ws": (req, server) => {
        if (server.upgrade(req)) return;
        return new Response("WebSocket upgrade required", { status: 426 });
      },
    },
    websocket: {
      open(ws) {
        wsManager.add(ws);
        ws.send(JSON.stringify({ type: "state", ...scrapeLogService.currentState() }));
      },
      message() {},
      close(ws) {
        wsManager.remove(ws);
      },
    },
    fetch() {
      return forbidden();
    },
  });

  logger.info({ port: server.port }, "Server running");
}
