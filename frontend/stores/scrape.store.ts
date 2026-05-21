import { create } from "zustand";
import type { LiveLogEntry, ContentProcessedDetail, SyncProgress } from "@/types";

const MAX_LIVE_LOGS = 500;

const INITIAL_SYNC_PROGRESS: SyncProgress = {
  running: false,
  total: 0,
  processed: 0,
  failed: 0,
  current: null,
};

interface ScrapeState {
  isScraping: boolean;
  isPaused: boolean;
  sessionId: string | null;
  connected: boolean;
  liveLogs: LiveLogEntry[];
  syncProgress: SyncProgress;
}

interface ScrapeActions {
  setScrapeState: (state: Partial<ScrapeState>) => void;
  appendLog: (entry: LiveLogEntry) => void;
  clearLogs: () => void;
  dispatchContentProcessed: (detail: ContentProcessedDetail) => void;
  setSyncProgress: (progress: SyncProgress) => void;
}

export const useScrapeStore = create<ScrapeState & ScrapeActions>((set) => ({
  isScraping: false,
  isPaused: false,
  sessionId: null,
  connected: false,
  liveLogs: [],
  syncProgress: INITIAL_SYNC_PROGRESS,

  setScrapeState: (partial) => set((s) => ({ ...s, ...partial })),

  appendLog: (entry) =>
    set((s) => ({
      liveLogs: [...s.liveLogs.slice(-MAX_LIVE_LOGS + 1), entry],
    })),

  clearLogs: () => set({ liveLogs: [] }),

  dispatchContentProcessed: (detail) => {
    window.dispatchEvent(new CustomEvent<ContentProcessedDetail>("content:processed", { detail }));
  },

  setSyncProgress: (progress) => set({ syncProgress: progress }),
}));
