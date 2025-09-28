import React, { useState } from "react";
import { Quest, QuestPeriod, QuestInput } from "../../../store/questStore";

interface QuestFormProps {
  mode: "create" | "edit";
  initialData?: Quest;
  onSave: (data: QuestInput) => void;
  onCancel?: () => void;
}

export const QuestForm: React.FC<QuestFormProps> = ({
  mode,
  initialData,
  onSave,
  onCancel,
}) => {
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
  const [endsAt, setEndsAt] = useState(initialData?.endsAt || "");

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value.trim()) {
      const newTag = e.currentTarget.value.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      e.currentTarget.value = "";
    }
  };

  const removeTag = (tagToRemove: string) =>
    setTags(tags.filter((tag) => tag !== tagToRemove));

  const handleSubmit = () => {
    if (!title.trim()) return;
    // Prepare quest input for saving.  Goal defaults to existing goal or 1.
    const input: QuestInput = {
      title: title.trim(),
      description: description || undefined,
      rewardCoins,
      period,
      tags,
      endsAt: endsAt || undefined,
      goal: initialData?.goal ?? 1,
    };
    onSave(input);
    if (mode === "edit" && onCancel) onCancel();
  };

  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <h3 className="font-medium mb-3">
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
          type="datetime-local"
          value={endsAt ? new Date(endsAt).toISOString().slice(0, 16) : ""}
          onChange={(e) =>
            setEndsAt(e.target.value ? e.target.value + ":00Z" : "")
          }
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
            Теги (Enter для добавления)
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
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-slate-600 font-medium"
            >
              Отмена
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
