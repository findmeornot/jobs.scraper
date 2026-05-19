import { withCors } from "@/routes/cors";
import { profileGet, profilePost, profileSyncIds } from "@/routes/instagram/profile";
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
import { appConfig } from "@/config/app";
import { getDashboardStats } from "@/repositories/instagram-content.repo";
import { serverErr } from "@/utils/response";

// @ts-ignore — Bun HTML import
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
      "/api/health": { GET: () => Response.json({ ok: true, ts: Date.now() }) },
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
      "/api/instagram/profile": {
        GET: c(profileGet),
        POST: c(profilePost),
      },
      "/api/instagram/profile/sync-ids": {
        POST: c(profileSyncIds),
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
      "/api/instagram/group/:group_id/content": { GET: c(groupContentGet as any) },
      "/api/instagram/hashtag": { GET: c(hashtagGet) },
      "/api/master/region": {
        GET: c(regionGet),
        POST: c(regionPost),
      },
      "/api/master/region/:id": {
        PUT: c(regionPut as any),
        DELETE: c(regionDelete as any),
      },
      "/api/master/region/:id/accounts": {
        GET: c(regionAccountsGet as any),
        POST: c(regionAccountAdd as any),
      },
      "/api/master/region/:id/accounts/:account_id": {
        DELETE: c(regionAccountRemove as any),
      },
      "/api/master/province": {
        GET: c(provinceGet),
        POST: c(provincePost),
      },
      "/api/master/province/:id": {
        PUT: c(provincePut as any),
        DELETE: c(provinceDelete as any),
      },
      "/api/master/group": {
        GET: c(masterGroupGet),
        POST: c(masterGroupPost),
      },
      "/api/master/group/:id": {
        PUT: c(masterGroupPut as any),
        DELETE: c(masterGroupDelete as any),
      },
    },
    fetch() {
      return forbidden();
    },
  });

  console.log(`✅ Server running on port ${server.port}`);
}
