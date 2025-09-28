import { create } from "zustand";
import { axialToPixel } from "../../lib/hex";
import type { Building } from "../../types";
import { upgradeCost } from "../services/economy/formulas";
import { recomputeClusters } from "../services/map/clustering";

const POP_BY_TYPE: Partial<Record<Building["type"], number>> = {
  house: 5,
};
const JOBS_BY_TYPE: Partial<Record<Building["type"], number>> = {
  factory: 6,
  shop: 3,
  bank: 4,
};

export type GameState = {
  /** Current amount of coins the player owns. */
  coins: number;
  /** List of all buildings placed on the map. */
  buildings: Building[];
  // === занятость ===
  population: number; // всего населения
  jobs: number; // доступных рабочих мест
  /** Add a certain amount of coins. */
  canSpend: (amount: number) => boolean;
  addCoins: (delta: number) => void;
  /** Spend coins if available and return true if successful. */
  spend: (v: number) => boolean;
  /** Reset the game state, clearing all buildings and restoring the default coin balance. */
  reset: () => void;
  /** Collect income from all buildings. Returns the total income collected. */
  collectIncome: () => number;
  // ==== buildings ====
  /** Add a building with specified properties (id will be generated automatically). */
  addBuilding: (b: Omit<Building, "id">) => void;
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
  upgradeClusterByTiles: (
    tiles: { q: number; r: number }[],
    threshold?: number
  ) => void;
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

function computeEmployment(buildings: Building[]) {
  let population = 0;
  let jobs = 0;
  for (const b of buildings) {
    population += POP_BY_TYPE[b.type] ?? 0;
    jobs += JOBS_BY_TYPE[b.type] ?? 0;
  }
  return { population, jobs };
}

export const useGame = create<GameState>((set, get) => ({
  coins: 500,
  buildings: [],
  population: 0,
  jobs: 0,
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
  addBuildingAt: ({ q, r, type }) => {
    set((s) => {
      const id = crypto.randomUUID();
      const position = axialToPixel({ q, r });
      const b: Building = {
        id,
        type,
        coord: { q, r },
        position,
        level: 1,
        incomePerHour: 0,
        lastIncomeAt: Date.now(),
      };
      const buildings = [...s.buildings, b];
      const { population, jobs } = computeEmployment(buildings);
      return { buildings, population, jobs };
    });
  },
  removeBuilding: (id) =>
    set((s) => {
      const buildings = s.buildings.filter((b) => b.id !== id);
      const { population, jobs } = computeEmployment(buildings);
      return { buildings, population, jobs };
    }),
  upgradeBuilding: (id) =>
    set((s) => {
      const idx = s.buildings.findIndex((b) => b.id === id);
      if (idx === -1) return {};
      const b = s.buildings[idx];
      const cost = upgradeCost(b.level);
      if (!s.canSpend(cost)) return {};
      const buildings = s.buildings.map((x, i) =>
        i === idx ? { ...x, level: x.level + 1, lastIncomeAt: Date.now() } : x
      );
      // списываем монеты
      const coins = s.coins - cost;
      // занятость уровнем не меняем (по ТЗ модель простая)
      return { buildings, coins };
    }),
  upgradeClusterByTiles: (tiles, threshold = 0.8) =>
    set((s) => {
      if (!tiles?.length) return {};

      const tileKeys = new Set(tiles.map((t) => `${t.q}:${t.r}`));
      const inside = s.buildings.filter((b) =>
        tileKeys.has(`${b.coord.q}:${b.coord.r}`)
      );
      if (inside.length === 0) return {};

      // ≥ X% зданий одного уровня?
      const byLevel = new Map<number, number>();
      for (const b of inside)
        byLevel.set(b.level, (byLevel.get(b.level) ?? 0) + 1);
      let best = 0;
      for (const [, cnt] of byLevel) if (cnt > best) best = cnt;
      const ratioSame = best / inside.length;
      if (ratioSame < threshold) return {};

      // деньги
      const costTotal = inside.reduce(
        (acc, b) => acc + upgradeCost(b.level),
        0
      );
      if (!s.canSpend(costTotal)) return {};

      const now = Date.now();
      const toUpgrade = new Set(inside.map((b) => b.id));
      const buildings = s.buildings.map((b) =>
        toUpgrade.has(b.id)
          ? { ...b, level: b.level + 1, lastIncomeAt: now }
          : b
      );
      return { buildings, coins: s.coins - costTotal };
    }),
  mergeBuildingsAt: (q, r) => {
    const { buildings } = get();

    // 1) находим целевое здание
    const idx = buildings.findIndex((b) => b.coord.q === q && b.coord.r === r);
    if (idx === -1) return false;
    const target = buildings[idx];
    const targetId = target.id;

    // 2) ищем соседа подходящего типа и уровня
    const neighbours = getNeighbours(target.coord);
    const neighbour = buildings.find(
      (b, i) =>
        i !== idx &&
        b.type === target.type &&
        b.level === target.level &&
        neighbours.some((n) => n.q === b.coord.q && n.r === b.coord.r)
    );
    if (!neighbour) return false;
    const neighbourId = neighbour.id;

    // 3) собираем начисления до слияния
    get().collectIncome?.();

    // 4) применяем изменения атомарно
    set((s) => {
      const now = Date.now();

      // убрать соседа
      const withoutNeighbour = s.buildings.filter((b) => b.id !== neighbourId);

      // апгрейдить целевое по id (устойчиво к сдвигам индексов)
      const buildingsNext = withoutNeighbour.map((b) =>
        b.id === targetId ? { ...b, level: b.level + 1, lastIncomeAt: now } : b
      );

      // пересчёт занятости
      const { population, jobs } = computeEmployment(buildingsNext);

      return { buildings: buildingsNext, population, jobs };
    });

    return true;
  },
}));
