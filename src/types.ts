// Shared type definitions for the game. These mirror the upstream
// definitions but extend the set of building types so that additional
// structures (like banks and farms) can be constructed. Keeping these
// types in one place avoids circular imports and simplifies store logic.

export type Quest = {
  id: string;
  title: string;
  description?: string;
  progress: number;
};

export type ShopItem = {
  id: string;
  title: string;
  price: number;
  description?: string;
};

export type Axial = { q: number; r: number };

/** Interface describing a single building on the map.  */
export interface Building {
  id: string;
  /**
   * Allowed building types. In addition to the originals from the
   * upstream repository (house, shop, factory, park), this project
   * extends the set with bank and farm to provide more varied
   * gameplay. Adding new types here allows the build menu to stay
   * type‑safe while still accommodating future expansion.
   */
  type: "house" | "shop" | "factory" | "park" | "bank" | "farm";
  /** Level determines the income multiplier of the building. */
  level: number;
  /**
   * Income per hour for a level‑1 building. Higher levels increase income.
   * Use this in combination with level to compute yield.
   */
  incomePerHour: number;
  /**
   * Timestamp (ms since epoch) when income for this building was last
   * collected. When calculating new income, subtract this value from
   * the current time. After collecting income, update this timestamp
   * to now to avoid counting the same period twice.
   */
  lastIncomeAt: number;
  /** Axial coordinates of the hex the building occupies. */
  coord: Axial;
  /** Pixel position of the building centre on the map. */
  position: { x: number; y: number };
}

export type Tile = {
  id: string;
  coord: Axial;
  biome: "water" | "grass" | "forest" | "mountain" | "desert";
};

export type World = {
  seed: string;
  radius: number;
  tiles: Tile[];
};