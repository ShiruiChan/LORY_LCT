import React, { useCallback, useMemo } from "react";
import { hexPolygonPoints } from "../../lib/hex";
import type { Tile } from "../../types";

const BIOME_FILL: Record<Tile["biome"], string> = {
  water: "#cfe9ff",
  grass: "#dff7d9",
  forest: "#bfe7c2",
  mountain: "#e6e0d8",
  desert: "#fbe7b2",
};

// предсозданные style-объекты (не создаются заново)
const CURSOR_DEFAULT = { cursor: "default" } as const;
const CURSOR_POINTER = { cursor: "pointer" } as const;

type Props = {
  tile: Tile;
  interactive?: boolean;
  highlighted?: boolean;
  onClick?: (t: Tile) => void;
};

function HexTileBase({
  tile,
  interactive = false,
  highlighted = false,
  onClick,
}: Props) {
  const { q, r } = tile.coord;

  // кэшируем строку координат шестиугольника
  const points = useMemo(() => hexPolygonPoints(q, r), [q, r]);

  // один стабильный колбэк (пересоздаётся только при смене tile или onClick)
  const handleClick = useCallback(() => {
    if (interactive && onClick) onClick(tile);
  }, [interactive, onClick, tile]);

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

// Мемоизация: пока tile (по ссылке), interactive, highlighted и onClick не меняются — перерендера нет
export default React.memo(
  HexTileBase,
  (prev, next) =>
    prev.tile === next.tile &&
    prev.interactive === next.interactive &&
    prev.highlighted === next.highlighted &&
    prev.onClick === next.onClick
);
