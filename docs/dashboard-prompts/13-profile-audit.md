# STEP 13 — Profile self-service + Audit log

## Prerequisite
Master prompt loaded. Steps 01–12 complete.

## Goal
Build two remaining views: `/profile` (the current user's self-service profile + password change) and `/audit` (read-only audit log with filters).

These are smaller surfaces than the previous flows but round out the navigation. Mobile-first throughout.

## Deliverables
- `dashboard/src/features/profile/ProfilePage.tsx`
- `dashboard/src/features/profile/PasswordChangeForm.tsx`
- `dashboard/src/features/profile/ProfileEditRequestForm.tsx`
- `dashboard/src/features/audit/AuditLogPage.tsx`
- `dashboard/src/features/audit/AuditEntryRow.tsx`
- Mock-backend additions: `submitProfileChangeRequest`, `changePassword`, `listProfileRequests`, `approveProfileRequest`
- Extend `uz.json` with `dashboard.profile.*` and `dashboard.audit.*`
- Replace `/profile` and `/audit` placeholders

## Tasks

### 1. ProfilePage

The current user is HR_ADMIN. The TZ §4.6 says employees can directly self-edit some fields (mobile, personal email, password) and request approval for others (FIO, etc.). For the demo, since the demo user IS HR_ADMIN, they can edit anything directly without approval. We still ship the "request approval" UI to demonstrate the design.

Layout:
- **Hero** (cream-deep): avatar, FIO, position, unit, status badge
- **Tabs**: "Asosiy ma'lumotlar" · "Parolni o'zgartirish" · "Tahrirlash so'rovlari" (the latter has a counter badge if any are pending)
- **Asosiy ma'lumotlar**: read-only display + "Tahrirlash" CTA → opens `ProfileEditRequestForm` (responsive dialog) where the user picks which fields to change. Submitting either applies directly (HR_ADMIN) or files a request (ROLE_EMPLOYEE).
- **Parolni o'zgartirish**: form with old password, new password (with strength meter), confirm new password. Submitting hashes and writes.
- **Tahrirlash so'rovlari**: list of past requests with status badges.

```tsx
// ProfilePage.tsx (sketch)
const { user } = useAuthStore();
const [emp, setEmp] = useState<Employee | null>(null);
useEffect(() => {
  if (!user) return;
  (async () => setEmp((await listEmployees()).find(e => e.userUuid === user.uuid) ?? null))();
}, [user]);

// Hero + Tabs structure mirrors EmployeeProfilePage
```

### 2. PasswordChangeForm

```tsx
// PasswordChangeForm.tsx (sketch)
const schema = z.object({
  current: z.string().min(1, 'common:errors.required'),
  next: z.string()
    .min(8, 'dashboard:profile.password.errors.weak')
    .regex(/[A-Z]/, 'dashboard:profile.password.errors.weak')
    .regex(/[a-z]/, 'dashboard:profile.password.errors.weak')
    .regex(/\d/, 'dashboard:profile.password.errors.weak')
    .regex(/[^A-Za-z0-9]/, 'dashboard:profile.password.errors.weak'),
  confirm: z.string(),
}).refine(d => d.next === d.confirm, { message: 'common:errors.passwords-dont-match', path: ['confirm'] });

// On submit:
async function onSubmit(values) {
  const ok = await changePassword(user!.uuid, values.current, values.next);
  if (!ok) toast.error(t('dashboard:profile.password.errors.current-wrong'));
  else toast.success(t('dashboard:profile.password.toast.changed'));
}
```

Mock-backend:
```ts
export async function changePassword(userUuid: string, current: string, next: string): Promise<boolean> {
  await simulatedDelay();
  maybeFail();
  const users = readTable<User>(Tables.users, []);
  const idx = users.findIndex(u => u.uuid === userUuid);
  if (idx === -1) return false;
  const currentHash = await sha256Hex(current);
  if (users[idx].passwordHash !== currentHash) return false;
  users[idx].passwordHash = await sha256Hex(next);
  users[idx].passwordChangedAt = new Date().toISOString();
  users[idx].mustChangePassword = false;
  writeTable(Tables.users, users);
  await appendAudit({ action: 'PASSWORD_CHANGED', resourceType: 'user', resourceUuid: userUuid, resourceLabel: users[idx].email, actorUuid: userUuid });
  return true;
}
```

### 3. ProfileEditRequestForm

A `ResponsiveDialog` with a list of editable fields (mobile, personal email, avatar). For HR_ADMIN: submitting calls `updateEmployee()` directly. For ROLE_EMPLOYEE: submitting calls `submitProfileChangeRequest()` and shows the request as pending in the third tab.

Demo behaviour: since the seeded user is HR_ADMIN, direct updates are the default. Still, ship the request-flow code so the structure exists.

### 4. AuditLogPage

Read-only table on desktop / card list on mobile. Filters: resource type, actor, date range. Pagination 50/page. Default sort: newest first.

```tsx
// AuditLogPage.tsx (sketch)
- Filters: SelectInput for resourceType (all / unit / employee / assignment / certificate / user), Combobox for actorUuid (lists all seeded users), DateRange picker (or two date inputs on mobile)
- Table columns (desktop): Vaqt · Aktor · Harakat · Resurs · Tafsilot
- Cards (mobile): each card shows timestamp at top, then "<Actor> <verb> <resource>" headline, optional changes summary below
```

```tsx
// AuditEntryRow.tsx (sketch)
const VERBS = {
  CREATE: 'yaratdi', UPDATE: 'yangiladi', /* etc */
};
const ICONS = {
  CREATE: Plus, UPDATE: Pencil, /* etc */
};
```

Use `formatDateTime` from `i18n/uz-locale.ts`.

If `entry.changes` exists, render a small diff:
```
Bo'linma:  IT Departamenti  →  Moliya Departamenti
Lavozim:   Dasturchi        →  Bosh dasturchi
```

### 5. Update router

```tsx
<Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
<Route path="/audit" element={<Protected><AuditLogPage /></Protected>} />
```

### 6. Extend `uz.json`

```json
"profile": {
  "title": "Mening profilim",
  "tabs": {
    "info": "Asosiy ma'lumotlar",
    "password": "Parolni o'zgartirish",
    "requests": "Tahrirlash so'rovlari"
  },
  "password": {
    "current-label": "Joriy parol",
    "next-label": "Yangi parol",
    "confirm-label": "Yangi parolni qaytaring",
    "submit": "Parolni o'zgartirish",
    "toast": {
      "changed": "Parol o'zgartirildi"
    },
    "errors": {
      "weak": "Parol kamida 8 belgi, 1 katta harf, 1 raqam, 1 maxsus belgi",
      "current-wrong": "Joriy parol noto'g'ri"
    }
  },
  "requests": {
    "empty": "Tahrirlash so'rovlari yo'q",
    "status": {
      "PENDING": "Kutilmoqda",
      "APPROVED": "Tasdiqlangan",
      "REJECTED": "Rad etilgan"
    }
  }
},
"audit": {
  "title": "Audit jurnali",
  "subtitle": "Tizimdagi barcha o'zgarishlar tarixi",
  "filters": {
    "resource-type": "Resurs turi",
    "actor": "Aktor",
    "date-from": "Sanadan",
    "date-to": "Sanagacha"
  },
  "col": {
    "time": "Vaqt",
    "actor": "Aktor",
    "action": "Harakat",
    "resource": "Resurs",
    "details": "Tafsilot"
  },
  "diff": {
    "header": "O'zgarishlar"
  },
  "empty": "Bu shartlarga mos yozuvlar yo'q"
}
```

## Acceptance checks

- [ ] `/profile` shows the current HR_ADMIN's info with three tabs
- [ ] **Password tab**: changing the password from `Demo2026!` to a new compliant password works; logging out and back in with the new password succeeds
- [ ] Wrong current password → red toast "Joriy parol noto'g'ri"
- [ ] Weak new password → inline error; submit disabled
- [ ] Passwords don't match → inline error on confirm field
- [ ] Audit log shows the PASSWORD_CHANGED entry after a successful change
- [ ] `/audit` shows the audit log; default 50 entries per page, newest first
- [ ] **Mobile**: audit log renders as cards; **Desktop**: as a table
- [ ] Filter by resource type → only entries for that resource appear
- [ ] Filter by actor → only entries by that actor appear
- [ ] Filter by date range → only entries in range appear
- [ ] Entries with `changes` show a clean diff block ("Bo'linma: A → B")
- [ ] All copy via `t()`. Tested at 360 / 768 / 1024 / 1280px.

## Notes

- For HR_ADMIN, the "Tahrirlash so'rovlari" tab is mostly informational since they don't need approvals — empty state with a short explanation that the workflow exists for ROLE_EMPLOYEE users.
- If you want to demo the request-approval flow with the single demo user, add a "Switch to employee POV" toggle later in the user menu. Out of scope for this step.
- Audit entries are immutable. Make sure the table view does not expose any edit affordances.

## What "done" looks like

The current user can update their own settings without leaving the dashboard. The audit log gives any reviewer a full timeline of what happened, who did it, and what changed. Both pages feel as polished as the rest.
