import React, { useEffect, useState, useMemo } from "react";
import { fetchWorld } from "../../services/db";
import HexTile from "../../components/HexTile";
import { axialToPixel, HEX_SIZE } from "../../../lib/hex";
import { useGame } from "../../store/game";

const COST = 100;

export default function CityPage() {
  const [world, setWorld] = useState<any>(null);
  const [viewBox, setViewBox] = useState("0 0 800 600");
  const [buildMode, setBuildMode] = useState(false);

  const spend = useGame((s) => s.spend);
  const addBuildingAt = useGame((s) => s.addBuildingAt);
  const buildings = useGame((s) => s.buildings);

  useEffect(() => {
    (async () => {
      const w = await fetchWorld(20);
      setWorld(w);
      const c = axialToPixel({ q: 0, r: 0 });
      setViewBox(`${c.x - 400} ${c.y - 300} 800 600`);
    })();
  }, []);

  const tiles = useMemo(() => {
    if (!world) return null;
    return world.tiles.map((t: any) => (
      <HexTile
        key={t.id}
        tile={t}
        interactive={buildMode}
        onClick={() => {
          if (!buildMode) return;
          if (t.biome === "water") {
            alert("Нельзя строить на воде");
            return;
          }
          if (!spend(COST)) {
            alert(`Недостаточно монет (нужно ${COST})`);
            setBuildMode(false);
            return;
          }
          addBuildingAt({
            q: t.coord.q,
            r: t.coord.r,
            type: "house",
            incomePerHour: 12,
          });
          setBuildMode(false);
        }}
      />
    ));
  }, [world, buildMode, spend, addBuildingAt]);

  if (!world) return <div className="p-4">Загрузка карты…</div>;

  const buildingsSvg = buildings.map((b) => (
    <g key={b.id} transform={`translate(${b.position.x},${b.position.y})`}>
      <rect x={-6} y={-6} width={12} height={12} fill="#0f172a" />
    </g>
  ));

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-lg font-semibold">Город</h1>

      <div className="rounded-2xl overflow-hidden shadow-sm ring-1 ring-slate-200 bg-white">
        <svg viewBox={viewBox} width="100%" height={520}>
          <g transform={`translate(${HEX_SIZE * 3},${HEX_SIZE * 3})`}>
            {tiles}
            {buildingsSvg}
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setBuildMode((v) => !v)}
          className={`rounded-xl py-3 px-4 font-medium active:scale-[.99] ${
            buildMode ? "bg-sky-600 text-white" : "bg-slate-900 text-white"
          }`}
        >
          {buildMode ? "Выбери клетку…" : `Построить дом (${COST})`}
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
