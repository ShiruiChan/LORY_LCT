import React, { memo, useMemo } from "react";
import { hexPolygonPoints } from "../../lib/hex";
import { Tile } from "../../types";

const BIOME_FILL: Record<Tile["biome"], string> = {
  water: "url(#biome-water)",
  grass: "url(#biome-grass)",
  forest: "url(#biome-forest)",
  mountain: "url(#biome-mountain)",
  desert: "url(#biome-desert)",
};

const STROKE_DEFAULT = "#0f172a33"; // ~20% непрозрачности (чуть плотнее для контраста)
const STROKE_HIGHLIGHT = "#0ea5e9";

const CURSOR_POINTER: React.CSSProperties = { cursor: "pointer" };
const CURSOR_DEFAULT: React.CSSProperties = { cursor: "default" };

type Props = {
  tile: Tile;
  interactive?: boolean;
  highlighted?: boolean;
  onClick?: (t: Tile, e: React.MouseEvent<SVGPolygonElement>) => void;
};

function HexTileBase({
  tile,
  interactive = false,
  highlighted = false,
  onClick,
}: Props) {
  const points = useMemo(
    () => hexPolygonPoints(tile.coord.q, tile.coord.r),
    [tile.coord.q, tile.coord.r]
  );

  const handleClick = (e: React.MouseEvent<SVGPolygonElement>) => {
    if (!onClick) return;
    onClick(tile, e);
  };

  return (
    <polygon
      data-i={interactive ? 1 : undefined}
      points={points}
      fill={BIOME_FILL[tile.biome]}
      stroke={highlighted ? STROKE_HIGHLIGHT : STROKE_DEFAULT}
      strokeWidth={highlighted ? 2 : 1.25}
      filter="url(#hexEdgeShadow)"
      style={interactive ? CURSOR_POINTER : CURSOR_DEFAULT}
      onClick={interactive && onClick ? handleClick : undefined}
    />
  );
}

export default memo(HexTileBase);
