import { create } from "zustand";

interface UiState {
  isOnline: boolean;
  setOnline: (online: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  setOnline: (online) => set({ isOnline: online }),
}));
