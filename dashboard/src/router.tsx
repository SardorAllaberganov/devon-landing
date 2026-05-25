import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoginPage from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';

// Placeholder for routes that will be filled in later steps.
function Placeholder({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation(['dashboard', 'common']);
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink">{t(titleKey)}</h1>
      <p className="text-muted-foreground mt-2">Coming in a later step.</p>
    </main>
  );
}

export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <Placeholder titleKey="dashboard:sidebar.nav-home" />
          </RequireAuth>
        }
      />
      <Route
        path="/units"
        element={
          <RequireAuth>
            <Placeholder titleKey="dashboard:sidebar.nav-units" />
          </RequireAuth>
        }
      />
      <Route
        path="/employees"
        element={
          <RequireAuth>
            <Placeholder titleKey="dashboard:sidebar.nav-employees" />
          </RequireAuth>
        }
      />
      <Route
        path="/employees/new"
        element={
          <RequireAuth>
            <Placeholder titleKey="dashboard:sidebar.nav-employees" />
          </RequireAuth>
        }
      />
      <Route
        path="/employees/:uuid"
        element={
          <RequireAuth>
            <Placeholder titleKey="dashboard:sidebar.nav-employees" />
          </RequireAuth>
        }
      />
      <Route
        path="/certificates"
        element={
          <RequireAuth>
            <Placeholder titleKey="dashboard:sidebar.nav-certificates" />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Placeholder titleKey="dashboard:sidebar.nav-profile" />
          </RequireAuth>
        }
      />
      <Route
        path="/audit"
        element={
          <RequireAuth>
            <Placeholder titleKey="dashboard:sidebar.nav-audit" />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
