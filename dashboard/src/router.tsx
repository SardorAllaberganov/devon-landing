import type { ReactElement } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import LoginPage from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/common/PageHeader';
import DashboardHome from '@/features/dashboard-home/DashboardHome';
import UnitsPage from '@/features/units/UnitsPage';

function Protected({ children }: { children: ReactElement }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
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
            <Placeholder titleKey="dashboard:sidebar.nav-employees" />
          </Protected>
        }
      />
      <Route
        path="/employees/new"
        element={
          <Protected>
            <Placeholder titleKey="dashboard:sidebar.nav-employees" />
          </Protected>
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
