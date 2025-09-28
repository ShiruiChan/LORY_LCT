import React from "react";
import type { Cluster } from "../../services/economy/formulas";
import { axialToPixel } from "../../../lib/hex";

type Props = {
  clusters: Cluster[];
};

export default function ClusterOverlay({ clusters }: Props) {
  return (
    <g className="cluster-overlay">
      {clusters.map((c) => {
        const points = c.tiles
          .map(({ q, r }) => {
            const p = axialToPixel({ q, r });
            return `${p.x},${p.y}`;
          })
          .join(" ");
        const centroid = axialToPixel(c.centroid);
        return (
          <g key={c.id}>
            <polygon
              points={points}
              fill="none"
              stroke="#0ea5e9"
              strokeOpacity={0.6}
              strokeWidth={2}
            />
            <text
              x={centroid.x}
              y={centroid.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              fill="#0ea5e9"
            >
              L{c.level} • {c.tiles.length}
            </text>
          </g>
        );
      })}
    </g>
  );
}
