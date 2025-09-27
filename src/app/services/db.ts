import { World, Tile } from "../../types";
const SEED = 'LORY_GLOBAL_WORLD_v1';

function mulberry32(strSeed: string) {
  let h = 1779033703 ^ [...strSeed].reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const t = (h ^= h >>> 16) >>> 0;
    return (t & 0xfffffff) / 0xfffffff;
  };
}

export async function fetchWorld(radius = 12): Promise<World> {
  const rand = mulberry32(SEED);
  const tiles: Tile[] = [];

  const pick = (x: number) =>
    x < 0.08 ? 'water' :
    x < 0.35 ? 'grass' :
    x < 0.55 ? 'forest' :
    x < 0.75 ? 'desert' : 'mountain';

  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      const noise = rand() * 0.6 + 0.4 * Math.cos((q * 13 + r * 7) * 0.3);
      tiles.push({ id: `${q};${r}`, coord: { q, r }, biome: pick((noise + 1) / 2 as number) as any });
    }
  }

  return { seed: SEED, radius, tiles };
}
