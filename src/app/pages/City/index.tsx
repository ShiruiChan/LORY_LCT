// src/app/pages/CityPage/index.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchWorld } from "../../services/db";
import HexTile from "../../components/HexTile";
import { axialToPixel, HEX_SIZE } from "../../../lib/hex";
import { useGame } from "../../store/game";

const COST = 100;

type VB = { x: number; y: number; w: number; h: number };

export default function CityPage() {
  // --- hooks: всегда вверху ---
  const [world, setWorld] = useState<any>(null);
  const [vb, setVb] = useState<VB>({ x: 0, y: 0, w: 800, h: 600 }); // фиксированный базовый масштаб
  const svgRef = useRef<SVGSVGElement | null>(null);

  // только для панорамирования
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const lastPanRef = useRef<{ x: number; y: number } | null>(null);

  // store
  const spend = useGame((s) => s.spend);
  const addBuildingAt = useGame((s: any) => s.addBuildingAt); // если есть
  const addBuilding = useGame((s) => s.addBuilding); // fallback
  const buildings = useGame((s) => s.buildings);

  // загрузка мира + центр
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

  // тайлы
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

  // здания
  const buildingsSvg = useMemo(
    () =>
      buildings.map((b: any) => (
        <g key={b.id} transform={`translate(${b.position.x},${b.position.y})`}>
          <rect x={-6} y={-6} width={12} height={12} fill="#0f172a" />
        </g>
      )),
    [buildings]
  );

  // ——— helpers ———
  const MIN_ZOOM = 0.25; // 4x ближе
  const MAX_ZOOM = 4; // 4x дальше
  const BASE_W = 800;

  const clampW = (w: number) =>
    Math.min(Math.max(w, BASE_W * MIN_ZOOM), BASE_W * MAX_ZOOM);

  const clientToView = (clientX: number, clientY: number, v: VB) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const vx = v.x + ((clientX - rect.left) / rect.width) * v.w;
    const vy = v.y + ((clientY - rect.top) / rect.height) * v.h;
    return { vx, vy, rect };
  };

  // ——— только PAN (один указатель). Мульти-тач игнорим (pinch off) ———
  const onPointerDown: React.PointerEventHandler<SVGSVGElement> = (e) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1) {
      lastPanRef.current = { x: e.clientX, y: e.clientY };
    } else {
      // 2+ пальца — ничего не делаем (без pinch)
      lastPanRef.current = null;
    }
  };

  const onPointerMove: React.PointerEventHandler<SVGSVGElement> = (e) => {
    if (!svgRef.current) return;
    if (!pointersRef.current.has(e.pointerId)) return;

    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1 && lastPanRef.current) {
      const cur = [...pointersRef.current.values()][0];
      const rect = svgRef.current.getBoundingClientRect();
      const dxPx = cur.x - lastPanRef.current.x;
      const dyPx = cur.y - lastPanRef.current.y;

      setVb((v) => ({
        ...v,
        x: v.x - dxPx * (v.w / rect.width),
        y: v.y - dyPx * (v.h / rect.height),
      }));

      lastPanRef.current = { ...cur };
    }
  };

  const onPointerUpOrCancel: React.PointerEventHandler<SVGSVGElement> = (e) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size === 1) {
      const only = [...pointersRef.current.values()][0];
      lastPanRef.current = { ...only };
    } else if (pointersRef.current.size === 0) {
      lastPanRef.current = null;
    }
  };

  // ——— ЗУМ КОЛЕСОМ (оставляем). Игнорируем ctrl+wheel (трекпад-pinch в браузере) ———
  const onWheel: React.WheelEventHandler<SVGSVGElement> = (e) => {
    e.preventDefault(); // чтобы страница не скроллилась
    if (!svgRef.current) return;

    // Если это системный pinch через трекпад (часто приходит как ctrlKey=true), проигнорировать:
    if (e.ctrlKey) return;

    const scale = e.deltaY > 0 ? 1.1 : 0.9;

    setVb((cur) => {
      const { vx: mx, vy: my } = clientToView(e.clientX, e.clientY, cur);
      const nextW = clampW(cur.w * scale);
      const nextH = (nextW / cur.w) * cur.h;

      // якорим под курсором
      const nx = mx - ((mx - cur.x) * nextW) / cur.w;
      const ny = my - ((my - cur.y) * nextH) / cur.h;
      return { x: nx, y: ny, w: nextW, h: nextH };
    });
  };

  const loading = !world;

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Город</h1>
        {/* Кнопки +- можно вернуть при желании */}
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
            // touchAction: "none" — отключает браузерные жесты внутри SVG (в т.ч. pinch)
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
