import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth";

// Extend the global window object to declare our callback for the
// Telegram login widget. When Telegram authenticates the user it will
// call this function with a user object. We capture it and store
// the user in our auth store.

export default function LoginPage() {
  const setUser = useAuth((s) => s.setUser);
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();

  // If the user is already authenticated (unlikely since we disabled auth), redirect
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    } else {
      // Temporarily log in as a guest. We could set a default user or simply redirect.
      setUser({ first_name: 'Гость' });
      navigate('/', { replace: true });
    }
  }, [user, navigate, setUser]);

  return (
    <div className="p-6 flex flex-col items-center justify-center space-y-4 h-screen bg-gradient-to-b from-slate-50 to-white">
      <h1 className="text-xl font-semibold">Авторизация отключена</h1>
      <p className="text-slate-600 text-center max-w-sm">
        Авторизация через Telegram временно недоступна. Вы будете перенаправлены в игру как гость.
      </p>
    </div>
  );
}