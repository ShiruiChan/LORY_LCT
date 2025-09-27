import { create } from "zustand";

export type Building = {
  id: string;
  x: number;
  y: number;
  size: number;
  level: number;
};

type GameState = {
  coins: number;
  buildings: Building[];
  addCoins: (v: number) => void;
  canSpend: (v: number) => boolean;
  spend: (v: number) => boolean;
  addBuilding: (b: Omit<Building, "id">) => void;
  reset: () => void;
};

type Persist = Pick<GameState, "coins" | "buildings">;

const KEY = "citygame@state";

const load = (): Persist | undefined => {
  try { return JSON.parse(localStorage.getItem(KEY) || "null") || undefined; } catch { return undefined; }
};
const save = (p: Persist) => {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
};

export const useGame = create<GameState>((set, get) => {
  const initial: Persist = load() ?? { coins: 500, buildings: [] as Building[] };

  return {
    coins: initial.coins,
    buildings: initial.buildings,

    addCoins: (v) =>
      set((s) => {
        const coins = s.coins + v;
        save({ coins, buildings: s.buildings });
        return { coins }; // Partial<GameState>
      }),

    canSpend: (v) => get().coins >= v,

    spend: (v) => {
      if (get().coins < v) return false;
      set((s) => {
        const coins = s.coins - v;
        save({ coins, buildings: s.buildings });
        return { coins };
      });
      return true;
    },

    addBuilding: (b) =>
      set((s) => {
        const nb: Building = { ...b, id: crypto.randomUUID() };
        const buildings: Building[] = [...s.buildings, nb];
        save({ coins: s.coins, buildings });
        return { buildings };
      }),

    reset: () =>
      set((s) => {
        const coins = 500;
        const buildings: Building[] = [];
        save({ coins, buildings });
        return { coins, buildings };
      }),
  };
});
