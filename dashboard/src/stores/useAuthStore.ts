import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Role } from '@/types/domain';

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

// Step 04 stopgap — literal demo credentials. Step 07 will refactor
// to query mock-backend/users.findByEmail and compare hashed passwords.
const DEMO_EMAIL = 'admin@devon.uz';
const DEMO_PASSWORD = 'Demo2026!';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      issuedAt: null,
      expiresAt: null,
      isAuthenticated: false,
      login: async (email, password) => {
        if (Math.random() < 0.03) return { ok: false, reason: 'network' };
        await new Promise((r) => setTimeout(r, 300 + Math.random() * 300));

        if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
          return { ok: false, reason: 'invalid-credentials' };
        }

        const now = new Date();
        const issuedAt = now.toISOString();
        const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();

        set({
          user: {
            uuid: 'demo-hr-admin-uuid',
            email: DEMO_EMAIL,
            fullName: 'Sardor Allaberganov',
            roles: ['ROLE_HR_ADMIN'],
          },
          issuedAt,
          expiresAt,
          isAuthenticated: true,
        });
        return { ok: true };
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
