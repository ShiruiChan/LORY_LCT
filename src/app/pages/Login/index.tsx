import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth";
import { verifyTelegramUser } from "../../utils/telegramAuth";

declare global {
  interface Window {
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

    // callback для виджета
    window.telegramAuthCallback = async (userData: any) => {
      const isValid = await verifyTelegramUser(userData);
      if (isValid) {
        setUser(userData);
        navigate("/", { replace: true });
      } else {
        setError("Ошибка авторизации: данные не прошли проверку.");
      }
    };

    const botName = import.meta.env.VITE_TELEGRAM_BOT_NAME;
    if (!botName) return;
    const container = document.getElementById("telegram-login-container");
    if (!container) return;

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-lang", "ru");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "telegramAuthCallback(user)");
    container.appendChild(script);

    return () => {
      window.telegramAuthCallback = undefined;
      container.removeChild(script);
    };
  }, [user, navigate, setUser]);

  return (
    <div className="p-6 flex flex-col items-center justify-center space-y-4 h-screen">
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
