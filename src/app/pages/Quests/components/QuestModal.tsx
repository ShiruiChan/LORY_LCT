import React, { useState, useEffect } from "react";
import {
  useQuests,
  Quest,
  QuestPeriod,
  QuestInput,
} from "../../../store/questStore";

interface QuestModalProps {
  mode: "create" | "edit";
  initialData?: Quest;
  onClose: () => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({
  mode,
  initialData,
  onClose,
}) => {
  const { addQuest, updateQuest } = useQuests();

  /* ---------- состояния формы (без изменений) ---------- */
  const formatDateForInput = (iso?: string): string => {
    if (!iso) return "";
    return new Date(iso).toISOString().split("T")[0];
  };

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [rewardCoins, setRewardCoins] = useState(
    initialData?.rewardCoins || 100
  );
  const [period, setPeriod] = useState<QuestPeriod>(
    initialData?.period || "daily"
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [endsAt, setEndsAt] = useState(formatDateForInput(initialData?.endsAt));

  /* ---------- анимация: появление / исчезновение ---------- */
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // запускаем анимацию появления сразу после монтирования
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsVisible(false); // 1. начинаем убирать
    setTimeout(onClose, 300); // 2. через 300 мс просим родителя размонтировать
  };

  /* ---------- остальные хэндлеры (без изменений) ---------- */
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value.trim()) {
      const newTag = e.currentTarget.value.trim();
      if (!tags.includes(newTag)) setTags([...tags, newTag]);
      e.currentTarget.value = "";
    }
  };
  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleSubmit = () => {
    if (!title.trim()) return;
    // Convert endsAt to an ISO string if provided
    const endsAtIso = endsAt ? `${endsAt}T00:00:00Z` : undefined;
    // Assemble quest input.  Goal defaults to existing goal or 1 when editing
    const questInput: QuestInput = {
      title: title.trim(),
      description: description || undefined,
      rewardCoins,
      period,
      tags,
      endsAt: endsAtIso,
      goal: mode === "create" ? 1 : initialData?.goal ?? 1,
    };
    mode === "create"
      ? addQuest(questInput)
      : updateQuest(initialData!.id, questInput);
    handleClose();
  };

  /* ---------- рендер ---------- */
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center"
      style={{
        transition: "opacity 300ms ease-out",
        opacity: isVisible ? 1 : 0,
      }}
    >
      {/* фон-затемнение */}
      <div
        className="absolute inset-0 backdrop-blur-sm bg-black/40"
        onClick={handleClose}
        style={{
          transition: "opacity 300ms ease-out",
          opacity: isVisible ? 1 : 0,
        }}
      />

      {/* панель */}
      <div
        className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-4 max-h-[80vh] overflow-y-auto"
        style={{
          transition: "transform 300ms ease-out, opacity 300ms ease-out",
          transform: isVisible
            ? "translateY(0) scale(1)"
            : "translateY(100%) scale(0.96)",
          opacity: isVisible ? 1 : 0,
        }}
      >
        <h3 className="font-bold mb-4">
          {mode === "create" ? "Добавить квест" : "Редактировать квест"}
        </h3>

        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название *"
            className="w-full p-2 border rounded"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание"
            rows={2}
            className="w-full p-2 border rounded"
          />
          <input
            type="date"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="w-full p-2 border rounded"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="1"
              value={rewardCoins}
              onChange={(e) => setRewardCoins(Number(e.target.value))}
              placeholder="Награда (монеты)"
              className="p-2 border rounded"
            />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as QuestPeriod)}
              className="p-2 border rounded"
            >
              <option value="daily">Ежедневный</option>
              <option value="weekly">Еженедельный</option>
              <option value="monthly">Ежемесячный</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-600 block mb-1">
              Теги (Enter)
            </label>
            <input
              onKeyDown={handleTagInput}
              placeholder="Например: обучение"
              className="w-full p-2 border rounded"
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-xs bg-slate-200 px-2 py-0.5 rounded flex items-center"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-slate-500 hover:text-slate-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-emerald-600 text-white py-2 rounded font-medium"
            >
              {mode === "create" ? "Добавить" : "Сохранить"}
            </button>
            <button onClick={handleClose} className="px-4 py-2 text-slate-600">
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
