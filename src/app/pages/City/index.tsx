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
const ZOOM_MIN = 0.4; // максимально далёкий зум
const ZOOM_STEP = 1.2; // шаг колесика/кнопок
const CULLING_PAD_HEXES = 1; // буфер виртуализации вокруг экрана

type ViewBox = { x: number; y: number; w: number; h: number };

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
  const { incrementProgressForTag } = useQuests();

  const svgRef = useRef<SVGSVGElement | null>(null);
  const pointersRef = useRef<Set<number>>(new Set());

  // ===== мир и кластеры =====
  const tiles: Tile[] = useMemo(() => assignBiomes(genHexagonGrid(10), 42), []);
  const { clusters } = useMemo(() => recomputeClusters(buildings), [buildings]);

  // ===== размер одного гекса в мировых координатах =====
  const hexBBox = useMemo(() => {
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
    return {
      w: maxX - minX,
      h: maxY - minY,
      halfW: (maxX - minX) / 2,
      halfH: (maxY - minY) / 2,
    };
  }, []);

  // ===== предвычисляем центры тайлов (для виртуализации и подсветки) =====
  const tileCenters = useMemo(
    () =>
      tiles.map((t) => {
        const { x, y } = axialToPixel(t.coord);
        return { id: t.id, x, y, tile: t };
      }),
    [tiles]
  );

  // Множество занятых клеток (быстрые проверки)
  const occupied = useMemo(() => {
    const s = new Set<string>();
    for (const b of buildings as any[]) {
      s.add(`${b.coord.q},${b.coord.r}`);
    }
    return s;
  }, [buildings]);

  // ===== границы всей карты =====
  const mapBounds = useMemo(() => {
    if (tiles.length === 0) {
      return {
        minX: 0,
        maxX: 1000,
        minY: 0,
        maxY: 700,
        pad: 24,
        w: 1000,
        h: 700,
      };
    }
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
    return {
      minX,
      maxX,
      minY,
      maxY,
      pad,
      w: maxX - minX + pad * 2,
      h: maxY - minY + pad * 2,
    };
  }, [tiles]);

  // ===== viewBox (через rAF) =====
  const [vb, _setVb] = useState<ViewBox>({ x: 0, y: 0, w: 1000, h: 700 });
  const vbRef = useRef(vb);
  useEffect(() => {
    vbRef.current = vb;
  }, [vb]);

  const contentRef = useRef<{
    w: number;
    h: number;
    originX: number;
    originY: number;
  }>({
    w: mapBounds.w,
    h: mapBounds.h,
    originX: mapBounds.minX - mapBounds.pad,
    originY: mapBounds.minY - mapBounds.pad,
  });
  useEffect(() => {
    contentRef.current = {
      w: mapBounds.w,
      h: mapBounds.h,
      originX: mapBounds.minX - mapBounds.pad,
      originY: mapBounds.minY - mapBounds.pad,
    };
  }, [mapBounds]);

  const rafIdRef = useRef<number | null>(null);
  const nextVbRef = useRef<ViewBox | null>(null);
  const setVbRaf = useCallback((next: ViewBox) => {
    nextVbRef.current = next;
    if (rafIdRef.current == null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (nextVbRef.current) _setVb(nextVbRef.current);
      });
    }
  }, []);

  // ===== клампы =====
  const clampZoom = useCallback(
    (w: number, h: number) => {
      const wMin = 2 * hexBBox.w; // гекс ≈ 0.5 экрана
      const hMin = 2 * hexBBox.h;
      const wMax = contentRef.current.w / ZOOM_MIN;
      const hMax = contentRef.current.h / ZOOM_MIN;
      return {
        w: Math.max(wMin, Math.min(wMax, w)),
        h: Math.max(hMin, Math.min(hMax, h)),
      };
    },
    [hexBBox.w, hexBBox.h]
  );

  const clampPan = useCallback((x: number, y: number, w: number, h: number) => {
    const { originX, originY, w: CW, h: CH } = contentRef.current;
    const minX = originX;
    const maxX = originX + CW - w;
    const minY = originY;
    const maxY = originY + CH - h;
    return {
      x: Math.min(maxX, Math.max(minX, x)),
      y: Math.min(maxY, Math.max(minY, y)),
    };
  }, []);

  // ===== стартовый ракурс «пол-гекса» =====
  const setInitialHalfHexView = useCallback(() => {
    const w = 2 * hexBBox.w;
    const h = 2 * hexBBox.h;
    const centerTile =
      tiles.find((t) => t.coord.q === 0 && t.coord.r === 0) ?? null;

    let cx: number, cy: number;
    if (centerTile) {
      const p = axialToPixel(centerTile.coord);
      cx = p.x;
      cy = p.y;
    } else {
      cx = (mapBounds.minX + mapBounds.maxX) / 2;
      cy = (mapBounds.minY + mapBounds.maxY) / 2;
    }

    const { x, y } = clampPan(cx - w / 2, cy - h / 2, w, h);
    _setVb({ x, y, w, h });
  }, [tiles, mapBounds, hexBBox.w, hexBBox.h, clampPan]);

  useEffect(() => {
    setInitialHalfHexView();
    const ro = new ResizeObserver(() => setInitialHalfHexView());
    if (svgRef.current?.parentElement) ro.observe(svgRef.current.parentElement);
    return () => ro.disconnect();
  }, [setInitialHalfHexView]);

  // ===== преобразования координат =====
  const clientToWorld = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    const cur = vbRef.current;
    return { x: cur.x + nx * cur.w, y: cur.y + ny * cur.h };
  }, []);

  const pixelsToWorldDelta = useCallback((dx: number, dy: number) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const cur = vbRef.current;
    return { wx: (dx / rect.width) * cur.w, wy: (dy / rect.height) * cur.h };
  }, []);

  // ===== онбординг =====
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

  // ===== wheel (native, passive:false) — зум вокруг курсора =====
  const handleWheelNative = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const cur = vbRef.current;

      const cursorWorld = clientToWorld(e.clientX, e.clientY);
      const factor = e.deltaY < 0 ? 1 / ZOOM_STEP : ZOOM_STEP;

      const nextW = cur.w * factor;
      const nextH = cur.h * factor;
      const { w, h } = clampZoom(nextW, nextH);

      const svg = svgRef.current!;
      const rect = svg.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;

      const xRaw = cursorWorld.x - nx * w;
      const yRaw = cursorWorld.y - ny * h;
      const { x, y } = clampPan(xRaw, yRaw, w, h);

      setVbRaf({ x, y, w, h });
    },
    [clientToWorld, clampZoom, clampPan, setVbRaf]
  );

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", handleWheelNative as any);
  }, [handleWheelNative]);

  // ===== панорамирование Pointer Events =====
  const dragRef = useRef<{ x: number; y: number; start: ViewBox } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.setPointerCapture(e.pointerId);
    pointersRef.current.add(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, start: vbRef.current };
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;

      const { wx, wy } = pixelsToWorldDelta(dx, dy);
      const s = dragRef.current.start;

      const xRaw = s.x - wx;
      const yRaw = s.y - wy;
      const { x, y } = clampPan(xRaw, yRaw, s.w, s.h);

      setVbRaf({ x, y, w: s.w, h: s.h });
    },
    [pixelsToWorldDelta, clampPan, setVbRaf]
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

  // ===== кнопки +/−/Fit =====
  const zoomBy = useCallback(
    (factor: number) => {
      const cur = vbRef.current;
      const cx = cur.x + cur.w / 2;
      const cy = cur.y + cur.h / 2;
      const nextW = cur.w * factor;
      const nextH = cur.h * factor;

      const { w, h } = clampZoom(nextW, nextH);
      const { x, y } = clampPan(cx - w / 2, cy - h / 2, w, h);

      setVbRaf({ x, y, w, h });
    },
    [clampZoom, clampPan, setVbRaf]
  );

  const fitToScreen = useCallback(() => {
    const w = mapBounds.w;
    const h = mapBounds.h;
    const { x, y } = clampPan(
      mapBounds.minX - mapBounds.pad,
      mapBounds.minY - mapBounds.pad,
      w,
      h
    );
    setVbRaf({ x, y, w, h });
  }, [mapBounds, clampPan, setVbRaf]);

  // ===== меню строительства =====
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [clickedTile, setClickedTile] = useState<Tile | null>(null);

  const isBuildMenuOpen = !!menuPos && !!clickedTile;

  const handleTileClick = useCallback(
    (t: Tile, e: React.MouseEvent<SVGPolygonElement, MouseEvent>) => {
      e.stopPropagation();
      setMenuPos({ x: e.clientX, y: e.clientY });
      setClickedTile(t);
    },
    []
  );

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
        collectIncome();
        incrementProgressForTag("build", 1);

        // Центрируемся на построенный гекс с «пол-гекса» масштабом
        const p = axialToPixel(clickedTile.coord);
        const w = 2 * hexBBox.w;
        const h = 2 * hexBBox.h;
        const { x, y } = clampPan(p.x - w / 2, p.y - h / 2, w, h);
        setVbRaf({ x, y, w, h });

        try {
          (navigator as any).vibrate?.(10);
        } catch {}
      }
      setMenuPos(null);
      setClickedTile(null);
    },
    [
      clickedTile,
      canSpend,
      spend,
      addBuildingAt,
      collectIncome,
      incrementProgressForTag,
      hexBBox.w,
      hexBBox.h,
      clampPan,
      setVbRaf,
    ]
  );

  const handleBuildingClick = useCallback(
    (
      b: any,
      e: React.MouseEvent<SVGRectElement | SVGUseElement, MouseEvent>
    ) => {
      e.stopPropagation();
      const merged = mergeBuildingsAt(b.coord.q, b.coord.r);
      if (merged) {
        alert(`Здания объединены! Уровень здания теперь ${b.level + 1}`);
      }
    },
    [mergeBuildingsAt]
  );

  // ===== виртуализация: видимые гексы =====
  const visibleTiles = useMemo(() => {
    const cur = vbRef.current;
    const padW = hexBBox.w * (0.5 + CULLING_PAD_HEXES);
    const padH = hexBBox.h * (0.5 + CULLING_PAD_HEXES);

    const minX = cur.x - padW;
    const maxX = cur.x + cur.w + padW;
    const minY = cur.y - padH;
    const maxY = cur.y + cur.h + padH;

    return tileCenters
      .filter(({ x, y }) => x >= minX && x <= maxX && y >= minY && y <= maxY)
      .map((t) => t.tile);
  }, [tileCenters, hexBBox.w, hexBBox.h]);

  return (
    <div className="relative">
      {/* HUD + Контролы зума */}
      <div className="pointer-events-none relative z-10 flex items-center justify-between">
        <EconomyHUD coins={coins} coinsPerSec={coinsPerSec} />
        <div className="pointer-events-auto fixed left-5 top-5 z-10 inline-flex overflow-hidden rounded-xl ring-1 ring-slate-200 shadow">
          <button
            className="flex h-12 w-12 items-center justify-center bg-white hover:bg-slate-50"
            onClick={() => zoomBy(1 / ZOOM_STEP)}
            aria-label="Приблизить"
            title="Приблизить"
          >
            +
          </button>
          <button
            className="flex h-12 w-12 items-center justify-center border-l border-slate-200 bg-white hover:bg-slate-50"
            onClick={() => zoomBy(ZOOM_STEP)}
            aria-label="Отдалить"
            title="Отдалить"
          >
            −
          </button>
          <button
            className="flex h-12 w-12 items-center justify-center border-l border-slate-200 bg-white hover:bg-slate-50"
            onClick={fitToScreen}
            aria-label="Подогнать к экрану"
            title="Подогнать к экрану"
          >
            Fit
          </button>
        </div>
      </div>

      {showOnboarding && (
        <div className="absolute left-1/2 top-16 z-40 -translate-x-1/2 rounded-xl bg-white/90 px-3 py-2 text-sm shadow ring-1 ring-slate-200 backdrop-blur">
          Тапните по любой клетке, чтобы построить здание
        </div>
      )}

      {/* Модалка первого запуска */}
      {showOnboarding && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="mb-2 text-xl font-semibold">
              Постройте своё первое здание
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              Нажмите на любую клетку карты → выберите здание в меню. За
              постройку вы получите монеты и откроете базовые механики.
            </p>
            <div className="flex gap-2">
              <button
                className="flex-1 rounded-xl bg-slate-900 py-2 text-white"
                onClick={() => closeOnboarding(true)}
              >
                Понятно
              </button>
              <button
                className="flex-1 rounded-xl bg-white py-2 ring-1 ring-slate-200"
                onClick={() => closeOnboarding()}
              >
                Позже
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Карта */}
      <div className="overflow-hidden ring-1 ring-slate-200 bg-white">
        <div className="fixed h-[calc(100dvh-var(--bottom-nav-h,96px))] w-full max-w-md">
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
            aria-label="Игровая карта"
          >
            {/* ====== Defs: тени/градиенты/иконки зданий ====== */}
            <defs>
              <filter
                id="hexEdgeShadow"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="0.8"
                  floodOpacity="0.25"
                />
              </filter>

              {/* Градиенты биомов */}
              <linearGradient id="biome-grass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#e8fadf" />
                <stop offset="1" stopColor="#cdeec6" />
              </linearGradient>
              <linearGradient id="biome-forest" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#cfeecf" />
                <stop offset="1" stopColor="#a8d9b0" />
              </linearGradient>
              <linearGradient id="biome-water" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#d8f1ff" />
                <stop offset="1" stopColor="#bfe3fb" />
              </linearGradient>
              <linearGradient id="biome-mountain" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#eee8df" />
                <stop offset="1" stopColor="#dfd8cf" />
              </linearGradient>
              <linearGradient id="biome-desert" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fdf0c6" />
                <stop offset="1" stopColor="#f6e0a4" />
              </linearGradient>

              {/* ===== Иконки зданий (монохром, лёгкие пути) ===== */}
              <g id="ico-house" fill="#0f172a">
                <path d="M-6 0 L0 -7 L6 0 V7 H-6 Z" />{" "}
                {/* дом с двускатной крышей */}
              </g>
              <g id="ico-farm" fill="#0f172a">
                <path d="M-7 7 H7 V4 H-7 Z" /> {/* поле */}
                <path d="M-5 4 L0 -6 L5 4 Z" /> {/* амбар */}
              </g>
              <g id="ico-shop" fill="#0f172a">
                <path d="M-6 -2 H6 L5 3 H-5 Z" /> {/* козырёк */}
                <rect x="-5" y="3" width="10" height="4" /> {/* павильон */}
              </g>
              <g id="ico-factory" fill="#0f172a">
                <rect x="-7" y="1" width="14" height="6" />
                <rect x="-5" y="-3" width="3" height="4" />
                <rect x="2" y="-2" width="3" height="3" />
              </g>
              <g id="ico-bank" fill="#0f172a">
                <path d="M-7 1 H7 V7 H-7 Z" />
                <path d="M-7 1 L0 -6 L7 1 Z" />
              </g>
              <g id="ico-park" fill="#0f172a">
                <circle cx="0" cy="-2" r="4" />
                <rect x="-1" y="1" width="2" height="6" />
              </g>
            </defs>

            {/* ====== Слои ====== */}
            <g id="tiles">
              {visibleTiles.map((t) => {
                const isFree = !occupied.has(`${t.coord.q},${t.coord.r}`);
                const highlighted = isBuildMenuOpen ? isFree : false;
                return (
                  <HexTile
                    key={t.id}
                    tile={t}
                    interactive
                    onClick={handleTileClick}
                    highlighted={highlighted}
                  />
                );
              })}
            </g>

            <g id="buildings">
              {(buildings as any[]).map((b) => {
                const { x, y } = axialToPixel(b.coord);
                const iconId =
                  b.type === "house"
                    ? "#ico-house"
                    : b.type === "farm"
                    ? "#ico-farm"
                    : b.type === "shop"
                    ? "#ico-shop"
                    : b.type === "factory"
                    ? "#ico-factory"
                    : b.type === "bank"
                    ? "#ico-bank"
                    : b.type === "park"
                    ? "#ico-park"
                    : null;

                const size = 14; // общая «высота» иконки (примерно)
                const scale = size / 14; // нормируем от базовой сетки 14

                return (
                  <g key={b.id} transform={`translate(${x},${y})`}>
                    {iconId ? (
                      <use
                        href={iconId}
                        transform={`scale(${scale})`}
                        onClick={(e) => handleBuildingClick(b, e as any)}
                        aria-label={`Здание: ${b.type}`}
                      />
                    ) : (
                      <rect
                        x={-6}
                        y={-6}
                        width={12}
                        height={12}
                        fill="#0f172a"
                        onClick={(e) => handleBuildingClick(b, e as any)}
                        aria-label="Здание"
                      />
                    )}
                  </g>
                );
              })}
            </g>

            <g id="overlays" pointerEvents="none">
              <ClusterOverlay
                clusters={clusters}
                buildings={buildings}
                coins={coins}
                threshold={0.8}
                onUpgrade={(tiles) => {
                  upgradeClusterByTiles(tiles, 0.8);
                }}
              />
            </g>
          </svg>

          <div className="absolute bottom-3 right-3 rounded-lg bg-white/80 px-2 py-1 text-xs text-slate-600 ring-1 ring-slate-200 backdrop-blur">
            Пан — потяни / Зум — колесо / Пинч — выключен
          </div>
        </div>
      </div>

      {/* Build menu */}
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
