import React, { useEffect, useMemo, useState } from 'react';
import { Quest, QuestPeriod, QuestStatus, QuestType, RewardType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export const QuestModal: React.FC<{
  open: boolean;
  initial?: Partial<Quest>;
  onClose: () => void;
  onSubmit: (q: Quest) => void;
}> = ({ open, initial = {}, onClose, onSubmit }) => {
  const DEFAULT_STATUS: QuestStatus = 'available';
  const DEFAULT_TYPE: QuestType = 'regular';
  const DEFAULT_REWARD_TYPE: RewardType = 'coins';

  const [title, setTitle] = useState(initial.title ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [questType, setQuestType] = useState<QuestType>(initial.questType ?? DEFAULT_TYPE);
  const [status, setStatus] = useState<QuestStatus>(initial.status ?? DEFAULT_STATUS);
  const [progress, setProgress] = useState<number>(initial.progress ?? 0);

  const [rewardType, setRewardType] = useState<RewardType>(initial.rewardType ?? DEFAULT_REWARD_TYPE);
  const [rewardValue, setRewardValue] = useState<number>(initial.rewardValue ?? 0);

  const [period, setPeriod] = useState<QuestPeriod | undefined>(initial.period);
  const [startsAt, setStartsAt] = useState<string>(initial.startsAt ?? '');
  const [endsAt, setEndsAt] = useState<string>(initial.endsAt ?? '');

  const [tags, setTags] = useState<string>((initial.tags ?? []).join(', '));

  // ⬇️ синхронизируем форму при смене initial (редактирование другого квеста)
  useEffect(() => {
    setTitle(initial.title ?? '');
    setDescription(initial.description ?? '');
    setQuestType((initial.questType as QuestType) ?? DEFAULT_TYPE);
    setStatus((initial.status as QuestStatus) ?? DEFAULT_STATUS);
    setProgress(initial.progress ?? 0);

    setRewardType((initial.rewardType as RewardType) ?? DEFAULT_REWARD_TYPE);
    setRewardValue(initial.rewardValue ?? 0);

    setPeriod(initial.period as QuestPeriod | undefined);
    setStartsAt(initial.startsAt ?? '');
    setEndsAt(initial.endsAt ?? '');
    setTags((initial.tags ?? []).join(', '));
  }, [initial]);

  const isRegular = questType === 'regular';
  const isEvent = questType === 'event';

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false;
    if (rewardValue < 0) return false;
    if (isRegular && !period) return false;
    if (isEvent && startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) return false;
    return true;
  }, [title, rewardValue, isRegular, isEvent, period, startsAt, endsAt]);

  const handleSubmit = () => {
    const id = (initial.id ?? crypto.randomUUID());
    const cleanedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);

    const q: Quest = {
      id,
      title: title.trim(),
      description: description.trim() || undefined,
      questType,
      status,
      progress: Math.min(1, Math.max(0, progress)),
      rewardType,
      rewardValue: Number(rewardValue),
      period: isRegular ? period : undefined,
      startsAt: isEvent || startsAt ? (startsAt || undefined) : undefined,
      endsAt: isEvent || endsAt ? (endsAt || undefined) : undefined,
      tags: cleanedTags,
    };

    onSubmit(q);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          >
            <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold">{initial.id ? 'Редактирование квеста' : 'Новый квест'}</h3>
                <button onClick={onClose} className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-slate-100">×</button>
              </div>

              {/* Форма */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="col-span-2 text-xs text-slate-600">Название</label>
                  <input className="col-span-2 border rounded px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Выполнить тренировку" />

                  <label className="col-span-2 text-xs text-slate-600">Описание</label>
                  <textarea className="col-span-2 border rounded px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Краткие детали задания" />

                  <div>
                    <label className="text-xs text-slate-600">Тип</label>
                    <select className="w-full border rounded px-2 py-2" value={questType} onChange={(e) => setQuestType(e.target.value as QuestType)}>
                      <option value="regular">Обычный</option>
                      <option value="event">Ивент</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-600">Статус</label>
                    <select className="w-full border rounded px-2 py-2" value={status} onChange={(e) => setStatus(e.target.value as QuestStatus)}>
                      <option value="locked">Заблокирован</option>
                      <option value="available">Доступен</option>
                      <option value="active">Активен</option>
                      <option value="completed">Завершён</option>
                      <option value="rewarded">Награждён</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-600">Награда — тип</label>
                    <select className="w-full border rounded px-2 py-2" value={rewardType} onChange={(e) => setRewardType(e.target.value as RewardType)}>
                      <option value="coins">Монеты</option>
                      <option value="discount">Скидка (%)</option>
                      <option value="coupon">Купон (код/ID)</option>
                      <option value="booster">Бустер (множитель)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-600">Награда — значение</label>
                    <input className="w-full border rounded px-3 py-2" type="number" min={0} value={rewardValue} onChange={(e) => setRewardValue(Number(e.target.value))} />
                  </div>

                  <div>
                    <label className="text-xs text-slate-600">Прогресс (0..1)</label>
                    <input className="w-full border rounded px-3 py-2" type="number" step="0.01" min={0} max={1} value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
                  </div>

                  {questType === 'regular' && (
                    <div>
                      <label className="text-xs text-slate-600">Период (для обычных)</label>
                      <select className="w-full border rounded px-2 py-2" value={period ?? ''} onChange={(e) => setPeriod((e.target.value || undefined) as QuestPeriod | undefined)}>
                        <option value="">— выбери период —</option>
                        <option value="daily">Ежедневный</option>
                        <option value="weekly">Еженедельный</option>
                        <option value="monthly">Ежемесячный</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-slate-600">Начало (ISO)</label>
                    <input className="w-full border rounded px-3 py-2" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
                  </div>

                  <div>
                    <label className="text-xs text-slate-600">Конец (ISO)</label>
                    <input className="w-full border rounded px-3 py-2" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
                  </div>

                  <label className="col-span-2 text-xs text-slate-600">Теги (через запятую)</label>
                  <input className="col-span-2 border rounded px-3 py-2" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="например: спорт, утро, золото" />
                </div>

                {!canSubmit && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    Проверь поля: название, период для «обычных», корректность дат (конец не раньше начала), награда ≥ 0.
                  </p>
                )}

                <div className="flex gap-2">
                  <button disabled={!canSubmit} onClick={handleSubmit}
                    className="px-3 py-2 rounded bg-emerald-600 disabled:bg-emerald-300 text-white">Сохранить</button>
                  <button onClick={onClose} className="px-3 py-2 rounded bg-slate-200">Отмена</button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
