import React from "react";
import { useGame } from "../../store/game";

export default function ProfilePage() {
  const coins = useGame((s) => s.coins);
  const buildings = useGame((s) => s.buildings);
  const reset = useGame((s) => s.reset);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">Профиль</h1>

      <section className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-200 flex items-center gap-3">
        <img
          src="https://api.dicebear.com/9.x/thumbs/svg?seed=player"
          alt="avatar"
          className="w-14 h-14 rounded-xl"
          loading="lazy"
          decoding="async"
        />
        <div className="flex-1">
          <p className="font-medium">Игрок</p>
          <p className="text-sm text-slate-500">Уровень 1 · 0 XP</p>
        </div>
        <button
          onClick={reset}
          className="text-sm px-3 py-2 rounded-lg bg-slate-900 text-white font-medium"
        >
          Сброс
        </button>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3 shadow-sm ring-1 ring-slate-200 text-center">
          <p className="text-xs text-slate-500">Монеты</p>
          <p className="text-lg font-semibold">{coins}</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm ring-1 ring-slate-200 text-center">
          <p className="text-xs text-slate-500">Дома</p>
          <p className="text-lg font-semibold">{buildings.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm ring-1 ring-slate-200 text-center">
          <p className="text-xs text-slate-500">Курсы</p>
          <p className="text-lg font-semibold">0/12</p>
        </div>
      </section>
    </div>
  );
}
