// src/app/components/TelegramLoginWidget.tsx
import React, { useEffect, useRef } from "react";

interface Props {
  botName: string;
  onAuth: (user: any) => void;
}

export default function TelegramLoginWidget({ botName, onAuth }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Делаем callback глобальным, чтобы Telegram смог его найти
    (window as any).onTelegramAuth = (user: any) => onAuth(user);

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");

    containerRef.current?.appendChild(script);

    return () => {
      // Удаляем скрипт и callback при размонтировании
      delete (window as any).onTelegramAuth;
      if (containerRef.current && script.parentNode === containerRef.current) {
        containerRef.current.removeChild(script);
      }
    };
  }, [botName, onAuth]);

  return <div ref={containerRef} />;
}
