import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { financialProducts } from "../../../data/financialProducts";

/**
 * The Academy page offers both short lessons on financial literacy and
 * curated lists of Gazprombank products extracted from the provided
 * spreadsheet. Visitors can browse lessons to improve their money
 * management skills and explore products relevant to their needs.
 */
export default function AcademyPage() {
  // Simple course list. In a real application these could be fetched
  // dynamically from Supabase or another CMS. For now we hard‑code
  // several important topics.
  const lessons = [
    { id: "budget", title: "Бюджет 50/30/20", time: "8 мин", description: "Как распределять доходы на обязательные платежи, сбережения и удовольствия." },
    { id: "etf", title: "Что такое ETF", time: "10 мин", description: "Плюсы и минусы фондов, как инвестировать через них." },
    { id: "emergency", title: "Подушка безопасности", time: "6 мин", description: "Создаём финансовую подушку и определяем её размер." },
    { id: "credit", title: "Как пользоваться кредитами с умом", time: "9 мин", description: "Когда брать кредиты выгодно и как не попасть в долговую яму." },
    { id: "deposits", title: "Накопительные счёта и вклады", time: "7 мин", description: "Сравниваем доходности и условия, выбираем лучший продукт." },
  ];
  // Track which product category is currently expanded.
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  // programmatic navigation for course buttons
  const navigate = useNavigate();
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-lg font-semibold">Академия</h1>
      {/* Section: lessons */}
      <section>
        <h2 className="text-md font-medium mb-2">Курсы по финансовой грамотности</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {lessons.map((l) => (
            <article
              key={l.id}
              className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-200 flex flex-col"
            >
              <h3 className="font-medium text-slate-900 mb-1">{l.title}</h3>
              <p className="text-sm text-slate-500 mb-1">{l.time}</p>
              <p className="text-sm text-slate-600 flex-1">{l.description}</p>
              <button
                onClick={() => navigate(`/academy/${l.id}`)}
                className="mt-3 rounded-lg bg-slate-900 text-white px-3 py-2 text-sm font-medium self-start hover:bg-slate-800 transition-colors"
              >
                Пройти урок
              </button>
            </article>
          ))}
        </div>
      </section>
      {/* Section: products */}
      <section>
        <h2 className="text-md font-medium mb-2">Финансовые продукты</h2>
        <div className="space-y-4">
          {financialProducts.map((cat) => {
            const isOpen = openCategory === cat.category;
            return (
              <div key={cat.category} className="bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm">
                <button
                  className="w-full flex justify-between items-center px-4 py-3 text-left"
                  onClick={() => setOpenCategory(isOpen ? null : cat.category)}
                >
                  <span className="font-medium">{cat.category}</span>
                  <span className="text-slate-500 text-sm">{isOpen ? "Скрыть" : "Показать"}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-slate-200 p-4 grid gap-3">
                    {cat.items.map((item) => (
                      <a
                        key={item.name}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-slate-50 hover:bg-slate-100 rounded-lg p-3 transition-colors"
                      >
                        <p className="font-medium text-slate-900">{item.name}</p>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}