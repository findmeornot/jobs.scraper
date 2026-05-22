import { appConfig } from "@/config/app";

type Handler = (req: Request) => Response | Promise<Response>;

const BASE_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  Vary: "Origin",
};

function resolveOrigin(origin: string | null): string | null {
  if (!origin || !appConfig.allowedOrigins.includes(origin)) return null;
  return origin;
}

export function handlePreflight(req: Request): Response | null {
  const origin = resolveOrigin(req.headers.get("Origin"));
  if (!origin) return null;
  return new Response(null, {
    status: 204,
    headers: { ...BASE_HEADERS, "Access-Control-Allow-Origin": origin },
  });
}

export function withCors(handler: Handler): Handler {
  return async (req) => {
    const allowed = resolveOrigin(req.headers.get("Origin"));

    if (req.method === "OPTIONS") {
      return handlePreflight(req) ?? new Response(null, { status: 204, headers: BASE_HEADERS });
    }

    const res = await handler(req);
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(BASE_HEADERS)) headers.set(k, v);
    if (allowed) headers.set("Access-Control-Allow-Origin", allowed);
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  };
}
