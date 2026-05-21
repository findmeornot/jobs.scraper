import { appConfig } from "@/config/app";
import { routes } from "@/routes/router";
import { websocketHandlers } from "@/ws/handlers";
import { logger } from "@/utils/logger";

function forbidden(): Response {
  return new Response("Forbidden", { status: 403 });
}

export function startServer(): void {
  const server = Bun.serve({
    port: appConfig.port,
    routes,
    websocket: websocketHandlers,
    fetch: () => forbidden(),
  });

  logger.info({ port: server.port }, "Server running");
}
