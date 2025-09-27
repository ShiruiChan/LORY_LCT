import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth";
import TelegramLoginWidget from "../../components/TelegramLoginWidget";

export default function LoginPage() {
  const setUser = useAuth((s) => s.setUser);
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();

  const handleAuth = (tgUser: any) => {
    // Здесь можно добавить валидацию подписи, если требуется
    setUser(tgUser);
    navigate("/", { replace: true });
  };

  // Если пользователь уже авторизован – редирект
  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  const botName = import.meta.env.VITE_TELEGRAM_BOT_NAME || "LORY_LCT_bot";

  return (
    <div className="p-6 flex flex-col items-center justify-center space-y-4 h-screen">
      <h1 className="text-xl font-semibold">Вход в игру</h1>
      <p className="text-slate-600 text-center max-w-sm">
        Войдите через Telegram, чтобы сохранить прогресс, проходить курсы
        финансовой грамотности и получать достижения.
      </p>
      <TelegramLoginWidget botName={botName} onAuth={handleAuth} />
    </div>
  );
}
