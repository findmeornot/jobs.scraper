import type { ServerWebSocket } from "bun";
import { wsManager } from "@/ws/manager";
import { scrapeLogService } from "@/services/scrape-log.service";
import { getSyncState } from "@/services/instagram-id.service";

export const websocketHandlers = {
  open(ws: ServerWebSocket<unknown>) {
    wsManager.add(ws);
    ws.send(JSON.stringify({ type: "state", ...scrapeLogService.currentState() }));
    ws.send(JSON.stringify({ type: "sync_progress", ...getSyncState() }));
  },
  message() {},
  close(ws: ServerWebSocket<unknown>) {
    wsManager.remove(ws);
  },
};
