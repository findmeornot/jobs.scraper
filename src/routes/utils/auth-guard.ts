import { validateSession, parseCookieToken } from "@/utils/session";
import { appConfig } from "@/config/app";

type Handler = (req: Request) => Response | Promise<Response>;

function isAuthenticated(req: Request): boolean {
  const origin = req.headers.get("Origin") ?? "";
  if (origin && appConfig.allowedOrigins.includes(origin)) return true;

  const token = parseCookieToken(req.headers.get("cookie"));
  return !!token && validateSession(token);
}

export function withAuth(handler: Handler): Handler {
  return (req) => {
    if (!isAuthenticated(req)) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return handler(req);
  };
}
