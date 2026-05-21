import { create } from "zustand";
import type { LiveLogEntry, ContentProcessedDetail } from "@/types";

const MAX_LIVE_LOGS = 500;

interface ScrapeState {
  isScraping: boolean;
  isPaused: boolean;
  sessionId: string | null;
  connected: boolean;
  liveLogs: LiveLogEntry[];
}

interface ScrapeActions {
  setScrapeState: (state: Partial<ScrapeState>) => void;
  appendLog: (entry: LiveLogEntry) => void;
  clearLogs: () => void;
  dispatchContentProcessed: (detail: ContentProcessedDetail) => void;
}

export const useScrapeStore = create<ScrapeState & ScrapeActions>((set) => ({
  isScraping: false,
  isPaused: false,
  sessionId: null,
  connected: false,
  liveLogs: [],

  setScrapeState: (partial) => set((s) => ({ ...s, ...partial })),

  appendLog: (entry) =>
    set((s) => ({
      liveLogs: [...s.liveLogs.slice(-MAX_LIVE_LOGS + 1), entry],
    })),

  clearLogs: () => set({ liveLogs: [] }),

  dispatchContentProcessed: (detail) => {
    window.dispatchEvent(
      new CustomEvent<ContentProcessedDetail>("content:processed", { detail }),
    );
  },
}));
