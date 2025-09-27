import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth";

declare global {
  interface Window {
    telegramAuthCallback?: (user: any) => void;
  }
}

export default function LoginPage() {
  const setUser = useAuth((s) => s.setUser);
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
      return;
    }
    window.telegramAuthCallback = (userData: any) => {
      setUser(userData);
      navigate("/", { replace: true });
    };
    const botName = import.meta.env.VITE_TELEGRAM_BOT_NAME;
    if (!botName) return;
    const container = document.getElementById("telegram-login-container");
    if (!container) return;
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?21";
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-lang", "ru");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "telegramAuthCallback(user)");
    container.appendChild(script);
    // Clean up callback on unmount
    return () => {
      window.telegramAuthCallback = undefined;
    };
  }, [setUser, user, navigate]);

  return (
    <div className="p-6 flex flex-col items-center justify-center space-y-4 h-screen bg-gradient-to-b from-slate-50 to-white">
      <h1 className="text-xl font-semibold">Вход в игру</h1>
      <p className="text-slate-600 text-center max-w-sm">
        Войдите через Telegram, чтобы сохранить прогресс, проходить курсы
        финансовой грамотности и получать достижения.
      </p>
      <div id="telegram-login-container" />
    </div>
  );
}
