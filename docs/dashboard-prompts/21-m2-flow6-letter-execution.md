# STEP 21 — M2 Flow 6 part B: letter detail + execution timeline + dispatch

## Prerequisite

Steps 16–20 complete: the letters domain works end-to-end from the console; the registry lists seeded letters; `/letters/:uuid` is still a placeholder.

## Goal

The **letter detail page** — a BP-3 swim-lane brought to life: a routing/execution timeline plus persona-aware actions that walk a letter from `REGISTERED` to `CLOSED`/`CLOSED_NO_RESPONSE`, including the Rahbar's ERI signature and Devonxona's outbound dispatch.

## Deliverables

- `src/features/letters/detail/` — `LetterDetailPage.tsx`, `LetterTimeline.tsx`, `RouteDialog.tsx`, `AssignDialog.tsx`, `ExecuteDialog.tsx`, `DispatchDialog.tsx` (+ reuse `SignDialog`/`FakeEriSigner` from step 19 — extract to `src/features/_shared/eri/` if the import crosses feature folders awkwardly; do NOT duplicate the component)
- Router: `/letters/:uuid` replaces the placeholder (under `Protected`)
- `uz.json` — `dashboard.letters.detail.*`

## Tasks

### 1. LetterDetailPage layout

- Hero band: direction chip (Keluvchi/Chiquvchi) + number + subject, `StatusBadge`, externalOrg, channel, receivedAt, deadline (overdue treatment: destructive + icon), registeredBy.
- Desktop `lg+`: left (2/3) `LetterTimeline` + attachments; right (1/3) metadata card, linked-letter card (the outgoing reply or incoming source — number + status, link), signature card (reuse `SignatureHistoryCard`). Mobile: single column.
- Attachments card: the original scan `fileMeta` and, when present, the response (`responseFileMeta` chip, or `responseDocumentUuid` → link to `/documents/:uuid`).
- Page re-resolves on POV switch.

### 2. LetterTimeline

Vertical rail (the `AssignmentTimeline` / `ApprovalSheetCard` pattern) rendering the **BP-3 stations** in canonical order, each row showing actor lane + state:

```
● Ro'yxatga olindi        Devonxona · {registeredBy FIO} · {date}
● Yo'naltirildi           Rahbar → {unit name} · {date}
● Ijrochi tayinlandi      {unit head FIO} → {executor FIO} · {date}
● Ijro boshlandi          {executor FIO} · {date}
● Ijro topshirildi        izoh yoki javob xati · {date}
● Qabul qilindi           {unit head FIO} · {date}
● ERI bilan imzolandi     {Rahbar FIO} · {cert serial} · {date}     ← only when requiresSignature
● Jo'natildi              Devonxona · CH-raqam · {date}
○ Yopildi
```

- Filled emerald dot = past, `ring-emerald` = current station, hollow = future. Derive past/current/future from `status` + stamps; pull actor names/dates from the letter's audit entries (`listAudit({ resourceUuid })`) rather than denormalising new fields — comment this choice.
- Skip the signature station entirely when `requiresSignature` is false; comment-only path ends at "Qabul qilindi → Yopildi (javobsiz)".

### 3. Persona-aware action bar (one primary action per state — the BPMN's token)

| Letter status | Persona | Action → dialog |
|---|---|---|
| REGISTERED | Rahbar | **Bo'linmaga yo'naltirish** → `RouteDialog`: unit `Combobox` (ACTIVE units only) → `routeLetter` |
| ROUTED | head of routed unit | **Ijrochi tayinlash** → `AssignDialog`: employee `Combobox` filtered to the routed unit's active members → `assignLetterExecutor` |
| ASSIGNED | executor | **Ijroni boshlash** → `startLetterExecution` (no dialog, immediate) |
| ASSIGNED / IN_PROGRESS | executor | **Ijroni topshirish** → `ExecuteDialog` |
| EXECUTED | head of routed unit | **Ijroni qabul qilish** → confirm `AlertDialog` (body explains where it goes next: signature / dispatch / close) → `acceptLetterExecution` |
| ON_SIGNATURE | Rahbar | **ERI bilan imzolash** → `SignDialog` (step 19) → `signLetter` |
| RESPONDED | Devonxona | **Jo'natish va ro'yxatga olish** → `DispatchDialog` |
| terminal states | — | no actions; muted closing line |

Everyone else sees a hint line ("Hozir {lane} navbati: {FIO/unit}"). Every `LetterValidationError` code maps to a `dashboard.letters.errors.*` toast.

### 4. ExecuteDialog (BPMN 7.1 / 7.2 gate)

`ResponsiveDialog` with a RadioGroup choosing the execution mode:

- **Izoh bilan yakunlash** (7.1) → required `Textarea` (≥ 10 chars) — explains why no reply letter is needed.
- **Javob xati biriktirish** (7.2) → either a file pick (`FileMeta`, PDF/DOC ≤ 10 MB) **or** a `Combobox` over the acting executor's own SIGNED/CLOSED documents (`listDocuments({ creatorUuid })`) to link as `responseDocumentUuid` — two sub-options, tabs or radio, keep it simple.

Submit → `submitLetterExecution` → toast → refetch. The dialog's helper text mirrors the BPMN gate question ("Ijro yuzasidan hujjat biriktirish talab etiladimi?").

### 5. DispatchDialog (Devonxona)

- Shows a read-only summary of what will happen: outbound number preview ("CH-2026/000N beriladi"), addressee = externalOrg, response attachment chip.
- Channel Select (default = the incoming channel) + optional note.
- Submit → `dispatchLetter` → success toast with the real CH-number → refetch: incoming now CLOSED, linked-letter card points at the new outgoing row (clicking it navigates to its own detail page rendering the OUTGOING view).

### 6. Outgoing letter detail view

Same page component, branched: timeline collapses to Ro'yxatga olindi → Jo'natildi stations, the linked-letter card points back at the incoming, signature card shows the inherited signature when present. No actions.

## Acceptance checks

- [ ] Build clean; `/letters/:uuid` 200 for both directions.
- [ ] Full BP-3 walk in one session via POV switching: Devonxona registers (step 20) → Rahbar routes → Bo'lim boshlig'i assigns → Xodim starts + submits with a response file → Bo'lim boshlig'i accepts → Rahbar signs via the ERI dialog → Devonxona dispatches → incoming CLOSED, outgoing CH-row exists and renders; timeline filled correctly at every stage; bell notified the right persona at every hop.
- [ ] Comment-only path: a second letter walked with 7.1 ends `CLOSED_NO_RESPONSE`, timeline shows "Yopildi (javobsiz)", no outgoing row.
- [ ] `requiresSignature: false` letter skips the signature station and goes EXECUTED → accepted → RESPONDED → dispatch.
- [ ] Wrong-persona console calls still throw (`not-rahbar`, `not-unit-head`, `not-executor`); the UI never showed those actions.
- [ ] Overdue letter shows destructive deadline treatment on the detail hero too.
- [ ] 360 px: timeline rail readable, dialogs are bottom sheets, action button full-width sticky-feel at the hero.

## Notes

- The timeline reads actor/date detail from audit entries — if an entry is missing (e.g. seeded letters without full audit history), fall back to showing the station without actor detail; seed fixes are allowed (no SEED_VERSION bump needed unless identity changes — LESSONS rule; adding audit rows for seeded letters IS identity-changing, so bump if you touch it).
- Reuse, don't fork: `SignDialog`, `SignatureHistoryCard`, `FakeEriSigner`, `formatBytes`, `StatusBadge`, `EmptyState/ErrorState/LoadingState`.

## What "done" looks like

The full Devonxona story — a letter arrives from "Toshkent shahar hokimligi", winds through the hierarchy, gets executed with an attached reply, signed by the Rahbar with ERI theatre, and leaves the building with an outbound number — entirely walkable on a phone by switching POV, with the timeline as the visual proof.
