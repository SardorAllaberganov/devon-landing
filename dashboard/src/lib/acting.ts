// POV resolution (milestone 2). Every M2 page resolves the acting persona
// through this hook to decide queue contents + action visibility, and passes
// `employee.uuid` as `actorUuid` into every mutation.

import { useEffect, useState } from 'react';

import {
  findUserByEmployee,
  getEmployee,
  listEmployees,
  listUnits,
} from '@/lib/mock-backend';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Employee, Role, User } from '@/types/domain';

export interface ActingContext {
  /** The acting persona (falls back to the session user's own employee). */
  employee: Employee;
  /** Persona's user row (for roles); undefined if the employee has no user. */
  user: User | undefined;
  roles: Role[];
  /** Units where the persona is `headEmployeeUuid` — drives approval queues. */
  headedUnitUuids: string[];
  /** True when acting as the session user's own employee. */
  isSelf: boolean;
}

/**
 * Resolve the acting persona from the mock backend. Re-resolves whenever
 * `actingAsEmployeeUuid` (or the session) changes — that per-key effect is
 * the memoisation; a module-level cache would go stale across reseeds.
 * Returns `null` while loading or when unauthenticated.
 */
export function useActingEmployee(): ActingContext | null {
  const sessionUser = useAuthStore((s) => s.user);
  const actingAsEmployeeUuid = useAuthStore((s) => s.actingAsEmployeeUuid);
  const [ctx, setCtx] = useState<ActingContext | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!sessionUser) {
      setCtx(null);
      return;
    }
    setCtx(null);
    void (async () => {
      try {
        let employee: Employee | null = null;
        if (actingAsEmployeeUuid) {
          employee = await getEmployee(actingAsEmployeeUuid);
        }
        if (!employee) {
          // Own POV (or a stale acting uuid) — resolve via the session user.
          const employees = await listEmployees();
          employee = employees.find((e) => e.userUuid === sessionUser.uuid) ?? null;
        }
        if (!employee) {
          if (!cancelled) setCtx(null);
          return;
        }
        const [user, units] = await Promise.all([
          findUserByEmployee(employee.uuid),
          listUnits(),
        ]);
        if (cancelled) return;
        const employeeUuid = employee.uuid;
        setCtx({
          employee,
          user: user ?? undefined,
          roles: user?.roles ?? [],
          headedUnitUuids: units
            .filter((u) => u.headEmployeeUuid === employeeUuid)
            .map((u) => u.uuid),
          isSelf: employee.userUuid === sessionUser.uuid,
        });
      } catch {
        // Simulated network flake on a read — leave ctx null; the next
        // POV/session change retries.
        if (!cancelled) setCtx(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionUser, actingAsEmployeeUuid]);

  return ctx;
}
