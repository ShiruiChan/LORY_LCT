// src/components/AdminPanel.tsx
import React, { useState } from "react";
import { useQuests, Quest, QuestPeriod } from "../../../store/questStore";
import { QuestCard } from "./QuestCard";

interface AdminPanelProps {
  onClose: () => void;
  onEdit: (quest: Quest) => void;
  onAdd: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onClose,
  onEdit,
  onAdd,
}) => {
  const { quests, deleteQuest } = useQuests();
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 500);
  };

  const periodOrder: QuestPeriod[] = ["daily", "weekly", "monthly"];
  const periodLabels = {
    daily: "Ежедневные",
    weekly: "Еженедельные",
    monthly: "Ежемесячные",
  };

  const grouped = periodOrder.reduce((acc, period) => {
    acc[period] = quests.filter((q) => q.period === period);
    return acc;
  }, {} as Record<QuestPeriod, Quest[]>);

  return (
    <div
      className={`fixed inset-0 z-20 bg-white shadow-lg ${
        isClosing ? "admin-page-closing" : "admin-page"
      }`}
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">🛠️ Админ-панель</h2>
          <div className="flex gap-2">
            <button
              onClick={onAdd}
              className="px-3 py-1 bg-emerald-600 text-white rounded text-sm"
            >
              + Добавить
            </button>
            <button onClick={handleClose} className="text-xl">
              ×
            </button>
          </div>
        </div>

        <div>
          {periodOrder.map((period) => {
            const questsInPeriod = grouped[period];
            if (questsInPeriod.length === 0) return null;
            return (
              <div key={period} className="mb-4">
                <h4 className="text-sm font-semibold text-slate-600 mb-2">
                  {periodLabels[period]}
                </h4>
                <div className="space-y-2">
                  {questsInPeriod.map((q) => (
                    <QuestCard
                      key={q.id}
                      quest={q}
                      isAdmin={true}
                      onEdit={() => onEdit(q)}
                      onDelete={() => deleteQuest(q.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
