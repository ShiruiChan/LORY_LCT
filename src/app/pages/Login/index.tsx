import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth";
import { verifyTelegramUser } from "../../utils/telegramAuth";

// Extend the global window object to declare our callback for the
// Telegram login widget. When Telegram authenticates the user it will
// call this function with a user object. We capture it and store
// the user in our auth store.
declare global {
  interface Window {
    telegramAuthCallback?: (user: any) => void;
  }
}

export default function LoginPage() {
  const setUser = useAuth((s) => s.setUser);
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  // Track any error that occurs during verification. When set, an error
  // message is displayed to the user.
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If user is already authenticated redirect to the home page
    if (user) {
      navigate("/", { replace: true });
      return;
    }
    // Register global callback. The Telegram widget will invoke
    // `telegramAuthCallback(user)` when the user completes authentication.
    window.telegramAuthCallback = async (userData: any) => {
      // Verify the signature returned by Telegram. If verification fails
      // we refuse to authenticate and display an error.
      const isValid = await verifyTelegramUser(userData);
      if (isValid) {
        setUser(userData);
        navigate("/", { replace: true });
      } else {
        console.error("Invalid Telegram auth hash. Login attempt rejected.");
        setError("Ошибка авторизации: данные не прошли проверку.");
      }
    };
    // Dynamically inject the Telegram login widget script. The bot name
    // should be defined in your .env file under VITE_TELEGRAM_BOT_NAME.
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
      {error && <p className="text-red-500 text-center mt-2">{error}</p>}
    </div>
  );
}