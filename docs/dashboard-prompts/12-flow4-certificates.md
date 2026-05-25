# STEP 12 — Flow 4: Sertifikatlar (ERI Kanban + PFX upload + approval queue)

## Prerequisite
Master prompt loaded. Steps 01–11 complete.

## Goal
Build `/certificates` covering Flow 4 in TZ §6:
- Kanban-style board on desktop with columns PENDING_APPROVAL · ACTIVE · EXPIRED · REVOKED
- On mobile, the same board collapses to `Tabs` (one column visible at a time)
- A certificate `Card` shows owner, validity window, issuer, status
- HR_ADMIN actions: approve / reject (with reason) / revoke
- Upload route `/certificates/upload` simulating PFX metadata extraction (no real crypto — fake parser returns plausible data after a delay)
- Expiring-soon banner pinned on top
- Bulk actions (approve / reject multiple at once)

## Deliverables
- `dashboard/src/features/certificates/CertificatesPage.tsx`
- `dashboard/src/features/certificates/CertificatesKanban.tsx`
- `dashboard/src/features/certificates/CertificatesTabsMobile.tsx`
- `dashboard/src/features/certificates/CertificateCard.tsx`
- `dashboard/src/features/certificates/CertificateUploadPage.tsx`
- `dashboard/src/features/certificates/FakePfxParser.ts` — generates plausible X.509 metadata
- `dashboard/src/features/certificates/ApproveDialog.tsx`, `RejectDialog.tsx`, `RevokeDialog.tsx`
- Mock-backend additions: `uploadCertificate`, `approveCertificate`, `rejectCertificate`, `revokeCertificate` (if not yet)
- Extend `uz.json` with `dashboard.certificates.*`
- Replace `/certificates` and `/certificates/upload` placeholders

## Tasks

### 1. FakePfxParser

```ts
// src/features/certificates/FakePfxParser.ts
export interface ExtractedCertMeta {
  serialNumber: string;
  thumbprint: string;
  subjectPinfl: string;          // assumed to match the current employee in the demo
  subjectCommonName: string;
  subjectOrganization?: string;
  issuerName: string;
  validFrom: string;
  validTo: string;
  keyUsage: string[];
}

function randomHex(len: number) {
  let s = '';
  for (let i = 0; i < len; i++) s += '0123456789ABCDEF'[Math.floor(Math.random() * 16)];
  return s;
}

export async function fakeExtractFromPfx(
  file: File,
  passwordOk: boolean,
  knownPinfl: string,
  knownFio: string
): Promise<ExtractedCertMeta> {
  // Simulate the local parse latency
  await new Promise(r => setTimeout(r, 800 + Math.random() * 700));
  if (!passwordOk) throw new Error('pfx-password-wrong');
  if (file.size > 100 * 1024) throw new Error('pfx-too-large');

  const validFrom = new Date();
  const validTo = new Date(validFrom);
  validTo.setFullYear(validTo.getFullYear() + 1);

  return {
    serialNumber: randomHex(32),
    thumbprint: randomHex(64),
    subjectPinfl: knownPinfl,
    subjectCommonName: knownFio,
    issuerName: 'YANGI TEXNOLOGIYALAR ILMIY-AXBOROT MARKAZI AJ',
    validFrom: validFrom.toISOString(),
    validTo: validTo.toISOString(),
    keyUsage: ['digitalSignature', 'keyEncipherment'],
  };
}
```

> No real PFX parsing — the file is read only to gate on size. The "password" check is just whether the user typed anything. The extracted metadata is mocked plausibly. In the real system this happens via webcrypto + X.509 parsing.

### 2. CertificateCard

```tsx
// CertificateCard.tsx
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import StatusBadge from '@/components/common/StatusBadge';
import { Calendar, AlertCircle } from 'lucide-react';
import { formatDate } from '@/i18n/uz-locale';
import type { Certificate, Employee } from '@/types/domain';

interface Props {
  cert: Certificate;
  employee?: Employee;
  selected?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
}

function initials(n: string) {
  return n.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function CertificateCard({ cert, employee, selected, onSelect, onClick }: Props) {
  const { t } = useTranslation(['dashboard']);
  const expiringSoon = cert.status === 'ACTIVE' && new Date(cert.validTo).getTime() - Date.now() < 30 * 86_400_000;

  return (
    <Card
      onClick={onClick}
      className={`p-4 cursor-pointer hover:shadow-sm transition-shadow ${selected ? 'ring-2 ring-emerald' : ''}`}
    >
      <div className="flex items-start gap-3">
        {onSelect && (
          <input
            type="checkbox"
            checked={!!selected}
            onChange={e => { e.stopPropagation(); onSelect(); }}
            onClick={e => e.stopPropagation()}
            className="mt-1 h-4 w-4 rounded border-line accent-emerald"
            aria-label="Select"
          />
        )}
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-emerald-soft text-emerald-deep text-xs font-semibold">
            {employee ? initials(employee.fullNameGenerated) : '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink truncate">
            {employee?.fullNameGenerated ?? cert.subjectCommonName}
          </p>
          <p className="text-xs text-muted-foreground truncate">{cert.issuerName}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
            <Calendar className="h-3 w-3" aria-hidden />
            {formatDate(cert.validFrom)} – {formatDate(cert.validTo)}
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <StatusBadge status={cert.status} />
            {expiringSoon && (
              <span className="inline-flex items-center gap-1 text-xs text-cinnamon">
                <AlertCircle className="h-3 w-3" />
                {t('dashboard:certificates.card.expiring-soon')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
```

### 3. CertificatesKanban (desktop)

4 columns side-by-side. Each column has header (label + count badge), scrollable card list, and a footer bulk-action zone.

```tsx
// CertificatesKanban.tsx
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CertificateCard from './CertificateCard';
import type { Certificate, Employee } from '@/types/domain';

const STATUSES: Array<{ key: Certificate['status']; bgClass: string }> = [
  { key: 'PENDING_APPROVAL', bgClass: 'bg-cinnamon-soft' },
  { key: 'ACTIVE', bgClass: 'bg-emerald-soft' },
  { key: 'EXPIRED', bgClass: 'bg-cream-deep' },
  { key: 'REVOKED', bgClass: 'bg-destructive/10' },
];

interface Props {
  certs: Certificate[];
  employees: Employee[];
  selected: Set<string>;
  onToggleSelect: (uuid: string) => void;
  onOpen: (c: Certificate) => void;
}

export default function CertificatesKanban({ certs, employees, selected, onToggleSelect, onOpen }: Props) {
  const { t } = useTranslation(['common']);
  const empByUuid = new Map(employees.map(e => [e.uuid, e]));
  return (
    <div className="grid grid-cols-4 gap-4">
      {STATUSES.map(s => {
        const rows = certs.filter(c => c.status === s.key);
        return (
          <div key={s.key} className="flex flex-col bg-cream-deep/50 rounded-xl p-3 min-h-[480px]">
            <div className={`flex items-center justify-between rounded-md px-3 py-2 mb-3 ${s.bgClass}`}>
              <span className="text-xs font-semibold tracking-wider uppercase text-ink">
                {t(`common:status.${s.key.toLowerCase().replace('_approval', '')}`)}
              </span>
              <Badge variant="outline" className="bg-cream tabular-nums">{rows.length}</Badge>
            </div>
            <div className="space-y-2 overflow-y-auto pr-1 flex-1">
              {rows.map(c => (
                <CertificateCard
                  key={c.uuid}
                  cert={c}
                  employee={empByUuid.get(c.employeeUuid)}
                  selected={selected.has(c.uuid)}
                  onSelect={c.status === 'PENDING_APPROVAL' ? () => onToggleSelect(c.uuid) : undefined}
                  onClick={() => onOpen(c)}
                />
              ))}
              {rows.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">—</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### 4. CertificatesTabsMobile

Tabs sticky just below the page header. Active tab shows the column.

```tsx
// CertificatesTabsMobile.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CertificateCard from './CertificateCard';
import type { Certificate, Employee } from '@/types/domain';

const STATUSES: Certificate['status'][] = ['PENDING_APPROVAL', 'ACTIVE', 'EXPIRED', 'REVOKED'];

interface Props {
  certs: Certificate[];
  employees: Employee[];
  selected: Set<string>;
  onToggleSelect: (uuid: string) => void;
  onOpen: (c: Certificate) => void;
}

export default function CertificatesTabsMobile({ certs, employees, selected, onToggleSelect, onOpen }: Props) {
  const { t } = useTranslation(['common']);
  const empByUuid = new Map(employees.map(e => [e.uuid, e]));
  const [tab, setTab] = useState<Certificate['status']>('PENDING_APPROVAL');
  const rows = certs.filter(c => c.status === tab);
  return (
    <Tabs value={tab} onValueChange={v => setTab(v as Certificate['status'])} className="space-y-3">
      <TabsList className="w-full overflow-x-auto no-scrollbar">
        {STATUSES.map(s => (
          <TabsTrigger key={s} value={s} className="text-xs whitespace-nowrap">
            {t(`common:status.${s.toLowerCase().replace('_approval', '')}`)} ({certs.filter(c => c.status === s).length})
          </TabsTrigger>
        ))}
      </TabsList>
      {STATUSES.map(s => (
        <TabsContent key={s} value={s} className="space-y-2">
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">{t('common:labels.empty')}</p>
          )}
          {rows.map(c => (
            <CertificateCard
              key={c.uuid}
              cert={c}
              employee={empByUuid.get(c.employeeUuid)}
              selected={selected.has(c.uuid)}
              onSelect={c.status === 'PENDING_APPROVAL' ? () => onToggleSelect(c.uuid) : undefined}
              onClick={() => onOpen(c)}
            />
          ))}
        </TabsContent>
      ))}
    </Tabs>
  );
}
```

### 5. Approval, rejection, revocation dialogs

Three small `ResponsiveDialog`s:
- **ApproveDialog** — confirm with a single OK CTA. On confirm: `approveCertificate(uuid)`.
- **RejectDialog** — textarea for `rejectionReason`, required. On confirm: `rejectCertificate(uuid, reason)`.
- **RevokeDialog** — select `revocationReason` from `[EXPIRED, COMPROMISED, REPLACED, MANUAL]`. On confirm: `revokeCertificate(uuid, reason)`.

All actions write audit entries.

### 6. CertificatesPage

```tsx
// CertificatesPage.tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, AlertCircle, Check, X, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import PageHeader from '@/components/common/PageHeader';
import LoadingState from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useMediaQuery } from '@/lib/use-media-query';
import CertificatesKanban from './CertificatesKanban';
import CertificatesTabsMobile from './CertificatesTabsMobile';
import ApproveDialog from './ApproveDialog';
import RejectDialog from './RejectDialog';
import RevokeDialog from './RevokeDialog';

import { listCertificates, listEmployees, approveCertificate } from '@/lib/mock-backend';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Certificate, Employee } from '@/types/domain';

export default function CertificatesPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const actor = useAuthStore(s => s.user!.uuid);
  const [certs, setCerts] = useState<Certificate[] | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openCert, setOpenCert] = useState<Certificate | null>(null);

  async function reload() {
    const [c, e] = await Promise.all([listCertificates(), listEmployees()]);
    setCerts(c);
    setEmployees(e);
  }
  useEffect(() => { reload(); }, []);

  function toggle(uuid: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(uuid) ? next.delete(uuid) : next.add(uuid);
      return next;
    });
  }

  async function bulkApprove() {
    const ids = Array.from(selected);
    let ok = 0;
    for (const id of ids) {
      try { await approveCertificate(id, actor); ok++; } catch {}
    }
    toast.success(t('dashboard:certificates.toast.bulk-approved', { count: ok }));
    setSelected(new Set());
    await reload();
  }

  const pendingCount = certs?.filter(c => c.status === 'PENDING_APPROVAL').length ?? 0;

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHeader
        title={t('dashboard:certificates.title')}
        subtitle={t('dashboard:certificates.subtitle', { count: pendingCount })}
        actions={
          <Button asChild className="w-full md:w-auto">
            <Link to="/certificates/upload"><Plus className="h-4 w-4 mr-2" />{t('dashboard:certificates.upload-cta')}</Link>
          </Button>
        }
      />

      {selected.size > 0 && (
        <Alert className="bg-cream-deep border-emerald/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <AlertDescription className="text-ink">
            {t('dashboard:certificates.bulk.selected', { count: selected.size })}
          </AlertDescription>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>
              {t('common:actions.cancel')}
            </Button>
            <Button size="sm" onClick={bulkApprove}>
              <Check className="h-4 w-4 mr-1" /> {t('common:actions.approve')} ({selected.size})
            </Button>
          </div>
        </Alert>
      )}

      {!certs && <LoadingState rows={6} />}
      {certs && (isDesktop ? (
        <CertificatesKanban certs={certs} employees={employees} selected={selected} onToggleSelect={toggle} onOpen={setOpenCert} />
      ) : (
        <CertificatesTabsMobile certs={certs} employees={employees} selected={selected} onToggleSelect={toggle} onOpen={setOpenCert} />
      ))}

      {/* Detail sheet with approve/reject/revoke */}
      {/* Use ResponsiveDialog or Sheet showing all metadata + action buttons */}
    </div>
  );
}
```

### 7. CertificateUploadPage

Mobile-first, no AppShell. Step-by-step "upload wizard":
1. Pick employee (defaults from `?employee=` query param if present)
2. File picker (`.pfx` / `.p12` only, max 100KB)
3. PFX password (single field, masked)
4. "Continue" → `fakeExtractFromPfx()` with a loading state
5. Show extracted metadata in a confirmation card; if `subjectPinfl !== employee.pinfl` → red error "PINFL mos kelmadi"
6. Simulated challenge-response: a short "Sertifikatga egalik tasdiqlanmoqda..." progress (1.5s mock signing)
7. Auto-approve (default) or send to PENDING_APPROVAL (toggle in admin only)
8. On submit, `uploadCertificate()` → toast → navigate back to employee profile or `/certificates`

Layout:
- Mobile: full-screen route, top bar `X` + title, body scrolls, sticky CTA bar.
- Desktop: page rendered inside AppShell with a centred card.

### 8. Mock-backend mutations

```ts
export async function uploadCertificate(input: {
  employeeUuid: string;
  meta: ExtractedCertMeta;
  certificateType: 'SIGNING' | 'ENCRYPTION' | 'BOTH';
  autoApprove: boolean;
}, actorUuid: string): Promise<Certificate> {
  await simulatedDelay();
  maybeFail();
  const all = readTable<Certificate>(Tables.certificates, []);
  if (all.some(c => c.serialNumber === input.meta.serialNumber)) {
    throw Object.assign(new Error('serial-taken'), { code: 'serial-taken' });
  }
  const employee = readTable<Employee>(Tables.employees, []).find(e => e.uuid === input.employeeUuid)!;
  if (employee.pinfl !== input.meta.subjectPinfl) {
    throw Object.assign(new Error('pinfl-mismatch'), { code: 'pinfl-mismatch' });
  }
  const c: Certificate = {
    uuid: uuid(),
    employeeUuid: input.employeeUuid,
    serialNumber: input.meta.serialNumber,
    thumbprint: input.meta.thumbprint,
    subjectPinfl: input.meta.subjectPinfl,
    subjectCommonName: input.meta.subjectCommonName,
    subjectOrganization: input.meta.subjectOrganization,
    issuerName: input.meta.issuerName,
    validFrom: input.meta.validFrom,
    validTo: input.meta.validTo,
    keyUsage: input.meta.keyUsage,
    certificateType: input.certificateType,
    status: input.autoApprove ? 'ACTIVE' : 'PENDING_APPROVAL',
    uploadedByUuid: actorUuid,
    approvedByUuid: input.autoApprove ? actorUuid : undefined,
    approvedAt: input.autoApprove ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
  };
  all.push(c);
  writeTable(Tables.certificates, all);
  await appendAudit({
    action: 'CERTIFICATE_UPLOADED',
    resourceType: 'certificate',
    resourceUuid: c.uuid,
    resourceLabel: input.meta.subjectCommonName,
    actorUuid,
  });
  return c;
}

export async function approveCertificate(uuidStr: string, actorUuid: string): Promise<Certificate> { /* mark ACTIVE + approvedBy/At + audit */ }
export async function rejectCertificate(uuidStr: string, reason: string, actorUuid: string): Promise<Certificate> { /* mark REJECTED + reason + audit */ }
export async function revokeCertificate(uuidStr: string, reason: Certificate['revocationReason'], actorUuid: string): Promise<Certificate> { /* mark REVOKED + reason + revokedAt + audit */ }
```

### 9. Extend `uz.json`

```json
"certificates": {
  "title": "ERI sertifikatlari",
  "subtitle": "{{count}} ta tasdiqlash kutilmoqda",
  "upload-cta": "+ Yangi ERI yuklash",
  "card": {
    "expiring-soon": "Tez orada tugaydi"
  },
  "bulk": {
    "selected": "{{count}} ta tanlandi"
  },
  "details": {
    "issuer": "Sertifikat markazi",
    "serial": "Seriya raqami",
    "thumbprint": "Thumbprint",
    "key-usage": "Kalit turi",
    "owner": "Egasi"
  },
  "actions": {
    "approve": "Tasdiqlash",
    "reject": "Rad etish",
    "revoke": "Bekor qilish"
  },
  "reject": {
    "title": "Sertifikatni rad etish",
    "reason-label": "Rad etish sababi",
    "reason-placeholder": "Masalan: PINFL noto'g'ri"
  },
  "revoke": {
    "title": "Sertifikatni bekor qilish",
    "reason-label": "Sabab",
    "reasons": {
      "EXPIRED": "Muddati tugadi",
      "COMPROMISED": "Buzilgan kalit",
      "REPLACED": "Almashtirildi",
      "MANUAL": "Qo'lda bekor qilingan"
    }
  },
  "toast": {
    "approved": "Sertifikat tasdiqlandi",
    "rejected": "Sertifikat rad etildi",
    "revoked": "Sertifikat bekor qilindi",
    "uploaded": "ERI muvaffaqiyatli yuklandi",
    "bulk-approved": "{{count}} ta sertifikat tasdiqlandi"
  },
  "upload": {
    "title": "ERI kalitini yuklash",
    "step-employee": "Egasini tanlang",
    "step-file": "PFX faylni tanlang",
    "step-password": "Fayl parolini kiriting",
    "step-confirm": "Ma'lumotlarni tasdiqlang",
    "file-hint": ".pfx yoki .p12, maksimal 100KB",
    "password-hint": "Parol serverga uzatilmaydi — faqat fayl uchun",
    "challenge-info": "Sertifikatga egalik tasdiqlanmoqda...",
    "errors": {
      "pfx-too-large": "Fayl 100KB dan katta",
      "pfx-password-wrong": "Parol noto'g'ri",
      "pinfl-mismatch": "Sertifikat egasining JSHShIRi xodimning JSHShIRiga mos kelmadi",
      "serial-taken": "Bu sertifikat allaqachon tizimda mavjud"
    }
  }
}
```

### 10. Router updates

```tsx
<Route path="/certificates" element={<Protected><CertificatesPage /></Protected>} />
<Route path="/certificates/upload" element={<RequireAuth><CertificateUploadPage /></RequireAuth>} />
```

## Acceptance checks

- [ ] **Desktop (≥1024px)**: 4-column Kanban with PENDING_APPROVAL · ACTIVE · EXPIRED · REVOKED; each column scrolls if needed
- [ ] **Mobile (<1024px)**: tabs at the top, one column visible. Tab labels show counts.
- [ ] PENDING_APPROVAL cards show a checkbox; selecting one or more brings up the bulk action bar
- [ ] Bulk approve processes all selected at once; 3% failure may skip some — final toast reports actual count approved
- [ ] Single approval/rejection/revocation via the detail sheet — confirmation dialog before each
- [ ] Upload flow on mobile is a step-by-step, full-screen experience; on desktop a centred card
- [ ] Upload password field has hint "Parol serverga uzatilmaydi"
- [ ] PINFL mismatch shows a red error "Sertifikat egasining JSHShIRi xodimning JSHShIRiga mos kelmadi"
- [ ] After successful upload, the new cert appears in the appropriate column based on auto-approve setting
- [ ] Audit entries: CERTIFICATE_UPLOADED + CERTIFICATE_APPROVED chain on auto-approve; only UPLOADED otherwise
- [ ] `Expiring soon` badge appears on ACTIVE certs whose `validTo` is < 30 days away
- [ ] All copy via `t()`. Tested at 360 / 768 / 1024 / 1280px.

## Notes

- We are intentionally not building the WebSocket/E-IMZO plugin handshake. Master §17 says "fake the WebSocket with a delay" — keep the upload flow showing a "Sertifikatga egalik tasdiqlanmoqda..." progress for ~1.5s to evoke the challenge-response step.
- The "Reset demo" in user menu re-seeds — certificates revert to the seeded mix. Useful for live demos.
- Bulk reject is intentionally not in scope. Bulk approve is the common HR_ADMIN operation; rejections require reasons that don't apply to many at once.

## What "done" looks like

HR_ADMIN can scan the Kanban at a glance, see what's pending, multi-select and approve, drill into any single cert to revoke. On mobile, the same operations are reachable through tabs and bottom-sheet dialogs without sacrificing the chrome.
