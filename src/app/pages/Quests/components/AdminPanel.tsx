// src/AdminPanel.tsx
import React, { useMemo, useState } from "react";
import { useQuests } from "../questStore";
import { Quest } from "../types";
import { QuestCard } from "./QuestCard";
import { motion, AnimatePresence } from "framer-motion";

type AdminPanelProps = {
  onClose: () => void;
  onEdit: (q: Quest) => void;
  onAdd: () => void;
};

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onClose,
  onEdit,
  onAdd,
}) => {
  const { quests, deleteQuest } = useQuests();
  const [tab, setTab] = useState<"regular" | "events">("regular");
  const [regularPeriod, setRegularPeriod] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");

  const now = useMemo(() => new Date(), []);
  const [dayISO, setDayISO] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const thisWeek = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const week = Math.ceil(
      ((+d - +oneJan) / 86400000 + oneJan.getDay() + 1) / 7
    );
    return `${year}-W${String(week).padStart(2, "0")}`;
  }, []);
  const [weekISO, setWeekISO] = useState<string>(thisWeek);

  const [monthISO, setMonthISO] = useState<string>(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });

  const toDate = (s?: string) => (s ? new Date(s) : null);
  const isBetween = (d: Date, a: Date, b: Date) => d >= a && d <= b;

  const dayRange = useMemo(() => {
    const start = new Date(dayISO + "T00:00:00Z");
    const end = new Date(dayISO + "T23:59:59Z");
    return { start, end };
  }, [dayISO]);

  const weekRange = useMemo(() => {
    const [y, wStr] = weekISO.split("-W");
    const yN = Number(y);
    const w = Number(wStr);
    const simple = new Date(Date.UTC(yN, 0, 1 + (w - 1) * 7));
    const dow = (simple.getUTCDay() + 6) % 7;
    const monday = new Date(simple);
    monday.setUTCDate(simple.getUTCDate() - dow);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const start = new Date(monday.toISOString().slice(0, 10) + "T00:00:00Z");
    const end = new Date(sunday.toISOString().slice(0, 10) + "T23:59:59Z");
    return { start, end };
  }, [weekISO]);

  const monthRange = useMemo(() => {
    const [yStr, mStr] = monthISO.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, 0, 23, 59, 59));
    return { start, end };
  }, [monthISO]);

  const isEvent = (q: Quest) => q.questType === "event";
  const isRegular = (q: Quest) => q.questType === "regular";

  const isScheduled = (q: Quest) => {
    const start = toDate(q.startsAt);
    return !!(start && start > now);
  };

  const isActive = (q: Quest) => {
    const start = toDate(q.startsAt);
    const end = toDate(q.endsAt);
    if (!start) return q.status === "active" || q.status === "available";
    return start <= now && (!end || end >= now);
  };

  const inSelectedBucket = (q: Quest) => {
    if (!isRegular(q)) return false;
    if (q.period !== regularPeriod) return false;
    if (!q.startsAt) return true;

    const d = new Date(q.startsAt);
    if (regularPeriod === "daily")
      return isBetween(d, dayRange.start, dayRange.end);
    if (regularPeriod === "weekly")
      return isBetween(d, weekRange.start, weekRange.end);
    return isBetween(d, monthRange.start, monthRange.end);
  };

  const events = quests.filter(isEvent);
  const regularQuests = quests.filter(isRegular);

  const activeEvents = events.filter(isActive);
  const scheduledEvents = events.filter(isScheduled);

  const scopedRegular = regularQuests.filter(inSelectedBucket);
  const activeRegular = scopedRegular.filter(isActive);
  const scheduledRegular = scopedRegular.filter(isScheduled);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-40 backdrop-blur-sm bg-black/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-stretch justify-center"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 1 }}
      >
        <motion.div
          className="relative w-full max-w-[430px] h-screen bg-white shadow-xl rounded-none sm:rounded-2xl sm:my-6 overflow-hidden"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
        >
          {/* Хедер */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setTab("regular")}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    tab === "regular"
                      ? "bg-white/90 text-slate-900 shadow"
                      : "bg-white/10"
                  }`}
                >
                  Обычные
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setTab("events")}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    tab === "events"
                      ? "bg-white/90 text-slate-900 shadow"
                      : "bg-white/10"
                  }`}
                >
                  Ивенты
                </motion.button>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={onAdd}
                  className="px-3 py-1.5 rounded-full text-sm bg-white/95 text-slate-900 shadow"
                >
                  + Добавить
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9, rotate: 90 }}
                  onClick={onClose}
                  aria-label="Закрыть"
                  className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
                >
                  ×
                </motion.button>
              </div>
            </div>

            {/* Переключатель периодов и дата-контролы */}
            {tab === "regular" && (
              <div className="px-3 pb-3">
                <div className="flex gap-2 mb-2">
                  {(["daily", "weekly", "monthly"] as const).map((p) => (
                    <motion.button
                      key={p}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setRegularPeriod(p)}
                      className={`px-3 py-1.5 rounded-full text-sm transition ${
                        regularPeriod === p
                          ? "bg-white text-slate-900 shadow"
                          : "bg-white/15 text-white"
                      }`}
                    >
                      {p === "daily"
                        ? "Ежедневные"
                        : p === "weekly"
                        ? "Еженедельные"
                        : "Ежемесячные"}
                    </motion.button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {regularPeriod === "daily" && (
                    <input
                      type="date"
                      value={dayISO}
                      onChange={(e) => setDayISO(e.target.value)}
                      className="px-3 py-2 rounded-lg w-full bg-white/95 text-slate-800 shadow-inner"
                    />
                  )}
                  {regularPeriod === "weekly" && (
                    <input
                      type="week"
                      value={weekISO}
                      onChange={(e) => setWeekISO(e.target.value)}
                      className="px-3 py-2 rounded-lg w-full bg-white/95 text-slate-800 shadow-inner"
                    />
                  )}
                  {regularPeriod === "monthly" && (
                    <input
                      type="month"
                      value={monthISO}
                      onChange={(e) => setMonthISO(e.target.value)}
                      className="px-3 py-2 rounded-lg w-full bg-white/95 text-slate-800 shadow-inner"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Контент */}
          <div className="p-3 max-h-[calc(100vh-136px)] overflow-y-auto bg-slate-50">
            {tab === "regular" && (
              <SectionedList
                active={activeRegular}
                scheduled={scheduledRegular}
                emptyText="Нет квестов в выбранный период"
                onEdit={onEdit}
                onDelete={(id) => deleteQuest(id)}
              />
            )}
            {tab === "events" && (
              <SectionedList
                active={activeEvents}
                scheduled={scheduledEvents}
                emptyText="Ивентов нет"
                onEdit={onEdit}
                onDelete={(id) => deleteQuest(id)}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

function SectionedList({
  active,
  scheduled,
  emptyText,
  onEdit,
  onDelete,
}: {
  active: Quest[];
  scheduled: Quest[];
  emptyText: string;
  onEdit: (q: Quest) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <AnimatePresence initial={false}>
        {active.length > 0 && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <h4 className="text-xs font-semibold text-emerald-700 mb-2">
              Активные
            </h4>
            <motion.div
              layout
              className="space-y-2"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.04 } },
              }}
            >
              {active.map((q) => (
                <motion.div
                  key={q.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                >
                  <QuestCard
                    quest={q}
                    isAdmin
                    onEdit={() => onEdit(q)}
                    onDelete={() => onDelete(q.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {scheduled.length > 0 && (
          <motion.div
            key="scheduled"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <h4 className="text-xs font-semibold text-slate-700 mb-2">
              Запланированные
            </h4>
            <motion.div
              layout
              className="space-y-2"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.04 } },
              }}
            >
              {scheduled.map((q) => (
                <motion.div
                  key={q.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                >
                  <QuestCard
                    quest={q}
                    isAdmin
                    onEdit={() => onEdit(q)}
                    onDelete={() => onDelete(q.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {active.length === 0 && scheduled.length === 0 && (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            className="text-slate-500 text-center py-8"
          >
            {emptyText}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
