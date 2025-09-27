import { create } from "zustand";
import { Building } from "../../types";
import { axialToPixel } from "../../lib/hex";

type GameState = {
  coins: number;
  buildings: Building[];
  spend: (v: number) => boolean;

  addBuilding: (b: Omit<Building, 'id'>) => void;

  // NEW:
  addBuildingAt: (opts: {
    q: number;
    r: number;
    type: Building['type'];
    level?: number;
    incomePerHour?: number;
  }) => void;
};

export const useGame = create<GameState>((set, get) => ({
  coins: 500,
  buildings: [],

  spend: (v) => {
    if (get().coins < v) return false;
    set(s => ({ coins: s.coins - v }));
    return true;
  },

  addBuilding: (b) =>
    set(s => ({ buildings: [...s.buildings, { ...b, id: crypto.randomUUID() }] })),

  addBuildingAt: ({ q, r, type, level = 1, incomePerHour = 10 }) =>
    set((s) => {
      const { x, y } = axialToPixel({ q, r });
      const nb: Building = {
        id: crypto.randomUUID(),
        type,
        level,
        incomePerHour,
        position: { x, y },
        // если Building включает coord — не забудь его:
        coord: { q, r },
      };
      return { buildings: [...s.buildings, nb] };
    }),
}));