// Persistent game state. This store manages the player's coin balance,
// list of buildings on the map and provides helper functions to add
// buildings, upgrade them and reset the game. The state is saved to
// localStorage so progress persists between sessions.

import { create } from "zustand";
import { axialToPixel } from "../../lib/hex";
import type { Building } from "../../types";

export type GameState = {
  coins: number;
  buildings: Building[];
  // Economy
  addCoins: (v: number) => void;
  canSpend: (v: number) => boolean;
  spend: (v: number) => boolean;
  reset: () => void;
  // Buildings
  addBuilding: (b: Omit<Building, "id">) => void;
  addBuildingAt: (opts: {
    q: number;
    r: number;
    type: Building["type"];
    level?: number;
    incomePerHour?: number;
  }) => void;
  removeBuilding: (id: string) => void;
  upgradeBuilding: (id: string) => void;
};

const STORAGE_KEY = "citygame@state";

export const useGame = create<GameState>((set, get) => ({
  coins: 500,
  buildings: [],
  // ==== economy ====
  addCoins: (v) =>
    set((s) => {
      const coins = s.coins + v;
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ coins, buildings: s.buildings })
        );
      } catch {}
      return { coins };
    }),
  canSpend: (v) => get().coins >= v,
  spend: (v) => {
    if (v <= 0) return true;
    if (get().coins < v) return false;
    set((s) => ({ coins: s.coins - v }));
    try {
      const s = get();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ coins: s.coins, buildings: s.buildings })
      );
    } catch {}
    return true;
  },
  reset: () =>
    set(() => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      return { coins: 500, buildings: [] };
    }),
  // ==== buildings ====
  addBuilding: (b) =>
    set((s) => ({
      buildings: [...s.buildings, { ...b, id: crypto.randomUUID() }],
    })),
  addBuildingAt: ({ q, r, type, level = 1, incomePerHour = 10 }) =>
    set((s) => {
      const { x, y } = axialToPixel({ q, r });
      const nb: Building = {
        id: crypto.randomUUID(),
        type,
        level,
        incomePerHour,
        coord: { q, r },
        position: { x, y },
      };
      return { buildings: [...s.buildings, nb] };
    }),
  removeBuilding: (id) =>
    set((s) => ({
      buildings: s.buildings.filter((b) => b.id !== id),
    })),
  upgradeBuilding: (id) =>
    set((s) => ({
      buildings: s.buildings.map((b) =>
        b.id === id ? { ...b, level: (b.level ?? 1) + 1 } : b
      ),
    })),
}));