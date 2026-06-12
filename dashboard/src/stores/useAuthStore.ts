import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Role } from '@/types/domain';
import {
  appendAudit,
  findUserByEmail,
  getEmployee,
  listEmployees,
  MockNetworkError,
  PERSONAS,
} from '@/lib/mock-backend';
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
  /**
   * POV switcher (milestone 2): the employee the session is acting as.
   * `null` = the session user's own employee. Persisted inside the session
   * blob so a refresh keeps the POV.
   */
  actingAsEmployeeUuid: string | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  isExpired: () => boolean;
  /** Act as another persona without logging out. Audited (actor = real session user). */
  switchPov: (employeeUuid: string) => Promise<void>;
  /** Return to the session user's own POV. Audited like `switchPov`. */
  resetPov: () => Promise<void>;
  /**
   * Re-derive the persisted session's `fullName` (and roles) from the current
   * seed. Lets renames / reseeds reflect into already-cached sessions without
   * forcing a logout. No-op when not authenticated, when expired, or when
   * the user no longer exists in the seed. Also drops a persisted POV whose
   * employee no longer exists after a reseed.
   */
  refreshSessionUser: () => Promise<void>;
}

/** Reverse-resolve a persona key from PERSONAS for audit context; falls back to the uuid. */
function personaKeyFor(employeeUuid: string): string {
  return (
    Object.entries(PERSONAS).find(([, uuid]) => uuid === employeeUuid)?.[0] ?? employeeUuid
  );
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
      actingAsEmployeeUuid: null,
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
      logout: () =>
        set({
          user: null,
          issuedAt: null,
          expiresAt: null,
          isAuthenticated: false,
          actingAsEmployeeUuid: null,
        }),
      isExpired: () => {
        const exp = get().expiresAt;
        if (!exp) return true;
        return new Date(exp).getTime() < Date.now();
      },
      switchPov: async (employeeUuid) => {
        const session = get().user;
        if (!session) return;
        const employee = await getEmployee(employeeUuid);
        if (!employee) throw new Error(`Employee not found: ${employeeUuid}`);
        // Flip the POV before the audit write so the UI reacts immediately.
        set({ actingAsEmployeeUuid: employeeUuid });
        await appendAudit({
          actorUuid: session.uuid,
          actorName: session.fullName,
          action: 'POV_SWITCHED',
          resourceType: 'user',
          resourceUuid: session.uuid,
          resourceLabel: employee.fullNameGenerated,
          context: { to: personaKeyFor(employeeUuid) },
        });
      },
      resetPov: async () => {
        const session = get().user;
        if (!session || get().actingAsEmployeeUuid === null) return;
        set({ actingAsEmployeeUuid: null });
        await appendAudit({
          actorUuid: session.uuid,
          actorName: session.fullName,
          action: 'POV_SWITCHED',
          resourceType: 'user',
          resourceUuid: session.uuid,
          resourceLabel: session.fullName,
          context: { to: 'self' },
        });
      },
      refreshSessionUser: async () => {
        const current = get().user;
        if (!current || get().isExpired()) return;
        try {
          // Drop a persisted POV whose employee vanished in a reseed —
          // otherwise every acting-aware surface would resolve to nothing.
          const acting = get().actingAsEmployeeUuid;
          if (acting && !(await getEmployee(acting))) {
            set({ actingAsEmployeeUuid: null });
          }

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
