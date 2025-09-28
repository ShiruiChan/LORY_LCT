import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useGame } from "../../store/game";
import HexTile from "../../components/HexTile";
import BuildMenu, { BuildOption } from "../../components/BuildMenu";
import type { Tile } from "../../../types";
import { axialToPixel } from "../../../lib/hex";
import { genHexagonGrid, assignBiomes } from "../../utils/grid";

// ===== настройки карты =====
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 3.5;
const ZOOM_STEP = 1.2;

type ViewBox = { x: number; y: number; w: number; h: number };

// List of available buildings with their costs. You can extend this list
// to add new building types without changing the core map logic. Costs
// should reflect relative difficulty of construction within the game.
const BUILD_OPTIONS: BuildOption[] = [
  { type: "house", title: "Дом", cost: 100 },
  { type: "farm", title: "Ферма", cost: 150 },
  { type: "shop", title: "Магазин", cost: 200 },
  { type: "factory", title: "Фабрика", cost: 300 },
  { type: "bank", title: "Банк", cost: 500 },
  { type: "park", title: "Парк", cost: 80 },
];

export default function CityPage() {
  const { coins, canSpend, spend, addBuildingAt, buildings } = useGame();

  const svgRef = useRef<SVGSVGElement | null>(null);
  const pointersRef = useRef<Set<number>>(new Set());

  const [vb, setVb] = useState<ViewBox>({ x: 0, y: 0, w: 1000, h: 700 });
  const baseRef = useRef<{ w: number; h: number }>({ w: 1000, h: 700 });

  // мир: шестиугольник радиуса R + биомы
  const tiles: Tile[] = useMemo(() => assignBiomes(genHexagonGrid(10), 42), []);

  // ===== состояние меню строительства =====
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [clickedTile, setClickedTile] = useState<Tile | null>(null);

  // ===== utils =====
  const clampView = useCallback((w: number, h: number) => {
    const wMin = baseRef.current.w / ZOOM_MAX;
    const wMax = baseRef.current.w / ZOOM_MIN;
    const hMin = baseRef.current.h / ZOOM_MAX;
    const hMax = baseRef.current.h / ZOOM_MIN;
    return {
      w: Math.max(wMin, Math.min(wMax, w)),
      h: Math.max(hMin, Math.min(hMax, h)),
    };
  }, []);

  const fitToScreen = useCallback(() => {
    if (!svgRef.current || tiles.length === 0) return;
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const t of tiles) {
      const { x, y } = axialToPixel(t.coord);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const pad = 24;
    const contentW = maxX - minX + pad * 2;
    const contentH = maxY - minY + pad * 2;

    baseRef.current = { w: contentW, h: contentH };
    setVb({ x: minX - pad, y: minY - pad, w: contentW, h: contentH });
  }, [tiles]);

  useEffect(() => {
    fitToScreen();
    const ro = new ResizeObserver(() => fitToScreen());
    if (svgRef.current?.parentElement) ro.observe(svgRef.current.parentElement);
    return () => ro.disconnect();
  }, [fitToScreen]);

  // преобразования координат
  const clientToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current!;
      const rect = svg.getBoundingClientRect();
      const nx = (clientX - rect.left) / rect.width;
      const ny = (clientY - rect.top) / rect.height;
      return { x: vb.x + nx * vb.w, y: vb.y + ny * vb.h };
    },
    [vb]
  );

  const pixelsToWorldDelta = useCallback(
    (dx: number, dy: number) => {
      const svg = svgRef.current!;
      const rect = svg.getBoundingClientRect();
      return { wx: (dx / rect.width) * vb.w, wy: (dy / rect.height) * vb.h };
    },
    [vb]
  );

  // ===== НАТИВНЫЙ wheel с passive:false — окончательно убирает прокрутку страницы =====
  const handleWheelNative = useCallback(
    (e: WheelEvent) => {
      e.preventDefault(); // критично!
      // зум вокруг курсора
      const cursorWorld = clientToWorld(e.clientX, e.clientY);
      const factor = e.deltaY < 0 ? 1 / ZOOM_STEP : ZOOM_STEP;

      const nextW = vb.w * factor;
      const nextH = vb.h * factor;
      const { w, h } = clampView(nextW, nextH);

      const svg = svgRef.current!;
      const rect = svg.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;

      const x = cursorWorld.x - nx * w;
      const y = cursorWorld.y - ny * h;

      setVb({ x, y, w, h });
    },
    [clientToWorld, clampView, vb.w, vb.h]
  );

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", handleWheelNative as any);
  }, [handleWheelNative]);

  // панорамирование Pointer Events
  const dragRef = useRef<{ x: number; y: number; vb: ViewBox } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      svg.setPointerCapture(e.pointerId);
      pointersRef.current.add(e.pointerId);
      dragRef.current = { x: e.clientX, y: e.clientY, vb };
    },
    [vb]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      const { wx, wy } = pixelsToWorldDelta(dx, dy);
      const { vb: start } = dragRef.current;
      setVb({ x: start.x - wx, y: start.y - wy, w: start.w, h: start.h });
    },
    [pixelsToWorldDelta]
  );

  const onPointerUpOrCancel = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      try {
        svgRef.current?.releasePointerCapture(e.pointerId);
      } catch {}
      pointersRef.current.delete(e.pointerId);
      dragRef.current = null;
    },
    []
  );

  // кнопки +/−/Fit
  const zoomBy = useCallback(
    (factor: number) => {
      const cx = vb.x + vb.w / 2;
      const cy = vb.y + vb.h / 2;
      const nextW = vb.w * factor;
      const nextH = vb.h * factor;
      const { w, h } = clampView(nextW, nextH);
      setVb({ x: cx - w / 2, y: cy - h / 2, w, h });
    },
    [vb, clampView]
  );

  // клик по тайлу → открываем меню строительства возле курсора
  const handleTileClick = useCallback(
    (t: Tile, e: React.MouseEvent<SVGPolygonElement, MouseEvent>) => {
      e.stopPropagation();
      // Translate client coordinates to document coordinates for the menu.
      setMenuPos({ x: e.clientX, y: e.clientY });
      setClickedTile(t);
    },
    []
  );

  // обработчик выбора здания в меню
  const handleSelectOption = useCallback(
    (opt: BuildOption) => {
      if (!clickedTile) return;
      if (!canSpend(opt.cost)) {
        alert(`Недостаточно монет (нужно ${opt.cost})`);
        return;
      }
      if (spend(opt.cost)) {
        const { q, r } = clickedTile.coord;
        addBuildingAt({ q, r, type: opt.type as any });
      }
      setMenuPos(null);
      setClickedTile(null);
    },
    [clickedTile, canSpend, spend, addBuildingAt]
  );

  return (
    <div className="p-4 space-y-3 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Город</h1>
        <div className="inline-flex rounded-xl overflow-hidden shadow ring-1 ring-slate-200">
          <button
            className="px-3 py-2 bg-white hover:bg-slate-50"
            onClick={() => zoomBy(1 / ZOOM_STEP)}
            title="Приблизить"
          >
            +
          </button>
          <button
            className="px-3 py-2 bg-white hover:bg-slate-50 border-l border-slate-200"
            onClick={() => zoomBy(ZOOM_STEP)}
            title="Отдалить"
          >
            −
          </button>
          <button
            className="px-3 py-2 bg-white hover:bg-slate-50 border-l border-slate-200"
            onClick={fitToScreen}
            title="Подогнать к экрану"
          >
            Fit
          </button>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-white">
        <div className="h-[70vh] relative">
          <svg
            ref={svgRef}
            viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
            width="100%"
            height="100%"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUpOrCancel}
            onPointerCancel={onPointerUpOrCancel}
            style={{
              touchAction: "none",
              cursor: pointersRef.current.size ? "grabbing" : "grab",
              display: "block",
              overscrollBehavior: "none" as any,
            }}
          >
            <g transform="translate(0,0)">
              {tiles.map((t) => (
                <HexTile
                  key={t.id}
                  tile={t}
                  interactive
                  onClick={handleTileClick}
                />
              ))}

              {buildings.map((b: any) => {
                const { x, y } = axialToPixel(b.coord);
                const size = 12;
                return (
                  <g key={b.id} transform={`translate(${x},${y})`}>
                    <rect
                      x={-size / 2}
                      y={-size / 2}
                      width={size}
                      height={size}
                      fill="#0f172a"
                      pointerEvents="none"
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          <div className="absolute bottom-3 right-3 text-xs text-slate-600 bg-white/80 backdrop-blur rounded-lg px-2 py-1 ring-1 ring-slate-200">
            Пан — потяни / Зум — колесо / Пинч — выключен
          </div>
        </div>
      </div>

      {/* Build menu appears when a tile is clicked */}
      {menuPos && clickedTile && (
        <BuildMenu
          options={BUILD_OPTIONS}
          position={menuPos}
          onSelect={handleSelectOption}
          onClose={() => {
            setMenuPos(null);
            setClickedTile(null);
          }}
        />
      )}
    </div>
  );
}