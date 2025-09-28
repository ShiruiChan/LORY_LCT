// src/components/QuestCard.tsx
import React from "react";
import { Quest } from "../../../store/questStore";
import { Button } from "../../../../ui/Button";
import { Coin } from "../../../components/Icons";

interface QuestCardProps {
  quest: Quest;
  isAdmin: boolean;
  onStart?: () => void;
  onClaim?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Форматирует ISO-дату в DD.MM.YYYY
const formatDate = (isoString: string): string => {
  const d = new Date(isoString);
  return d.toLocaleDateString("ru-RU"); // например: 05.04.2025
};

export const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  isAdmin,
  onStart,
  onClaim,
  onEdit,
  onDelete,
}) => {
  if (isAdmin) {
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-200 relative">
        <div className="flex justify-between">
          <h4 className="font-medium text-slate-800">{quest.title}</h4>
          <span className="text-sm text-emerald-700">
            +{quest.rewardCoins} монет
          </span>
        </div>
        {quest.description && (
          <p className="text-sm text-slate-600 mt-1">{quest.description}</p>
        )}
        {quest.endsAt && (
          <p className="text-xs text-slate-500 mt-1">
            🕗 До {formatDate(quest.endsAt)}
          </p>
        )}
        {quest.tags && quest.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {quest.tags.map((tag, i) => (
              <span
                key={i}
                className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {/* Кнопки управления — справа снизу */}
        <div className="absolute bottom-3 right-3 flex gap-1">
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
            title="Редактировать"
          >
            🖋️
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
            title="Удалить"
          >
            🗙
          </button>
        </div>
      </div>
    );
  }

  // Обычный режим (для игроков)
  return (
    <section className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-800">{quest.title}</h3>
        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg font-medium flex items-center gap-1">
          +{quest.rewardCoins} <Coin className="w-3 h-3" />
        </span>
      </div>
      {quest.description && (
        <p className="text-sm text-slate-600 mt-2">{quest.description}</p>
      )}
      {quest.endsAt && (
        <p className="text-xs text-slate-500 mt-1">
          🕗 До {formatDate(quest.endsAt)}
        </p>
      )}
      {(quest.status === "active" || quest.status === "completed") && (
        <>
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${Math.round(quest.progress * 100)}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {Math.round(quest.progress * 100)}%
          </div>
        </>
      )}
      <div className="mt-3 flex gap-2">
        {quest.status === "available" && onStart && (
          <Button size="sm" onClick={onStart}>
            Начать
          </Button>
        )}
        {quest.status === "completed" && onClaim && (
          <Button size="sm" variant="primary" onClick={onClaim}>
            Получить награду
          </Button>
        )}
        {quest.status === "rewarded" && (
          <span className="text-xs text-emerald-700 font-medium">
            Награда получена ✓
          </span>
        )}
      </div>
    </section>
  );
};
