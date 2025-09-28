// src/pages/QuestsPage.tsx
import React, { useEffect, useState } from 'react';
import { useQuests, Quest, QuestPeriod } from './questStore';
import { QuestCard } from './components/QuestCard';
import { AdminPanel } from './components/AdminPanel';
import { QuestModal } from './components/QuestModal';

const periodUpdateTimes = {
  daily: '00:00',
  weekly: 'Понедельник, 00:00',
  monthly: '1-е число, 00:00',
};

export default function QuestsPage() {
  const { quests, fetch, start, claim } = useQuests();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; quest?: Quest } | null>(null);

  useEffect(() => {
    fetch();
    const t = setInterval(fetch, 30_000);
    return () => clearInterval(t);
  }, [fetch]);

  const periodOrder: QuestPeriod[] = ['daily', 'weekly', 'monthly'];
  const grouped = periodOrder.reduce(
    (acc, period) => {
      acc[period] = quests.filter((q) => q.period === period && q.status !== 'locked');
      return acc;
    },
    {} as Record<QuestPeriod, Quest[]>
  );

  const hasVisibleQuests = Object.values(grouped).some(group => group.length > 0);

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Основной контент */}
      <div className={`transition-opacity duration-300 ${isAdminOpen ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        <div className=" top-0 z-10 bg-white p-4  flex justify-between items-start">
          <h1 className="text-xl font-bold text-slate-800">Квесты</h1>
          {/* Улучшенный переключатель */}
          <div className="flex flex-col items-end">
            <span className="text-xs font-medium text-slate-700 mb-1">Админ-панель</span>
            <div
              className="relative w-8 h-4 flex items-center rounded-full bg-slate-400 cursor-pointer"
              onClick={() => setIsAdminOpen(!isAdminOpen)}
            >
              <div
                className={`absolute w-3 h-3 rounded-full bg-white shadow transition-transform duration-500 ${
                  isAdminOpen ? 'translate-x-8' : 'translate-x-0.5'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Даты обновления — как раньше */}
        <div className="px-4 pb-4 text-xs text-slate-500 space-y-1">
          <p>🕗 Ежедневные квесты обновляются в {periodUpdateTimes.daily}</p>
          <p>📅 Еженедельные — {periodUpdateTimes.weekly}</p>
          <p>📆 Ежемесячные — {periodUpdateTimes.monthly}</p>
        </div>

        <div className="p-4 pt-0 space-y-6">
          {hasVisibleQuests ? (
            periodOrder.map((period) => {
              const questsInPeriod = grouped[period];
              if (questsInPeriod.length === 0) return null;
              return (
                <div key={period}>
                  <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    {period === 'daily' ? 'Ежедневные' : period === 'weekly' ? 'Еженедельные' : 'Ежемесячные'}
                  </h2>
                  <div className="space-y-3">
                    {questsInPeriod.map((q) => (
                      <QuestCard
                        key={q.id}
                        quest={q}
                        isAdmin={false}
                        onStart={() => start(q.id)}
                        onClaim={() => claim(q.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-slate-500">
              Квесты закончились. Скоро появятся новые!
            </div>
          )}
        </div>
      </div>

      {/* Админ-панель: плавная страница сверху */}
      {isAdminOpen && <AdminPanel onClose={() => setIsAdminOpen(false)} onEdit={(q) => setModal({ mode: 'edit', quest: q })} onAdd={() => setModal({ mode: 'create' })} />}

      {/* Модальное окно для добавления/редактирования */}
      {modal && (
        <QuestModal
          mode={modal.mode}
          initialData={modal.quest}
          onClose={() => setModal(null)}
        />
      )}

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(-100%); opacity: 0; }
        }
        .admin-page {
          animation: slideDown 0.5s ease-out;
        }
        .admin-page-closing {
          animation: slideUp 0.5s ease-in;
        }
      `}</style>
    </div>
  );
}