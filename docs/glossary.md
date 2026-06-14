# Devon — Glossary

> **Document type:** Glossary of Uzbek and Russian terms used throughout the product, with their meaning in Devon's domain.
> **Audience:** Non-Uzbek-speaking team members, new joiners, customer-success staff outside Uzbekistan, anyone authoring docs or copy.
>
> When in doubt, prefer the Uzbek term in copy (Devon is Uzbek-first) and explain it parenthetically on first use in any English text.

---

## Organizational hierarchy

The four-level Uzbek corporate hierarchy Devon models natively.

| Term | Approx. English | Devon-specific meaning |
|---|---|---|
| **Departament** | Department / Directorate | Top-level org unit; usually headed by a director or deputy director. A large ministry has several. |
| **Boshqarma** | Management / Division | Second level under Departament. Headed by a boshqarma boshlig'i (division head). |
| **Bo'lim** | Section / Office | Third level. Headed by a bo'lim boshlig'i. |
| **Sho'ba** | Bureau / Unit | Fourth (leaf) level. Headed by a sho'ba boshlig'i. Employees are assigned directly to a sho'ba. |
| **Boshliq** | Head / Chief | Generic title for the head of any structural unit. Combined with the unit name (e.g., `Bo'lim boshlig'i`). |

**Why four levels matter:** Devon models all four as first-class concepts. Generic "departments + sub-departments" cannot capture this — see [product-specification.md §4.6](./product-specification.md#46-organizational-structure).

---

## Workflow terms

| Term | Approx. English | Devon-specific meaning |
|---|---|---|
| **Soglasovaniya** (Russian: согласование) | Concurrence / Collaborative approval | The traditional Uzbek/Soviet-style multi-party approval process where a document must be reviewed and endorsed by several parties before it is signed. Devon's Approval Workflow module ([§4.4](./product-specification.md#44-approval-workflow-list-soglasovaniya)) digitizes this. |
| **List soglasovaniya** (Russian: лист согласования) | Approval routing list / Approval sheet | The named ordered list of approvers a document must pass through. Sometimes also refers to the **final printed sheet** showing each approver's decision. |
| **Kelishuv** | Concurrence (Uzbek) | The Uzbek equivalent of *soglasovaniya*. |
| **Kelishuv varaqasi** | Approval sheet | The one-page document Devon auto-generates when an approval chain completes, listing every participant's action, comment, and timestamp. Permanently attached to the document. |
| **Tasdiqlash** | Approval / Confirmation | The act of approving (one specific decision within a chain). |
| **Rad etish** | Rejection | The act of rejecting within a chain. |
| **Izoh** | Comment / Note | A non-blocking annotation attached to an approval action. |
| **Imzo** | Signature | A formal signature, in the legal sense. |
| **ERI** — *Elektron Raqamli Imzo* | Electronic Digital Signature | The legally recognized e-signature standard in Uzbekistan, backed by the local PKI. Devon's signature module ([§4.3](./product-specification.md#43-electronic-digital-signature-eri)) integrates with the customer's CA. |
| **E-imzo** | e-signature | Common shorthand for ERI. The national platform/service is also branded e-imzo. |
| **PKI** | Public Key Infrastructure | The certificate authority and key-management infrastructure the customer runs internally. Devon connects to it; Devon does not replace it. |

---

## Document and correspondence terms

| Term | Approx. English | Devon-specific meaning |
|---|---|---|
| **Hujjat** | Document | A formal record in Devon — has a number, an author, a confidentiality classification, a lifecycle state. |
| **Hujjat aylanmasi** | Document circulation / Document flow | The general practice of internal document movement and approval — what Devon digitizes end-to-end. |
| **Shablon** | Template | A reusable document structure with placeholder fields. Customers define their own template library. |
| **Buyruq** | Order / Directive | A formal internal order, typically signed by a director or deputy. A common document type. |
| **Buyruqdan ko'chirma** | Extract from an order | The certified extract of the hiring order, signed by a director — attached (PDF/JPG/PNG) as a required document when an employee profile is created in Devon. Collected alongside *lavozim yo'riqnomasi* — both are required at profile creation. |
| **Ishdan bo'shatish buyrug'idan ko'chirma** | Extract from the termination order | The certified extract of the dismissal order, signed by a director — a required document (PDF/JPG/PNG) when an employee is terminated in Devon. Terminating also auto-revokes the employee's active ERI certificates. |
| **Yo'riqnoma** | Instruction / Manual | A formal instruction document. |
| **Lavozim yo'riqnomasi** | Position instructions / Job description | The document defining an employee's job duties; attached (PDF/JPG/PNG) as a required document when an employee profile is created in Devon. |
| **Davonxona** | Registry / Chancellery / Clerk's office | The team that handles incoming and outgoing official correspondence. Often the entry point for citizen petitions and inter-agency letters. Owns the inbound/outbound numbering. Variants in spelling: *devonxona*, *dyevonxona*. |
| **Kiruvchi xat** | Inbound letter / Incoming correspondence | Official letter received by the organization. Devon registers these with a unique inbound number. Spelling variant: *keluvchi xat* (used in the 19.03.2026 TLH and the dashboard UI). |
| **Yo'naltirish** | Routing / Forwarding | The act of routing a registered letter down the hierarchy: Devonxona → Rahbar → structural unit → executor (BP-3). |
| **Chiquvchi xat** | Outbound letter / Outgoing correspondence | Official letter sent by the organization. Devon assigns the outbound number after the response is signed and dispatched. |
| **Ijrochi** | Executor | The employee assigned to handle a specific inbound letter (drafting the response, gathering information). |
| **Arxiv** | Archive | The post-active store for documents in terminal states. Searchable but moved out of the active working set. |
| **Maxfiylik darajasi** | Confidentiality level | The classification (open / internal / restricted / confidential) that gates who can see a document. |

---

## Roles

| Term | Approx. English | Devon-specific meaning |
|---|---|---|
| **Super Admin** | (Same) | The system administrator role; manages users, org structure, templates, configuration. Cannot edit document content. |
| **Bo'linma rahbari** / **Boshliq** | Department Head | Head of any structural unit (Departament / Boshqarma / Bo'lim / Sho'ba). Devon grants them subtree-scoped permissions. |
| **Xodim** | Employee | A standard employee. Has personal scope: own documents, own tasks, chains they're added to. |
| **Mehmon** | Guest | (Planned post-v1.0) — limited read-only role for external auditors or visitors with explicit access grants. |

---

## Task management terms

| Term | Approx. English | Devon-specific meaning |
|---|---|---|
| **Vazifa** | Task | A named work item with an assignee, deadline, priority, and deliverable. |
| **Vazifa doskasi** | Task board | The Kanban board (4 columns: Yangi / Ijroda / Ko'rib chiqilmoqda / Bajarildi; plus terminal Rad etilgan). |
| **Topshiriq** | Task / Assignment | The BP-2 unit of delegated work. A manager (Rahbar or Bo'lim boshlig'i — the *assigner*) creates a topshiriq and assigns it to a single subordinate employee (*assignee / ijrochi*). Auto-numbered `TOP-{year}/{NNNN}`. Lifecycle: Yangi → Ijroda → Ko'rib chiqilmoqda → Bajarildi, with terminal Rad etilgan. The assigner reviews the deliverable and chooses Accept / Accept-with-note / Return for revision / Reject. Often used interchangeably with *vazifa*; in practice *topshiriq* implies a more formal manager-to-employee delegation. |
| **Muddat** | Deadline / Term | The due date on a task or letter. Stored as a date-only value (`YYYY-MM-DD`). |
| **Ustuvorlik** | Priority | High / Medium / Standard. |
| **Natija** | Result / Deliverable | The artifact the assignee produces and submits for review. |
| **Bildirishnoma** | Notification | An in-app, email, or push notification fired by Devon on a state change. |

---

## Authentication and security terms

| Term | Approx. English | Devon-specific meaning |
|---|---|---|
| **Kirish** | Login / Entry | Authentication into Devon. |
| **Parol** | Password | The user's secret. Devon enforces a complexity policy. |
| **Token / PIN** | (Same) | The signing credential the user presents to apply an ERI signature. |
| **Audit log / Audit yozuvlari** | Audit log | Devon's append-only record of every meaningful action. |
| **Backup / Zaxira nusxa** | Backup | Nightly encrypted snapshot. |

---

## Project naming history

The product currently called **Devon** has had two prior names. Legacy artifacts may still use either.

| Name | Era | Usage today |
|---|---|---|
| **PLYMO** | Early concept (pre-2025) | Appears in the earliest written spec. Same product. |
| **PLYMA** | 2025 spec phase | Appears in the v1.0 technical specification, the early landing page, the legacy `docs/Plyma_Technical_Spec_v1.0.docx`, **and the updated TLH `docs/Plyma 19.03.2026.docx`** (dated 2026 but retains the legacy codename — its content is current canon). From Greek *plimo* — "flow." Same product. |
| **Devon** | Current (2026+) | The shipping product name. All new artifacts use Devon. |

When you see PLYMO or PLYMA in legacy material, mentally substitute Devon. The product hasn't changed; the naming has.

---

## Phrases worth recognizing

| Phrase | Translation | When you'll see it |
|---|---|---|
| **Rivolanish intizom bilan** | "Development through discipline" | Devon's tagline. The cultural posture — Devon is opinionated about workflows because regulated environments require it. |
| **Plimo** (Greek: πλημμύρα) | "Flow" | The etymological root of PLYMA. The product is about making the document flow. |
| **Hujjat aylanish platformasi** | "Document circulation platform" | The category descriptor in Uzbek. Roughly equivalent to "EDM" (Electronic Document Management) in English. |
| **Ichki hujjat aylanmasi** | "Internal document flow" | Specifically the flow of documents *within* an organization — Devon's primary scope. (Inbound/outbound correspondence is a controlled boundary.) |
| **Korporativ platforma** | "Corporate platform" | Marketing-positioning term. Implies enterprise-grade rather than consumer or small-business. |
| **Ichki server / On-prem** | "Internal server / On-premise" | Devon's deployment model. A non-negotiable. |
| **Ish taqsimoti** | "Work distribution / Work delegation" | The Uzbek term for task management. Distinct from *hujjat aylanmasi* — the two coexist in Devon. |

---

## Pronunciation notes (informal)

For non-Uzbek-speaking team members making first contact with the terms:

| Term | Rough pronunciation |
|---|---|
| Departament | de-par-ta-MENT |
| Boshqarma | bosh-qar-MA |
| Bo'lim | bo-LIM (the apostrophe lengthens the 'o') |
| Sho'ba | SHO-ba |
| Soglasovaniya (Russian) | sah-glah-soh-VAH-nee-yah |
| Kelishuv | keh-lee-SHOOV |
| Kelishuv varaqasi | keh-lee-SHOOV vah-rah-kah-SI |
| Hujjat | hooj-JAT |
| Davonxona | dah-von-HO-na |
| Devon (the product) | DEH-von |
| Plyma | PLEE-ma |
| ERI | E-R-I (three letters) |

---

## When to use which language in product surfaces

- **UI strings:** Uzbek primary. Russian and English co-equal in v1.1+.
- **Document content:** Whatever the author writes. Devon does not auto-translate document content.
- **Internal team communication:** English among the Devon team; Uzbek/Russian with customers.
- **Marketing & landing copy:** Uzbek primary; Russian and English follow.
- **Legal/compliance content** (terms, privacy policy, certificates of signature validity): Uzbek + Russian + the relevant legal-equivalent English.

---

## Cross-references

- Product spec where these terms appear in context: [product-specification.md](./product-specification.md)
- Business processes that use the workflow terminology: [business-processes.md](./business-processes.md)
- Use cases that exercise the role names: [use-cases.md](./use-cases.md)
- Competitive analysis (where some competitor names are also Uzbek/Russian): [competitive-analysis.md](./competitive-analysis.md)
