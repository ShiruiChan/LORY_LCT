import React, { useMemo, useState } from 'react';
import { Quest, QuestPeriod, QuestStatus, QuestType, RewardType } from '../types';

type Props = {
  initial?: Partial<Quest>;
  onSubmit: (values: Omit<Quest, 'id'>) => void;
  onCancel: () => void;
};

const statusOpts: QuestStatus[] = ['locked', 'available', 'active', 'completed', 'rewarded'];
const questTypeOpts: QuestType[] = ['regular', 'event'];
const periodOpts: QuestPeriod[] = ['daily', 'weekly', 'monthly'];
const rewardTypeOpts: RewardType[] = ['coins', 'discount', 'coupon', 'booster'];

export default function QuestForm({ initial = {}, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial.title ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [status, setStatus] = useState<QuestStatus>(initial.status ?? 'available');
  const [progress, setProgress] = useState<number>(typeof initial.progress === 'number' ? initial.progress : 0);
  const [questType, setQuestType] = useState<QuestType>(initial.questType ?? 'regular');
  const [period, setPeriod] = useState<QuestPeriod | undefined>(initial.period);
  const [rewardType, setRewardType] = useState<RewardType>(initial.rewardType ?? 'coins');
  const [rewardValue, setRewardValue] = useState<number>(initial.rewardValue ?? 0);
  const [startsAt, setStartsAt] = useState<string>(initial.startsAt ?? '');
  const [endsAt, setEndsAt] = useState<string>(initial.endsAt ?? '');
  const [tags, setTags] = useState<string>((initial.tags ?? []).join(', '));

  const disabled = useMemo(() => title.trim().length === 0, [title]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result: Omit<Quest, 'id'> = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      progress: Math.max(0, Math.min(1, Number(progress) || 0)),
      questType,
      rewardType,
      rewardValue: Number(rewardValue) || 0,
      period: questType === 'regular' ? period : undefined,
      startsAt: startsAt || undefined,
      endsAt: endsAt || undefined,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    onSubmit(result);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs text-slate-600">Название</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например: Выпей воду"
          className="w-full px-3 py-2 rounded-lg border border-slate-200"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-600">Описание</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 resize-y"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Статус</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as QuestStatus)} className="w-full px-3 py-2 rounded-lg border border-slate-200">
            {statusOpts.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Прогресс</label>
          <input
            type="number"
            step={0.01}
            min={0}
            max={1}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Тип</label>
          <select value={questType} onChange={(e) => setQuestType(e.target.value as QuestType)} className="w-full px-3 py-2 rounded-lg border border-slate-200">
            {questTypeOpts.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        {questType === 'regular' && (
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Период</label>
            <select value={period ?? ''} onChange={(e) => setPeriod((e.target.value || undefined) as QuestPeriod | undefined)} className="w-full px-3 py-2 rounded-lg border border-slate-200">
              <option value="">—</option>
              {periodOpts.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Награда (тип)</label>
          <select value={rewardType} onChange={(e) => setRewardType(e.target.value as RewardType)} className="w-full px-3 py-2 rounded-lg border border-slate-200">
            {rewardTypeOpts.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Награда (значение)</label>
          <input
            type="number"
            value={rewardValue}
            onChange={(e) => setRewardValue(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Начало (ISO)</label>
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Конец (ISO)</label>
          <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-600">Теги (через запятую)</label>
        <input value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
      </div>

      <div className="flex gap-2 pt-1">
        <button disabled={disabled} className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50">Сохранить</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-slate-200">Отмена</button>
      </div>
    </form>
  );
}
