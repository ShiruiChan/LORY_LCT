import React from "react";
import { useGame } from "../../store/game";
import { useNavigate } from "react-router-dom";

/**
 * Profile page shows a simple avatar along with the player's coins,
 * number of buildings and completed courses. A reset button allows
 * clearing progress. In future this page could display additional
 * stats such as investment performance or quest achievements.
 */
export default function ProfilePage() {
  const coins = useGame((s) => s.coins);
  const buildings = useGame((s) => s.buildings);
  const reset = useGame((s) => s.reset);

  // Test data for course progress. In a real app this could come from a store or database.
  const courses = [
    { id: 'budget', title: 'Бюджет 50/30/20', completed: false },
    { id: 'etf', title: 'Что такое ETF', completed: false },
    { id: 'emergency', title: 'Подушка безопасности', completed: false },
    { id: 'credit', title: 'Как пользоваться кредитами', completed: false },
    { id: 'deposits', title: 'Накопительные счета и вклады', completed: false },
  ];

  const navigate = useNavigate();

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
          <p className="text-xs text-slate-500">Здания</p>
          <p className="text-lg font-semibold">{buildings.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm ring-1 ring-slate-200 text-center">
          <p className="text-xs text-slate-500">Курсы</p>
          <p className="text-lg font-semibold">
            {courses.filter((c) => c.completed).length}/{courses.length}
          </p>
        </div>
      </section>

      {/* Courses progress */}
      <section className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-md font-medium mb-3">Курсы (тестовые)</h2>
        <ul className="space-y-2">
          {courses.map((course) => (
            <li key={course.id} className="flex items-center justify-between">
              <button
                onClick={() => navigate(`/academy/${course.id}`)}
                className="text-sm text-blue-600 hover:underline p-0 m-0 bg-transparent border-none cursor-pointer"
              >
                {course.title}
              </button>
              <span
                className={`text-xs font-medium ${
                  course.completed ? 'text-green-600' : 'text-slate-400'
                }`}
              >
                {course.completed ? 'Пройден' : 'Не пройден'}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}