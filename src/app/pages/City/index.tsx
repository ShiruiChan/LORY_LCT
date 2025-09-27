import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useGame } from "../../store/game";
import HexTile from "../../components/HexTile";
import type { Tile } from "../../../types";
import { axialToPixel } from "../../../lib/hex";
import {
  genHexagonGrid,
  assignBiomes,
  computeBounds,
  isWithinViewport,
} from "../../utils/grid";
const VIEWPORT_W = 1000;
const VIEWPORT_H = 720;
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 3.5;
const ZOOM_STEP = 1.1; // mouse wheel multiplier
const BUILD_COST = 100;

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function CityPage() {
  const { coins, canSpend, spend, addBuildingAt, buildings } = useGame();
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // ====== Viewport transform (pan/zoom) ======
  const [zoom, setZoom] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const startRef = useRef<{
    x: number;
    y: number;
    tx: number;
    ty: number;
  } | null>(null);

  const getLocalPoint = useCallback((clientX: number, clientY: number) => {
    const el = wrapRef.current!;
    const rect = el.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const screenToWorld = useCallback(
    (sx: number, sy: number) => ({ x: (sx - tx) / zoom, y: (sy - ty) / zoom }),
    [tx, ty, zoom]
  );

  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault(); // stop page scroll while interacting with map
      const { x: lx, y: ly } = getLocalPoint(e.clientX, e.clientY);
      const { x: wx, y: wy } = screenToWorld(lx, ly);
      const dir = e.deltaY < 0 ? 1 : -1;
      const nextZoom = clamp(
        zoom * (dir > 0 ? ZOOM_STEP : 1 / ZOOM_STEP),
        ZOOM_MIN,
        ZOOM_MAX
      );
      const nextTx = lx - wx * nextZoom; // keep world point under cursor stable
      const nextTy = ly - wy * nextZoom;
      setZoom(nextZoom);
      setTx(nextTx);
      setTy(nextTy);
    },
    [getLocalPoint, screenToWorld, zoom]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      el.setPointerCapture(e.pointerId);
      const p = getLocalPoint(e.clientX, e.clientY);
      startRef.current = { x: p.x, y: p.y, tx, ty };
    },
    [getLocalPoint, tx, ty]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      const p = getLocalPoint(e.clientX, e.clientY);
      const dx = p.x - startRef.current.x;
      const dy = p.y - startRef.current.y;
      setTx(startRef.current.tx + dx);
      setTy(startRef.current.ty + dy);
    },
    [getLocalPoint]
  );

  const endPan = useCallback((e: React.PointerEvent) => {
    const el = wrapRef.current;
    if (el)
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
    startRef.current = null;
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, [onWheel]);

  // ====== World generation ======
  const world: Tile[] = useMemo(() => assignBiomes(genHexagonGrid(10), 42), []); // R=40 → ~4901 tiles

  // ====== Zoom-to-fit on mount ======
  useEffect(() => {
    if (!world.length) return;
    const { minX, maxX, minY, maxY, width, height } = computeBounds(world);
    const pad = 24;
    const zx = (VIEWPORT_W - pad * 2) / width;
    const zy = (VIEWPORT_H - pad * 2) / height;
    const nextZoom = clamp(Math.min(zx, zy), ZOOM_MIN, ZOOM_MAX);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setZoom(nextZoom);
    setTx(VIEWPORT_W / 2 - cx * nextZoom);
    setTy(VIEWPORT_H / 2 - cy * nextZoom);
  }, [world.length]);

  // ====== Click to build ======
  const handleTileClick = useCallback(
    (t: Tile) => {
      if (!canSpend(BUILD_COST)) {
        alert(`Недостаточно монет (нужно ${BUILD_COST})`);
        return;
      }
      if (spend(BUILD_COST)) {
        const { q, r } = t.coord;
        addBuildingAt({ q, r, type: "house" });
      }
    },
    [addBuildingAt, canSpend, spend]
  );

  const getBPos = (b: any) => (b.position ? b.position : { x: b.x, y: b.y });

  // ====== Project tiles to screen + cull (perf) ======
  const projected = useMemo(() => {
    const arr: Array<{ t: Tile; sx: number; sy: number }> = [];
    for (const t of world) {
      const { x, y } = axialToPixel(t.coord);
      const sx = x * zoom + tx;
      const sy = y * zoom + ty;
      if (isWithinViewport(sx, sy, VIEWPORT_W, VIEWPORT_H, 80)) {
        arr.push({ t, sx, sy });
      }
    }
    return arr;
  }, [world, zoom, tx, ty]);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-baseline gap-3">
        <h1 className="text-lg font-semibold">Город (шестигранная карта)</h1>
        <span className="text-sm text-gray-500">
          Монеты: {Math.floor(coins)}
        </span>
      </div>

      <div
        ref={wrapRef}
        className="map-root"
        style={{
          width: "100%", // <-- вместо фиксированного VIEWPORT_W
          height: "70vh", // или фиксированная высота в % экрана
          maxWidth: VIEWPORT_W, // ограничение сверху, если нужно
          maxHeight: VIEWPORT_H,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          overflow: "hidden",
          touchAction: "none",
          position: "relative",
          background: "linear-gradient(180deg,#f8fafc,#fff)",
        }}
      >
        <svg
          width="100%" // SVG тоже растягивается
          height="100%"
          style={{ display: "block" }}
        >
          <g transform={`translate(${tx},${ty}) scale(${zoom})`}>
            {projected.map(({ t }) => (
              <HexTile
                key={t.id}
                tile={t}
                interactive
                onClick={() => handleTileClick(t)}
              />
            ))}

            {buildings.map((b) => {
              const p = getBPos(b);
              return (
                <g key={b.id} transform={`translate(${p.x},${p.y})`}>
                  <rect x={-6} y={-6} width={12} height={12} fill="#0f172a" />
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="text-xs text-gray-500">
        Пан: зажми мышь/палец и двигай • Зум: колесо мыши • Пинч отключён, чтобы
        не конфликтовать с прокруткой страницы
      </div>
    </div>
  );
}
