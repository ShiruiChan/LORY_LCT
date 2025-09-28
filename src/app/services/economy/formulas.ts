// Economy formulas for building income and cluster bonuses

export type BuildingLike = {
  id: string;
  type: string; // house | shop | factory | park | bank | farm | school | ...
  level: number; // 1..N
  health?: number; // 0..100
  coord: { q: number; r: number };
  productivity?: number; // optional per-building multiplier (default 1)
  clusterId?: string;
};

export interface Cluster {
  id: string;
  type: string;
  level: number;
  tiles: { q: number; r: number }[];
  centroid: { q: number; r: number };
}

// sensible defaults; unknown types fallback to 2
const BASE_INCOME: Record<string, number> = {
  house: 2,
  shop: 3,
  factory: 6,
  bank: 8,
  school: 3,
  park: 1,
  farm: 2.5,
};

export function levelMult(level: number): number {
  return 1 + 0.35 * Math.max(0, level - 1);
}

export function healthMult(health = 100): number {
  const m = 0.4 + 0.006 * health;
  return Math.min(1.0, Math.max(0.4, m));
}

export function clusterBonus(tileCount: number): number {
  return 1 + 0.05 * Math.floor(tileCount / 5);
}

export function employmentMult(employmentRatio: number): number {
  // employmentRatio ~ 1 is balanced. clamp to [0.6..1.2]
  const base = 0.6 + 0.6 * employmentRatio;
  return Math.max(0.6, Math.min(1.2, base));
}

/** coins per second */
export function incomePerSecond(
  b: BuildingLike,
  opts: { clusterTileCount?: number; employmentRatio?: number } = {}
): number {
  const base = BASE_INCOME[b.type] ?? 2;
  const lvl = levelMult(b.level);
  const h = healthMult(b.health ?? 100);
  const c = clusterBonus(opts.clusterTileCount ?? 1);
  const e = employmentMult(opts.employmentRatio ?? 1);
  const prod = b.productivity ?? 1;
  return base * lvl * h * c * e * prod;
}

/** coins per hour (для воркера) */
export function incomePerHour(
  b: BuildingLike,
  opts: { clusterTileCount?: number; employmentRatio?: number } = {}
): number {
  return incomePerSecond(b, opts) * 3600;
}
