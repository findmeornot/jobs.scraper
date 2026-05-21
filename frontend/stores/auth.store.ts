import { create } from "zustand";

interface AuthState {
  /** null = unknown (not yet checked), false = unauthenticated, true = authenticated */
  authenticated: boolean | null;
  setAuthenticated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  authenticated: null,
  setAuthenticated: (v) => set({ authenticated: v }),
}));
