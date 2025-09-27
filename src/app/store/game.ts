// src/store/game.ts
import { create } from "zustand";
import { axialToPixel } from "../../lib/hex"; // проверь относительный путь
import type { Building } from "../../types";  // проверь путь к типам

export type GameState = {
  coins: number;
  buildings: Building[];

  // === экономика ===
  addCoins: (v: number) => void;
  canSpend: (v: number) => boolean;
  spend: (v: number) => boolean;
  reset: () => void;

  // === здания ===
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

  // === экономика ===
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

  // === здания ===
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
				coord: { q, r },        // <-- добавили обязательное поле
				position: { x, y },     // <-- у тебя уже есть position — оставляем
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
