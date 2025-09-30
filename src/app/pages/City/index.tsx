import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useGame } from "../../store/game";
import { useQuests } from "../../store/questStore";
import HexTile from "../../components/HexTile";
import BuildMenu, { BuildOption } from "../../components/BuildMenu";
import type { Tile } from "../../../types";
import { axialToPixel, hexPolygonPoints } from "../../../lib/hex";
import { genHexagonGrid, assignBiomes } from "../../utils/grid";
import { recomputeClusters } from "../../services/map/clustering";
import ClusterOverlay from "../../components/overlays/ClusterOverlay";
import { useEconomyTicker } from "../../hooks/useEconomyTicker";
import { EconomyHUD } from "../../components/HUD/EconomyHUD";

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
  const {
    coins,
    canSpend,
    spend,
    addBuildingAt,
    buildings,
    collectIncome,
    mergeBuildingsAt,
  } = useGame();
  const { coinsPerSec } = useEconomyTicker(buildings);
  const upgradeClusterByTiles = useGame((s) => s.upgradeClusterByTiles);

  // Quest store actions
  const { incrementProgressForTag } = useQuests();

  const svgRef = useRef<SVGSVGElement | null>(null);
  const pointersRef = useRef<Set<number>>(new Set());

  const [vb, setVb] = useState<ViewBox>({ x: 0, y: 0, w: 1000, h: 700 });
  const baseRef = useRef<{ w: number; h: number }>({ w: 1000, h: 700 });

  const hexBBox = useMemo(() => {
    // берём полигон гекса в (q=0,r=0) и вычисляем его bbox
    const pts = hexPolygonPoints(0, 0)
      .split(" ")
      .map((p) => p.split(",").map(Number) as [number, number]);

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    for (const [x, y] of pts) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    return { w: maxX - minX, h: maxY - minY }; // ширина/высота одного гекса в мировых единицах
  }, []);

  // мир: шестиугольник радиуса R + биомы
  const tiles: Tile[] = useMemo(() => assignBiomes(genHexagonGrid(10), 42), []);
  const { clusters } = useMemo(() => recomputeClusters(buildings), [buildings]);

  // ===== состояние меню строительства =====
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [clickedTile, setClickedTile] = useState<Tile | null>(null);

  // ===== utils =====
  const clampView = useCallback(
    (w: number, h: number) => {
      // Минимальные размеры viewBox: чтобы гекс занимал не больше половины экрана
      const wMin = 2 * hexBBox.w;
      const hMin = 2 * hexBBox.h;
      // Максимальные размеры (зум-аут) оставляем как раньше через ZOOM_MIN
      const wMax = baseRef.current.w / ZOOM_MIN;
      const hMax = baseRef.current.h / ZOOM_MIN;
      return {
        w: Math.max(wMin, Math.min(wMax, w)),
        h: Math.max(hMin, Math.min(hMax, h)),
      };
    },
    [hexBBox.w, hexBBox.h]
  );

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

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    try {
      const done = localStorage.getItem("firstBuildOnboardingDone") === "1";
      if (!done) setShowOnboarding(true);
    } catch {
      setShowOnboarding(true);
    }
  }, []);

  function closeOnboarding(markDone = false) {
    if (markDone) {
      try {
        localStorage.setItem("firstBuildOnboardingDone", "1");
      } catch {}
    }
    setShowOnboarding(false);
  }

  const setInitialHalfHexView = useCallback(() => {
    if (!svgRef.current) return;

    // размеры viewBox, при которых один гекс занимает ~половину экрана
    const w = 4 * hexBBox.w;
    const h = 4 * hexBBox.h;

    // выбираем центр: пытаемся найти (0,0); иначе — центр всех тайлов
    const centerTile =
      tiles.find((t) => t.coord.q === 0 && t.coord.r === 0) ?? null;

    let cx: number, cy: number;

    if (centerTile) {
      const p = axialToPixel(centerTile.coord);
      cx = p.x;
      cy = p.y;
    } else {
      // центр по всем тайлам (fallback)
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
      cx = (minX + maxX) / 2;
      cy = (minY + maxY) / 2;
    }

    setVb({ x: cx - w / 2, y: cy - h / 2, w, h });
  }, [tiles, hexBBox.w, hexBBox.h]);

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

  useEffect(() => {
    setInitialHalfHexView();
    const ro = new ResizeObserver(() => setInitialHalfHexView());
    if (svgRef.current?.parentElement) ro.observe(svgRef.current.parentElement);
    return () => ro.disconnect();
  }, [setInitialHalfHexView]);

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
      // Сначала проверяем наличие монет, а доход собираем после строительства.
      if (!canSpend(opt.cost)) {
        alert(`Недостаточно монет (нужно ${opt.cost})`);
        return;
      }
      if (spend(opt.cost)) {
        const { q, r } = clickedTile.coord;
        addBuildingAt({ q, r, type: opt.type as any });
        // Собираем доход после строительства, чтобы начислить накопленный доход
        // и не мешать выбору здания в меню.
        collectIncome();
        // Обновляем прогресс квестов на строительство
        incrementProgressForTag("build", 1);
      }
      setMenuPos(null);
      setClickedTile(null);
    },
    [clickedTile, canSpend, spend, addBuildingAt, collectIncome]
  );

  // обработчик клика по существующему зданию (попытка объединить)
  const handleBuildingClick = useCallback(
    (b: any, e: React.MouseEvent<SVGRectElement, MouseEvent>) => {
      e.stopPropagation();
      // Attempt to merge building with neighbour. If merge occurs, collect income afterwards
      const merged = mergeBuildingsAt(b.coord.q, b.coord.r);
      if (merged) {
        // Show some feedback. You could use a toast/notification instead of alert.
        alert(`Здания объединены! Уровень здания теперь ${b.level + 1}`);
      }
    },
    [mergeBuildingsAt]
  );

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <EconomyHUD coins={coins} coinsPerSec={coinsPerSec} />
        <div className="inline-flex fixed top-5 left-5 z-10 rounded-xl overflow-hidden shadow ring-1 ring-slate-200 ml-auto">
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

      {showOnboarding && (
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 z-40
                  bg-white/90 backdrop-blur ring-1 ring-slate-200
                  px-3 py-2 rounded-xl text-sm shadow"
        >
          Тапните по любой клетке, чтобы построить здание
        </div>
      )}

      {/* Модалка первого запуска */}
      {showOnboarding && (
        <div
          className="absolute inset-0 z-50 flex items-end sm:items-center justify-center
                  bg-black/40 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-xl font-semibold mb-2">
              Постройте своё первое здание
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Нажмите на любую клетку карты &rarr; выберите здание в меню. За
              постройку вы получите монеты и откроете базовые механики.
            </p>
            <div className="flex gap-2">
              <button
                className="flex-1 rounded-xl bg-slate-900 text-white py-2"
                onClick={() => closeOnboarding(true)}
              >
                Понятно
              </button>
              <button
                className="flex-1 rounded-xl bg-white ring-1 ring-slate-200 py-2"
                onClick={() => closeOnboarding()}
              >
                Позже
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden ring-1 ring-slate-200 bg-white">
        <div className="h-[calc(100dvh-var(--bottom-nav-h,96px))] fixed">
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
                      // make buildings clickable to allow merging
                      onClick={(e) => handleBuildingClick(b, e as any)}
                    />
                  </g>
                );
              })}
              <ClusterOverlay
                clusters={clusters}
                buildings={buildings}
                coins={coins}
                threshold={0.8}
                onUpgrade={(tiles) => {
                  console.log("[City] upgrade tiles ->", tiles.length);
                  upgradeClusterByTiles(tiles, 0.8);
                }}
              />
            </g>
          </svg>

          <div className="absolute bottom-3 right-3 text-xs text-slate-600 bg-white/80 backdrop-blur rounded-lg px-2 py-1 ring-1 ring-slate-200">
            Пан — потяни / Зум — колесо / Пинч — выключен (на телефонах)
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
