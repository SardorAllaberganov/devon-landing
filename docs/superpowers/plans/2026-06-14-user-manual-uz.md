# Devon Uzbek User Manual — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author `docs/user-manual-uz.md` — the Uzbek end-user manual covering every built/clickable dashboard feature across all 8 modules, with a bounded demo-mode chapter, per the approved spec.

**Architecture:** One Markdown file, built chapter-by-chapter. Chapters follow the 8 modules; each contains task-oriented "Qadamlar" how-tos sourced from a specific use case (UC) and a real dashboard route. Every on-screen label cited must exist in `dashboard/src/i18n/locales/uz.json`; every route must exist in `dashboard/src/router.tsx`. Demo-simulated integrations are flagged 🟡; demo-only scaffolding is isolated in the final chapter.

**Tech Stack:** Markdown (GitHub-flavored). No code, no build. "Tests" = content-correctness greps (label accuracy, no-Cyrillic, no-tech-stack, no-legacy-names, anchor resolution).

**Spec:** [`docs/superpowers/specs/2026-06-14-user-manual-uz-design.md`](../specs/2026-06-14-user-manual-uz-design.md)

---

## Conventions for every authoring task

- **Language:** Uzbek (Latin script) only. Use canonical terms from [`docs/glossary.md`](../../glossary.md) (Kelishuv varaqasi, Devonxona, Topshiriq, Ijrochi, Maxfiylik darajasi, …). No tech-stack words (Laravel/React/Vite/Tailwind/PostgreSQL/localStorage/zod/etc.). No legacy names (PLYMA/PLYMO).
- **Label sourcing rule:** before naming any button/tab/field in prose, confirm the Uzbek string exists in `dashboard/src/i18n/locales/uz.json` under the namespace listed in the task. Use the user-visible Uzbek value, not the JSON key. Never invent a control that isn't in the UI.
- **Task-block shape (every how-to):** one-line intro (**kim** / **qachon**) → **Qadamlar** numbered list (each step names a real Uzbek label) → optional **Eslatma** / **Maslahat** / **Diqqat** callouts.
- **Honesty marker:** add a `> 🟡 **Simulyatsiya:** …` blockquote wherever the demo mocks a real integration (ERI signing, e-pochta, Word eksport, arxiv/zaxira jadval). Match the status column in [`docs/use-cases.md`](../../use-cases.md) "Demo coverage".
- **Screenshots:** insert `![<Uzbek caption>](images/user-manual/<name>.png)` placeholders at the key step of each how-to. Pick a descriptive `<name>` (e.g. `login`, `employee-wizard-step1`). The folder is created when the operator adds the first image; do not create empty image files.
- **Anchors:** every chapter is an `##` heading; every task section is a `###` heading, so the TOC links resolve. Keep heading text stable once written.
- **Commits:** **DO NOT run `git commit`** — the standing project rule is "no commit until the user runs `/commit`." End each task at the verification checkpoint and leave changes in the working tree. The user commits the whole manual at the end.

### Ground-truth route table (from `dashboard/src/router.tsx`)

`/login` · `/` (home) · `/units` · `/employees` · `/employees/new` · `/employees/:uuid` · `/employees/:uuid/transfer` · `/certificates` · `/certificates/upload` · `/profile` · `/audit` · `/documents` · `/documents/new` · `/documents/:uuid` · `/approvals` · `/letters` · `/letters/new` · `/letters/:uuid` · `/tasks` · `/tasks/new` · `/tasks/:uuid`. Unknown paths redirect to `/`.

### Reusable verification commands (run from repo root unless noted)

```bash
# V1 — no Cyrillic leaked into the manual (Uzbek is Latin script)
# (macOS BSD grep lacks -P, so use python3 which is present on this machine)
python3 -c "import re; t=open('docs/user-manual-uz.md',encoding='utf-8').read(); bad=[(i+1,l) for i,l in enumerate(t.splitlines()) if re.search(r'[Ѐ-ӿ]',l)]; [print(f'{n}: {l}') for n,l in bad]; print('OK: no Cyrillic' if not bad else 'CYRILLIC FOUND')"

# V2 — no tech-stack leaks
grep -niE 'laravel|react|vite|tailwind|postgres|localstorage|\bzod\b|typescript|shadcn|vue|node\.js' docs/user-manual-uz.md || echo "OK: no tech-stack"

# V3 — no legacy product names
grep -niE 'plyma|plymo' docs/user-manual-uz.md || echo "OK: no legacy names"

# V4 — no leftover placeholders
grep -niE 'TODO|TBD|\[NEEDS_TRANSLATION\]|lorem ipsum' docs/user-manual-uz.md || echo "OK: no placeholders"

# V5 — confirm a specific Uzbek label you cited exists in the UI strings
#       (replace SUBSTRING with a distinctive part of the label)
grep -ni 'SUBSTRING' dashboard/src/i18n/locales/uz.json
```

A chapter "passes" when V1–V4 print their OK line and every label cited in that chapter is found by a V5 lookup.

---

## Task 0: Scaffold the file (front matter, conventions legend, TOC, Kirish, screenshot note)

**Files:**
- Create: `docs/user-manual-uz.md`

- [ ] **Step 1: Create the file with header, intro, conventions legend, and the full TOC**

Write, in order:
1. `# Devon — Foydalanuvchi qo'llanmasi` + the tagline blockquote `> Rivolanish intizom bilan!`.
2. A front-matter blockquote: **Hujjat turi** (foydalanuvchi qo'llanmasi), **Auditoriya** (oxirgi foydalanuvchilar va administratorlar), **Til** (o'zbek; rus/ingliz tillari v1.1 rejasida), **Versiya** (Devon v1.0 demo). One line that the live demo is at `sardorallaberganov.github.io/devon-landing/dashboard/`.
3. `## Kirish` — 2–3 short paragraphs: what Devon is (qog'ozsiz ichki hujjat aylanmasi, kelishuv, ERI, topshiriqlar, tashkiliy tuzilma — sourced from README "About"), who the manual serves, how it's organized (8 module-chapter, vazifaga yo'naltirilgan how-to). Link to [`docs/glossary.md`](glossary.md) for terms (use the path relative to `docs/`).
4. `### Belgilar` (conventions legend) — explain the four callouts: **Eslatma** (qo'shimcha ma'lumot), **Maslahat** (foydali maslahat), **Diqqat** (ehtiyot bo'ling — qaytarib bo'lmaydigan amal), and `🟡 Simulyatsiya` (demo rejimida taqlid qilingan; real tizimda haqiqiy integratsiya).
5. `### Skrinshotlar haqida` — one paragraph telling the operator screenshots are placeholders under `images/user-manual/` to be captured against the live demo.
6. `## Mundarija` — a bulleted TOC linking to all chapter `##` anchors: Boshlash · Foydalanuvchilar va profil · Tashkiliy tuzilma · Hujjatlarni boshqarish · Kelishuv jarayoni · Elektron raqamli imzo (ERI) · Vazifalar va topshiriqlar · Kiruvchi va chiquvchi xatlar · Audit va xavfsizlik · Demo rejimi · Ilova.

Use the chapter titles **exactly** as listed in Tasks 1–10 so TOC links resolve.

- [ ] **Step 2: Verify scaffold**

Run V1, V2, V3, V4 from the reusable commands. Expected: each prints its `OK:` line.
Run: `grep -c '^## ' docs/user-manual-uz.md` — expected ≥ 4 at this stage (Kirish, Mundarija, and the heading stubs you've added).

- [ ] **Step 3: Checkpoint** — leave file in working tree (no commit). Confirm the TOC lists 11 entries (10 chapters + Ilova).

---

## Task 1: Chapter "Boshlash"

**Files:**
- Modify: `docs/user-manual-uz.md` (append `## Boshlash`)

**Label sources:** `dashboard.login`, `dashboard.sidebar`, `dashboard.topbar`, `dashboard.notifications`, `dashboard.home`, `common.roles` in `dashboard/src/i18n/locales/uz.json`. **Routes:** `/login`, `/`. **UC:** UC-01.

- [ ] **Step 1: Read sources**

Read the `dashboard.login`, `dashboard.sidebar`, `dashboard.topbar`, `dashboard.notifications`, `common.roles` blocks in `uz.json`, and skim `dashboard/src/features/auth/LoginPage.tsx` + `dashboard/src/components/layout/` (Sidebar, TopBar) to confirm the nav labels and the bell behavior.

- [ ] **Step 2: Write the chapter**

`## Boshlash`, then these `###` sections:
- `### Tizimga kirish` (UC-01, `/login`) — Qadamlar: open the dashboard URL → enter email + parol → **Kirish**. Eslatma: demo login is covered in [Demo rejimi](#demo-rejimi) (link). Screenshot placeholder `login`.
- `### Asosiy ekran bilan tanishish` — describe the persistent **yon panel** (sidebar nav groups, incl. "HUJJAT AYLANMASI"), the **yuqori panel** (search, bildirishnomalar qo'ng'irog'i, foydalanuvchi menyusi), and the home greeting/stat cards/quick actions. Screenshot `home`.
- `### Rollar va ruxsatlar` — short prose: **Super Admin**, **Bo'linma rahbari**, **Xodim** (from `common.roles` + product-spec §5); one line that access is per-document/per-task scoped. No how-to.
- `### Bildirishnomalar` — Qadamlar: click the qo'ng'iroq → unread badge, mark-as-read, "barchasini o'qilgan deb belgilash"; row click opens the related hujjat/xat/topshiriq. Eslatma: bildirishnomalar acting persona bo'yicha ko'rsatiladi (forward-ref to Demo rejimi POV).

- [ ] **Step 3: Verify**

Run V1–V4 (expect OK). For 3 labels you cited (e.g. the **Kirish** button, a sidebar group, the bell "mark all" action), run V5 to confirm each exists in `uz.json`.

- [ ] **Step 4: Checkpoint** — no commit; confirm `## Boshlash` and its 4 `###` sections are present.

---

## Task 2: Chapter "Foydalanuvchilar va profil"

**Files:**
- Modify: `docs/user-manual-uz.md` (append `## Foydalanuvchilar va profil`)

**Label sources:** `dashboard.employees`, `dashboard.profile`, `common.employment-types`, `common.genders`, `common.actions`. **Routes:** `/employees`, `/employees/new`, `/employees/:uuid`, `/employees/:uuid/transfer`, `/profile`. **UC:** UC-17, UC-02.

- [ ] **Step 1: Read sources**

Read `dashboard.employees` + `dashboard.profile` in `uz.json`; skim `dashboard/src/features/employees/wizard/` (the 4 steps) and `EmployeeProfilePage.tsx` / `EmployeeTransferPage.tsx` for step names and field labels.

- [ ] **Step 2: Write the chapter**

`## Foydalanuvchilar va profil`, then:
- `### Yangi xodim yaratish` (UC-17, `/employees/new`) — intro: kim = HR_ADMIN/Super Admin. Qadamlar walking the 4 sehrgar steps: **Shaxsiy** (ism/jins/tug'ilgan sana/JSHShIR live dedup) → **Aloqa** (telefon/korporativ e-pochta dedup) → **Ish o'rni** (bo'linma, lavozim, ish turi, ishga olingan sana, rol, **Buyruqdan ko'chirma** + **Lavozim yo'riqnomasi** fayllari — ikkalasi majburiy) → **Kirish** (avto-login, parol generatori) → **Ko'rib chiqish** → save. Diqqat: buyruqdan ko'chirma va lavozim yo'riqnomasi **yaratishda majburiy** (glossary). Screenshot `employee-wizard-step1`.
- `### O'z profilini boshqarish` (UC-02, `/profile`) — three tabs: **Asosiy ma'lumotlar** (edit → HR_ADMIN applies directly; xodim uchun so'rov navbatga tushadi), **Parolni o'zgartirish** (complexity rules), **Tahrirlash so'rovlari**. Qadamlar for the edit + password change. Screenshot `profile`.
- `### Xodimni boshqa bo'linmaga o'tkazish` (`/employees/:uuid/transfer`) — Qadamlar: open profile → **O'tkazish** → new unit/position/start date/workload/assignment type/close-old checkbox/reason → submit. Eslatma: umumiy yuklama 150% dan oshmasligi kerak.
- `### Xodimni ishdan bo'shatish` — Qadamlar: profile → terminate → attach **ishdan bo'shatish buyrug'idan ko'chirma** (majburiy) → confirm. Diqqat: bu amal xodimning faol ERI sertifikatlarini avtomatik bekor qiladi (cascade).

- [ ] **Step 3: Verify** — V1–V4 OK; V5 on 4 cited labels (a wizard step name, the two attachment field labels, the password tab).

- [ ] **Step 4: Checkpoint** — no commit.

---

## Task 3: Chapter "Tashkiliy tuzilma"

**Files:**
- Modify: `docs/user-manual-uz.md` (append `## Tashkiliy tuzilma`)

**Label sources:** `dashboard.units`, `common.unit-types`, `common.status`. **Route:** `/units`. **UC:** UC-16.

- [ ] **Step 1: Read sources** — `dashboard.units` + `common.unit-types` in `uz.json`; skim `dashboard/src/features/units/UnitsPage.tsx` + `UnitFormSheet.tsx`.

- [ ] **Step 2: Write the chapter**

`## Tashkiliy tuzilma`, then:
- `### Bo'linmalarni boshqarish` (UC-16, `/units`) — intro: kim = Super Admin. Describe the 4-level daraxt (Departament → Boshqarma → Bo'lim → Sho'ba; glossary). Qadamlar: qidiruv/filtr → **Yangi bo'linma** form (nom, qisqa nom, kod, ota-bo'linma, tur) → save; edit; arxivlash. Eslatma: ichida tugallanmagan (faol) xodimlari bor bo'linmani arxivlab bo'lmaydi. Diqqat: bo'linma turi ota-bo'linmaga mos bo'lishi kerak (daraja chuqurligi). Screenshot `units-tree`.

- [ ] **Step 3: Verify** — V1–V4 OK; V5 on the 4 unit-type names + the **Yangi bo'linma** label.

- [ ] **Step 4: Checkpoint** — no commit.

---

## Task 4: Chapter "Hujjatlarni boshqarish"

**Files:**
- Modify: `docs/user-manual-uz.md` (append `## Hujjatlarni boshqarish`)

**Label sources:** `dashboard.documents`. **Routes:** `/documents`, `/documents/new`, `/documents/:uuid`. **UC:** UC-03, UC-11, UC-12, UC-18.

- [ ] **Step 1: Read sources** — `dashboard.documents` in `uz.json`; skim `dashboard/src/features/documents/wizard/` (4 steps), `DocumentsPage.tsx` (tabs incl. **Arxiv**), `detail/DocumentDetailPage.tsx` (print/email actions).

- [ ] **Step 2: Write the chapter**

`## Hujjatlarni boshqarish`, then:
- `### Shablon asosida hujjat yaratish` (UC-03, `/documents/new`) — Qadamlar across the wizard: **Turi** (shablon tanlash yoki fayl yuklash) → **Mazmun** (sarlavha, kimga, kim imzolaydi, maxfiylik, shablon maydonlari + jonli A4 ko'rinish) → **Kelishuv varaqasi** (next chapter handles routing) → **Ko'rib chiqish** → **Qoralama sifatida saqlash**. Eslatma: hujjat avtomatik raqam oladi (`HJ-2026/NNNN`). Screenshot `document-wizard`.
- `### Tayyor faylni yuklash` — Qadamlar: Turi step → **Tayyor faylni yuklash** → PDF/DOC/DOCX ≤ 10 MB.
- `### Hujjatni ko'rish, chop etish va PDF saqlash` (UC-11, `/documents/:uuid`) — Qadamlar: open document → **Chop etish / PDF saqlash** (browser print). 🟡 Simulyatsiya: Word (DOCX) eksport demo'da yo'q; faqat brauzer orqali PDF.
- `### Hujjatni e-pochta orqali yuborish` (UC-12) — Qadamlar: SIGNED/CLOSED hujjatda **Emailga yuborish**. 🟡 Simulyatsiya: demo "Yuborildi (demo)" xabarini ko'rsatadi; haqiqiy e-pochta jo'natilmaydi.
- `### Arxiv` (UC-18, `/documents` Arxiv tab) — explain: imzolangan/yakunlangan hujjatlar kun yakunida arxivga o'tadi; Arxiv tab kun bo'yicha guruhlaydi. 🟡 Simulyatsiya: arxivlash `archivedAt` belgisi bilan taqlid qilinadi (rejalashtiruvchi yo'q).

- [ ] **Step 3: Verify** — V1–V4 OK; V5 on the wizard step labels + **Chop etish** + **Arxiv** tab. Confirm the 🟡 markers on UC-11/12/18 match `use-cases.md` "Demo coverage".

- [ ] **Step 4: Checkpoint** — no commit.

---

## Task 5: Chapter "Kelishuv jarayoni"

**Files:**
- Modify: `docs/user-manual-uz.md` (append `## Kelishuv jarayoni`)

**Label sources:** `dashboard.documents` (kelishuv/approval parts), `dashboard.approvals`. **Routes:** `/documents/new`, `/documents/:uuid`, `/approvals`. **UC:** UC-04, UC-04a, UC-06.

- [ ] **Step 1: Read sources** — `dashboard.approvals` + the kelishuv/decision keys in `dashboard.documents`; skim `detail/DocumentActions` + `ApprovalSheetCard` + `ApprovalsQueuePage.tsx`.

- [ ] **Step 2: Write the chapter**

`## Kelishuv jarayoni`, then:
- `### Hujjatni kelishuvga yuborish` (UC-04) — Qadamlar: wizard **Kelishuv varaqasi** step → ketma-ket ishtirokchilar ro'yxati (qo'shish, tartiblash, olib tashlash) → **Kelishuvga yuborish**. Eslatma: kelishuv ketma-ket (sequential) — navbat tartibi bo'yicha. Glossary: *Kelishuv varaqasi*.
- `### Kelishuvda ishtirok etish` (UC-06, `/approvals`) — intro: kim = navbatdagi ishtirokchi. Qadamlar: **Kelishuvlar** queue → open → **Tasdiqlash** / **Izoh bilan tasdiqlash** / **Rad etish** (rad etishda izoh majburiy). Diqqat: rad etish joriy turni to'xtatadi. Screenshot `approvals-queue`.
- `### Kelishuv varaqasi va uning tarixi` — describe the auto-generated sheet (har bir ishtirokchi qarori, izoh, vaqt) and round history when a document is reworked.
- `### Hujjatni qayta ishlash` (UC-04a) — Qadamlar: rad etilgan/qoralama hujjatda **Tahrirlash** → o'zgartirish → qayta yuborish (yangi tur/round). Eslatma: faqat yaratuvchi tahrirlay oladi; imzolangan hujjat tahrirlanmaydi.

- [ ] **Step 3: Verify** — V1–V4 OK; V5 on **Tasdiqlash**, **Rad etish**, **Izoh bilan tasdiqlash**, the queue/section label.

- [ ] **Step 4: Checkpoint** — no commit.

---

## Task 6: Chapter "Elektron raqamli imzo (ERI)"

**Files:**
- Modify: `docs/user-manual-uz.md` (append `## Elektron raqamli imzo (ERI)`)

**Label sources:** `dashboard.certificates`, `dashboard.documents` (sign action). **Routes:** `/documents/:uuid`, `/certificates`, `/certificates/upload`. **UC:** UC-05 + certificates flow.

- [ ] **Step 1: Read sources** — `dashboard.certificates` + the sign keys in `dashboard.documents`; skim `features/_shared/eri/SignDialog`, `CertificatesPage.tsx`, `CertificateUploadPage.tsx`.

- [ ] **Step 2: Write the chapter**

`## Elektron raqamli imzo (ERI)`, then:
- `### Hujjatni ERI bilan imzolash` (UC-05, `/documents/:uuid`) — intro: kim = tasdiqlangan hujjatning imzolovchisi. Qadamlar: APPROVED hujjatda **Imzolash** → faol sertifikatni tanlash → 6-xonali PIN → tasdiqlash. 🟡 Simulyatsiya: demo E-IMZO bilan ~1.5 soniyalik taqlidiy aloqa o'rnatadi; haqiqiy E-IMZO plagini ishlatilmaydi. Eslatma: imzo tarixi audit jurnaliga yoziladi. Screenshot `document-sign`.
- `### ERI sertifikatlarini boshqarish` (`/certificates`, `/certificates/upload`) — describe the Kanban (PENDING_APPROVAL / ACTIVE / EXPIRED / REVOKED). Qadamlar: **Sertifikat yuklash** → xodim → PFX/P12 fayl → parol → o'qish → tasdiqlash; bulk **Tasdiqlash**; **Bekor qilish** (sabab bilan). 🟡 Simulyatsiya: PFX o'qish taqlid qilinadi; parol serverga uzatilmaydi. Diqqat: xodim ishdan bo'shatilganda uning faol sertifikatlari avtomatik bekor qilinadi.

- [ ] **Step 3: Verify** — V1–V4 OK; V5 on **Imzolash**, **Sertifikat yuklash**, **Bekor qilish**. Confirm 🟡 on UC-05 matches `use-cases.md`.

- [ ] **Step 4: Checkpoint** — no commit.

---

## Task 7: Chapter "Vazifalar va topshiriqlar"

**Files:**
- Modify: `docs/user-manual-uz.md` (append `## Vazifalar va topshiriqlar`)

**Label sources:** `dashboard.tasks`. **Routes:** `/tasks`, `/tasks/new`, `/tasks/:uuid`. **UC:** UC-07, UC-08, UC-09, UC-10.

- [ ] **Step 1: Read sources** — `dashboard.tasks` in `uz.json`; skim `features/tasks/TasksPage.tsx` (4 columns + stats band), `CreateTaskPage.tsx`, `detail/TaskDetailPage.tsx` (action bar).

- [ ] **Step 2: Write the chapter**

`## Vazifalar va topshiriqlar`, then:
- `### Topshiriq berish` (UC-07, `/tasks/new`) — intro: kim = rahbar (Bo'lim boshlig'i / Rahbar). Qadamlar: doskada **Topshiriq berish** → ijrochi (faqat o'z bo'linma subtree), sarlavha, tavsif, muddat, ustuvorlik → yuborish. Eslatma: avtomatik raqam `TOP-2026/NNNN`. Diqqat: o'z bo'linmasidan tashqaridagi xodimga topshiriq berib bo'lmaydi (scope guard). Screenshot `task-create`.
- `### Topshiriqni bajarish va natijani topshirish` (UC-08, `/tasks/:uuid`) — intro: kim = ijrochi. Qadamlar: **Boshlash** (Yangi → Ijroda) → ishni bajarish → **Natijani topshirish** (izoh/fayl/hujjat) → Ko'rib chiqilmoqda. Clarification thread ham bor.
- `### Natijani ko'rib chiqish` (UC-09) — intro: kim = topshiriq beruvchi. Qadamlar: **Qabul qilish** / **Izoh bilan qabul qilish** / **Qayta ishlashga qaytarish** (sabab majburiy) / **Rad etish** (sabab majburiy). Eslatma: qaytarilganda `round` oshadi.
- `### Vazifa doskasi va statistika` (UC-10, `/tasks`) — describe 4 columns (Yangi / Ijroda / Ko'rib chiqilmoqda / Bajarildi; Rad etilgan Bajarildi ustunida) + drag-and-drop + rahbar statistika tasmasi (sanoq / muddati o'tgan / xodim bo'yicha yuklama). 🟡 Qisman: kengaytirilgan hisobotlar/grafiklar demo'da yo'q. Maslahat: mobil qurilmada doska bitta ustunli ko'rinishga o'tadi.

- [ ] **Step 3: Verify** — V1–V4 OK; V5 on **Topshiriq berish**, **Natijani topshirish**, **Qabul qilish**, **Rad etish**, the 4 column names.

- [ ] **Step 4: Checkpoint** — no commit.

---

## Task 8: Chapter "Kiruvchi va chiquvchi xatlar"

**Files:**
- Modify: `docs/user-manual-uz.md` (append `## Kiruvchi va chiquvchi xatlar`)

**Label sources:** `dashboard.letters`. **Routes:** `/letters`, `/letters/new`, `/letters/:uuid`. **UC:** UC-13, UC-14, UC-15.

- [ ] **Step 1: Read sources** — `dashboard.letters` in `uz.json`; skim `features/letters/LettersPage.tsx`, `RegisterLetterPage.tsx`, `detail/LetterDetailPage.tsx` + `LetterActions`.

- [ ] **Step 2: Write the chapter**

`## Kiruvchi va chiquvchi xatlar`, then:
- `### Kiruvchi xatni ro'yxatga olish` (UC-13, `/letters/new`) — intro: kim = Devonxona (glossary). Qadamlar: **Xat ro'yxatga olish** → tashkilot, mavzu, kanal, qabul sanasi, muddat, imzo talab qilinadimi, skan fayl → saqlash. Eslatma: avtomatik raqam `K-2026/NNNN`. Screenshot `letter-register`.
- `### Xatni yo'naltirish va ijrochi tayinlash` (`/letters/:uuid`) — Qadamlar: Rahbar **Yo'naltirish** (bo'linmaga) → Bo'lim boshlig'i **Ijrochi tayinlash** (o'z subtree'sidan). Glossary: *Yo'naltirish*, *Ijrochi*.
- `### Xatga javob tayyorlash` (UC-14) — intro: kim = ijrochi. Qadamlar: **Ijroni boshlash** → javob (izoh yoki javob fayli/hujjati) → topshirish → Bo'lim boshlig'i **Qabul qilish**; agar imzo talab qilinsa Rahbar ERI bilan imzolaydi.
- `### Chiquvchi xatni jo'natish` (UC-15) — intro: kim = Devonxona. Qadamlar: tayyor javobni **Jo'natish** (kanal) → avtomatik bog'langan chiquvchi xat `CH-2026/NNNN` yaratiladi, kiruvchi xat yopiladi. Eslatma: muddati o'tgan xatlar ro'yxatda ogohlantirish belgisi bilan ko'rsatiladi.

- [ ] **Step 3: Verify** — V1–V4 OK; V5 on **Xat ro'yxatga olish**, **Yo'naltirish**, **Ijrochi tayinlash**, **Jo'natish**.

- [ ] **Step 4: Checkpoint** — no commit.

---

## Task 9: Chapter "Audit va xavfsizlik"

**Files:**
- Modify: `docs/user-manual-uz.md` (append `## Audit va xavfsizlik`)

**Label sources:** `dashboard.audit`, `common.status`. **Route:** `/audit`. **UC:** UC-20.

- [ ] **Step 1: Read sources** — `dashboard.audit` in `uz.json`; skim `features/audit/AuditLogPage.tsx` + `AuditEntryRow`.

- [ ] **Step 2: Write the chapter**

`## Audit va xavfsizlik`, then:
- `### Audit jurnalini o'qish` (UC-20, `/audit`) — Qadamlar: open **Audit** → filtrlar (resurs turi, aktor, sana oralig'i) → row shows kim / nima / qachon (+ maydon-darajasidagi farq). Hujjat tarixini `/documents/:uuid` ichida ham ko'rish mumkin. Screenshot `audit-log`.
- `### Imzolangan hujjatlar himoyasi` — prose: imzolangan hujjatni hech bir rol o'chira olmaydi va sezdirmasdan o'zgartira olmaydi; har qanday holat o'zgarishi audit jurnaliga tushadi. (README "Signed-document protection".)
- `### Maxfiylik va ruxsatlar` — prose: ruxsatlar har bir hujjat va topshiriq darajasida; xodim o'z bo'linmasidan tashqaridagi hujjatni faqat unga aniq ulashilgan bo'lsa ko'radi; audit yozuvlari faqat-qo'shiladigan (append-only).

- [ ] **Step 3: Verify** — V1–V4 OK; V5 on the **Audit** nav label + a filter label.

- [ ] **Step 4: Checkpoint** — no commit.

---

## Task 10: Chapter "Demo rejimi" + "Ilova"

**Files:**
- Modify: `docs/user-manual-uz.md` (append `## Demo rejimi` and `## Ilova`)

**Label sources:** `dashboard.pov`, `dashboard.user-menu`. **Facts from:** `ai_context/AI_CONTEXT.md` (personas, credentials, SEED_VERSION), `dashboard/QA_NOTES.md`.

- [ ] **Step 1: Read sources** — `dashboard.pov` + `dashboard.user-menu` in `uz.json`; re-read the AI_CONTEXT "Auth model" + seed-personas paragraphs for the 5 personas and credentials.

- [ ] **Step 2: Write the chapter**

`## Demo rejimi`, then:
- `### Demo haqida` — prose: demo namoyish maqsadida; ma'lumotlar oldindan to'ldirilgan (mock); haqiqiy server yo'q; o'zgarishlar faqat brauzerda saqlanadi.
- `### Kirish ma'lumotlari` — `admin@devon.uz` / `Demo2026!` (login ekranida ham ko'rsatilgan).
- `### Rol almashtirish` — Qadamlar: foydalanuvchi menyusi → **Rol almashtirish** → 5 shaxsdan birini tanlash (HR_ADMIN · Rahbar · Bo'lim boshlig'i · Devonxona · Xodim). Eslatma: yuqori paneldagi chipdagi × orqali o'z roliga qaytish. Maslahat: ko'p ishtirokchili oqimlarni (kelishuv, xat, topshiriq) shu orqali to'liq ko'rish mumkin. Screenshot `pov-switcher`.
- `### Demoni qayta tiklash` — Qadamlar: foydalanuvchi menyusi → **Reset demo** (boshlang'ich holatga qaytaradi). Diqqat: demo davomida yaratgan ma'lumotlar o'chiriladi.
- `### Nimalar simulyatsiya qilingan` — bullet list: ERI imzolash (taqlidiy E-IMZO), e-pochta jo'natish, hujjat arxivlash va tungi zaxira (jadval yo'q), PFX o'qish. Haqiqiy tizimda bularning barchasi real integratsiya orqali ishlaydi.

Then `## Ilova`:
- `### Atamalar` — short pointer to [`docs/glossary.md`](glossary.md) with 6–8 most-used terms inline (Kelishuv varaqasi, Devonxona, Topshiriq, Ijrochi, ERI, Maxfiylik darajasi, Buyruqdan ko'chirma).
- `### Yordam olish` — in-app `?` icon; support contacts (from README Support: `support@yourorg.uz`, helpdesk).

- [ ] **Step 3: Verify** — V1–V4 OK; V5 on **Rol almashtirish** + **Reset demo**. Confirm credentials match AI_CONTEXT exactly.

- [ ] **Step 4: Checkpoint** — no commit.

---

## Task 11: Whole-document verification pass (spec §5 definition of done)

**Files:**
- Modify: `docs/user-manual-uz.md` (fix any issues found)

- [ ] **Step 1: Run all content-correctness greps**

```bash
python3 -c "import re; t=open('docs/user-manual-uz.md',encoding='utf-8').read(); bad=[(i+1,l) for i,l in enumerate(t.splitlines()) if re.search(r'[Ѐ-ӿ]',l)]; [print(f'{n}: {l}') for n,l in bad]; print('OK: no Cyrillic' if not bad else 'CYRILLIC FOUND')"
grep -niE 'laravel|react|vite|tailwind|postgres|localstorage|\bzod\b|typescript|shadcn|vue|node\.js' docs/user-manual-uz.md || echo "OK: no tech-stack"
grep -niE 'plyma|plymo' docs/user-manual-uz.md || echo "OK: no legacy names"
grep -niE 'TODO|TBD|\[NEEDS_TRANSLATION\]' docs/user-manual-uz.md || echo "OK: no placeholders"
```
Expected: `OK: no Cyrillic` + three `OK:` lines. Fix any hit.

- [ ] **Step 2: Route accuracy** — extract every route mentioned in the manual and confirm it exists in `dashboard/src/router.tsx`:

```bash
grep -noE '/[a-z][a-z/:.-]*' docs/user-manual-uz.md | sort -u
```
Cross-check each `/…` path against the router's route list. Any path not in the router (and not an obvious external URL/image path) is a bug — fix the prose.

- [ ] **Step 3: Demo-status honesty** — confirm each 🟡 marker in the manual corresponds to a 🟡/⬜ row in `docs/use-cases.md` "Demo coverage" (UC-05, UC-10, UC-11, UC-12, UC-18, certificates PFX). Nothing marked ✅ in use-cases is described as simulated, and nothing simulated is described as fully real.

- [ ] **Step 4: Anchor/TOC resolution** — confirm every `## ` chapter title matches a Mundarija link, and the in-document links (`#demo-rejimi`, `glossary.md`) resolve:

```bash
grep -nE '^## ' docs/user-manual-uz.md
grep -noE '\]\(#[a-z0-9-]+\)' docs/user-manual-uz.md | sort -u
```
Verify each `#anchor` has a matching lower-cased, hyphenated heading.

- [ ] **Step 5: Label spot-check** — pick 10 distinct on-screen labels cited across chapters; run V5 for each against `uz.json`. All must be found. Fix any cited label that doesn't exist.

- [ ] **Step 6: Checkpoint** — no commit; the manual is content-complete and verified.

---

## Task 12: Doc cascade

**Files:**
- Modify: `ai_context/AI_CONTEXT.md` (flip the user-manual gap)
- Modify: `ai_context/HISTORY.md` (append session entry)
- Verify: `README.md` reference resolves (likely no change)

- [ ] **Step 1: Flip the AI_CONTEXT gap**

In `ai_context/AI_CONTEXT.md` "Open questions / known gaps", change the **"User manual (Uzbek)"** bullet from open to resolved: note `docs/user-manual-uz.md` now exists (task-oriented, all 8 modules, demo-mode chapter, Uzbek-only), and that the screenshot images are a follow-up for the operator (`docs/images/user-manual/`).

- [ ] **Step 2: Append a HISTORY entry**

Add a dated entry to `ai_context/HISTORY.md` summarizing: spec → plan → manual authored; framing (hybrid), structure (module chapters / task sections), depth (practical), screenshots deferred, UC-19 excluded; verification results.

- [ ] **Step 3: Verify README reference**

Confirm `README.md` already points at `docs/user-manual-uz.md` (Documentation table + Support). It does — no edit expected. If the link text drifted, fix it.

- [ ] **Step 4: Final checkpoint**

Leave everything in the working tree. Tell the user the manual + doc-cascade edits are ready and to run `/commit` when they want them committed. Mention the screenshot-capture follow-up.

---

## Self-review notes (for the executor)

- **If a manual step reveals a real discrepancy** in `use-cases.md` / `product-specification.md` / `uz.json` (a label that drifted, a route that moved), **fix the source doc first**, then write the manual against the corrected truth — do not encode drift into the manual (CLAUDE.md "fix the doc first").
- **Type/term consistency:** use the same Uzbek heading text in the Mundarija and the chapter `##` headings; reuse glossary spellings exactly (Devonxona, Kelishuv varaqasi, Topshiriq) across all chapters.
- **No commits anywhere** until the user runs `/commit`.
