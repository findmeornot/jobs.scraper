import type { ServerWebSocket } from "bun";

const clients = new Set<ServerWebSocket<unknown>>();

export const wsManager = {
  add(ws: ServerWebSocket<unknown>) {
    clients.add(ws);
  },
  remove(ws: ServerWebSocket<unknown>) {
    clients.delete(ws);
  },
  broadcast(msg: unknown) {
    const json = JSON.stringify(msg);
    for (const ws of clients) {
      try { ws.send(json); } catch {}
    }
  },
  get size() {
    return clients.size;
  },
};
