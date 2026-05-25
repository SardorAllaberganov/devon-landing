import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Role } from '@/types/domain';
import { findUserByEmail, listEmployees, MockNetworkError } from '@/lib/mock-backend';
import { sha256Hex } from '@/lib/hash';

export interface SessionUser {
  uuid: string;
  email: string;
  fullName: string;
  roles: Role[];
}

type LoginResult = { ok: true } | { ok: false; reason: 'invalid-credentials' | 'network' };

interface AuthState {
  user: SessionUser | null;
  issuedAt: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  isExpired: () => boolean;
}

const STORAGE_KEY = 'devon.dashboard.session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      issuedAt: null,
      expiresAt: null,
      isAuthenticated: false,
      login: async (email, password) => {
        try {
          const user = await findUserByEmail(email.trim());
          if (!user) return { ok: false, reason: 'invalid-credentials' };

          const hash = await sha256Hex(password);
          if (hash !== user.passwordHash) return { ok: false, reason: 'invalid-credentials' };

          let fullName = user.email;
          if (user.employeeUuid) {
            const employees = await listEmployees();
            fullName =
              employees.find((e) => e.uuid === user.employeeUuid)?.fullNameGenerated ??
              user.email;
          }

          const now = new Date();
          set({
            user: {
              uuid: user.uuid,
              email: user.email,
              fullName,
              roles: user.roles,
            },
            issuedAt: now.toISOString(),
            expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
            isAuthenticated: true,
          });
          return { ok: true };
        } catch (err) {
          if (err instanceof MockNetworkError) return { ok: false, reason: 'network' };
          throw err;
        }
      },
      logout: () => set({ user: null, issuedAt: null, expiresAt: null, isAuthenticated: false }),
      isExpired: () => {
        const exp = get().expiresAt;
        if (!exp) return true;
        return new Date(exp).getTime() < Date.now();
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
