import type { ReactElement } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import LoginPage from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/common/PageHeader';
import DashboardHome from '@/features/dashboard-home/DashboardHome';
import EmployeeListPage from '@/features/employees/list/EmployeeListPage';
import EmployeeWizardPage from '@/features/employees/wizard/EmployeeWizardPage';
import UnitsPage from '@/features/units/UnitsPage';

function Protected({ children }: { children: ReactElement }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}

// The employee creation wizard renders its own chrome (top bar + stepper +
// sticky footer) and goes full-screen on mobile. Wrapping it in AppShell
// would double the topbar + waste vertical room. Auth gate still required.
function ProtectedNoShell({ children }: { children: ReactElement }) {
  return <RequireAuth>{children}</RequireAuth>;
}

function Placeholder({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation(['dashboard', 'common']);
  return <PageHeader title={t(titleKey)} subtitle={t('common:labels.coming-soon')} />;
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
            <Placeholder titleKey="dashboard:sidebar.nav-employees" />
          </Protected>
        }
      />
      <Route
        path="/certificates"
        element={
          <Protected>
            <Placeholder titleKey="dashboard:sidebar.nav-certificates" />
          </Protected>
        }
      />
      <Route
        path="/profile"
        element={
          <Protected>
            <Placeholder titleKey="dashboard:sidebar.nav-profile" />
          </Protected>
        }
      />
      <Route
        path="/audit"
        element={
          <Protected>
            <Placeholder titleKey="dashboard:sidebar.nav-audit" />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
