// src/types.ts
export type QuestStatus = 'locked' | 'available' | 'active' | 'completed' | 'rewarded';
export type QuestPeriod = 'daily' | 'weekly' | 'monthly';
export type RewardType = 'coins' | 'discount' | 'coupon' | 'booster';
export type QuestType = 'regular' | 'event';

export interface Quest {
  id: string;
  title: string;
  description?: string;

  status: QuestStatus;
  progress: number; // 0..1

  questType: QuestType;

  // награда
  rewardType: RewardType;
  rewardValue: number;

  // для обычных квестов
  period?: QuestPeriod;

  // для ивентов
  startsAt?: string; // ISO 8601
  endsAt?: string;   // ISO 8601

  tags: string[];
}
