import React, { useEffect, useRef } from "react";

export default function CityPage() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current!;
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
    const blocks = Array.from({ length: 16 }).map((_, i) => ({
      x: 20 + (i % 4) * 72,
      y: 20 + Math.floor(i / 4) * 72,
      s: 22 + (i % 3) * 6,
    }));

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

      // дома
      ctx.fillStyle = "#0F172A";
      blocks.forEach((b) => ctx.fillRect(b.x, b.y, b.s, b.s));

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-lg font-semibold">Город</h1>

      <div className="rounded-2xl overflow-hidden shadow-sm ring-1 ring-slate-200 bg-white">
        <canvas ref={ref} className="w-full block" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="rounded-xl py-3 px-4 bg-slate-900 text-white font-medium active:scale-[.99]">
          Построить дом
        </button>
        <button className="rounded-xl py-3 px-4 bg-white ring-1 ring-slate-300 text-slate-700 active:scale-[.99]">
          Задания на карте
        </button>
      </div>
    </div>
  );
}
