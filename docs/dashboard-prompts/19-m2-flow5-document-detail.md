# STEP 19 — M2 Flow 5 UI part B: document detail, kelishuv actions, ERI signing, approvals queue

## Prerequisite

Steps 16–18 complete: documents exist and can be created/submitted from the wizard; registry tabs work; bell notifications fire. Document rows currently link to a placeholder.

## Goal

Close the BPMN 3.4 loop: the **document detail page** where every remaining transition happens (approve / approve-with-comment / reject → sign with ERI → accept → email/print), the **kelishuv varaqasi** as a visible artifact, and the **`/approvals` queue** where each persona finds work waiting for them.

## Deliverables

- `src/features/documents/detail/` — `DocumentDetailPage.tsx`, `A4Preview.tsx`, `ApprovalSheetCard.tsx`, `SignatureHistoryCard.tsx`, `DocumentActions.tsx`, `DecideDialog.tsx`, `SignDialog.tsx`
- `src/features/documents/FakeEriSigner.ts`
- `src/features/documents/ApprovalsQueuePage.tsx`
- Router: `/documents/:uuid` + `/approvals` replace placeholders (both under `Protected`)
- Sidebar "Kelishuvlar" item gains its pending-count badge
- `uz.json` — `dashboard.documents.detail.*`, `dashboard.approvals.*`

## Tasks

### 1. DocumentDetailPage layout

- Header band (employee-profile hero pattern): document number + title, `StatusBadge`, confidentiality badge (`MAXFIY` → cinnamon), creator → recipient line, created/updated dates.
- Desktop `lg+`: two columns — left (2/3) `A4Preview`, right (1/3) stacked cards: `ApprovalSheetCard`, `SignatureHistoryCard`, "Kimlar ko'rgan" card, metadata card. Mobile: single column, preview first.
- On mount: `recordDocumentView(uuid, acting.uuid)` (fire-and-forget). "Kimlar ko'rgan" card lists `viewedBy` (avatar initials + FIO + `formatRelative`) — §2.2's who-viewed audit, surfaced.
- The whole page re-resolves on POV switch (actions depend on the persona).

### 2. A4Preview

- TEMPLATE source: white A4-proportioned card (`aspect-[210/297]` max-width capped, `shadow-sm`, generous padding, serif-feel via existing fonts) rendering `renderedBody` with preserved line breaks; document number + date in a letterhead-style header; after signing, a signature stamp block (emerald border box: "ERI bilan imzolangan — {signer FIO} — {date} — {serial}").
- UPLOAD source: metadata card — file icon by mime, name, `formatBytes` size, uploadedAt; copy line "Fayl namoyishi demo rejimida mavjud emas".
- A `window.print()` button ("Chop etish / PDF saqlash") with a print stylesheet that isolates the A4 card (`@media print` — hide app chrome). This is the demo's §2.2 "download as PDF" substitute.

### 3. ApprovalSheetCard — kelishuv varaqasi

The auto-generated approval sheet (§2.4) as a vertical timeline (reuse the `AssignmentTimeline` rail pattern):

- One row per `ApprovalStep` of the **current round**, in order: order number, avatar + FIO + position, decision `StatusBadge` (PENDING → ring dot, APPROVED → emerald check, APPROVED_WITH_COMMENT → emerald check + comment icon, REJECTED → destructive ×), comment in italic muted when present, `decidedAt` timestamp.
- Current pending step highlighted (`ring-emerald` dot — "navbat shu yerda").
- Round selector when `round > 1` (small Select: "1-davra", "2-davra" …) — rejected-round history stays visible (BP-4: halted chains are history, never deleted).
- When `requiresApproval` is false: render the card with an explanation line instead ("Kelishuvsiz yuborilgan").

### 4. DocumentActions — status- and persona-aware action bar

Compute from `useActingEmployee()` + document state; **render only the actions the policy layer would allow** (the backend still re-validates — UI is a convenience, not the gate):

| State | Persona | Actions |
|---|---|---|
| DRAFT / REJECTED | creator | Tahrirlash (→ wizard prefilled from store), Kelishuvga yuborish (`submitDocumentForReview`), DRAFT only: O'chirish (`deleteDocument`, confirm `AlertDialog`) |
| IN_REVIEW | current-order participant | Tasdiqlash · Izoh bilan tasdiqlash · Rad etish (→ `DecideDialog`) |
| APPROVED | signer | ERI bilan imzolash (→ `SignDialog`) |
| APPROVED (no signer) | recipient | Qabul qilish (`acceptDocument`, confirm dialog) |
| SIGNED / CLOSED | creator or recipient | Emailga yuborish (`emailDocument` — small dialog with email input, success toast "Yuborildi (demo)"), Chop etish |

- Everyone else sees no action bar — plus a muted hint line for IN_REVIEW ("Hozir {FIO} navbati").
- Map every `DocumentValidationError` to its `dashboard.documents.errors.*` toast — e.g. acting out of order surfaces "Navbat hali sizga kelmagan" even if a stale UI offered the button.

### 5. DecideDialog

`ResponsiveDialog`: decision RadioGroup (3 options, descriptions), `Textarea` for comment — optional for APPROVED, **required** for APPROVED_WITH_COMMENT? No — required only for REJECTED (≥ 5 chars, the RejectDialog convention from step 12); optional otherwise. Submit → `decideApproval` → toast → refetch. The dialog explains the consequence of a reject ("Hujjat yaratuvchiga qaytariladi").

### 6. SignDialog + FakeEriSigner

- Mirrors the step-12 upload theatre: pick one of the acting persona's `ACTIVE` certificates (radio list with serial + validity; preselect when only one), PIN input (`type=password`, any 6 digits, "PIN serverga uzatilmaydi" hint), then `FakeEriSigner.sign()` — 1.5 s `ShieldCheck`-pulse challenge-response, returns fake hex.
- On resolve → `signDocument(uuid, acting.uuid, certUuid)` → success state inside the dialog (emerald check + serial) → close → page refetches showing SIGNED + stamp block in the preview + new `SignatureHistoryCard` row.
- `FakeEriSigner.ts` lives in `features/documents/` but stays generic (step 21 reuses it for letters): `sign(payload: { resourceUuid }): Promise<{ signatureHex }>`.

### 7. SignatureHistoryCard

§2.3 "imzo tarixini saqlash va tekshirish": list `SignatureRecord`s — signer FIO, certificate serial (link → `/certificates`), algorithm, `signedAt`, and a "Tekshirish" button per row that runs a 600 ms fake verify → inline emerald "Imzo haqiqiy" badge. Empty state when unsigned.

### 8. ApprovalsQueuePage (`/approvals`)

- Feed: `listMyApprovals(acting.uuid)` — re-fetch on POV switch.
- Three labelled groups (render only non-empty): **Qaroringiz kutilmoqda** (kind `decision`) · **Imzolash kutilmoqda** (`signature`) · **Qabul qilish kutilmoqda** (`acceptance`).
- Row: document number + title, creator, waiting-since (`formatRelative(sentForReviewAt/approvedAt)`), CTA chevron → `/documents/:uuid`.
- Empty state: "Sizni kutayotgan hujjatlar yo'q ✨".
- Sidebar "Kelishuvlar" badge = total queue length for the acting persona (recompute on POV switch + after any decide/sign/accept — simplest: a small zustand `useQueueStore` bumped by the detail page after mutations, refreshed on layout mount).

## Acceptance checks

- [ ] `npm run build` clean; `/documents/:uuid` + `/approvals` 200.
- [ ] Full chain walkable in one session via POV switching: XODIM creates+submits (step 18) → switch to participant 1 → /approvals shows it → approve → switch to participant 2 → reject with comment → switch to XODIM → doc REJECTED with visible comment → edit + resubmit → round 2 visible in the round selector → approvals → sign as RAHBAR via SignDialog → SIGNED, stamp in preview, signature verifiable, archived in Arxiv tab.
- [ ] Out-of-order guard: as participant 2 while participant 1 is pending, no decide actions render; forcing the call (console) throws `out-of-order` and the equivalent toast copy exists.
- [ ] DRAFT delete works with confirm; SIGNED doc shows no delete anywhere; console `deleteDocument` on it throws `not-deletable`.
- [ ] `recordDocumentView`: open as two personas → "Kimlar ko'rgan" lists both exactly once; audit has two `DOCUMENT_VIEWED` entries.
- [ ] Print preview isolates the A4 card (no sidebar/topbar in print).
- [ ] Bell: every transition in the walk produced a notification for the right persona.
- [ ] 360 px: A4 preview scales without horizontal scroll; action bar buttons stack full-width; dialogs are bottom sheets.

## Notes

- "Tahrirlash" on DRAFT/REJECTED may re-enter the wizard with the store prefilled (`doc-wizard-store.hydrate(document)`) — keep scope tight: editing re-uses the existing wizard route with a `?edit=<uuid>` param; on submit call `updateDraftDocument` + optional resubmit instead of `createDocument`.
- Per BP-4, editing APPROVED documents is out of scope (master §17) — do not add an edit affordance there.

## What "done" looks like

BPMN 3.4 is fully demonstrable end-to-end on a phone: create → kelishuv (sequential decisions with comments) → ERI signature with theatre → archive — with the kelishuv varaqasi and signature history visible as first-class artifacts, and every hop notified + audited.
