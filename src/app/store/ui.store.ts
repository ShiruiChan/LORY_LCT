import { create } from 'zustand';

type UIState = {
  safeBottom: number;
  setSafeBottom: (v: number) => void;
  isBottomNavVisible: boolean;
  setBottomNavVisible: (v: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  safeBottom: 0,
  setSafeBottom: (v) => set({ safeBottom: v }),
  isBottomNavVisible: true,
  setBottomNavVisible: (v) => set({ isBottomNavVisible: v }),
}));
