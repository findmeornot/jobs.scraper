import { withCors } from "@/routes/utils/cors";
import { withAuth } from "@/routes/utils/auth-guard";
import { authLogin, authLogout, authMe } from "@/routes/auth";
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
      "/login": frontendIndex,
      "/accounts": frontendIndex,
      "/regions": frontendIndex,
      "/logs": frontendIndex,
      "/content": frontendIndex,
      "/api/health": { GET: () => Response.json({ ok: true, ts: Date.now() }) },
      "/api/auth/login": { POST: authLogin },
      "/api/auth/logout": { POST: authLogout },
      "/api/auth/me": { GET: authMe },
      "/api/proxy/image": { GET: withAuth(imageProxy) },
      "/api/dashboard/stats": {
        GET: c(
          withAuth(async () => {
            try {
              const stats = await getDashboardStats();
              return Response.json({ success: true, data: stats });
            } catch {
              return serverErr("Failed to fetch stats");
            }
          }),
        ),
      },
      "/api/scrape/status": { GET: c(withAuth(scrapeStatusGet)) },
      "/api/scrape/control": { POST: c(withAuth(scrapeControl)) },
      "/api/scrape/sessions": { GET: c(withAuth(scrapeSessionsGet)) },
      "/api/scrape/sessions/:id/logs": { GET: c(withAuth(scrapeSessionLogsGet)) },
      "/api/instagram/profile": {
        GET: c(withAuth(profileGet)),
        POST: c(withAuth(profilePost)),
      },
      "/api/instagram/profile/sync-ids": {
        POST: c(withAuth(profileSyncIds)),
      },
      "/api/instagram/profile/:id": {
        PUT: c(withAuth(profilePut)),
        DELETE: c(withAuth(profileDelete)),
      },
      "/api/instagram/profile/:id/regions": {
        GET: c(withAuth(profileAccountRegions)),
      },
      "/api/instagram/content": {
        GET: c(withAuth(contentGet)),
        POST: c(withAuth(contentPost)),
      },
      "/api/instagram/content/scrape": { POST: c(withAuth(contentScrape)) },
      "/api/instagram/content/submit": { POST: c(withAuth(contentSubmit)) },
      "/api/instagram/content/actions": { POST: c(withAuth(contentActions)) },
      "/api/instagram/content/file/:filename": { GET: withAuth(contentFileGet) },
      "/api/instagram/group": { GET: c(withAuth(groupGet)) },
      "/api/instagram/group/missing": { GET: c(withAuth(groupMissingGet)) },
      "/api/instagram/group/:group_id/content": { GET: c(withAuth(groupContentGet)) },
      "/api/instagram/hashtag": { GET: c(withAuth(hashtagGet)) },
      "/api/master/region": {
        GET: c(withAuth(regionGet)),
        POST: c(withAuth(regionPost)),
      },
      "/api/master/region/:id": {
        PUT: c(withAuth(regionPut)),
        DELETE: c(withAuth(regionDelete)),
      },
      "/api/master/region/:id/accounts": {
        GET: c(withAuth(regionAccountsGet)),
        POST: c(withAuth(regionAccountAdd)),
      },
      "/api/master/region/:id/accounts/:account_id": {
        DELETE: c(withAuth(regionAccountRemove)),
      },
      "/api/master/province": {
        GET: c(withAuth(provinceGet)),
        POST: c(withAuth(provincePost)),
      },
      "/api/master/province/:id": {
        PUT: c(withAuth(provincePut)),
        DELETE: c(withAuth(provinceDelete)),
      },
      "/api/master/group": {
        GET: c(withAuth(masterGroupGet)),
        POST: c(withAuth(masterGroupPost)),
      },
      "/api/master/group/:id": {
        PUT: c(withAuth(masterGroupPut)),
        DELETE: c(withAuth(masterGroupDelete)),
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
