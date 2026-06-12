# STEP 20 — M2 Flow 6 part A: letters domain backend + registry

## Prerequisite

Steps 16–19 complete: documents flow fully works; `SignatureRecord` + `FileMeta` + `FakeEriSigner` exist and are letter-agnostic; the Devonxona persona exists. `/letters` renders the step-16 placeholder.

## Goal

Build the BPMN 3.3 correspondence domain (incoming/outgoing letters with routing, execution, acceptance, signature, dispatch) in the mock backend, plus the **registry UI** at `/letters` with Devonxona's register-incoming dialog. The detail page and per-role actions are step 21.

Canon: `LetterStatus` in master §15 (mirrors `docs/business-processes.md` BP-3, extended with the BPMN's explicit acceptance/signature gates). **Status semantics for the demo:** an INCOMING letter ends in `CLOSED` (response dispatched) or `CLOSED_NO_RESPONSE` (comment-only execution accepted); `DISPATCHED` is the terminal state of OUTGOING rows, which are created at dispatch time as the reply (`linkedIncomingUuid` set).

## Deliverables

- `src/types/domain.ts` — `LetterDirection`, `LetterStatus`, `LetterChannel`, `Letter` (master §15) + `AuditAction` letter entries + `resourceType` `'letter'`.
- Mock backend: `letters` table, reads + mutations below, `LetterValidationError`.
- `src/features/letters/` — `LettersPage.tsx`, `LettersTable.tsx`, `LetterCardMobile.tsx`, `RegisterLetterDialog.tsx`, `letter.schema.ts`.
- Router: `/letters` replaces the placeholder.
- Seed: 10 letters; **`SEED_VERSION = '7'`** (step 16 → '5', step 17 → '6', this step → '7' — if an interim fix already consumed '7', use the next free integer and note it).
- `uz.json` — `dashboard.letters.*` (registry + errors; detail keys land in step 21).

## Tasks

### 1. Typed errors + policy helpers

```ts
export type LetterValidationCode =
  | 'wrong-status' | 'not-devonxona' | 'not-rahbar' | 'not-unit-head'
  | 'not-executor' | 'comment-required' | 'missing-response' | 'cert-invalid';
export class LetterValidationError extends Error { constructor(public code: LetterValidationCode) ... }
```

Policy resolution (internal helpers, documented in code):
- **Devonxona check** — the actor's user has `ROLE_DEVONXONA`.
- **Rahbar check** — the actor heads a **root-level** unit (`level === 0` + `headEmployeeUuid === actor`).
- **Unit-head check** — the actor heads `letter.routedToUnitUuid` (or an ancestor of it).
- **Executor check** — `letter.assignedEmployeeUuid === actor`.

### 2. Reads

- `listLetters(filters?: { direction?: LetterDirection; status?: LetterStatus; search?: string; overdueOnly?: boolean })` — newest first; search over number + subject + externalOrg. A letter is **overdue** when `deadline < today` and status is not terminal (`CLOSED`/`CLOSED_NO_RESPONSE`/`DISPATCHED`).
- `getLetter(uuid)` — letter + its signature records + linked letters (the outgoing reply, or the incoming source) + resolved unit/employee names.

### 3. Mutations (all: delay + `maybeFail()` + audit + notifications; every one re-validates status + persona — policy layer, not UI-hiding)

| Mutation | Allowed actor | Transition | Side effects |
|---|---|---|---|
| `registerIncomingLetter(input, actorUuid)` | Devonxona | → `REGISTERED` | Auto-number `K-2026/NNNN`; fields: externalOrg, subject, channel, receivedAt, optional deadline, optional `fileMeta` (scan); audit `LETTER_REGISTERED` |
| `routeLetter(uuid, unitUuid, actorUuid)` | Rahbar | `REGISTERED → ROUTED` | sets `routedToUnitUuid`; notify the unit head (`LETTER_ROUTED`); audit `LETTER_ROUTED` |
| `assignLetterExecutor(uuid, employeeUuid, actorUuid)` | Unit head | `ROUTED → ASSIGNED` | executor must belong to the routed unit (active assignment); notify executor (`LETTER_ASSIGNED`); audit `LETTER_ASSIGNED` |
| `startLetterExecution(uuid, actorUuid)` | Executor | `ASSIGNED → IN_PROGRESS` | timeline realism only; audit `LETTER_EXECUTED` context `started` — or introduce no audit here and document why (pick one, be consistent) |
| `submitLetterExecution(uuid, input, actorUuid)` | Executor | `ASSIGNED \| IN_PROGRESS → EXECUTED` | input is **either** `{ executionComment }` (BPMN 7.1 — required non-empty, `comment-required`) **or** `{ responseFileMeta }` / `{ responseDocumentUuid }` (BPMN 7.2, `missing-response` if neither on the response path); notify unit head (`LETTER_EXECUTED`); audit `LETTER_EXECUTED` |
| `acceptLetterExecution(uuid, actorUuid)` | Unit head | `EXECUTED → ON_SIGNATURE` (when `requiresSignature`) / `→ RESPONDED` (response present) / `→ CLOSED_NO_RESPONSE` (comment-only) | notify Rahbar (`LETTER_SIGN_REQUESTED`) or Devonxona (`LETTER_ACCEPTED`); audit `LETTER_ACCEPTED` |
| `signLetter(uuid, certificateUuid, actorUuid)` | Rahbar | `ON_SIGNATURE → RESPONDED` | cert must be ACTIVE + owned (`cert-invalid`); `SignatureRecord` with `resourceType: 'letter'`; notify Devonxona (`LETTER_SIGN_REQUESTED` cleared → send `LETTER_ACCEPTED` to Devonxona); audit `LETTER_SIGNED` |
| `dispatchLetter(uuid, input, actorUuid)` | Devonxona | incoming `RESPONDED → CLOSED` **+ creates** the OUTGOING row (`CH-2026/NNNN`, status `DISPATCHED`, `linkedIncomingUuid`, addressee = incoming `externalOrg`, channel from input, `fileMeta` = response package) | stamps `dispatchedAt` on both; notify executor + unit head (`LETTER_DISPATCHED`); audit `LETTER_DISPATCHED` on both rows + `LETTER_CLOSED` on the incoming |

Number helpers mirror `nextDocumentNumber()` — separate counters for `K-` and `CH-`.

### 4. LettersPage — registry

- `PageHeader` + primary CTA **"Xat ro'yxatga olish"** — rendered only for the Devonxona persona (everyone else gets no CTA; the policy layer enforces regardless).
- Underline tabs **Keluvchi** / **Chiquvchi** (`TabLabel`), count pills per tab.
- Filters: `SearchInput` · status `Select` (letter statuses; labels via extended `StatusBadge` — add kinds `REGISTERED`, `ROUTED`, `ASSIGNED`, `IN_PROGRESS`, `EXECUTED`, `ON_SIGNATURE`, `RESPONDED`, `DISPATCHED`, `CLOSED_NO_RESPONSE`; `CLOSED` may reuse muted styling) · "Muddati o'tgan" filter chip (`overdueOnly`).
- Desktop table: Raqam · Tashkilot · Mavzu · Bo'linma/Ijrochi (resolved names, em-dash when unset) · Muddat (destructive text + `AlertTriangle` icon when overdue — **icon + colour, never colour alone**) · Holat. Row click → `/letters/:uuid` (placeholder until step 21).
- Mobile: card stack (number + org bold, subject 2-line clamp, status + deadline row).
- Empty/loading/error/pagination — existing components.

### 5. RegisterLetterDialog (Devonxona)

`ResponsiveDialog` + `react-hook-form` + `letter.schema.ts`: externalOrg (required) · subject (required) · channel Select (`POCHTA / EMAIL / KURYER / QOGOZ`) · receivedAt (date, default today) · deadline (optional date, min = today) · requiresSignature Checkbox ("Javobga rahbar imzosi talab qilinadi") · optional scan attachment (`FileMeta`, pick-time validation, PDF/JPG/PNG ≤ 10 MB). Submit → `registerIncomingLetter` → toast with the assigned number ("K-2026/0008 raqami bilan ro'yxatga olindi") → list refetch.

### 6. Seed (10 letters)

| # | Direction | Status | Notes |
|---|---|---|---|
| 1 | INCOMING | REGISTERED | fresh, no routing yet |
| 2 | INCOMING | ROUTED | routed to the BOLIM_BOSHLIGI persona's unit |
| 3 | INCOMING | ASSIGNED | assigned to XODIM persona; **deadline in the past → overdue** |
| 4 | INCOMING | IN_PROGRESS | XODIM working |
| 5 | INCOMING | EXECUTED | response file attached; awaiting BOLIM_BOSHLIGI acceptance |
| 6 | INCOMING | ON_SIGNATURE | awaiting RAHBAR; `requiresSignature: true` |
| 7 | INCOMING | CLOSED | full happy path; has signature record + linked outgoing |
| 8–10 | OUTGOING | DISPATCHED | replies; #8 linked to #7, the others to synthetic closed incomings or standalone with `linkedIncomingUuid` unset |

Realistic Uzbek org names (e.g. "Toshkent shahar hokimligi", "O'zstandart agentligi") and subjects. Bump `SEED_VERSION`.

## Acceptance checks

- [ ] Build clean; `/letters` 200; tabs/counts/filters/search work; overdue letter shows the badge in both layouts.
- [ ] Register dialog as Devonxona → number auto-increments, toast shows it, list updates. As any other persona the CTA is absent and a console call throws `not-devonxona`.
- [ ] Console smoke of the full transition table: each mutation rejects wrong persona and wrong status with the right code; happy path walks REGISTERED → … → CLOSED creating the outgoing row with `linkedIncomingUuid`.
- [ ] `dispatchLetter` produced exactly two audit trails (incoming + outgoing) and the outgoing inherits the response `fileMeta`.
- [ ] Comment-only execution accepted lands in `CLOSED_NO_RESPONSE` and **no** outgoing row is created.
- [ ] Notifications fire to the right personas at every hop (verify via bell + POV switching).
- [ ] 360 px: registry cards, dialog-as-sheet, no horizontal scroll.

## Notes

- `StatusBadge` is getting crowded — if the kind map outgrows its switch, refactor to a config record, but do not change the component's API (every M1 surface consumes it).
- Keep letter numbering year hardcoded to 2026 like documents (master §17).
- Do not build `/letters/:uuid` — step 21. Leave the placeholder route.

## What "done" looks like

Devonxona registers a real-feeling incoming letter that lands with an auto number; the seeded registry shows the whole BP-3 lifecycle across tabs and statuses, with one letter visibly overdue; the entire transition matrix is provably enforced in the policy layer even though most actions have no UI yet.
