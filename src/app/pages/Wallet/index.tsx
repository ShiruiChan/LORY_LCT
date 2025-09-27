import React, { useState } from "react";
import { useGame } from "../../store/game";
import { useFinance, Investment, Loan } from "../../store/finance";

/**
 * The Wallet page displays the player's current coin balance and
 * provides interfaces for financial operations: investing, taking
 * loans, making payments and declaring bankruptcy. The financial logic
 * lives in the useFinance store; this component simply renders
 * forms and lists and calls into the store when actions occur.
 */
export default function WalletPage() {
  const coins = useGame((s) => s.coins);
  const addCoins = useGame((s) => s.addCoins);

  // Finance store hooks
  const investments = useFinance((s) => s.investments);
  const loans = useFinance((s) => s.loans);
  const invest = useFinance((s) => s.invest);
  const collectInvestment = useFinance((s) => s.collectInvestment);
  const takeLoan = useFinance((s) => s.takeLoan);
  const payLoan = useFinance((s) => s.payLoan);
  const declareBankruptcy = useFinance((s) => s.declareBankruptcy);

  // Local state for forms
  const [investAmount, setInvestAmount] = useState("");
  const [investType, setInvestType] = useState<"deposit" | "stocks" | "bonds">("deposit");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanRate, setLoanRate] = useState("");

  // Compute accrued profit for an investment
  const computeProfit = (inv: Investment) => {
    const now = Date.now();
    const hours = (now - inv.createdAt) / 3600000;
    return inv.amount * inv.rate * hours;
  };
  // Render
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-lg font-semibold">Кошелёк</h1>

      {/* Balance and quick actions */}
      <section className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm">
        <p className="text-slate-300 text-sm">Баланс</p>
        <p className="text-3xl font-bold mt-1">₽ {coins.toLocaleString("ru-RU")}</p>
        <div className="mt-4 flex gap-2 flex-wrap">
          <button
            onClick={() => addCoins(200)}
            className="bg-white text-slate-900 rounded-lg px-3 py-2 text-sm font-medium"
          >
            Пополнить +200
          </button>
          <button
            onClick={() => alert("Функция вывода пока не реализована")}
            className="bg-white/10 rounded-lg px-3 py-2 text-sm"
          >
            Вывести
          </button>
        </div>
      </section>

      {/* Investments */}
      <section className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-200 space-y-3">
        <h2 className="font-medium">Инвестиции</h2>
        {investments.length === 0 ? (
          <p className="text-sm text-slate-500">У вас нет активных инвестиций.</p>
        ) : (
          <ul className="space-y-2">
            {investments.map((inv) => {
              const profit = computeProfit(inv);
              return (
                <li
                  key={inv.id}
                  className="flex items-center justify-between bg-slate-50 rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium">{inv.type.toUpperCase()}</p>
                    <p className="text-sm text-slate-500">Сумма: ₽ {inv.amount}</p>
                    <p className="text-sm text-slate-500">Доход: ₽ {profit.toFixed(0)}</p>
                  </div>
                  <button
                    onClick={() => collectInvestment(inv.id)}
                    className="bg-slate-900 text-white rounded-lg px-3 py-2 text-sm font-medium"
                  >
                    Забрать
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {/* New investment form */}
        <div className="mt-3 space-y-2">
          <label className="block text-sm font-medium">Новая инвестиция</label>
          <div className="flex gap-2 items-end flex-wrap">
            <select
              value={investType}
              onChange={(e) => setInvestType(e.target.value as any)}
              className="border border-slate-300 rounded-lg px-2 py-1 text-sm"
            >
              <option value="deposit">Депозит (5%/ч)</option>
              <option value="stocks">Акции (10%/ч)</option>
              <option value="bonds">Облигации (3%/ч)</option>
            </select>
            <input
              type="number"
              value={investAmount}
              onChange={(e) => setInvestAmount(e.target.value)}
              placeholder="Сумма"
              className="border border-slate-300 rounded-lg px-2 py-1 text-sm w-24"
            />
            <button
              onClick={() => {
                const amount = parseFloat(investAmount);
                if (isNaN(amount) || amount <= 0) {
                  alert("Введите корректную сумму");
                  return;
                }
                // Determine rate based on selected type
                const rate = investType === "deposit" ? 0.05 : investType === "stocks" ? 0.1 : 0.03;
                invest(investType, amount, rate);
                setInvestAmount("");
              }}
              className="bg-slate-900 text-white rounded-lg px-3 py-2 text-sm font-medium"
            >
              Инвестировать
            </button>
          </div>
        </div>
      </section>

      {/* Loans */}
      <section className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-200 space-y-3">
        <h2 className="font-medium">Кредиты</h2>
        {loans.length === 0 ? (
          <p className="text-sm text-slate-500">У вас нет активных кредитов.</p>
        ) : (
          <ul className="space-y-2">
            {loans.map((loan) => (
              <li
                key={loan.id}
                className="flex items-center justify-between bg-slate-50 rounded-lg p-3"
              >
                <div>
                  <p className="font-medium">Кредит</p>
                  <p className="text-sm text-slate-500">Остаток: ₽ {loan.balance.toFixed(0)}</p>
                  <p className="text-sm text-slate-500">Ставка: {(loan.rate * 100).toFixed(1)}%/ч</p>
                </div>
                <button
                  onClick={() => payLoan(loan.id, 50)}
                  className="bg-slate-900 text-white rounded-lg px-3 py-2 text-sm font-medium"
                >
                  Платёж 50
                </button>
              </li>
            ))}
          </ul>
        )}
        {/* New loan form */}
        <div className="mt-3 space-y-2">
          <label className="block text-sm font-medium">Взять кредит</label>
          <div className="flex gap-2 items-end flex-wrap">
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="Сумма"
              className="border border-slate-300 rounded-lg px-2 py-1 text-sm w-24"
            />
            <input
              type="number"
              value={loanRate}
              onChange={(e) => setLoanRate(e.target.value)}
              placeholder="Ставка %/ч"
              className="border border-slate-300 rounded-lg px-2 py-1 text-sm w-24"
            />
            <button
              onClick={() => {
                const amount = parseFloat(loanAmount);
                const ratePct = parseFloat(loanRate);
                if (isNaN(amount) || amount <= 0 || isNaN(ratePct) || ratePct <= 0) {
                  alert("Введите корректные значения");
                  return;
                }
                takeLoan(amount, ratePct / 100);
                setLoanAmount("");
                setLoanRate("");
              }}
              className="bg-slate-900 text-white rounded-lg px-3 py-2 text-sm font-medium"
            >
              Получить
            </button>
          </div>
        </div>
      </section>

      {/* Bankruptcy */}
      <section className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-medium mb-2">Банкротство</h2>
        <p className="text-sm text-slate-500 mb-3">
          Объявите банкротство, чтобы сбросить игру и очистить все финансовые обязательства. Это действие нельзя отменить.
        </p>
        <button
          onClick={() => {
            if (confirm("Вы уверены, что хотите объявить банкротство? Это удалит все ваши здания и финансы.")) {
              declareBankruptcy();
            }
          }}
          className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium"
        >
          Объявить банкротство
        </button>
      </section>
    </div>
  );
}