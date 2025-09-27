import { create } from "zustand";

/**
 * User object returned from the Telegram login widget. The structure mirrors
 * the data passed from the widget. Additional fields may appear but are
 * ignored by this type definition.
 */
export type User = {
  id?: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number;
  hash?: string;
};

export type AuthState = {
  /** Currently authenticated user, or null when anonymous */
  user: User | null;
  /** Update the current user and persist to localStorage */
  setUser: (u: User | null) => void;
};

/**
 * Zustand store for authentication. It persists the user to localStorage
 * under the key `auth:user` to survive page reloads. The user object is
 * restored on initialization.
 */
export const useAuth = create<AuthState>((set) => ({
  user: (() => {
    try {
      const raw = localStorage.getItem("auth:user");
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  })(),
  setUser: (u) => {
    if (u) {
      try {
        localStorage.setItem("auth:user", JSON.stringify(u));
      } catch {}
    } else {
      try {
        localStorage.removeItem("auth:user");
      } catch {}
    }
    set({ user: u });
  },
}));