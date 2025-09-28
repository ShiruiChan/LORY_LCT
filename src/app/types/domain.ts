export type Currency = 'RUB' | 'USD' | 'EUR';

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  level: number;
  xp: number;
}

export interface Wallet {
  balance: number;
  currency: Currency;
  cards: { id: string; last4: string; brand: string }[];
  investments: Investment[];
}

export interface Investment {
  id: string;
  title: string;
  amount: number;
  roiYearly: number;     // 0.12 = 12%
  updatedAt: number;     // ts
}

export interface Quest {
  id: string;
  title: string;
  description?: string;
  progress: number;      // 0..1
  rewardCoins: number;
}

export interface Lesson {
  id: string;
  title: string;
  durationMin: number;
  completed: boolean;
}
