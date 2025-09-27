// src/app/pages/CityPage/index.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchWorld } from "../../services/db";
import HexTile from "../../components/HexTile";
import { axialToPixel, HEX_SIZE } from "../../../lib/hex";
import { useGame } from "../../store/game";

const COST = 100;
type VB = { x: number; y: number; w: number; h: number };

export default function CityPage() {
  // --- state / refs ---
  const [world, setWorld] = useState<any>(null);
  const [vb, setVb] = useState<VB>({ x: 0, y: 0, w: 800, h: 600 }); // фиксированный масштаб
  const svgRef = useRef<SVGSVGElement | null>(null);

  // только для pan
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const lastPanRef = useRef<{ x: number; y: number } | null>(null);

  // store
  const spend = useGame((s) => s.spend);
  const addBuildingAt = useGame((s: any) => s.addBuildingAt);
  const addBuilding = useGame((s) => s.addBuilding);
  const buildings = useGame((s) => s.buildings);

  // загрузка мира и центрирование
  useEffect(() => {
    (async () => {
      const w = await fetchWorld(20);
      setWorld(w);
      const c = axialToPixel({ q: 0, r: 0 });
      // зафиксируй стартовый “зум” через w/h; дальше их НЕ меняем
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

  // --- ТОЛЬКО PAN (Pointer Events). Игнорируем multi-touch и колесо ---
  const onPointerDown: React.PointerEventHandler<SVGSVGElement> = (e) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // пан только когда один указатель
    if (pointersRef.current.size === 1) {
      lastPanRef.current = { x: e.clientX, y: e.clientY };
    } else {
      lastPanRef.current = null; // два+ пальца — ничего не делаем (зум выключен)
    }
  };

  const onPointerMove: React.PointerEventHandler<SVGSVGElement> = (e) => {
    if (!svgRef.current) return;
    if (!pointersRef.current.has(e.pointerId)) return;

    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // двигаем только при единственном указателе
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

  // Полностью игнорируем колесо (на всякий случай)
  const onWheel: React.WheelEventHandler<SVGSVGElement> = (e) => {
    e.preventDefault(); // чтобы страница не скроллила, когда курсор над картой
    // ничего не делаем — зум отключён
  };

  const loading = !world;

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Город</h1>
        {/* Кнопки +- зума убраны (фиксированный масштаб) */}
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
            // Важно: блокируем системные жесты (pinch, двойной тап) и даём своё перетаскивание
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
