import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import BottomNav from "./app/components/BottomNav";
import { useAuth } from "./app/store/auth";

// Lazy‑loaded pages to reduce initial bundle size
const CityPage = lazy(() => import("./app/pages/City"));
const WalletPage = lazy(() => import("./app/pages/Wallet"));
const AcademyPage = lazy(() => import("./app/pages/Academy"));
const QuestsPage = lazy(() => import("./app/pages/Quests"));
const ProfilePage = lazy(() => import("./app/pages/Profile"));
const LoginPage = lazy(() => import("./app/pages/Login"));
const LessonPage = lazy(() => import("./app/pages/Academy/Lesson"));

export default function App() {
  const location = useLocation();
  const isLogin = location.pathname === "/login";
  // Always display the navigation bar except on the login page
  const showNav = !isLogin;

  return (
    <div className="min-h-screen relative app-shell bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <main className="pb-24 max-w-md mx-auto w-full">
        <Suspense
          fallback={
            <div className="p-6 animate-pulse">
              <div className="h-5 w-24 bg-slate-200 rounded mb-4" />
              <div className="h-40 w-full bg-slate-200 rounded-xl" />
            </div>
          }
        >
          <Routes>
            {/* If you decide to add login back in the future, keep this route */}
            <Route path="/login" element={<LoginPage />} />
            {/* Main app routes accessible without authentication */}
            <Route path="/" element={<CityPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/academy" element={<AcademyPage />} />
            <Route path="/academy/:id" element={<LessonPage />} />
            <Route path="/quests" element={<QuestsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
