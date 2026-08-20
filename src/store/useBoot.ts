import { create } from "zustand";

interface BootState {
  ready: boolean;
  revealed: boolean;
  setReady: () => void;
  reveal: () => void;
}

export const useBoot = create<BootState>((set) => ({
  ready: false,
  revealed: false,
  setReady: () => set({ ready: true }),
  reveal: () => set({ revealed: true }),
}));