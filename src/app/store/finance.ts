import { create } from "zustand";
import { useGame } from "./game";

// Types representing investment and loan positions. Interest rates are
// expressed as a fraction per hour (e.g. 0.05 = 5% per hour). When
// calculating returns or interest due we multiply the principal by
// rate and the time elapsed in hours.
export type InvestmentType = "deposit" | "stocks" | "bonds";

export type Investment = {
  id: string;
  type: InvestmentType;
  amount: number;
  rate: number;
  createdAt: number;
};

export type Loan = {
  id: string;
  amount: number;
  balance: number;
  rate: number;
  createdAt: number;
};

export type FinanceState = {
  investments: Investment[];
  loans: Loan[];
  /** Create a new investment if sufficient coins are available. */
  invest: (type: InvestmentType, amount: number, rate: number) => void;
  /** Collect the returns from an investment and add them to the player's coins. */
  collectInvestment: (id: string) => void;
  /** Take out a new loan: adds coins and creates a loan record. */
  takeLoan: (amount: number, rate: number) => void;
  /** Make a payment on an existing loan. Payments reduce the outstanding balance. */
  payLoan: (id: string, amount: number) => void;
  /** Declare bankruptcy: resets game state and clears all financial positions. */
  declareBankruptcy: () => void;
};

/**
 * Zustand store for managing investments and loans. It references the game
 * store to add or deduct coins when creating investments or taking loans.
 */
export const useFinance = create<FinanceState>((set, get) => ({
  investments: [],
  loans: [],
  invest: (type, amount, rate) => {
    const game = useGame.getState();
    if (!game.canSpend(amount)) return;
    if (!game.spend(amount)) return;
    const inv: Investment = {
      id: crypto.randomUUID(),
      type,
      amount,
      rate,
      createdAt: Date.now(),
    };
    set((s) => ({ investments: [...s.investments, inv] }));
  },
  collectInvestment: (id) => {
    const game = useGame.getState();
    set((s) => {
      const inv = s.investments.find((i) => i.id === id);
      if (!inv) return {};
      const now = Date.now();
      const hours = (now - inv.createdAt) / 3600000;
      const profit = inv.amount * inv.rate * hours;
      game.addCoins(Math.floor(profit));
      return { investments: s.investments.filter((i) => i.id !== id) };
    });
  },
  takeLoan: (amount, rate) => {
    const game = useGame.getState();
    game.addCoins(amount);
    const loan: Loan = {
      id: crypto.randomUUID(),
      amount,
      balance: amount,
      rate,
      createdAt: Date.now(),
    };
    set((s) => ({ loans: [...s.loans, loan] }));
  },
  payLoan: (id, payment) => {
    const game = useGame.getState();
    if (!game.canSpend(payment)) return;
    if (!game.spend(payment)) return;
    set((s) => {
      const now = Date.now();
      const updated: Loan[] = [];
      for (const loan of s.loans) {
        if (loan.id !== id) {
          updated.push(loan);
          continue;
        }
        // Compute accrued interest
        const hours = (now - loan.createdAt) / 3600000;
        const owed = loan.amount + loan.amount * loan.rate * hours;
        const newBalance = Math.max(0, owed - payment);
        if (newBalance > 0) {
          updated.push({ ...loan, balance: newBalance });
        }
      }
      return { loans: updated };
    });
  },
  declareBankruptcy: () => {
    const game = useGame.getState();
    game.reset();
    set({ investments: [], loans: [] });
  },
}));