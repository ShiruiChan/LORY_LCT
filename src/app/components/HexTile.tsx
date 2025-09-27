import React from "react";
import { hexPolygonPoints } from "../../lib/hex";
import { Tile } from "../../types";

const BIOME_FILL: Record<Tile["biome"], string> = {
  water: "#cfe9ff",
  grass: "#dff7d9",
  forest: "#bfe7c2",
  mountain: "#e6e0d8",
  desert: "#fbe7b2",
};

export default function HexTile({
  tile,
  interactive = false,
  highlighted = false,
  onClick,
}: {
  tile: Tile;
  interactive?: boolean;
  highlighted?: boolean;
  onClick?: (t: Tile) => void;
}) {
  const { q, r } = tile.coord;
  return (
    <polygon
      points={hexPolygonPoints(q, r)}
      fill={BIOME_FILL[tile.biome]}
      stroke={highlighted ? "#0ea5e9" : "#0f172a22"}
      strokeWidth={highlighted ? 2 : 1}
      style={{ cursor: interactive ? "pointer" : "default" }}
      onClick={interactive && onClick ? () => onClick(tile) : undefined}
    />
  );
}
