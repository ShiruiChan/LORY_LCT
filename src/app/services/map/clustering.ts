// Hex-grid clustering for adjacent buildings of the same type and near-equal level
import type { Building, Cluster } from "../economy/formulas";

const NEIGHBORS: Array<[number, number]> = [
  [+1, 0], [0, +1], [-1, +1],
  [-1, 0], [0, -1], [+1, -1],
];

function key(q: number, r: number) { return `${q}:${r}`; }

export function recomputeClusters(buildings: Building[], maxLevelDelta = 1): {
  clusters: Cluster[];
  byBuildingId: Record<string, string | undefined>;
} {
  const byCoord = new Map<string, Building>();
  buildings.forEach(b => byCoord.set(key(b.coord.q, b.coord.r), b));

  const visited = new Set<string>();
  const clusters: Cluster[] = [];
  const byBuildingId: Record<string, string> = {};

  for (const b of buildings) {
    const startKey = key(b.coord.q, b.coord.r);
    if (visited.has(startKey)) continue;

    const queue = [b];
    const tiles = [];
    let levels: number[] = [];
    let type = b.type;

    const clusterId = `cl_${b.type}_${b.coord.q}_${b.coord.r}_${Math.random().toString(36).slice(2,8)}`;

    while (queue.length) {
      const cur = queue.pop()!;
      const k = key(cur.coord.q, cur.coord.r);
      if (visited.has(k)) continue;
      visited.add(k);

      tiles.push(cur.coord);
      levels.push(cur.level);
      byBuildingId[cur.id] = clusterId;

      for (const [dq, dr] of NEIGHBORS) {
        const nk = key(cur.coord.q + dq, cur.coord.r + dr);
        const nb = byCoord.get(nk);
        if (!nb) continue;
        if (nb.type !== type) continue;
        if (Math.abs(nb.level - cur.level) > maxLevelDelta) continue;
        if (!visited.has(nk)) queue.push(nb);
      }
    }

    const levelAvg = Math.round(levels.reduce((a, v) => a + v, 0) / Math.max(1, levels.length));
    // simple centroid by average axial coords
    const cq = Math.round(tiles.reduce((a, t) => a + t.q, 0) / tiles.length);
    const cr = Math.round(tiles.reduce((a, t) => a + t.r, 0) / tiles.length);

    clusters.push({
      id: clusterId,
      type,
      level: levelAvg,
      tiles,
      centroid: { q: cq, r: cr },
    });
  }

  return { clusters, byBuildingId };
}
