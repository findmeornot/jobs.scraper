import { withCors } from "@/routes/utils/cors";
import { withAuth } from "@/routes/utils/auth-guard";
import { authLogin, authLogout, authMe } from "@/routes/global/auth";
import { dashboardStatsGet } from "@/routes/global/dashboard";
import {
  profileGet,
  profilePost,
  profileImport,
  profileSyncIds,
  profileSyncStop,
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

import frontendIndex from "../../frontend/index.html";

const c = withCors;
const a = withAuth;

export const routes = {
  // SPA shell
  "/": frontendIndex,
  "/login": frontendIndex,
  "/accounts": frontendIndex,
  "/regions": frontendIndex,
  "/logs": frontendIndex,
  "/content": frontendIndex,

  // Health
  "/api/health": { GET: () => Response.json({ ok: true, ts: Date.now() }) },

  // Auth
  "/api/auth/login": { POST: authLogin },
  "/api/auth/logout": { POST: authLogout },
  "/api/auth/me": { GET: authMe },

  // Utilities
  "/api/proxy/image": { GET: a(imageProxy) },
  "/api/dashboard/stats": { GET: c(a(dashboardStatsGet)) },

  // Scrape
  "/api/scrape/status": { GET: c(a(scrapeStatusGet)) },
  "/api/scrape/control": { POST: c(a(scrapeControl)) },
  "/api/scrape/sessions": { GET: c(a(scrapeSessionsGet)) },
  "/api/scrape/sessions/:id/logs": { GET: c(a(scrapeSessionLogsGet)) },

  // Instagram accounts
  "/api/instagram/profile": { GET: c(a(profileGet)), POST: c(a(profilePost)) },
  "/api/instagram/profile/import": { POST: c(a(profileImport)) },
  "/api/instagram/profile/sync-ids": { POST: c(a(profileSyncIds)) },
  "/api/instagram/profile/sync-ids/stop": { POST: c(a(profileSyncStop)) },
  "/api/instagram/profile/:id": { PUT: c(a(profilePut)), DELETE: c(a(profileDelete)) },
  "/api/instagram/profile/:id/regions": { GET: c(a(profileAccountRegions)) },

  // Instagram content
  "/api/instagram/content": { GET: c(a(contentGet)), POST: c(a(contentPost)) },
  "/api/instagram/content/scrape": { POST: c(a(contentScrape)) },
  "/api/instagram/content/submit": { POST: c(a(contentSubmit)) },
  "/api/instagram/content/actions": { POST: c(a(contentActions)) },
  "/api/instagram/content/file/:filename": { GET: a(contentFileGet) },

  // Instagram groups & hashtags
  "/api/instagram/group": { GET: c(a(groupGet)) },
  "/api/instagram/group/missing": { GET: c(a(groupMissingGet)) },
  "/api/instagram/group/:group_id/content": { GET: c(a(groupContentGet)) },
  "/api/instagram/hashtag": { GET: c(a(hashtagGet)) },

  // Master: regions
  "/api/master/region": { GET: c(a(regionGet)), POST: c(a(regionPost)) },
  "/api/master/region/:id": { PUT: c(a(regionPut)), DELETE: c(a(regionDelete)) },
  "/api/master/region/:id/accounts": { GET: c(a(regionAccountsGet)), POST: c(a(regionAccountAdd)) },
  "/api/master/region/:id/accounts/:account_id": { DELETE: c(a(regionAccountRemove)) },

  // Master: provinces
  "/api/master/province": { GET: c(a(provinceGet)), POST: c(a(provincePost)) },
  "/api/master/province/:id": { PUT: c(a(provincePut)), DELETE: c(a(provinceDelete)) },

  // Master: groups
  "/api/master/group": { GET: c(a(masterGroupGet)), POST: c(a(masterGroupPost)) },
  "/api/master/group/:id": { PUT: c(a(masterGroupPut)), DELETE: c(a(masterGroupDelete)) },

};
