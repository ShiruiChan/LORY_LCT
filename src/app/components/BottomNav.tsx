import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  IconMap,
  IconDiscover as IconAcademy,
  IconProfile,
  IconQuests,
  IconShop as IconWallet,
} from "./Icons";

/**
 * Animated bottom navigation bar. When a tab is active, a circular indicator
 * smoothly slides to that tab and raises the icon slightly. This component
 * uses refs to measure tab positions and applies CSS transitions to the
 * indicator for fluid movement. The active icon is also raised with a
 * translate‑y transformation.
 */
export default function BottomNav() {
  const location = useLocation();
  // Define navigation items
  const items: { to: string; label: string; Icon: React.ComponentType<any> }[] =
    [
      { to: "/", label: "Город", Icon: IconMap },
      { to: "/wallet", label: "Кошелёк", Icon: IconWallet },
      { to: "/academy", label: "Академия", Icon: IconAcademy },
      { to: "/quests", label: "Квесты", Icon: IconQuests },
      { to: "/profile", label: "Профиль", Icon: IconProfile },
    ];

  // Refs to each nav item to measure positions
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  // Ref for the white "wave" behind the indicator
  const waveRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Force re‑compute on window resize
  const [_, setDims] = useState<number>(0);

  // Determine active index based on location
  const activeIndex = items.findIndex(({ to }) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  });

  // Update indicator position when active index or resize changes
  useEffect(() => {
    const update = () => {
      const activeEl = itemRefs.current[activeIndex];
      if (activeEl && indicatorRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const rect = activeEl.getBoundingClientRect();
        const indicatorWidth = 56; // width of the indicator circle
        // Calculate left offset: center the indicator on the active tab
        const left =
          rect.left - containerRect.left + rect.width / 2 - indicatorWidth / 2;
        indicatorRef.current.style.transform = `translateX(${left}px)`;
        // Move the wave behind the indicator at the same horizontal position
        if (waveRef.current) {
          waveRef.current.style.transform = `translateX(${left}px)`;
        }
      }
    };
    update();
  }, [activeIndex]);

  // Update dimensions on resize
  useEffect(() => {
    const handle = () => setDims((x) => x + 1);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Container with rounded background */}
      <div
        ref={containerRef}
        className="relative mx-auto max-w-md px-4 overflow-visible"
      >
        <div className="absolute inset-0 flex items-center justify-between px-3 py-3 bg-white/90 backdrop-blur-md border-t border-slate-200 rounded-t-3xl shadow-[0_-1px_4px_rgba(0,0,0,0.05)] z-0" />
        {/* Wave background behind the indicator */}
        <div
          ref={waveRef}
          className="absolute bottom-[20px] -ml-2 w-18 h-18 rounded-full bg-white/90 border-t border-slate-200 shadow-inner transition-transform duration-300 ease-out pointer-events-none z-10"
          style={{ left: 0 }}
        />
        {/* Indicator */}
        <div
          ref={indicatorRef}
          className="absolute bottom-[28px] w-14 h-14 rounded-full bg-blue-600 shadow-lg transition-transform duration-300 ease-out pointer-events-none z-20"
          style={{ left: 0 }}
        />
        <div className="relative flex justify-between items-end z-30">
          {items.map(({ to, label, Icon }, index) => {
            const isActive = index === activeIndex;
            return (
              <div
                key={to}
                // ⬇️ важно: блочное тело, НИЧЕГО не возвращаем
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                className="flex-1 flex justify-center"
              >
                <Link
                  to={to}
                  className="relative flex flex-col items-center"
                  aria-label={label}
                >
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
                      isActive ? "text-white" : "text-slate-500"
                    }`}
                    style={{
                      transform: isActive
                        ? "translateY(-8px)"
                        : "translateY(0)",
                    }}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                  </div>
                  <span
                    className={`mb-2 text-[11px] transition-colors ${
                      isActive ? "text-blue-600 font-medium" : "text-slate-500"
                    }`}
                    style={{
                      transform: isActive
                        ? "translateY(-6px)"
                        : "translateY(0)",
                    }}
                  >
                    {label}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
