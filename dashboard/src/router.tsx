import type { ReactElement } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import AppShell from '@/components/layout/AppShell';
import AuditLogPage from '@/features/audit/AuditLogPage';
import DashboardHome from '@/features/dashboard-home/DashboardHome';
import CertificatesPage from '@/features/certificates/CertificatesPage';
import CertificateUploadPage from '@/features/certificates/CertificateUploadPage';
import ApprovalsQueuePage from '@/features/documents/ApprovalsQueuePage';
import DocumentDetailPage from '@/features/documents/detail/DocumentDetailPage';
import DocumentsPage from '@/features/documents/DocumentsPage';
import DocumentWizardPage from '@/features/documents/wizard/DocumentWizardPage';
import EmployeeListPage from '@/features/employees/list/EmployeeListPage';
import EmployeeWizardPage from '@/features/employees/wizard/EmployeeWizardPage';
import EmployeeProfilePage from '@/features/employees/profile/EmployeeProfilePage';
import EmployeeTransferPage from '@/features/employees/assignments/EmployeeTransferPage';
import LettersPage from '@/features/letters/LettersPage';
import RegisterLetterPage from '@/features/letters/RegisterLetterPage';
import LetterDetailPage from '@/features/letters/detail/LetterDetailPage';
import ProfilePage from '@/features/profile/ProfilePage';
import TasksPage from '@/features/tasks/TasksPage';
import CreateTaskPage from '@/features/tasks/CreateTaskPage';
import TaskDetailPage from '@/features/tasks/detail/TaskDetailPage';
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
            <DocumentsPage />
          </Protected>
        }
      />
      <Route
        path="/documents/new"
        element={
          <ProtectedNoShell>
            <DocumentWizardPage />
          </ProtectedNoShell>
        }
      />
      <Route
        path="/documents/:uuid"
        element={
          <Protected>
            <DocumentDetailPage />
          </Protected>
        }
      />
      <Route
        path="/approvals"
        element={
          <Protected>
            <ApprovalsQueuePage />
          </Protected>
        }
      />
      <Route
        path="/letters"
        element={
          <Protected>
            <LettersPage />
          </Protected>
        }
      />
      <Route
        path="/letters/new"
        element={
          <ProtectedNoShell>
            <RegisterLetterPage />
          </ProtectedNoShell>
        }
      />
      <Route
        path="/letters/:uuid"
        element={
          <Protected>
            <LetterDetailPage />
          </Protected>
        }
      />
      <Route
        path="/tasks"
        element={
          <Protected>
            <TasksPage />
          </Protected>
        }
      />
      <Route
        path="/tasks/new"
        element={
          <ProtectedNoShell>
            <CreateTaskPage />
          </ProtectedNoShell>
        }
      />
      <Route
        path="/tasks/:uuid"
        element={
          <Protected>
            <TaskDetailPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
