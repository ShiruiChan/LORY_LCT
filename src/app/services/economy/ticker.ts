// Economy ticker that leverages the existing Web Worker
import WorkerUrl from "../../workers/economy.worker.ts?worker&url";
import { incomePerHour, type BuildingLike } from "./formulas";
import { recomputeClusters } from "../map/clustering";

type Subscriber = (delta: number) => void;

export class EconomyTicker {
  private worker: Worker;
  private lastTs = performance.now();
  private subs: Set<Subscriber> = new Set();

  constructor() {
    this.worker = new Worker(WorkerUrl, { type: "module" });
    this.worker.onmessage = (e: MessageEvent) => {
      const { coinsDelta } = e.data as { coinsDelta: number };
      this.subs.forEach((fn) => fn(coinsDelta));
    };
  }

  subscribe(fn: Subscriber) {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }

  // <<< ВАЖНО: принимаем BuildingLike[], но по сути структурно совместимо с твоим Building[] >>>
  tick(buildings: BuildingLike[], opts?: { employmentRatio?: number }) {
    const now = performance.now();
    const dtMs = now - this.lastTs;
    this.lastTs = now;

    const { clusters, byBuildingId } = recomputeClusters(buildings);

    const enriched = buildings.map((b) => {
      const clId = byBuildingId[b.id];
      const size = clId
        ? clusters.find((c) => c.id === clId)?.tiles.length ?? 1
        : 1;
      const iph = incomePerHour(b, {
        clusterTileCount: size,
        employmentRatio: opts?.employmentRatio ?? 1,
      });
      return { ...b, incomePerHour: iph };
    });

    this.worker.postMessage({ buildings: enriched, investments: [], dtMs });
  }
}
