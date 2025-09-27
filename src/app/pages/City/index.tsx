import React, { useEffect, useRef } from "react";
import { useGame } from "../../store/game";

export default function CityPage() {
  const cRef = useRef<HTMLCanvasElement>(null);
  const buildings = useGame((s) => s.buildings);
  const spend = useGame((s) => s.spend);
  const addBuilding = useGame((s) => s.addBuilding);

  // кнопка построить дом
  const handleBuild = () => {
    const COST = 100;
    if (!spend(COST)) {
      alert("Недостаточно монет (нужно 100)");
      return;
    }
    const canvas = cRef.current!;
    const w = canvas.clientWidth;
    const h = Math.round(w * 1.4);
    const x = Math.floor(16 + Math.random() * (w - 48));
    const y = Math.floor(16 + Math.random() * (h - 48));
    const size = 18 + Math.floor(Math.random() * 10);
    addBuilding({ x, y, size, level: 1 });
  };

  useEffect(() => {
    const c = cRef.current!;
    const ctx = c.getContext("2d")!;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const w = c.clientWidth;
      const h = Math.round(w * 1.4);
      c.width = Math.floor(w * DPR);
      c.height = Math.floor(h * DPR);
      c.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const draw = () => {
      const { width, height } = c;
      ctx.clearRect(0, 0, width, height);

      // фон
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(0, 0, width, height);

      // сетка
      ctx.strokeStyle = "#E2E8F0";
      for (let x = 0; x < width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // дома из стора
      ctx.fillStyle = "#0F172A";
      buildings.forEach((b) => ctx.fillRect(b.x, b.y, b.size, b.size));

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [buildings]);

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-lg font-semibold">Город</h1>

      <div className="rounded-2xl overflow-hidden shadow-sm ring-1 ring-slate-200 bg-white">
        <canvas ref={cRef} className="w-full block" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleBuild}
          className="rounded-xl py-3 px-4 bg-slate-900 text-white font-medium active:scale-[.99]"
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
