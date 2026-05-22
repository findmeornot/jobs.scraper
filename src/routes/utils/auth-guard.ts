import { validateSession, parseCookieToken } from "@/utils/session";
import { appConfig } from "@/config/app";

type Handler = (req: Request) => Response | Promise<Response>;

function isAuthenticated(req: Request): boolean {
  const token = parseCookieToken(req.headers.get("cookie"));
  if (token && validateSession(token)) return true;

  if (appConfig.apiKey) {
    const auth = req.headers.get("Authorization") ?? "";
    if (auth === `Bearer ${appConfig.apiKey}`) return true;
  }

  return false;
}

export function withAuth(handler: Handler): Handler {
  return (req) => {
    if (!isAuthenticated(req)) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return handler(req);
  };
}
