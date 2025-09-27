// src/store/game.ts
import { create } from "zustand";
import { axialToPixel } from "../../lib/hex"; // проверь относительный путь
import type { Building } from "../../types";     // проверь путь к типам

type GameState = {
  coins: number;
  buildings: Building[];
  spend: (v: number) => boolean;
	reset: () => void;

  // уже была:
  addBuilding: (b: Omit<Building, "id">) => void;

  // НОВОЕ: строим по гексу
  addBuildingAt: (opts: {
    q: number;
    r: number;
    type: Building["type"];
    level?: number;
    incomePerHour?: number;
  }) => void;
};

export const useGame = create<GameState>((set, get) => ({
  coins: 500,
  buildings: [],

  spend: (v) => {
    if (get().coins < v) return false;
    set((s) => ({ coins: s.coins - v }));
    return true;
  },

  addBuilding: (b) =>
    set((s) => ({ buildings: [...s.buildings, { ...b, id: crypto.randomUUID() }] })),

  // НОВОЕ
  addBuildingAt: ({ q, r, type, level = 1, incomePerHour = 10 }) =>
    set((s) => {
      const { x, y } = axialToPixel({ q, r });
      const nb: Building = {
        id: crypto.randomUUID(),
        type,
        level,
        incomePerHour,
        // если в твоём Building есть coord — оставь строку ниже; если нет — можно удалить
        coord: { q, r },
        position: { x, y },
      };
      return { buildings: [...s.buildings, nb] };
    }),

	reset: () => set(() => {
		try { localStorage.removeItem("citygame@state"); } catch {}
		return { coins: 500, buildings: [] };
	}),
}));
