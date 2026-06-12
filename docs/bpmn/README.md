# BPMN Business Process Diagrams

Visual swim-lane diagrams extracted from the canonical TLH [`docs/Plyma 19.03.2026.docx`](../Plyma%2019.03.2026.docx) (§III). The text form of each process lives in [`docs/business-processes.md`](../business-processes.md) — if a diagram and the text disagree, reconcile against the TLH first.

| # | Diagram | TLH § | Process | Lanes | Dashboard milestone |
|---|---|---|---|---|---|
| BP-1 | [`bp1-xodim-profil-yaratish.png`](./bp1-xodim-profil-yaratish.png) | 3.1 | Xodim va tarkibiy bo'linma uchun profil yaratish | Admin · Platforma · Xodim · HR/Kadrlar bo'limi | **M1 — shipped** (steps 01–15) |
| BP-2 | [`bp2-vazifa-taqsimoti.png`](./bp2-vazifa-taqsimoti.png) | 3.2 | Vazifa taqsimoti va ijroni qabul qilish | Rahbar · Platforma · Xodim | M3 — planned |
| BP-3 | [`bp3-xatlar-boshqaruvi.png`](./bp3-xatlar-boshqaruvi.png) | 3.3 | Keluvchi va chiquvchi xatlar boshqaruvi | Devonxona · Rahbar · Tarkibiy bo'linma boshlig'i · Xodim | **M2 — in plan** (steps 20–21) |
| BP-4 | [`bp4-hujjat-yaratish-kelishish.png`](./bp4-hujjat-yaratish-kelishish.png) | 3.4 | Hujjat yaratish va tarkibiy bo'linmalar bilan kelishish | Xodim · Platforma | **M2 — in plan** (steps 17–19) |

Milestone prompt sets: [`docs/dashboard-prompts/`](../dashboard-prompts/).
