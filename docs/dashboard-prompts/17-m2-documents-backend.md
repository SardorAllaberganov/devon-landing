# STEP 17 — M2 Flow 5 backend: templates, documents, approvals, signatures

## Prerequisite

Step 16 is complete: `PERSONAS` constants exist with fixed UUIDs, `appendNotification` is exported, `SEED_VERSION = '5'`, POV switcher works.

## Goal

Build the entire document-management domain in the mock backend — types, zod schemas, typed errors, policy-enforcing mutations, audit + notification wiring, and seed data — so steps 18–19 are pure UI work. This step ships **no screens**.

Canon: `DocumentStatus` / `ApprovalDecision` state machines in master §15 (which mirror `docs/business-processes.md` BP-4 and BPMN 3.4). Never add states.

## Deliverables

- `src/types/domain.ts` — all M2 document types from master §15 (`DocumentSource`, `DocumentStatus`, `Confidentiality`, `FileMeta`, `TemplateField`, `DocumentTemplate`, `DocumentViewRecord`, `DocumentEntity`, `ApprovalDecision`, `ApprovalStep`, `SignatureRecord`) + `AuditAction` / `resourceType` extensions.
- `src/lib/mock-backend/schemas.ts` — zod schemas for each new entity (flat objects composed from field validators, existing convention).
- `src/lib/mock-backend/errors.ts` — `DocumentValidationError` with `DocumentValidationCode`.
- `src/lib/mock-backend/index.ts` — reads + mutations listed below.
- `src/features/documents/renderTemplate.ts` — `{{PLACEHOLDER}}` substitution helper (pure function, exported for the wizard preview in step 18).
- `seed.ts` — templates + documents + approval steps + signatures; notification seed from step 16 re-pointed at real document UUIDs. **`SEED_VERSION = '6'`.**

## Tasks

### 1. Tables

Three new localStorage tables: `devon.dashboard.documentTemplates`, `devon.dashboard.documents`, `devon.dashboard.approvalSteps`, plus `devon.dashboard.signatures` (shared with letters in step 20 — `SignatureRecord.resourceType` discriminates).

### 2. Typed errors

```ts
export type DocumentValidationCode =
  | 'wrong-status'        // action not allowed in current DocumentStatus
  | 'not-creator'         // edit/delete/submit by someone else
  | 'not-participant'     // decideApproval by a non-participant
  | 'out-of-order'        // participant exists but an earlier order is still PENDING
  | 'already-decided'     // participant already acted this round
  | 'comment-required'    // REJECTED without a comment
  | 'not-signer'          // signDocument by someone other than signerUuid
  | 'not-recipient'       // acceptDocument by someone other than recipientUuid
  | 'cert-invalid'        // certificate not ACTIVE or not owned by the signer
  | 'not-editable'        // update on a non-DRAFT/non-REJECTED document
  | 'not-deletable';      // delete on anything except own DRAFT
export class DocumentValidationError extends Error { constructor(public code: DocumentValidationCode) ... }
```

These are the **policy layer** (CLAUDE.md: per-document authorization enforced in mutations, never UI-hiding alone). Every mutation below validates against the *acting* `actorUuid` it receives.

### 3. Reads

- `listDocumentTemplates(): Promise<DocumentTemplate[]>`
- `listDocuments(filters?: { status?: DocumentStatus; creatorUuid?: string; recipientUuid?: string; archivedOnly?: boolean; search?: string })` — newest first; `search` matches number + title (case-insensitive).
- `getDocument(uuid)` — document + its approval steps (current round) + signature records, as one composed object.
- `listMyApprovals(actorUuid)` — the `/approvals` queue feed. Returns discriminated rows:
  - `{ kind: 'decision', document, step }` — IN_REVIEW docs where `step` is the **first PENDING step of the current round** and `step.employeeUuid === actorUuid`;
  - `{ kind: 'signature', document }` — APPROVED docs where `signerUuid === actorUuid`;
  - `{ kind: 'acceptance', document }` — APPROVED docs with no `signerUuid` where `recipientUuid === actorUuid`.
- `recordDocumentView(uuid, actorUuid)` — appends to `viewedBy` **once per employee** (first view also writes a `DOCUMENT_VIEWED` audit entry; repeat views are no-ops). No `maybeFail()` — viewing must never error.

### 4. Mutations (all: `simulatedDelay()` + `maybeFail()` + audit + notifications)

**`createDocument(input, actorUuid)`** — builds a `DRAFT`:
- Auto-number via `nextDocumentNumber()`: scan the table for the max `NNNN` in `HJ-2026/NNNN`, zero-pad 4. (Year hardcoded per master §17.)
- `source: 'TEMPLATE'` → require `templateUuid` + a `values: Record<string,string>` input; render `renderedBody` via `renderTemplate` (employee-kind fields arrive as UUIDs — resolve to `fullNameGenerated` before substitution). `source: 'UPLOAD'` → require `fileMeta` (metadata-only).
- `requiresApproval: true` → require `participantUuids: string[]` (ordered, ≥ 1, no duplicates, creator excluded); create `ApprovalStep` rows with `round: 1`, `order: 1..n`, `decision: 'PENDING'`.
- Audit `DOCUMENT_CREATED` (context: number, source, template code).

**`updateDraftDocument(uuid, patch, actorUuid)`** — only `DRAFT` or `REJECTED` (`not-editable` otherwise), only creator (`not-creator`). Patch may replace title, template values (re-render body), fileMeta, recipient/signer, confidentiality, participants (rebuild PENDING steps for the *upcoming* round only — decided rounds are immutable history).

**`submitDocumentForReview(uuid, actorUuid)`** — creator only; from `DRAFT` or `REJECTED`:
- `requiresApproval` → status `IN_REVIEW`, `sentForReviewAt`, on resubmit `round += 1` and fresh PENDING steps cloned from the participant list. Notify the **order-1 participant** (`DOC_REVIEW_REQUESTED`).
- `!requiresApproval` → status `APPROVED` (implicit — BPMN "Kelishuv varaqasi kerakmi? → Yo'q") + `approvedAt`; notify signer (`DOC_SIGN_REQUESTED`) or, when no signer, recipient (`DOC_SIGN_REQUESTED` titled as acceptance).
- Audit `DOCUMENT_SENT_FOR_REVIEW`.

**`decideApproval(documentUuid, actorUuid, decision, comment?)`** — the kelishuv heart:
- Document must be `IN_REVIEW` (`wrong-status`). Actor must be a participant of the current round (`not-participant`), must not have decided already (`already-decided`), and **every lower-order step must already be decided** (`out-of-order` — the demo chain is strictly sequential).
- `REJECTED` requires `comment` (`comment-required` — BP-4 failure-mode rule).
- Stamp the step (`decision`, `comment`, `decidedAt`).
- `REJECTED` → document `REJECTED`; remaining steps stay PENDING (halted history); notify creator `DOC_REJECTED`.
- approve variants: notify creator `DOC_DECIDED` (params: actor, decision); if this was the **last** step → document `APPROVED` + `approvedAt`, notify creator `DOC_APPROVED` and signer/recipient `DOC_SIGN_REQUESTED` (same branching as above).
- Audit `DOCUMENT_APPROVED` / `DOCUMENT_REJECTED` with `context.decision` and `context.order`.

**`signDocument(documentUuid, actorUuid, certificateUuid)`** —
- Status `APPROVED` (`wrong-status`); `actorUuid === signerUuid` (`not-signer`); cert must exist, be `ACTIVE`, and belong to the signer (`cert-invalid`).
- Create a `SignatureRecord` (`resourceType: 'document'`, fake `signatureHex` from `crypto.getRandomValues`, `algorithm: 'RSA-PKCS7'`).
- Document → `SIGNED`, `signedAt`, **`archivedAt`** (the simulated nightly job — stamp immediately, comment why).
- Notify creator + recipient `DOC_SIGNED`. Audit `DOCUMENT_SIGNED` (context: certificate serial).

**`acceptDocument(documentUuid, actorUuid)`** — the no-ERI branch (BPMN 11.2):
- Status `APPROVED`, no `signerUuid` set (`wrong-status` otherwise), `actorUuid === recipientUuid` (`not-recipient`).
- Document → `CLOSED`, `closedAt`, `archivedAt`. Notify creator `DOC_CLOSED`. Audit `DOCUMENT_CLOSED`.

**`emailDocument(uuid, actorUuid, email)`** — only `SIGNED`/`CLOSED`; append to `emailedTo`; audit `DOCUMENT_EMAILED`. No real mail (master §17).

**`deleteDocument(uuid, actorUuid)`** — **only** the creator's own `DRAFT` (`not-deletable` / `not-creator` otherwise). This is the §2.2 signed-document protection: there is no code path that deletes a non-draft document. Audit `DELETE`.

### 5. `renderTemplate.ts`

```ts
export function renderTemplate(bodyTemplate: string, values: Record<string, string>): string
```
Replaces every `{{KEY}}`; unknown keys render as `«—»` (never leak the raw token). Pure + synchronous so step 18's wizard can live-preview.

### 6. Seed

**5 templates** (realistic short Uzbek bodies, 3–6 lines, 2–4 fields each). Example shape for `BUYRUQ`:

```
{{SANA}} dagi {{RAQAM}}-sonli buyruqqa asosan {{XODIM_FIO}}
quyidagi vazifaga tayinlansin: {{MAZMUN}}.
Asos: {{ASOS}}.
```
fields: `SANA` (date) · `XODIM_FIO` (employee) · `MAZMUN` (textarea) · `ASOS` (text). Write comparable bodies for XIZMAT_XATI, MALUMOTNOMA, ARIZA, BILDIRISHNOMA.

**~12 documents**, distributed so every persona's queue is non-empty:

| Count | Status | Detail |
|---|---|---|
| 2 | DRAFT | creator = XODIM persona; one TEMPLATE, one UPLOAD |
| 3 | IN_REVIEW | current PENDING participant = RAHBAR / BOLIM_BOSHLIGI / HR_ADMIN respectively (mixed earlier-step decisions, incl. one APPROVED_WITH_COMMENT) |
| 1 | REJECTED | creator = XODIM; rejection comment present |
| 2 | APPROVED | one with `signerUuid = RAHBAR` (signature queue), one with no signer + `recipientUuid = BOLIM_BOSHLIGI` (acceptance queue) |
| 2 | SIGNED | full chain decided + SignatureRecord + `archivedAt` |
| 2 | CLOSED | accepted without ERI + `archivedAt` |

- All approval steps/timestamps internally consistent (decidedAt after sentForReviewAt, etc. — derive from a fixed base date, no `Date.now()` randomness beyond the existing seed conventions).
- Sprinkle `viewedBy` across non-draft docs.
- **Re-point the step-16 notification seed** at these real document UUIDs.
- **Bump `SEED_VERSION` to `'6'`.**

### 7. i18n

No screens in this step, but add the error-code map now: `dashboard.documents.errors.<code>` for every `DocumentValidationCode` (Uzbek copy; e.g. `out-of-order` → "Navbat hali sizga kelmagan", `signed-immutable`-style copy for `not-deletable` → "Imzolangan hujjatni o'chirish mumkin emas"). Steps 18–19 map caught errors to these toasts.

## Acceptance checks

- [ ] `npm run build` + `tsc -b` clean.
- [ ] Reseed (5 → 6) produces: 5 templates, 12 documents, consistent approval steps, 3 signature records (2 SIGNED docs + spare), notifications resolving to real docs.
- [ ] Console smoke (dev-tools): `decideApproval` as the wrong persona throws `not-participant`; as the right persona but order 2 while order 1 is PENDING throws `out-of-order`; REJECTED without comment throws `comment-required`.
- [ ] `signDocument` with another employee's cert throws `cert-invalid`; with the right cert flips status to SIGNED, writes a SignatureRecord, stamps `archivedAt`.
- [ ] `deleteDocument` on a SIGNED doc throws `not-deletable` — verify there is **no** code path that removes a non-DRAFT row.
- [ ] Every status transition writes exactly one audit entry and ≥ 1 notification (except DRAFT create — audit only).
- [ ] Audit entries remain append-only (no mutation rewrites past entries).

## Notes

- Editing an `APPROVED` document (BP-4 "modification cancels approvals") is **out of scope** — demo permits editing only DRAFT/REJECTED. The state machine comment in `domain.ts` should say so.
- Letters (step 20) will reuse `SignatureRecord` and `FileMeta` — keep both generic, no document-specific fields.
- Keep all new mutations on the established conventions: `simulatedDelay()`, 3 % `maybeFail()` on mutations only, unshift-new-rows-to-front, `crypto.randomUUID()`.

## What "done" looks like

No visible UI change beyond reseeded data — but from the browser console you can walk a full BPMN 3.4 happy path entirely through the typed API: create → submit → decide × n → sign → (try to delete: blocked) — with the audit log and the bell (step 16) reflecting every hop.
