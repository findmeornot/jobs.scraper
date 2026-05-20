import { wsManager } from "@/ws/manager";
import {
  createSession,
  finishSession,
  insertLog,
  type ScrapeLogEntry,
  type ScrapeSession,
} from "@/repositories/scrape-log.repo";

let _isScraping = false;
let _currentSessionId: string | null = null;

function broadcastState() {
  wsManager.broadcast({ type: "state", isScraping: _isScraping, sessionId: _currentSessionId });
}

export const scrapeLogService = {
  get isScraping() {
    return _isScraping;
  },
  get currentSessionId() {
    return _currentSessionId;
  },

  currentState() {
    return { isScraping: _isScraping, sessionId: _currentSessionId };
  },

  async startSession(): Promise<string> {
    const id = crypto.randomUUID();
    await createSession(id);
    _isScraping = true;
    _currentSessionId = id;
    broadcastState();
    wsManager.broadcast({ type: "session_start", sessionId: id, startedAt: new Date().toISOString() });
    return id;
  },

  async endSession(
    id: string,
    stats: { totalAccounts: number; successCount: number; errorCount: number; deletedCount: number },
    failed = false,
  ): Promise<void> {
    await finishSession(id, { ...stats, status: failed ? "failed" : "completed" });
    _isScraping = false;
    _currentSessionId = null;
    broadcastState();
    wsManager.broadcast({ type: "session_end", sessionId: id, stats, status: failed ? "failed" : "completed" });
  },

  async log(
    sessionId: string,
    level: ScrapeLogEntry["level"],
    message: string,
    opts?: { username?: string; postsCount?: number },
  ): Promise<void> {
    const entry = await insertLog({
      sessionId,
      level,
      message,
      accountUsername: opts?.username ?? null,
      postsCount: opts?.postsCount ?? null,
    });
    wsManager.broadcast({ type: "log", entry });
  },
};
