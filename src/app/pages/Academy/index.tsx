import React from "react";

export default function AcademyPage() {
  const lessons = [
    { id: "l1", title: "Бюджет 50/30/20", time: "8 мин" },
    { id: "l2", title: "Что такое ETF", time: "10 мин" },
    { id: "l3", title: "Подушка безопасности", time: "6 мин" },
  ];
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">Академия</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {lessons.map((l) => (
          <article
            key={l.id}
            className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-200"
          >
            <h3 className="font-medium">{l.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{l.time}</p>
            <button className="mt-3 rounded-lg bg-slate-900 text-white px-3 py-2 text-sm font-medium">
              Пройти урок
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
