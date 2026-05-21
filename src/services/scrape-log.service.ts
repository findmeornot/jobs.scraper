import { wsManager } from "@/ws/manager";
import {
  createSession,
  finishSession,
  insertLog,
  type ScrapeLogEntry,
} from "@/repositories/scrape-log.repo";

let _isScraping = false;
let _isPaused = false;
let _stopRequested = false;
let _currentSessionId: string | null = null;
let _sessionStartedAt: Date | null = null;

function broadcastState() {
  wsManager.broadcast({
    type: "state",
    isScraping: _isScraping,
    sessionId: _currentSessionId,
    isPaused: _isPaused,
    stopRequested: _stopRequested,
  });
}

export const scrapeLogService = {
  get isScraping() {
    return _isScraping;
  },
  get isPaused() {
    return _isPaused;
  },
  get stopRequested() {
    return _stopRequested;
  },
  get currentSessionId() {
    return _currentSessionId;
  },
  get sessionStartedAt() {
    return _sessionStartedAt;
  },

  currentState() {
    return {
      isScraping: _isScraping,
      sessionId: _currentSessionId,
      isPaused: _isPaused,
      stopRequested: _stopRequested,
    };
  },

  async startSession(): Promise<string> {
    const id = crypto.randomUUID();
    _sessionStartedAt = new Date();
    await createSession(id);
    _isScraping = true;
    _isPaused = false;
    _stopRequested = false;
    _currentSessionId = id;
    broadcastState();
    wsManager.broadcast({
      type: "session_start",
      sessionId: id,
      startedAt: _sessionStartedAt.toISOString(),
    });
    return id;
  },

  async endSession(
    id: string,
    stats: {
      totalAccounts: number;
      successCount: number;
      errorCount: number;
      deletedCount: number;
    },
    status: "completed" | "failed" = "completed",
  ): Promise<void> {
    await finishSession(id, { ...stats, status });
    _isScraping = false;
    _isPaused = false;
    _stopRequested = false;
    _currentSessionId = null;
    _sessionStartedAt = null;
    broadcastState();
    wsManager.broadcast({ type: "session_end", sessionId: id, stats, status });
  },

  pause() {
    if (!_isScraping || _isPaused) return;
    _isPaused = true;
    broadcastState();
  },

  resume() {
    if (!_isPaused) return;
    _isPaused = false;
    broadcastState();
  },

  requestStop() {
    if (!_isScraping) return;
    _stopRequested = true;
    _isPaused = false; // unblock the wait loop
    broadcastState();
  },

  /** Wait until unpaused or stop requested. Call inside the scrape loop. */
  async waitIfPaused(): Promise<void> {
    while (_isPaused && !_stopRequested) {
      await new Promise((r) => setTimeout(r, 300));
    }
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
