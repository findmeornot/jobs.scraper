import { appConfig } from "@/config/app";
import { routes } from "@/routes/router";
import { websocketHandlers } from "@/ws/handlers";
import { logger } from "@/utils/logger";


export function startServer(): void {
  const server = Bun.serve<undefined>({
    port: appConfig.port,
    routes: {
      ...routes,
      "/favicon.ico": () => new Response(null, { status: 204 }),
      "/ws": (req: Request, server: Bun.Server<undefined>) => {
        if (server.upgrade(req)) return;
        return new Response("WebSocket upgrade required", { status: 426 });
      },
    },
    websocket: websocketHandlers,
    fetch: () => new Response(Bun.file("frontend/forbidden.html"), { status: 403 }),
  });

  logger.info({ port: server.port }, "Server running");
}
