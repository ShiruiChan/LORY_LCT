import type { Tile } from "../../types";
import { axialToPixel } from "../../lib/hex"; // uses your existing util

export type Biome = Tile["biome"]; // reuse your union: "water" | "grass" | "forest" | "mountain" | "desert"

export function genHexagonGrid(radius: number, biome: Biome = "grass"): Tile[] {
  const res: Tile[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      res.push({ id: `${q}:${r}`, coord: { q, r }, biome });
    }
  }
  return res;
}

// fast deterministic PRNG for stable biome patterns
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function assignBiomes(tiles: Tile[], seed = 1337): Tile[] {
  const rnd = mulberry32(seed);
  return tiles.map((t) => {
    const n = rnd();
    const biome: Biome =
      n < 0.12
        ? "water"
        : n < 0.38
        ? "grass"
        : n < 0.62
        ? "forest"
        : n < 0.82
        ? "desert"
        : "mountain";
    return { ...t, biome };
  });
}

export function computeBounds(tiles: Tile[]) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const t of tiles) {
    const { x, y } = axialToPixel(t.coord);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}

// quick visibility test with padding (in screen space)
export function isWithinViewport(
  px: number,
  py: number,
  viewW: number,
  viewH: number,
  padding = 64
) {
  return (
    px >= -padding &&
    px <= viewW + padding &&
    py >= -padding &&
    py <= viewH + padding
  );
}
