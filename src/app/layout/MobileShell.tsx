import React from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function MobileShell() {
  return (
    <div className="min-h-screen relative app-shell bg-white">
      <main className="pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
