import React from "react";
import { useGame } from "../../store/game";

/**
 * Quests page offers simple objectives for players. Completing quests
 * could award coins or unlock additional game features. In this
 * version the quests are static placeholders but they could be driven
 * from Supabase in the future.
 */
export default function QuestsPage() {
  const buildings = useGame((s) => s.buildings);
  const progress = Math.min(buildings.length / 3, 1);
  const pct = Math.round(progress * 100);

  const quests = [
    { id: "q1", title: "Построй 3 дома", progress, reward: "+70" },
    { id: "q2", title: "Пополнить кошелёк", progress: 0, reward: "+25" },
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
                style={{ width: `${q.id === "q1" ? pct : Math.round(q.progress * 100)}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {q.id === "q1" ? pct : Math.round(q.progress * 100)}%
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}