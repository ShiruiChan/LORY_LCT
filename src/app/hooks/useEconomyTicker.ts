import { useEffect, useRef, useState } from "react";
import { EconomyTicker } from "../services/economy/ticker";
import type { Building } from "../../types";
import { useGame } from "../store/game";

export function useEconomyTicker(buildings: Building[]) {
  const addCoins = useGame((s: any) => s.addCoins);
  const population = useGame((s: any) => s.population);
  const jobs = useGame((s: any) => s.jobs);
  const clamp = (v: number, a: number, b: number) =>
    Math.max(a, Math.min(b, v));
  const tickerRef = useRef<EconomyTicker | null>(null);
  const [coinsPerSec, setCps] = useState(0);

  // keep a small rolling window of deltas to compute cps
  const windowRef = useRef<Array<{ t: number; d: number }>>([]);

  useEffect(() => {
    if (!tickerRef.current) {
      tickerRef.current = new EconomyTicker();
      tickerRef.current.subscribe((delta) => {
        addCoins(delta);
        const now = performance.now();
        windowRef.current.push({ t: now, d: delta });
        // keep last 5 seconds
        const cutoff = now - 5000;
        while (windowRef.current.length && windowRef.current[0].t < cutoff) {
          windowRef.current.shift();
        }
        const sum = windowRef.current.reduce((a, v) => a + v.d, 0);
        const dt = Math.max(1, (now - (windowRef.current[0]?.t ?? now)) / 1000);
        setCps(sum / dt);
      });
    }
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const emp = clamp(population / Math.max(1, jobs), 0, 1.2);
      tickerRef.current!.tick(buildings, { employmentRatio: emp });
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [buildings, addCoins, population, jobs]);

  return { coinsPerSec };
}
