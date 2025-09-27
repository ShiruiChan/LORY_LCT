import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth";
import { verifyTelegramUser } from "../../utils/telegramAuth";

declare global {
  interface Window {
    TelegramOnAuthCb?: (user: any) => void;
    telegramAuthCallback?: (user: any) => void;
  }
}

export default function LoginPage() {
  const setUser = useAuth((s) => s.setUser);
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
      return;
    }

    // Глобальная функция для виджета Telegram.
    window.telegramAuthCallback = async (u: any) => {
      const isValid = await verifyTelegramUser(u);
      if (isValid) {
        setUser(u);
        navigate("/", { replace: true });
      } else {
        setError("Ошибка авторизации: проверка подписи не пройдена.");
      }
    };

    const botName = import.meta.env.VITE_TELEGRAM_BOT_NAME;
    if (!botName) {
      setError("Имя бота не указано в переменной окружения.");
      return;
    }

    const container = document.getElementById("telegram-login-container");
    if (!container) return;

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-lang", "ru");
    script.setAttribute("data-onauth", "telegramAuthCallback(user)");
    container.appendChild(script);

    return () => {
      window.telegramAuthCallback = undefined;
      container.removeChild(script);
    };
  }, [user, setUser, navigate]);

  return (
    <div className="p-6 flex flex-col items-center justify-center space-y-4 h-screen bg-gradient-to-b from-slate-50 to-white">
      <h1 className="text-xl font-semibold">Вход в игру</h1>
      <p className="text-slate-600 text-center max-w-sm">
        Войдите через Telegram, чтобы сохранить прогресс, проходить курсы
        финансовой грамотности и получать достижения.
      </p>
      <div id="telegram-login-container" />
      {error && <p className="text-red-500 text-center mt-2">{error}</p>}
    </div>
  );
}
