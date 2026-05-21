import {
  checkPassword,
  createSession,
  deleteSession,
  validateSession,
  parseCookieToken,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
} from "@/utils/session";

const COOKIE_ATTRS = [`Max-Age=${COOKIE_MAX_AGE}`, "HttpOnly", "SameSite=Strict", "Path=/"].join(
  "; ",
);

const CLEAR_COOKIE = `${COOKIE_NAME}=; Max-Age=0; HttpOnly; SameSite=Strict; Path=/`;

/**
 * POST /api/auth/login
 * Body: { password: string }
 * Sets an HttpOnly session cookie on success.
 */
export async function authLogin(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).password !== "string"
  ) {
    return Response.json({ success: false, message: "Missing password" }, { status: 400 });
  }

  const { password } = body as { password: string };

  if (!checkPassword(password)) {
    // Uniform response time to slow brute-force even further
    await Bun.sleep(300);
    return Response.json({ success: false, message: "Invalid password" }, { status: 401 });
  }

  const token = createSession();

  return Response.json(
    { success: true },
    {
      status: 200,
      headers: { "Set-Cookie": `${COOKIE_NAME}=${token}; ${COOKIE_ATTRS}` },
    },
  );
}

/**
 * POST /api/auth/logout
 * Clears the session cookie and invalidates the server-side session.
 */
export function authLogout(req: Request): Response {
  const token = parseCookieToken(req.headers.get("cookie"));
  if (token) deleteSession(token);

  return Response.json({ success: true }, { headers: { "Set-Cookie": CLEAR_COOKIE } });
}

/**
 * GET /api/auth/me
 * Returns 200 if the session cookie is valid, 401 otherwise.
 */
export function authMe(req: Request): Response {
  const token = parseCookieToken(req.headers.get("cookie"));
  if (!token || !validateSession(token)) {
    return Response.json({ authenticated: false }, { status: 401 });
  }
  return Response.json({ authenticated: true });
}
