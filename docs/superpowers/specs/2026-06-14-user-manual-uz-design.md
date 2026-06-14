# Devon — Uzbek User Manual (`docs/user-manual-uz.md`) — Design Spec

> **Status:** design pending user approval 2026-06-14.
> **Source of truth:** [`docs/use-cases.md`](../../use-cases.md) (UC-01…20 + the "Demo coverage" map) · [`docs/product-specification.md`](../../product-specification.md) §4 (the eight modules), §5 (roles) · [`docs/glossary.md`](../../glossary.md) (canonical Uzbek vocabulary) · [`README.md`](../../../README.md) (module + role canon) · [`ai_context/AI_CONTEXT.md`](../../../ai_context/AI_CONTEXT.md) (live dashboard state, seed personas, demo affordances) · [`dashboard/QA_NOTES.md`](../../../dashboard/QA_NOTES.md) (what's simulated vs. full).
> If this spec conflicts with a `docs/` source, the doc wins — fix the doc first (per CLAUDE.md).

## 1. Goal & scope

Write the Uzbek end-user manual at `docs/user-manual-uz.md` — the path the README already references and which AI_CONTEXT flags as **load-bearing now that the dashboard is live and reachable to real users** at `sardorallaberganov.github.io/devon-landing/dashboard/`. It must be writable end-to-end by a non-technical Uzbek user, and usable both as a walkthrough for stakeholders evaluating the live demo **and** as the standing product user manual.

The manual is **task-oriented** documentation of what is actually built and clickable in the dashboard across all 8 modules, organized into module chapters. It honestly flags demo-simulated integrations (ERI handshake, email send, archival) and isolates demo-only scaffolding (login credentials, POV switcher, Reset demo) in one bounded chapter at the end.

**Decisions locked during brainstorming (2026-06-14):**

| Decision | Choice |
|---|---|
| Framing | **Hybrid** — real product manual covering only built/clickable features, plus a bounded "Demo rejimi" chapter for demo-only affordances. |
| Structure | **Module chapters → task sections.** Top level follows the 8 modules (familiar from README/product-spec); inside each, task-oriented "Qanday qilib…" how-tos derived from the relevant use cases. Opens with a "Boshlash" chapter, closes with "Demo rejimi". |
| Depth | **Practical, task-focused.** Each task = short intro → numbered **Qadamlar** → Eslatma/Maslahat/Diqqat callouts. Covers every built task, not every screen state. Medium length. |
| Language | **Uzbek only.** RU/EN follow per the v1.1 roadmap (do not ship `[NEEDS_TRANSLATION]`). Canonical terms from `docs/glossary.md`; no tech-stack mentions. |
| Screenshots | **Placeholders for the operator.** `![caption](images/user-manual/<name>.png)` with Uzbek captions at key steps; prose ships now, images captured against the live demo later. |
| UC-19 (nightly backup) | **Excluded** — no user-facing surface; belongs in `docs/operations/backup.md`. |
| Git | **No commit until the user runs `/commit`** (standing project rule). |

**Out of scope:** Russian/English translations (v1.1); the operations runbook (`docs/operations/`); capturing the actual screenshot images; documenting features with no demo surface (nightly backup UC-19); any code or product change. This is a single Markdown deliverable.

## 2. Document conventions

- **One file:** `docs/user-manual-uz.md`. Front matter (document type / audience / version note) mirroring the other `docs/*.md` headers.
- **Task block shape** — every how-to uses the same rhythm:
  - One-line intro: **kim** (which role/persona) and **qachon** (when) does this.
  - **Qadamlar** — numbered steps that name real on-screen Uzbek labels (e.g. "**Topshiriq berish** tugmasini bosing").
  - Callouts where useful: **Eslatma** (note), **Maslahat** (tip), **Diqqat** (warning — used for irreversible/gated actions).
- **Honesty markers** — a 🟡 *Simulyatsiya* note wherever the demo mocks a real integration (per the QA_NOTES / use-cases status column): ERI signing (UC-05), email (UC-12), Word export (UC-11), archival/backup scheduling (UC-18).
- **Vocabulary** — canonical glossary terms (Kelishuv varaqasi, Devonxona, Topshiriq, Ijrochi, Maxfiylik darajasi, …). First use of a term links to or parenthetically explains it.
- **Cross-references** — point at `README.md`, `docs/glossary.md`, and `docs/business-processes.md` where a reader needs the bigger picture; never restate tech stack.
- **Screenshots** — placeholder image refs under `images/user-manual/` with descriptive Uzbek alt-captions, plus a short "Skrinshotlar haqida" note at the top telling the operator how/where to capture them.

## 3. Table of contents (chapters → task sections)

Each task section cites the use case it documents and the live route, so the writer documents only what's walkable.

**Kirish** — Devon nima; qo'llanma kimga; qanday o'qiladi; atamalar uchun lug'atga ishora; skrinshotlar haqida eslatma.

1. **Boshlash**
   - Tizimga kirish (UC-01 · `/login`)
   - Asosiy ekran bilan tanishish — yon panel, yuqori panel, qidiruv (orientation)
   - Rollar va ruxsatlar — qisqacha: Super Admin · Bo'linma rahbari · Xodim (product-spec §5)
   - Bildirishnomalar markasi (notification bell)
2. **Foydalanuvchilar va profil** *(Modul 1 — Users & Auth)*
   - Yangi xodim yaratish — 4-bosqichli sehrgar (UC-17 · `/employees/new`)
   - O'z profilini boshqarish, parolni o'zgartirish (UC-02 · `/profile`)
   - Xodimni boshqa bo'linmaga o'tkazish (`/employees/:uuid/transfer`)
   - Xodimni ishdan bo'shatish — termination-extract talabi + ERI avto-bekor (glossary: *ishdan bo'shatish buyrug'idan ko'chirma*)
3. **Tashkiliy tuzilma** *(Modul 6 — Org Structure)*
   - Bo'linmalarni boshqarish — 4 darajali daraxt CRUD (UC-16 · `/units`)
4. **Hujjatlarni boshqarish** *(Modul 2 — Document Management; export/email/arxiv tasks belong to Modul 7 — Integration & Export, folded in here since they act on documents)*
   - Shablon asosida hujjat yaratish (UC-03 · `/documents/new`)
   - Tayyor faylni yuklash
   - Hujjatni ko'rish, chop etish / PDF saqlash (UC-11 · 🟡 print-to-PDF)
   - Hujjatni e-pochta orqali yuborish (UC-12 · 🟡 simulyatsiya)
   - Arxiv — kunlik avto-arxivlash (UC-18 · `/documents` Arxiv tab · 🟡)
5. **Kelishuv jarayoni** *(Modul 4 — Approval Workflow / "List soglasovaniya")*
   - Hujjatni kelishuvga yuborish — kelishuv varaqasini tuzish (UC-04 · `/documents/new` → `/documents/:uuid`)
   - Kelishuvda ishtirok etish — tasdiqlash / izoh bilan tasdiqlash / rad etish (UC-06 · `/approvals`)
   - Kelishuv varaqasi va uning tarixi (rounds)
   - Hujjatni qayta ishlash sikli (UC-04a · `?edit=`)
6. **Elektron raqamli imzo (ERI)** *(Modul 3 — Electronic Signature)*
   - Hujjatni ERI bilan imzolash (UC-05 · `/documents/:uuid` · 🟡 simulyatsiya)
   - ERI sertifikatlarini boshqarish — yuklash, tasdiqlash, bekor qilish (`/certificates`, `/certificates/upload`)
7. **Vazifalar va topshiriqlar** *(Modul 5 — Task Delegation)*
   - Topshiriq berish (UC-07 · `/tasks/new`)
   - Topshiriqni bajarish va natijani topshirish (UC-08 · `/tasks/:uuid`)
   - Natijani ko'rib chiqish — qabul / izoh bilan qabul / qaytarish / rad (UC-09)
   - Vazifa doskasi va statistika (UC-10 · `/tasks` · 🟡 qisman)
8. **Kiruvchi va chiquvchi xatlar** *(Modul 8 — Letters)*
   - Kiruvchi xatni ro'yxatga olish (UC-13 · `/letters/new` · Devonxona)
   - Xatni yo'naltirish va ijrochi tayinlash (`/letters/:uuid`)
   - Xatga javob tayyorlash (UC-14)
   - Chiquvchi xatni jo'natish (UC-15)
9. **Audit va xavfsizlik** *(kesishuvchi qoidalar — product-spec §9–10; modul emas)*
   - Audit jurnalini o'qish (UC-20 · `/audit`)
   - Imzolangan hujjatlar himoyasi (immutability — never deletable/silently editable)
   - Maxfiylik va ruxsatlar (per-document/per-task scope)
10. **Demo rejimi**
    - Demo haqida — mock ma'lumotlar, real server yo'q
    - Kirish ma'lumotlari — `admin@devon.uz` / `Demo2026!`
    - Rol almashtirish — POV switcher, 5 seeded shaxs (HR_ADMIN · Rahbar · Bo'lim boshlig'i · Devonxona · Xodim)
    - Demoni qayta tiklash — "Reset demo"
    - Nimalar simulyatsiya qilingan — ERI, e-pochta, arxiv/zaxira

**Ilova** — mini-atamalar lug'ati (pointer to `docs/glossary.md`) · yordam olish (in-app `?`, support contacts from README).

## 4. Content-sourcing map (UC → manual section)

| UC | Manual chapter.section | Live route | Demo status to reflect |
|---|---|---|---|
| UC-01 | 1 · Tizimga kirish | `/login` | ✅ Full (single login; POV switcher) |
| UC-02 | 2 · O'z profilini boshqarish | `/profile` | ✅ Full (HR_ADMIN edits direct) |
| UC-17 | 2 · Yangi xodim yaratish | `/employees/new` | ✅ Full |
| UC-16 | 3 · Bo'linmalarni boshqarish | `/units` | ✅ Full |
| UC-03 | 4 · Shablondan hujjat | `/documents/new` | ✅ Full |
| UC-11 | 4 · Chop etish / PDF | `/documents/:uuid` | 🟡 print-to-PDF, no Word |
| UC-12 | 4 · E-pochta | `/documents/:uuid` | 🟡 simulyatsiya |
| UC-18 | 4 · Arxiv | `/documents` Arxiv | 🟡 avto-arxiv |
| UC-04/04a | 5 · Kelishuvga yuborish / qayta ishlash | `/documents/new` → `/documents/:uuid` | ✅ Full |
| UC-06 | 5 · Kelishuvda ishtirok | `/approvals` | ✅ Full |
| UC-05 | 6 · ERI bilan imzolash | `/documents/:uuid` | 🟡 simulyatsiya |
| (certs) | 6 · Sertifikatlarni boshqarish | `/certificates` | ✅ Full (PFX mocked) |
| UC-07 | 7 · Topshiriq berish | `/tasks/new` | ✅ Full |
| UC-08 | 7 · Bajarish/topshirish | `/tasks/:uuid` | ✅ Full |
| UC-09 | 7 · Ko'rib chiqish | `/tasks/:uuid` | ✅ Full |
| UC-10 | 7 · Doska va statistika | `/tasks` | 🟡 qisman |
| UC-13 | 8 · Kiruvchi xatni ro'yxatga olish | `/letters/new` | ✅ Full |
| UC-14 | 8 · Javob tayyorlash | `/letters/:uuid` | ✅ Full |
| UC-15 | 8 · Chiquvchi xatni jo'natish | `/letters/:uuid` | ✅ Full |
| UC-20 | 9 · Audit jurnali | `/audit` | ✅ Full |
| UC-19 | — | — | **Excluded** (operations runbook) |

## 5. Verification (definition of done)

Because this is documentation, "done" is content-correctness, not a build:

- **Route/label accuracy** — every route and on-screen label named in the manual is cross-checked against the dashboard source (route table in `router.tsx`, i18n `uz.json` labels). No invented buttons or screens.
- **Demo-status honesty** — every 🟡 simulyatsiya marker matches the `use-cases.md` "Demo coverage" status column; nothing fully-mocked is described as real.
- **Vocabulary** — terms match `docs/glossary.md`; spot-grep for legacy names (PLYMA/PLYMO) and any accidental tech-stack mentions (Laravel/React/etc.) → zero.
- **Uzbek-only** — no `[NEEDS_TRANSLATION]` placeholders; no untranslated English body copy beyond proper nouns (Devon, ERI, PDF) and intentional brand strings.
- **Completeness** — every ✅/🟡 row in the content-sourcing map has a corresponding section; UC-19 deliberately absent.
- **Self-consistency** — TOC anchors resolve; cross-reference links to `README.md` / `glossary.md` / `business-processes.md` are valid relative paths.

## 6. Doc cascade (on completion)

Per CLAUDE.md's Doc Cascade — this manual is *derived* from the canon, so the canon mostly doesn't move, but:

- `README.md` already lists `docs/user-manual-uz.md` (Documentation table + Support section) — verify the reference resolves once the file exists; no content change expected.
- `ai_context/AI_CONTEXT.md` "Open questions / known gaps" — flip the **"User manual (Uzbek)"** gap from open to resolved; note the screenshot-placeholder follow-up for the operator.
- `ai_context/HISTORY.md` — append a session entry.
- If, while writing, any manual step reveals a real discrepancy in `use-cases.md` / `product-specification.md` (e.g. a label that drifted), **fix the doc first**, then write the manual against the corrected truth (do not encode the drift into the manual).

## 7. Open follow-ups (not in this deliverable)

- Operator captures the screenshot set against the live demo and drops images into `docs/images/user-manual/` (the in-file refs use the relative path `images/user-manual/<name>.png`; the folder is created with the first image).
- Russian/English manual passes land with the v1.1 locale work.
- `docs/operations/` runbook (incl. backup, UC-19) is a separate backlog item.
