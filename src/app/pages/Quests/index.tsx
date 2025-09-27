import React from "react";

export default function QuestsPage() {
  const quests = [
    {
      id: "q1",
      title: "Пополнить кошелёк на 1000₽",
      progress: 0.4,
      reward: "+50",
    },
    {
      id: "q2",
      title: "Оплатить проезд с карты",
      progress: 0.1,
      reward: "+25",
    },
    {
      id: "q3",
      title: "Пройти 2 урока в Академии",
      progress: 0.0,
      reward: "+70",
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">Квесты</h1>
      <ul className="space-y-3">
        {quests.map((q) => (
          <li
            key={q.id}
            className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-200"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{q.title}</p>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg font-medium">
                Награда {q.reward}
              </span>
            </div>
            <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 transition-all"
                style={{ width: `${q.progress * 100}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {Math.round(q.progress * 100)}%
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
