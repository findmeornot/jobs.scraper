import { appConfig } from "@/config/app";

type Handler = (req: Request) => Response | Promise<Response>;

const BASE_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function resolveOrigin(origin: string | null): string | null {
  if (!origin || !appConfig.allowedOrigins.includes(origin)) return null;
  return origin;
}

export function withCors(handler: Handler): Handler {
  return async (req) => {
    const allowed = resolveOrigin(req.headers.get("Origin"));

    if (req.method === "OPTIONS") {
      const headers: Record<string, string> = { ...BASE_HEADERS, Vary: "Origin" };
      if (allowed) headers["Access-Control-Allow-Origin"] = allowed;
      return new Response(null, { status: 204, headers });
    }

    const res = await handler(req);
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(BASE_HEADERS)) headers.set(k, v);
    headers.set("Vary", "Origin");
    if (allowed) headers.set("Access-Control-Allow-Origin", allowed);
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  };
}
