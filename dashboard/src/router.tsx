import type { ReactElement } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, ListChecks, Mail, type LucideIcon } from 'lucide-react';

import LoginPage from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import AppShell from '@/components/layout/AppShell';
import AuditLogPage from '@/features/audit/AuditLogPage';
import DashboardHome from '@/features/dashboard-home/DashboardHome';
import CertificatesPage from '@/features/certificates/CertificatesPage';
import CertificateUploadPage from '@/features/certificates/CertificateUploadPage';
import EmployeeListPage from '@/features/employees/list/EmployeeListPage';
import EmployeeWizardPage from '@/features/employees/wizard/EmployeeWizardPage';
import EmployeeProfilePage from '@/features/employees/profile/EmployeeProfilePage';
import EmployeeTransferPage from '@/features/employees/assignments/EmployeeTransferPage';
import ProfilePage from '@/features/profile/ProfilePage';
import UnitsPage from '@/features/units/UnitsPage';
import EmptyState from '@/components/common/EmptyState';
import PageHeader from '@/components/common/PageHeader';

function Protected({ children }: { children: ReactElement }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}

// Step-16 placeholders for the milestone-2 routes the sidebar already links
// to. Steps 18 (documents), 19 (approvals) and 20 (letters) replace these.
function ComingSoonPage({ titleKey, icon }: { titleKey: string; icon: LucideIcon }) {
  const { t } = useTranslation(['dashboard']);
  return (
    <>
      <PageHeader title={t(titleKey)} />
      <EmptyState
        icon={icon}
        title={t('dashboard:coming-soon.title')}
        body={t('dashboard:coming-soon.body')}
      />
    </>
  );
}

// The employee creation wizard renders its own chrome (top bar + stepper +
// sticky footer) and goes full-screen on mobile. Wrapping it in AppShell
// would double the topbar + waste vertical room. Auth gate still required.
function ProtectedNoShell({ children }: { children: ReactElement }) {
  return <RequireAuth>{children}</RequireAuth>;
}

export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <Protected>
            <DashboardHome />
          </Protected>
        }
      />
      <Route
        path="/units"
        element={
          <Protected>
            <UnitsPage />
          </Protected>
        }
      />
      <Route
        path="/employees"
        element={
          <Protected>
            <EmployeeListPage />
          </Protected>
        }
      />
      <Route
        path="/employees/new"
        element={
          <ProtectedNoShell>
            <EmployeeWizardPage />
          </ProtectedNoShell>
        }
      />
      <Route
        path="/employees/:uuid"
        element={
          <Protected>
            <EmployeeProfilePage />
          </Protected>
        }
      />
      <Route
        path="/employees/:uuid/transfer"
        element={
          <ProtectedNoShell>
            <EmployeeTransferPage />
          </ProtectedNoShell>
        }
      />
      <Route
        path="/certificates"
        element={
          <Protected>
            <CertificatesPage />
          </Protected>
        }
      />
      <Route
        path="/certificates/upload"
        element={
          <ProtectedNoShell>
            <CertificateUploadPage />
          </ProtectedNoShell>
        }
      />
      <Route
        path="/profile"
        element={
          <Protected>
            <ProfilePage />
          </Protected>
        }
      />
      <Route
        path="/audit"
        element={
          <Protected>
            <AuditLogPage />
          </Protected>
        }
      />
      <Route
        path="/documents"
        element={
          <Protected>
            <ComingSoonPage titleKey="dashboard:sidebar.nav-documents" icon={FileText} />
          </Protected>
        }
      />
      <Route
        path="/approvals"
        element={
          <Protected>
            <ComingSoonPage titleKey="dashboard:sidebar.nav-approvals" icon={ListChecks} />
          </Protected>
        }
      />
      <Route
        path="/letters"
        element={
          <Protected>
            <ComingSoonPage titleKey="dashboard:sidebar.nav-letters" icon={Mail} />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
