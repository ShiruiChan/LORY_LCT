import React from "react";
import { NavLink } from "react-router-dom";
import IconButton from "./IconButton";
import {
  IconMap,
  IconDiscover as IconAcademy,
  IconProfile,
  IconQuests,
  IconShop as IconWallet,
} from "./Icons";

const linkBase = "flex flex-col items-center text-xs transition-colors";
const active = "text-slate-900";
const inactive = "text-slate-500";

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-slate-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto max-w-md grid grid-cols-5 py-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          <IconButton label="Город">
            <IconMap className="w-6 h-6" />
          </IconButton>
        </NavLink>
        <NavLink
          to="/wallet"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          <IconButton label="Кошелёк">
            <IconWallet className="w-6 h-6" />
          </IconButton>
        </NavLink>
        <NavLink
          to="/academy"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          <IconButton label="Академия">
            <IconAcademy className="w-6 h-6" />
          </IconButton>
        </NavLink>
        <NavLink
          to="/quests"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          <IconButton label="Квесты">
            <IconQuests className="w-6 h-6" />
          </IconButton>
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          <IconButton label="Профиль">
            <IconProfile className="w-6 h-6" />
          </IconButton>
        </NavLink>
      </div>
    </nav>
  );
}
