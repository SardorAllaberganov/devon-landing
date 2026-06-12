# STEP 16 — M2 foundation: POV switcher + notification centre

## Prerequisite

Steps 01–15 are complete: the milestone-1 dashboard is live, `SEED_VERSION = '4'`, the topbar's bell icon is a non-functional placeholder, and the user menu has Profil / Reset demo / Chiqish items.

## Goal

Lay the two cross-cutting foundations every milestone-2 flow depends on:

1. **POV switcher** — let the single demo login act as five different personas (HR admin, Rahbar, Bo'lim boshlig'i, Devonxona xodimi, Oddiy xodim) without logout, so one session can walk an entire approval or letter chain end-to-end.
2. **Notification centre** — a real in-app notification system behind the topbar bell: unread badge, list, mark-as-read, deep links. Milestone-2 mutations (steps 17–21) will fire notifications on every BPMN state transition.

No document/letter functionality lands in this step — only the rails.

## Deliverables

- `src/types/domain.ts` — `Role` union += `'ROLE_DEVONXONA'`; new `AppNotification` + `NotificationType` types (master §15); `AuditAction` += `'POV_SWITCHED'`.
- `src/lib/mock-backend/` — `notifications` table, `listNotifications`, `markNotificationRead`, `markAllNotificationsRead`, internal `appendNotification` helper; seed additions + `SEED_VERSION = '5'`.
- `src/stores/useAuthStore.ts` — `actingAsEmployeeUuid` state + `switchPov` / `resetPov` actions.
- `src/lib/acting.ts` — `useActingEmployee()` hook resolving the acting persona.
- `src/components/layout/UserMenu.tsx` — "Rol almashtirish" submenu.
- `src/components/layout/TopBar.tsx` — POV chip + working bell.
- `src/features/notifications/NotificationsBell.tsx`, `NotificationsList.tsx`.
- Sidebar: new "Hujjatlar" nav section with three disabled-until-built links (enabled per step 18/19/20 as routes land) — or simply add the section in this step and the routes in their steps; pick one and note it.
- `uz.json` — new `dashboard.pov.*` and `dashboard.notifications.*` key groups.

## Tasks

### 1. Persona seed designations

In `seed.ts`:

- Create a **Devonxona unit** (root-level, `type: 'OTHER'`, code `DEV-01`, nameUz `Devonxona`) and one employee in it (realistic Uzbek FIO, e.g. `Yusupova Nilufar Baxtiyorovna`) whose user carries `roles: ['ROLE_DEVONXONA']`.
- Export a `PERSONAS` constant:

```ts
export const PERSONAS = {
  HR_ADMIN: '<uuid of Pulatov Asilbek Karimovich>',
  RAHBAR: '<uuid of the head of a root Departament>',
  BOLIM_BOSHLIGI: '<uuid of the head of a Bo'lim>',
  DEVONXONA: '<uuid of the new devonxona employee>',
  XODIM: '<uuid of a regular employee in that same Bo'lim>',
} as const;
```

- Use **fixed literal UUIDs** for the five personas (not `crypto.randomUUID()`) so steps 17–21 can seed documents/letters referencing them deterministically.
- Pick `RAHBAR` / `BOLIM_BOSHLIGI` / `XODIM` from the existing 30 employees (set the units' `headEmployeeUuid` accordingly if not already set). Ensure each persona's employee is `ACTIVE` and has at least one `ACTIVE` certificate (needed for ERI signing in steps 19/21) — adjust the cert seed if necessary.
- **Bump `SEED_VERSION` to `'5'`** — this is an identity-changing seed edit (LESSONS rule).

### 2. Auth store: actingAs

In `useAuthStore`:

```ts
actingAsEmployeeUuid: string | null;   // null = session user's own employee
switchPov: (employeeUuid: string) => Promise<void>;
resetPov: () => Promise<void>;
```

- Persist `actingAsEmployeeUuid` inside the existing session blob so a refresh keeps the POV.
- `switchPov` writes a `POV_SWITCHED` audit entry where **actor = the real session user** and `context = { to: <personaName> }`; `resetPov` likewise with `context = { to: 'self' }`.
- `refreshSessionUser()` must clear `actingAsEmployeeUuid` if the referenced employee no longer exists after a reseed.

### 3. `useActingEmployee()` helper

New `src/lib/acting.ts`:

```ts
export interface ActingContext {
  employee: Employee;          // the acting persona (falls back to session user's employee)
  user: User | undefined;      // persona's user row (for roles)
  roles: Role[];
  headedUnitUuids: string[];   // units where employee is headEmployeeUuid
  isSelf: boolean;
}
export function useActingEmployee(): ActingContext | null
```

Resolve from the mock backend; memoise per `actingAsEmployeeUuid`. **All milestone-2 pages call this** to decide queue contents and action visibility — and pass `employee.uuid` as `actorUuid` into every mutation.

### 4. UserMenu: "Rol almashtirish"

- New submenu (DropdownMenuSub on desktop; on mobile the user menu is already a sheet — render a nested section with radio items).
- Items: the five personas, each as `<persona label> — <FIO>`; current one checked. Labels from `dashboard.pov.persona.<key>` (Kadrlar bo'yicha admin · Tashkilot rahbari · Bo'lim boshlig'i · Devonxona xodimi · Xodim).
- Selecting calls `switchPov`; toast `dashboard.pov.switched` with the persona name interpolated.

### 5. TopBar POV chip

- When `actingAsEmployeeUuid` is non-null and ≠ session employee: render a cinnamon-soft chip `Siz: {persona} sifatida` with an inline `×` that calls `resetPov`.
- Mobile: the chip text collapses to the persona label only (no FIO) to fit 360 px.
- The chip is a status signal, not the only control — the user menu remains the canonical switch surface.

### 6. Notifications backend

- New `notifications` localStorage table (`devon.dashboard.notifications`), zod schema in `schemas.ts` mirroring `AppNotification`.
- `appendNotification(input: Omit<AppNotification, 'uuid' | 'isRead' | 'createdAt'>)` — internal helper, **no `maybeFail()`** (notifications must never be the flaky part of a mutation), unshift-to-front.
- `listNotifications(recipientEmployeeUuid, { unreadOnly? })` — newest first.
- `markNotificationRead(uuid)`, `markAllNotificationsRead(recipientEmployeeUuid)`.
- Seed ~20 notifications across the five personas (mix read/unread, both `document` and `letter` resource types — reference the fixed persona UUIDs; the resource UUIDs may be placeholders until steps 17/20 seed real rows, in which case revisit the seed in those steps so links resolve).

### 7. Bell UI

- `NotificationsBell` replaces the placeholder: unread-count badge (cap display at `9+`), opens `NotificationsList` in a `DropdownMenu`-style popover ≥ `md`, bottom `Sheet` below.
- Each row: type icon (lucide; map per `NotificationType`), localized title via `t(titleKey, params)`, `formatRelative()` timestamp, unread dot (emerald).
- Row click: `markNotificationRead` + navigate to `/documents/:uuid` or `/letters/:uuid` per `resourceType` (routes 404 until steps 18–21 land — acceptable inside this step; verify links once those steps ship).
- Header row: "Bildirishnomalar" + "Barchasini o'qilgan deb belgilash" action (only when unread > 0).
- Empty state via existing `EmptyState` component.
- Notifications are scoped to the **acting persona** (`useActingEmployee().employee.uuid`) — switching POV switches the bell's contents. This is the demo's killer trick: approve as Rahbar, switch to Xodim, see the notification arrive.

### 8. Sidebar section

Add a "Hujjatlar" section between the existing management group and the personal group:

- Hujjatlar → `/documents` (icon `FileText`)
- Kelishuvlar → `/approvals` (icon `ListChecks`) — renders a count badge of the acting persona's pending decisions once step 19 lands; badge omitted in this step
- Xatlar → `/letters` (icon `Mail`)

Routes don't exist yet — register the three nav items now pointing at the paths, and add placeholder routes rendering the existing `EmptyState` ("Tez kunda" subtitle) under `Protected` so nothing 404s. Steps 18–20 replace the placeholders.

### 9. i18n

Extend `uz.json` only (RU/EN stay stubbed):

- `dashboard.pov.*` — menu label, persona names, switched toast, chip text.
- `dashboard.notifications.*` — title, mark-all, empty state, and one `title.<NotificationType>` key per type with `{{docNumber}}` / `{{letterNumber}}` / `{{actorName}}` interpolation. Write all 13 now (steps 17–21 fire them).
- `dashboard.sidebar.*` — three new nav labels.

## Acceptance checks

- [ ] `npm run build` clean; all existing routes still render.
- [ ] Reseed fires automatically on first load (SEED_VERSION 4 → 5); Devonxona unit + employee exist; all five `PERSONAS` resolve to ACTIVE employees, each with an ACTIVE certificate.
- [ ] Switching POV via user menu: chip appears, audit gains `POV_SWITCHED` (actor = real session user), bell content switches to the persona's notifications.
- [ ] POV survives a page refresh; "Reset demo" clears it.
- [ ] Bell badge counts unread for the acting persona; mark-one and mark-all both persist across reload.
- [ ] Mobile (360 px): bell opens a bottom sheet; POV chip doesn't overflow the topbar; user-menu persona section usable with 44 pt targets.
- [ ] No hardcoded UI strings — `grep -n '"[A-Za-z]' src/features/notifications src/lib/acting.ts` shows keys only.

## Notes

- Do not touch document/letter domain logic here — steps 17/20 own those tables.
- The bell polls nothing: list re-fetches on open and after POV switch. Good enough for a demo; note it in code.
- Keep `appendNotification` exported from the mock-backend barrel for steps 17–21 to import — it is part of the internal mutation surface, like `appendAudit`.

## What "done" looks like

A user logs in as `admin@devon.uz`, switches POV to "Tashkilot rahbari" via the user menu, sees the chip and a different set of (seeded) notifications in the bell, clicks one, lands on a placeholder page, resets POV from the chip — and the audit log shows both switches with the real session user as actor.
