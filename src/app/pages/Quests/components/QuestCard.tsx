import React from "react";
import { Quest } from "../types";
import { motion } from "framer-motion";
import { useQuests } from "../questStore";

const formatReward = (q: Quest) => {
  switch (q.rewardType) {
    case "coins":
      return `${q.rewardValue} мон.`;
    case "discount":
      return `${q.rewardValue}% скидка`;
    case "coupon":
      return `купон: ${q.rewardValue}`;
    case "booster":
      return `бустер ×${q.rewardValue}`;
    default:
      return `${q.rewardValue}`;
  }
};

export const QuestCard: React.FC<{
  quest: Quest;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}> = ({ quest, isAdmin, onEdit, onDelete }) => {
  const { start, claim } = useQuests();

  const now = new Date();
  const s = quest.startsAt ? new Date(quest.startsAt) : null;
  const e = quest.endsAt ? new Date(quest.endsAt) : null;

  const status = (() => {
    if (s && s > now)
      return { label: "Запланирован", cls: "bg-amber-100 text-amber-800" };
    if (s && s <= now && (!e || e >= now))
      return { label: "Активен", cls: "bg-emerald-100 text-emerald-800" };
    switch (quest.status) {
      case "active":
        return { label: "Активен", cls: "bg-emerald-100 text-emerald-800" };
      case "available":
        return { label: "Доступен", cls: "bg-blue-100 text-blue-800" };
      case "completed":
        return { label: "Завершён", cls: "bg-slate-100 text-slate-700" };
      case "rewarded":
        return {
          label: "Награда получена",
          cls: "bg-violet-100 text-violet-800",
        };
      default:
        return { label: "Закрыт", cls: "bg-slate-100 text-slate-600" };
    }
  })();

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 250, damping: 20 }}
      className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 p-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full ${status.cls}`}
            >
              {status.label}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {quest.questType === "event" ? "ивент" : "обычный"}
            </span>
            {quest.period && quest.questType === "regular" && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {quest.period === "daily"
                  ? "ежедневно"
                  : quest.period === "weekly"
                  ? "еженед."
                  : "ежемес."}
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-slate-900 truncate">
            {quest.title}
          </h3>
          {quest.description && (
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
              {quest.description}
            </p>
          )}

          <div className="text-[11px] text-slate-500 mt-2 flex flex-wrap gap-x-2 gap-y-1">
            {quest.startsAt && (
              <>начало: {new Date(quest.startsAt).toLocaleString()}</>
            )}
            {quest.endsAt && (
              <>· конец: {new Date(quest.endsAt).toLocaleString()}</>
            )}
            {/* ТЕГИ — только в админке */}
            {isAdmin && quest.tags?.length ? (
              <>· теги: {quest.tags.join(", ")}</>
            ) : null}
          </div>

          <div className="text-[11px] text-emerald-700 mt-1">
            награда: {formatReward(quest)}
          </div>

          {/* Пользовательские действия (вне админки) */}
          {!isAdmin && (
            <div className="mt-2 flex gap-2">
              {quest.status === "available" && (
                <button
                  onClick={() => start(quest.id)}
                  className="px-2 py-1 rounded-md bg-emerald-600 text-white text-xs"
                >
                  Начать
                </button>
              )}
              {quest.status === "completed" && (
                <button
                  onClick={() => claim(quest.id)}
                  className="px-2 py-1 rounded-md bg-yellow-500 text-white text-xs"
                >
                  Забрать награду
                </button>
              )}
            </div>
          )}
        </div>

        {/* Админ-действия */}
        {isAdmin && (
          <div className="flex flex-col gap-1 shrink-0">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onEdit}
              className="px-2 py-1 rounded-md bg-slate-900 text-white text-xs"
            >
              Редакт.
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onDelete}
              className="px-2 py-1 rounded-md bg-red-600 text-white text-xs"
            >
              Удалить
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
