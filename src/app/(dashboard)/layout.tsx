'use client';

import { ReactNode, useState } from 'react';
import { Sidebar, SidebarContent } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { FilterBar } from '@/components/layout/FilterBar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-surface-muted">
      <Sidebar />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </MobileSidebar>

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onOpenMobileNav={() => setMobileOpen(true)} />

        {/* FilterBar mobile (abaixo do header em telas estreitas) */}
        <div className="border-b border-line bg-surface px-4 py-2 sm:hidden">
          <div className="overflow-x-auto">
            <FilterBar />
          </div>
        </div>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
