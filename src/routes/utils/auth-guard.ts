import { validateSession, parseCookieToken } from "@/utils/session";

type Handler = (req: Request) => Response | Promise<Response>;

/**
 * Wraps a route handler with a session authentication check.
 * Returns 401 JSON if the request does not carry a valid session cookie.
 */
export function withAuth(handler: Handler): Handler {
  return (req) => {
    const token = parseCookieToken(req.headers.get("cookie"));
    if (!token || !validateSession(token)) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return handler(req);
  };
}
