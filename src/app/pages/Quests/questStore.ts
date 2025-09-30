// src/questStore.ts
import { create } from 'zustand';
import { Quest } from './types';

type State = {
  quests: Quest[];
  fetch: () => Promise<void>;
  addQuest: (q: Quest) => void;
  updateQuest: (q: Quest) => void;
  deleteQuest: (id: string) => void;
  start: (id: string) => void;
  claim: (id: string) => void;
};

// расширенные моки (уникальные id!)
const mockQuests: Quest[] = [
  // DAILY
  {
    id: 'd1',
    title: 'Утренняя зарядка',
    description: '10 минут растяжки и приседаний',
    status: 'available',
    progress: 0,
    questType: 'regular',
    period: 'daily',
    rewardType: 'coins',
    rewardValue: 50,
    tags: ['спорт', 'здоровье'],
  },
  {
    id: 'd2',
    title: 'Прочитать 10 страниц',
    description: 'Любая книга или статья',
    status: 'locked',
    progress: 0,
    questType: 'regular',
    period: 'daily',
    rewardType: 'coins',
    rewardValue: 30,
    tags: ['чтение'],
  },

  // WEEKLY
  {
    id: 'w1',
    title: 'Пробежать 5 км',
    description: 'Можно на улице или на беговой дорожке',
    status: 'available',
    progress: 0,
    questType: 'regular',
    period: 'weekly',
    rewardType: 'coins',
    rewardValue: 200,
    tags: ['спорт'],
  },
  {
    id: 'w2',
    title: 'Посетить спортзал 2 раза',
    description: 'В течение недели',
    status: 'locked',
    progress: 0,
    questType: 'regular',
    period: 'weekly',
    rewardType: 'booster',
    rewardValue: 1,
    tags: ['спорт', 'дисциплина'],
  },

  // MONTHLY
  {
    id: 'm1',
    title: 'Прочитать одну книгу',
    description: 'Завершить любую книгу за месяц',
    status: 'available',
    progress: 0.25,
    questType: 'regular',
    period: 'monthly',
    rewardType: 'coupon',
    rewardValue: 1,
    tags: ['чтение'],
  },
  {
    id: 'm2',
    title: 'Закрыть 20 тренировок',
    description: 'Подсчёт тренировок за месяц',
    status: 'locked',
    progress: 0,
    questType: 'regular',
    period: 'monthly',
    rewardType: 'coins',
    rewardValue: 1000,
    tags: ['спорт'],
  },

  // EVENTS (один активный, один запланированный)
  {
    id: 'e1',
    title: 'Осенний марафон',
    description: 'Специальный ивент на октябрь',
    status: 'active',
    progress: 0.4,
    questType: 'event',
    rewardType: 'booster',
    rewardValue: 2,
    startsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['ивент', 'осень'],
  },
  {
    id: 'e2',
    title: 'Новый год 2025',
    description: 'Специальные задания к празднику',
    status: 'available',
    progress: 0,
    questType: 'event',
    rewardType: 'coins',
    rewardValue: 500,
    startsAt: new Date('2025-12-25T00:00:00Z').toISOString(),
    endsAt: new Date('2026-01-10T23:59:59Z').toISOString(),
    tags: ['ивент', 'зима', 'праздник'],
  },
];

export const useQuests = create<State>((set, get) => ({
  quests: [],

  fetch: async () => {
    await new Promise((r) => setTimeout(r, 200)); // имитация задержки
    set({ quests: mockQuests });
  },

  addQuest: (q) => set((s) => ({ quests: [...s.quests, q] })),

  updateQuest: (q) =>
    set((s) => ({ quests: s.quests.map((x) => (x.id === q.id ? q : x)) })),

  deleteQuest: (id) =>
    set((s) => ({ quests: s.quests.filter((x) => x.id !== id) })),

  start: (id) =>
    set((s) => ({
      quests: s.quests.map((q) =>
        q.id === id ? { ...q, status: 'active', progress: Math.max(0, q.progress) } : q
      ),
    })),

  claim: (id) =>
    set((s) => ({
      quests: s.quests.map((q) =>
        q.id === id ? { ...q, status: 'rewarded' } : q
      ),
    })),
}));
