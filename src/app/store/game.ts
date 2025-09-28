// Persistent game state. This store manages the player's coin balance,
// list of buildings on the map and provides helper functions to add
// buildings, upgrade them, merge adjacent buildings and collect income.
// The state is saved to localStorage so progress persists between sessions.

import { create } from "zustand";
import { axialToPixel } from "../../lib/hex";
import type { Building } from "../../types";

export type GameState = {
  /** Current amount of coins the player owns. */
  coins: number;
  /** List of all buildings placed on the map. */
  buildings: Building[];
  // ==== economy ====
  /** Add a certain amount of coins. */
  addCoins: (v: number) => void;
  /** Whether the player can spend a given amount of coins. */
  canSpend: (v: number) => boolean;
  /** Spend coins if available and return true if successful. */
  spend: (v: number) => boolean;
  /** Reset the game state, clearing all buildings and restoring the default coin balance. */
  reset: () => void;
  /** Collect income from all buildings. Returns the total income collected. */
  collectIncome: () => number;
  // ==== buildings ====
  /** Add a building with specified properties (id will be generated automatically). */
  addBuilding: (b: Omit<Building, "id">) => void;
  /**
   * Add a building at a given axial coordinate. Optionally specify
   * level and base income per hour. The building will have its
   * lastIncomeAt timestamp set to now.
   */
  addBuildingAt: (opts: {
    q: number;
    r: number;
    type: Building["type"];
    level?: number;
    incomePerHour?: number;
  }) => void;
  /** Remove a building by id. */
  removeBuilding: (id: string) => void;
  /** Upgrade a building to the next level. */
  upgradeBuilding: (id: string) => void;
  /** Attempt to merge a building at the given coordinate with one of its adjacent buildings. */
  mergeBuildingsAt: (q: number, r: number) => boolean;
};

const STORAGE_KEY = "citygame@state";

/** Returns axial neighbours of a given hex. Used to find adjacent buildings for merging. */
const getNeighbours = ({ q, r }: { q: number; r: number }) => [
  { q: q + 1, r },
  { q: q - 1, r },
  { q, r: r + 1 },
  { q, r: r - 1 },
  { q: q + 1, r: r - 1 },
  { q: q - 1, r: r + 1 },
];

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
  /**
   * Iterate over all buildings and collect the income accumulated since
   * their last collection timestamp. Income is calculated as:
   * income = (elapsed time in hours) * incomePerHour * level.
   * The total collected income is added to the player's coins and
   * returned for UI feedback. After collecting, each building's
   * lastIncomeAt timestamp is set to now.
   */
  collectIncome: () => {
    let total = 0;
    const now = Date.now();
    set((s) => {
      const updatedBuildings = s.buildings.map((b) => {
        const elapsedMs = now - (b.lastIncomeAt ?? now);
        const elapsedHours = elapsedMs / (1000 * 60 * 60);
        const income = elapsedHours * b.incomePerHour * b.level;
        total += income;
        return { ...b, lastIncomeAt: now };
      });
      const coins = s.coins + Math.floor(total);
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ coins, buildings: updatedBuildings })
        );
      } catch {}
      return { coins, buildings: updatedBuildings };
    });
    return Math.floor(total);
  },
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
        lastIncomeAt: Date.now(),
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
        b.id === id
          ? { ...b, level: (b.level ?? 1) + 1, lastIncomeAt: Date.now() }
          : b
      ),
    })),
  /**
   * Attempt to merge a building at (q,r) with an adjacent building of the
   * same type and level. If such a neighbour exists, the neighbour is
   * removed and the building at (q,r) is upgraded. Before merging, income
   * from both buildings is collected to avoid losing generated coins.
   * Returns true if a merge occurred, otherwise false.
   */
  mergeBuildingsAt: (q, r) => {
    const { buildings } = get();
    // find target building
    const idx = buildings.findIndex((b) => b.coord.q === q && b.coord.r === r);
    if (idx === -1) return false;
    const target = buildings[idx];
    // find mergeable neighbour
    const neighbours = getNeighbours(target.coord);
    const neighbourIdx = buildings.findIndex((b, i) => {
      if (i === idx) return false;
      if (b.type !== target.type || b.level !== target.level) return false;
      return neighbours.some((n) => n.q === b.coord.q && n.r === b.coord.r);
    });
    if (neighbourIdx === -1) return false;
    // Collect income from both buildings before merging
    get().collectIncome();
    // Remove neighbour and upgrade target
    set((s) => {
      const updated = s.buildings.filter((_, i) => i !== neighbourIdx);
      return {
        buildings: updated.map((b, i) => {
          if (i === idx) {
            return {
              ...b,
              level: b.level + 1,
              lastIncomeAt: Date.now(),
            };
          }
          return b;
        }),
      };
    });
    return true;
  },
}));
