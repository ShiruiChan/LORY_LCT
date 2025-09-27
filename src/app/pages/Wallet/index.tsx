import React from "react";
import { useGame } from "../../store/game";

export default function WalletPage() {
  const coins = useGame((s) => s.coins);
  const addCoins = useGame((s) => s.addCoins);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">Кошелёк</h1>

      <section className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm">
        <p className="text-slate-300 text-sm">Баланс</p>
        <p className="text-3xl font-bold mt-1">
          ₽ {coins.toLocaleString("ru-RU")}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => addCoins(200)}
            className="bg-white text-slate-900 rounded-lg px-3 py-2 text-sm font-medium"
          >
            Пополнить +200
          </button>
          <button className="bg-white/10 rounded-lg px-3 py-2 text-sm">
            Вывести
          </button>
        </div>
      </section>

      {/* остальной макет как был */}
    </div>
  );
}
