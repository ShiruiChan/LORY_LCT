import React, { useEffect, useMemo, useState } from "react";
import { useQuests } from "./questStore";
import { Quest, QuestPeriod } from "./types";
import { QuestCard } from "./components/QuestCard";
import { AdminPanel } from "./components/AdminPanel";
import { QuestModal } from "./components/QuestModal";

const periodUpdateTimes: Record<QuestPeriod, string> = {
  daily: "00:00",
  weekly: "Понедельник, 00:00",
  monthly: "1-е число, 00:00",
};

export default function QuestsPage() {
  const { quests, fetch, addQuest, updateQuest } = useQuests();

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isClosingAdmin, setIsClosingAdmin] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | undefined>(
    undefined
  );

  // безопасный вызов fetch (если вдруг заменишь стор)
  useEffect(() => {
    if (typeof fetch === "function") {
      fetch().catch(console.error);
    }
  }, [fetch]);

  // Группы для пользовательского экрана
  const dailyQuests = useMemo(
    () =>
      quests.filter((q) => q.questType === "regular" && q.period === "daily"),
    [quests]
  );
  const weeklyQuests = useMemo(
    () =>
      quests.filter((q) => q.questType === "regular" && q.period === "weekly"),
    [quests]
  );
  const monthlyQuests = useMemo(
    () =>
      quests.filter((q) => q.questType === "regular" && q.period === "monthly"),
    [quests]
  );

  const now = new Date();
  const eventsActive = useMemo(
    () =>
      quests.filter(
        (q) =>
          q.questType === "event" &&
          q.startsAt &&
          new Date(q.startsAt) <= now &&
          (!q.endsAt || new Date(q.endsAt) >= now)
      ),
    [quests, now]
  );

  const handleCloseAdmin = () => {
    setIsClosingAdmin(true);
    setTimeout(() => {
      setIsAdminOpen(false);
      setIsClosingAdmin(false);
    }, 320);
  };

  const openCreate = () => {
    setEditingQuest(undefined);
    setModalOpen(true);
  };
  const openEdit = (q: Quest) => {
    setEditingQuest(q);
    setModalOpen(true);
  };

  const handleSubmitQuest = (q: Quest) => {
    const exists = quests.some((x) => x.id === q.id);
    if (exists) updateQuest(q);
    else addQuest(q);
  };

  return (
    <div className="relative min-h-screen bg-[linear-gradient(180deg,#f8fafc,white)]">
      <div className="pointer-events-none absolute -top-24 right-[-120px] h-[360px] w-[360px] rounded-full bg-emerald-200/40 blur-3xl" />

      {/* Шапка */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-md">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-white/20 grid place-items-center font-bold">
              Q
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Квесты</h1>
              <p className="text-xs opacity-80">
                Ежедневные · Еженедельные · Ежемесячные
              </p>
            </div>
          </div>

          {/* только тумблер админки (кнопки «Добавить» здесь больше нет) */}
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-medium opacity-90 mb-1">
              Админ-панель
            </span>
            <button
              onClick={() => setIsAdminOpen((v) => !v)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition
                ${
                  isAdminOpen ? "bg-white/90" : "bg-white/25 hover:bg-white/35"
                }`}
              aria-pressed={isAdminOpen}
              aria-label="Переключить админ-панель"
            >
              <span
                className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform
                ${
                  isAdminOpen
                    ? "translate-x-6 bg-emerald-600 shadow-emerald-600/30"
                    : ""
                }`}
              />
              <span className="sr-only">Админ-панель</span>
            </button>
          </div>
        </div>
      </div>

      {/* Пользовательский контент — без тегов и без «запланированных» */}
      <div
        className={`transition-all duration-300 ${
          isAdminOpen
            ? "opacity-40 blur-[1px] pointer-events-none"
            : "opacity-100 blur-0"
        }`}
      >
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Section
            title="Ежедневные"
            subtitle={`Обновляются в ${periodUpdateTimes.daily}`}
            items={dailyQuests}
            emptyText="Пока нет ежедневных квестов"
          />
          <Section
            title="Еженедельные"
            subtitle={`Обновляются: ${periodUpdateTimes.weekly}`}
            items={weeklyQuests}
            emptyText="Пока нет еженедельных квестов"
          />
          <Section
            title="Ежемесячные"
            subtitle={`Обновляются: ${periodUpdateTimes.monthly}`}
            items={monthlyQuests}
            emptyText="Пока нет ежемесячных квестов"
          />

          {/* Ивенты — показываем только активные */}
          <div className="mt-10">
            <h2 className="text-sm font-semibold text-slate-700">Ивенты</h2>
            {eventsActive.length > 0 ? (
              <div className="mt-2 space-y-2">
                {eventsActive.map((q) => (
                  <QuestCard key={q.id} quest={q} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-center text-sm text-slate-500 bg-white/60 rounded-xl border border-slate-200 py-6">
                Нет активных ивентов
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Админ-панель: здесь есть +Добавить, теги и блоки «Запланированные» */}
      {isAdminOpen && (
        <div
          className={`fixed inset-0 z-30 ${
            isClosingAdmin ? "admin-page-closing" : "admin-page"
          }`}
        >
          <AdminPanel
            onAdd={openCreate}
            onEdit={openEdit}
            onClose={handleCloseAdmin}
          />
        </div>
      )}

      {/* Модалка создания/редактирования (инициализируется существующими данными при редактировании) */}
      <QuestModal
        open={modalOpen}
        initial={editingQuest}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitQuest}
      />

      <style>{`
  @keyframes slideDown {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(0);    opacity: 1; }
    to   { transform: translateY(-100%); opacity: 0; }
  }
  .admin-page {
    animation: slideDown 420ms cubic-bezier(.22,.98,.29,.99);
  }
  .admin-page-closing {
    animation: slideUp 320ms cubic-bezier(.2,.8,.2,1);
  }
`}</style>
    </div>
  );
}

function Section({
  title,
  subtitle,
  items,
  emptyText,
}: {
  title: string;
  subtitle?: string;
  items: Quest[];
  emptyText: string;
}) {
  return (
    <section className="mt-6">
      <div className="flex items-end justify-between">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        {subtitle && (
          <span className="text-[11px] text-slate-500">{subtitle}</span>
        )}
      </div>
      {items.length > 0 ? (
        <div className="mt-2 space-y-2">
          {items.map((q) => (
            <QuestCard key={q.id} quest={q} />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-center text-sm text-slate-500 bg-white/60 rounded-xl border border-slate-200 py-6">
          {emptyText}
        </p>
      )}
    </section>
  );
}
