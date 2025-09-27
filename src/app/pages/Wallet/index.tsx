import React from "react";

export default function WalletPage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">Кошелёк</h1>

      <section className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm">
        <p className="text-slate-300 text-sm">Баланс</p>
        <p className="text-3xl font-bold mt-1">₽ 12 450</p>
        <div className="mt-4 flex gap-2">
          <button className="bg-white text-slate-900 rounded-lg px-3 py-2 text-sm font-medium">
            Пополнить
          </button>
          <button className="bg-white/10 rounded-lg px-3 py-2 text-sm">
            Вывести
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">Карты</h2>
          <button className="text-sm text-slate-600">Управлять</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 text-white p-4">
            <p className="text-xs text-slate-300">VISA</p>
            <p className="text-lg font-semibold mt-4">•••• 1234</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-indigo-700 to-indigo-500 text-white p-4">
            <p className="text-xs text-indigo-200">MASTERCARD</p>
            <p className="text-lg font-semibold mt-4">•••• 9876</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">Инвестиции</h2>
          <button className="text-sm text-slate-600">История</button>
        </div>
        <ul className="divide-y divide-slate-200">
          {[
            { t: "ETF Индекс", v: "₽ 7 500", d: "+12% годовых" },
            { t: "Депозит 6 мес", v: "₽ 5 000", d: "8% годовых" },
          ].map((it) => (
            <li key={it.t} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{it.t}</p>
                <p className="text-sm text-slate-500">{it.d}</p>
              </div>
              <p className="font-semibold">{it.v}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
