import { create } from 'zustand';
import { Building } from '../types/domain';

type GameState = {
  buildings: Building[];
  coins: number;
  addBuilding: (b: Building) => void;
  addCoins: (amount: number) => void;
};

export const useGameStore = create<GameState>((set) => ({
  buildings: [],
  coins: 0,
  addBuilding: (b) => set((s) => ({ buildings: [...s.buildings, b] })),
  addCoins: (amount) => set((s) => ({ coins: s.coins + amount })),
}));
