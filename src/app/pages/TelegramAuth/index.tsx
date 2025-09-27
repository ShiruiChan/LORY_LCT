import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth';
import { verifyTelegramUser } from '../../utils/telegramAuth';

/**
 * TelegramAuthPage processes the query parameters added by Telegram when a user
 * clicks a Login URL button in a bot message. It verifies the signature of the
 * data using the bot token hash and stores the user in the auth store on success.
 *
 * Route: /telegram-login
 * Expected query parameters:
 *   id, first_name, last_name?, username?, photo_url?, auth_date, hash
 */
export default function TelegramAuthPage() {
  const setUser = useAuth((s) => s.setUser);
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('Проверка данных...');

  useEffect(() => {
    (async () => {
      // Parse query parameters from the URL
      const params = new URLSearchParams(window.location.search);
      const user: Record<string, any> = {};
      params.forEach((value, key) => {
        user[key] = value;
      });

      // Verify the Telegram data signature
      const valid = await verifyTelegramUser(user);
      if (valid) {
        setUser(user);
        setStatus('Авторизация успешна, перенаправляем...');
        // Delay a moment to allow the user to read the message
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1000);
      } else {
        setStatus('Ошибка проверки подписи. Пожалуйста, попробуйте снова.');
      }
    })();
  }, [setUser, navigate]);

  return (
    <div className="p-6 flex flex-col items-center justify-center space-y-4 h-screen">
      <h1 className="text-xl font-semibold">Авторизация через Telegram</h1>
      <p className="text-slate-600 text-center max-w-sm">{status}</p>
    </div>
  );
}