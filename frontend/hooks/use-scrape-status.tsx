import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";

export interface LiveLogEntry {
  id: number;
  session_id: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
  account_username: string | null;
  posts_count: number | null;
  created_at: string;
}

interface ScrapeStatusState {
  isScraping: boolean;
  sessionId: string | null;
  connected: boolean;
  liveLogs: LiveLogEntry[];
}

interface ScrapeStatusContextValue extends ScrapeStatusState {
  clearLiveLogs: () => void;
}

const ScrapeStatusContext = createContext<ScrapeStatusContextValue>({
  isScraping: false,
  sessionId: null,
  connected: false,
  liveLogs: [],
  clearLiveLogs: () => {},
});

const MAX_LIVE_LOGS = 500;

export function ScrapeStatusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ScrapeStatusState>({
    isScraping: false,
    sessionId: null,
    connected: false,
    liveLogs: [],
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
            sessionId: msg.sessionId,
            // clear live logs when a new session starts
            liveLogs: msg.isScraping && !s.isScraping ? [] : s.liveLogs,
          }));
        } else if (msg.type === "log") {
          setState((s) => ({
            ...s,
            liveLogs: [...s.liveLogs.slice(-MAX_LIVE_LOGS + 1), msg.entry],
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
