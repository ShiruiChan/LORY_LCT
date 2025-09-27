import React from "react";

export default function ProfilePage() {
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
          <p className="text-sm text-slate-500">Уровень 3 · 450 XP</p>
        </div>
        <button className="text-sm px-3 py-2 rounded-lg bg-slate-900 text-white font-medium">
          Редактировать
        </button>
      </section>

      <section className="grid grid-cols-3 gap-3">
        {[
          { t: "Монеты", v: "1 250" },
          { t: "Дома", v: "6" },
          { t: "Курсы", v: "4/12" },
        ].map((x) => (
          <div
            key={x.t}
            className="bg-white rounded-2xl p-3 shadow-sm ring-1 ring-slate-200 text-center"
          >
            <p className="text-xs text-slate-500">{x.t}</p>
            <p className="text-lg font-semibold">{x.v}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
