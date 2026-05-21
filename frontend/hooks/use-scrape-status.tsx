import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { SyncProgress } from "@/types";

export interface LiveLogEntry {
  id: number;
  session_id: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
  account_username: string | null;
  posts_count: number | null;
  created_at: string;
}

export interface ContentProcessedDetail {
  contentId: number;
  remoteUrl: string | null;
  skipReason?: string;
  error?: string;
}

/** Dispatch this to update content cards immediately, bypassing React state. */
export function dispatchContentProcessed(detail: ContentProcessedDetail) {
  window.dispatchEvent(new CustomEvent<ContentProcessedDetail>("content:processed", { detail }));
}

const INITIAL_SYNC_PROGRESS: SyncProgress = {
  running: false,
  total: 0,
  processed: 0,
  failed: 0,
  current: null,
};

interface ScrapeStatusState {
  isScraping: boolean;
  isPaused: boolean;
  sessionId: string | null;
  connected: boolean;
  liveLogs: LiveLogEntry[];
  syncProgress: SyncProgress;
}

interface ScrapeStatusContextValue extends ScrapeStatusState {
  clearLiveLogs: () => void;
}

const ScrapeStatusContext = createContext<ScrapeStatusContextValue>({
  isScraping: false,
  isPaused: false,
  sessionId: null,
  connected: false,
  liveLogs: [],
  syncProgress: INITIAL_SYNC_PROGRESS,
  clearLiveLogs: () => {},
});

const MAX_LIVE_LOGS = 500;

export function ScrapeStatusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ScrapeStatusState>({
    isScraping: false,
    isPaused: false,
    sessionId: null,
    connected: false,
    liveLogs: [],
    syncProgress: INITIAL_SYNC_PROGRESS,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setState((s) => ({ ...s, connected: true }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string);
        if (msg.type === "state") {
          setState((s) => ({
            ...s,
            isScraping: msg.isScraping,
            isPaused: msg.isPaused ?? false,
            sessionId: msg.sessionId,
            liveLogs: msg.isScraping && !s.isScraping ? [] : s.liveLogs,
          }));
        } else if (msg.type === "log") {
          setState((s) => ({
            ...s,
            liveLogs: [...s.liveLogs.slice(-MAX_LIVE_LOGS + 1), msg.entry],
          }));
        } else if (msg.type === "content_processed") {
          dispatchContentProcessed({
            contentId: msg.contentId,
            remoteUrl: msg.remoteUrl ?? null,
            skipReason: msg.skipReason,
            error: msg.error,
          });
        } else if (msg.type === "sync_progress") {
          setState((s) => ({
            ...s,
            syncProgress: {
              running: msg.running,
              total: msg.total,
              processed: msg.processed,
              failed: msg.failed,
              current: msg.current ?? null,
            },
          }));
        }
      } catch {}
    };

    ws.onclose = () => {
      setState((s) => ({ ...s, connected: false }));
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current!);
      wsRef.current?.close();
    };
  }, [connect]);

  const clearLiveLogs = useCallback(() => {
    setState((s) => ({ ...s, liveLogs: [] }));
  }, []);

  return (
    <ScrapeStatusContext.Provider value={{ ...state, clearLiveLogs }}>
      {children}
    </ScrapeStatusContext.Provider>
  );
}

export function useScrapeStatus() {
  return useContext(ScrapeStatusContext);
}
