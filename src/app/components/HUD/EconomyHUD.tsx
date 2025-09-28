import React from "react";

export function EconomyHUD({
  coins,
  coinsPerSec,
}: {
  coins: number;
  coinsPerSec: number;
}) {
  return (
    <div className="fixed top-18 right-5 z-50">
      <div className="rounded-2xl bg-white/80 backdrop-blur shadow px-4 py-2 text-slate-800">
        <div className="text-xs uppercase tracking-wide opacity-70">Баланс</div>
        <div className="text-xl font-semibold">
          {Math.floor(coins).toLocaleString()} 🪙
        </div>
        <div className="text-xs opacity-80">
          +{coinsPerSec.toFixed(2)} / сек
        </div>
      </div>
    </div>
  );
}
