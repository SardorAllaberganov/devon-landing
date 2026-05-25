import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface Props {
  children: ReactNode;
}

export default function AppShell({ children }: Props) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar — hidden below lg */}
      <div className="hidden shrink-0 lg:block lg:w-60">
        <div className="fixed inset-y-0 left-0 w-60">
          <Sidebar />
        </div>
      </div>

      {/* Main column — content fills full viewport (minus sidebar + padding) */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
