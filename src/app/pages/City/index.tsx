// src/app/pages/CityPage/index.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchWorld } from "../../services/db";
import HexTile from "../../components/HexTile";
import { axialToPixel, HEX_SIZE } from "../../../lib/hex";
import { useGame } from "../../store/game";

const COST = 100;

type VB = { x: number; y: number; w: number; h: number };

export default function CityPage() {
  // --- state / refs (хуки всегда сверху, без условий) ---
  const [world, setWorld] = useState<any>(null);
  const [vb, setVb] = useState<VB>({ x: 0, y: 0, w: 800, h: 600 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // pointer-state (тач/мышь)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const lastPanRef = useRef<{ x: number; y: number } | null>(null);
  const lastCenterRef = useRef<{ x: number; y: number } | null>(null);
  const lastDistRef = useRef<number | null>(null);

  // game store
  const spend = useGame((s) => s.spend);
  const addBuildingAt = useGame((s: any) => s.addBuildingAt); // если добавлял эту функцию
  const addBuilding = useGame((s) => s.addBuilding); // fallback
  const buildings = useGame((s) => s.buildings);

  // загрузка мира + центровка
  useEffect(() => {
    (async () => {
      const w = await fetchWorld(20);
      setWorld(w);
      const c = axialToPixel({ q: 0, r: 0 });
      setVb({ x: c.x - 400, y: c.y - 300, w: 800, h: 600 });
    })();
  }, []);

  // занято ли (q,r)
  const isOccupied = (q: number, r: number) =>
    buildings?.some((b: any) => b.coord && b.coord.q === q && b.coord.r === r);

  // рендер гексов
  const tiles = useMemo(() => {
    if (!world) return null;
    return world.tiles.map((t: any) => (
      <HexTile
        key={t.id}
        tile={t}
        interactive
        onClick={() => {
          if (t.biome === "water") {
            alert("Нельзя строить на воде");
            return;
          }
          if (isOccupied(t.coord.q, t.coord.r)) {
            alert("Клетка уже занята");
            return;
          }
          if (!spend(COST)) {
            alert(`Недостаточно монет (нужно ${COST})`);
            return;
          }
          if (addBuildingAt) {
            addBuildingAt({
              q: t.coord.q,
              r: t.coord.r,
              type: "house",
              incomePerHour: 12,
            });
          } else {
            // на случай, если addBuildingAt нет в сторе
            const { x, y } = axialToPixel({ q: t.coord.q, r: t.coord.r });
            addBuilding({
              type: "house",
              level: 1,
              incomePerHour: 12,
              coord: { q: t.coord.q, r: t.coord.r },
              position: { x, y },
            });
          }
        }}
      />
    ));
  }, [world, buildings, spend, addBuildingAt, addBuilding]);

  // рендер зданий
  const buildingsSvg = useMemo(
    () =>
      buildings.map((b: any) => (
        <g key={b.id} transform={`translate(${b.position.x},${b.position.y})`}>
          <rect x={-6} y={-6} width={12} height={12} fill="#0f172a" />
        </g>
      )),
    [buildings]
  );

  // --- helpers для тач/мышь зума/пана ---
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 4;

  const clientToView = (clientX: number, clientY: number, vb: VB) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const vx = vb.x + ((clientX - rect.left) / rect.width) * vb.w;
    const vy = vb.y + ((clientY - rect.top) / rect.height) * vb.h;
    return { vx, vy };
  };
  const clampZoom = (w: number, baseW = 800) =>
    Math.min(Math.max(w, baseW * MIN_ZOOM), baseW * MAX_ZOOM);

  // --- Pointer Events: pan / pinch ---
  const onPointerDown: React.PointerEventHandler<SVGSVGElement> = (e) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1) {
      lastPanRef.current = { x: e.clientX, y: e.clientY };
    } else if (pointersRef.current.size === 2) {
      const pts = [...pointersRef.current.values()];
      const cx = (pts[0].x + pts[1].x) / 2;
      const cy = (pts[0].y + pts[1].y) / 2;
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      lastCenterRef.current = { x: cx, y: cy };
      lastDistRef.current = Math.hypot(dx, dy);
    }
  };

  const onPointerMove: React.PointerEventHandler<SVGSVGElement> = (e) => {
    if (!svgRef.current) return;
    if (!pointersRef.current.has(e.pointerId)) return;

    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // pan: 1 указатель
    if (pointersRef.current.size === 1 && lastPanRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const cur = [...pointersRef.current.values()][0];
      const dxPx = cur.x - lastPanRef.current.x;
      const dyPx = cur.y - lastPanRef.current.y;

      setVb((v) => ({
        ...v,
        x: v.x - dxPx * (v.w / rect.width),
        y: v.y - dyPx * (v.h / rect.height),
      }));

      lastPanRef.current = { ...cur };
    }

    // pinch: 2 указателя
    if (
      pointersRef.current.size === 2 &&
      lastCenterRef.current &&
      lastDistRef.current
    ) {
      const pts = [...pointersRef.current.values()];
      const cx = (pts[0].x + pts[1].x) / 2;
      const cy = (pts[0].y + pts[1].y) / 2;
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const dist = Math.hypot(dx, dy);

      setVb((v) => {
        const baseW = 800;
        const scale = lastDistRef.current! / dist; // >1 — приближение
        const nextW = clampZoom(v.w * scale, baseW);
        const nextH = (nextW / v.w) * v.h;

        const { vx: mx, vy: my } = clientToView(cx, cy, v);
        const nx = mx - ((mx - v.x) * nextW) / v.w;
        const ny = my - ((my - v.y) * nextH) / v.h;

        return { x: nx, y: ny, w: nextW, h: nextH };
      });

      lastCenterRef.current = { x: cx, y: cy };
      lastDistRef.current = dist;
    }
  };

  const onPointerUpOrCancel: React.PointerEventHandler<SVGSVGElement> = (e) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size === 1) {
      const only = [...pointersRef.current.values()][0];
      lastPanRef.current = { ...only };
      lastCenterRef.current = null;
      lastDistRef.current = null;
    } else if (pointersRef.current.size === 0) {
      lastPanRef.current = null;
      lastCenterRef.current = null;
      lastDistRef.current = null;
    }
  };

  // колёсико на десктопе
  const onWheel: React.WheelEventHandler<SVGSVGElement> = (e) => {
    e.preventDefault();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = e.deltaY > 0 ? 1.1 : 0.9;

    setVb((cur) => {
      const baseW = 800;
      const nextW = clampZoom(cur.w * scale, baseW);
      const nextH = (nextW / cur.w) * cur.h;
      const mx = cur.x + ((e.clientX - rect.left) / rect.width) * cur.w;
      const my = cur.y + ((e.clientY - rect.top) / rect.height) * cur.h;
      const nx = mx - ((mx - cur.x) * nextW) / cur.w;
      const ny = my - ((my - cur.y) * nextH) / cur.h;
      return { x: nx, y: ny, w: nextW, h: nextH };
    });
  };

  const zoomBy = (factor: number) =>
    setVb((cur) => {
      const baseW = 800;
      const nextW = clampZoom(cur.w * factor, baseW);
      const nextH = (nextW / cur.w) * cur.h;
      const cx = cur.x + cur.w / 2;
      const cy = cur.y + cur.h / 2;
      return { x: cx - nextW / 2, y: cy - nextH / 2, w: nextW, h: nextH };
    });

  const loading = !world;

  // --- единственный return ---
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Город</h1>
        <div className="inline-flex rounded-xl overflow-hidden shadow ring-1 ring-slate-200">
          <button
            className="px-3 py-2 bg-white hover:bg-slate-50"
            onClick={() => zoomBy(1 / 1.2)}
            title="Приблизить"
          >
            +
          </button>
          <button
            className="px-3 py-2 bg-white hover:bg-slate-50 border-l border-slate-200"
            onClick={() => zoomBy(1.2)}
            title="Отдалить"
          >
            −
          </button>
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden shadow-sm ring-1 ring-slate-200 bg-white"
        style={{ height: 520 }}
      >
        {loading ? (
          <div className="h-full grid place-items-center">Загрузка карты…</div>
        ) : (
          <svg
            ref={svgRef}
            viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
            width="100%"
            height="100%"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUpOrCancel}
            onPointerCancel={onPointerUpOrCancel}
            onWheel={onWheel}
            style={{
              touchAction: "none",
              cursor: pointersRef.current.size ? "grabbing" : "grab",
            }}
          >
            <g transform={`translate(${HEX_SIZE * 3},${HEX_SIZE * 3})`}>
              {tiles}
              {buildingsSvg}
            </g>
          </svg>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          className="rounded-xl py-3 px-4 bg-slate-900 text-white font-medium active:scale-[.99]"
          onClick={() =>
            alert("Кликни по клетке, чтобы построить дом (100 монет).")
          }
        >
          Построить дом (100)
        </button>
        <a
          href="/quests"
          className="rounded-xl py-3 px-4 bg-white ring-1 ring-slate-300 text-slate-700 text-center active:scale-[.99]"
        >
          Задания на карте
        </a>
      </div>
    </div>
  );
}
