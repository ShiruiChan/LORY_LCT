import React, { useMemo } from "react";
import type { Cluster } from "../../services/economy/formulas";
import type { Building } from "../../../types";
import { axialToPixel } from "../../../lib/hex";
import { upgradeCost } from "../../services/economy/formulas";

type Props = {
  clusters: Cluster[];
  buildings: Building[];
  onUpgrade?: (tiles: { q: number; r: number }[]) => void;
  threshold?: number;
  coins?: number;
};

export default function ClusterOverlay({
  clusters,
  buildings,
  onUpgrade,
  threshold = 0.8,
  coins,
}: Props) {
  // быстрый индекс по координатам
  const byCoord = useMemo(() => {
    const m = new Map<string, Building>();
    buildings.forEach((b) => m.set(`${b.coord.q}:${b.coord.r}`, b));
    return m;
  }, [buildings]);

  return (
    <g className="cluster-overlay">
      {clusters.map((c) => {
        const points = c.tiles.map(({ q, r }) => {
          const p = axialToPixel({ q, r });
          return `${p.x},${p.y}`;
        });

        // здания кластера
        const list: Building[] = c.tiles
          .map((t) => byCoord.get(`${t.q}:${t.r}`))
          .filter(Boolean) as Building[];

        if (list.length === 0) return null;

        // считаем моду уровня
        const byLevel = new Map<number, number>();
        for (const b of list) {
          byLevel.set(b.level, (byLevel.get(b.level) ?? 0) + 1);
        }
        let modeLevel = list[0].level;
        let best = 0;
        for (const [lvl, cnt] of byLevel) {
          if (cnt > best) {
            best = cnt;
            modeLevel = lvl;
          }
        }
        const ratioSame = best / list.length;

        const totalIncomePerHour = Math.round(
          list.reduce((a, b) => a + (b.incomePerHour ?? 0), 0)
        );

        const centroid = axialToPixel(c.centroid);

        // апгрейд доступен?
        const costTotal = list.reduce(
          (acc, b) => acc + upgradeCost(b.level),
          0
        );
        const canUpgradeByLevel = ratioSame >= threshold;
        const canUpgradeByCoins = coins === undefined || coins >= costTotal;
        const canUpgrade = canUpgradeByLevel && canUpgradeByCoins;

        return (
          <g key={c.id} style={{ pointerEvents: "visiblePainted" }}>
            <polygon
              points={points.join(" ")}
              fill="none"
              stroke="#0ea5e966"
              strokeWidth={1}
            />

            {/* текст-лейбл */}
            <text
              x={centroid.x}
              y={centroid.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              fill={canUpgradeByLevel ? "#0ea5e9" : "#64748b"}
              style={{ userSelect: "none", pointerEvents: "none" }}
            >
              L{modeLevel} • {c.tiles.length} • +{totalIncomePerHour}/h
            </text>

            {/* svg-кнопка */}
            {onUpgrade && (
              <g
                transform={`translate(${centroid.x - 45}, ${centroid.y + 14})`}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!canUpgrade) return;
                  onUpgrade?.(c.tiles);
                }}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && canUpgrade) {
                    e.preventDefault();
                    onUpgrade?.(c.tiles);
                  }
                }}
                style={{ cursor: canUpgrade ? "pointer" : "not-allowed" }}
              >
                <rect
                  x={0}
                  y={0}
                  rx={6}
                  ry={6}
                  width={90}
                  height={24}
                  stroke={canUpgrade ? "#0ea5e9" : "#94a3b8"}
                  fill={canUpgrade ? "#e0f2fe" : "#e2e8f0"}
                />
                <text
                  x={45}
                  y={16}
                  textAnchor="middle"
                  fontSize={11}
                  fill={canUpgrade ? "#0369a1" : "#475569"}
                  style={{ userSelect: "none", pointerEvents: "none" }}
                >
                  Апгрейд {canUpgrade ? `(${costTotal})` : ""}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}
