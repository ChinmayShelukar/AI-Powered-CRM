import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, Role } from "@/types/api";

interface AuthState {
  token: string | null;
  userId: number | null;
  email: string | null;
  name: string | null;
  role: Role | null;
  setAuth: (auth: AuthResponse) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      userId: null,
      email: null,
      name: null,
      role: null,
      setAuth: (auth) =>
        set({
          token: auth.token,
          userId: auth.userId,
          email: auth.email,
          name: auth.name,
          role: auth.role,
        }),
      clear: () =>
        set({
          token: null,
          userId: null,
          email: null,
          name: null,
          role: null,
        }),
      isAuthenticated: () => !!get().token,
    }),
    { name: "cortex-auth" }
  )
);
