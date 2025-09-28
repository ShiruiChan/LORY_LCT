// src/store/questStore.ts
import { create } from 'zustand';

export type QuestStatus = 'locked' | 'available' | 'active' | 'completed' | 'rewarded';
export type QuestPeriod = 'daily' | 'weekly' | 'monthly';

export interface Quest {
  id: string;
  title: string;
  description?: string;
  status: QuestStatus;
  progress: number;
  rewardCoins: number;
  period: QuestPeriod;
  tags: string[];
  endsAt?: string; // ISO string
}

let nextId = 100;

const mockQuests: Quest[] = [
  {
    id: 'd1',
    title: 'Построй 3 дома',
    description: 'Стройте и развивайте свой личный город.',
    status: 'available',
    progress: 0,
    rewardCoins: 150,
    period: 'daily',
    tags: ['строительство'],
    endsAt: '2025-04-05T23:59:59Z',
  },
  {
    id: 'w1',
    title: 'Семейный бюджет',
    description: 'Пройдите мини-игру «Семейный бюджет».',
    status: 'available',
    progress: 0,
    rewardCoins: 200,
    period: 'weekly',
    tags: ['обучение'],
  },
];

interface QuestState {
  quests: Quest[];
  fetch: () => Promise<void>;
  start: (id: string) => Promise<void>;
  claim: (id: string) => Promise<void>;
  addQuest: (quest: Omit<Quest, 'id'>) => void;
  updateQuest: (id: string, updates: Partial<Quest>) => void;
  deleteQuest: (id: string) => void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useQuests = create<QuestState>((set) => ({
  quests: [],
  fetch: async () => {
    await sleep(400);
    set({ quests: [...mockQuests] });
  },
  start: async (id) => {
    await sleep(300);
    set((state) => ({
      quests: state.quests.map((q) =>
        q.id === id ? { ...q, status: 'active' } : q
      ),
    }));
  },
  claim: async (id) => {
    await sleep(300);
    set((state) => ({
      quests: state.quests.map((q) =>
        q.id === id ? { ...q, status: 'rewarded' } : q
      ),
    }));
  },
  addQuest: (quest) =>
    set((state) => ({
      quests: [...state.quests, { ...quest, id: `custom-${nextId++}` }],
    })),
  updateQuest: (id, updates) =>
    set((state) => ({
      quests: state.quests.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    })),
  deleteQuest: (id) =>
    set((state) => ({
      quests: state.quests.filter((q) => q.id !== id),
    })),
}));