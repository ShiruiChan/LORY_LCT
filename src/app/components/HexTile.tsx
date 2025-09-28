import React, { useCallback, useMemo } from "react";
import { hexPolygonPoints } from "../../lib/hex";
import type { Tile } from "../../types";

// Colour palette for each biome. These values are gentle pastels that
// improve visual clarity on the map.
const BIOME_FILL: Record<Tile["biome"], string> = {
  water: "#cfe9ff",
  grass: "#dff7d9",
  forest: "#bfe7c2",
  mountain: "#e6e0d8",
  desert: "#fbe7b2",
};

// Pre‑created style objects to avoid recreating them on every render.
const CURSOR_DEFAULT = { cursor: "default" } as const;
const CURSOR_POINTER = { cursor: "pointer" } as const;

type Props = {
  tile: Tile;
  interactive?: boolean;
  highlighted?: boolean;
  /**
   * Click handler invoked when the user clicks on a tile. If interactive
   * is true and an onClick handler is supplied, the event will be
   * passed through so that consumers can read the pointer coordinates.
   */
  onClick?: (
    tile: Tile,
    event: React.MouseEvent<SVGPolygonElement, MouseEvent>
  ) => void;
};

function HexTileBase({ tile, interactive = false, highlighted = false, onClick }: Props) {
  const { q, r } = tile.coord;
  // Cache the polygon string so the points are only recomputed when q/r change.
  const points = useMemo(() => hexPolygonPoints(q, r), [q, r]);
  // Stable click handler. Note that we forward the React synthetic event
  // so the caller can extract clientX/clientY for positioning menus.
  const handleClick = useCallback(
    (e: React.MouseEvent<SVGPolygonElement, MouseEvent>) => {
      if (interactive && onClick) onClick(tile, e);
    },
    [interactive, onClick, tile]
  );
  return (
    <polygon
      points={points}
      fill={BIOME_FILL[tile.biome]}
      stroke={highlighted ? "#0ea5e9" : "#0f172a22"}
      strokeWidth={highlighted ? 2 : 1}
      style={interactive ? CURSOR_POINTER : CURSOR_DEFAULT}
      onClick={interactive && onClick ? handleClick : undefined}
    />
  );
}

// Memoise the component to avoid re‑rendering unless relevant props change.
export default React.memo(
  HexTileBase,
  (prev, next) =>
    prev.tile === next.tile &&
    prev.interactive === next.interactive &&
    prev.highlighted === next.highlighted &&
    prev.onClick === next.onClick
);