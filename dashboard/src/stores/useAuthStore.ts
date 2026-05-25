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
  /**
   * Re-derive the persisted session's `fullName` (and roles) from the current
   * seed. Lets renames / reseeds reflect into already-cached sessions without
   * forcing a logout. No-op when not authenticated, when expired, or when
   * the user no longer exists in the seed.
   */
  refreshSessionUser: () => Promise<void>;
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
      refreshSessionUser: async () => {
        const current = get().user;
        if (!current || get().isExpired()) return;
        try {
          const fresh = await findUserByEmail(current.email);
          if (!fresh) return;
          let fullName = fresh.email;
          if (fresh.employeeUuid) {
            const employees = await listEmployees();
            fullName =
              employees.find((e) => e.uuid === fresh.employeeUuid)?.fullNameGenerated ??
              fresh.email;
          }
          const changed =
            fullName !== current.fullName ||
            fresh.uuid !== current.uuid ||
            fresh.roles.join() !== current.roles.join();
          if (!changed) return;
          set({
            user: { uuid: fresh.uuid, email: fresh.email, fullName, roles: fresh.roles },
          });
        } catch {
          // Mock-backend can throw on simulated network failure — swallow.
          // The cached session keeps working; next refresh tries again.
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
