'use client';

import { ReactNode, Suspense, useState } from 'react';
import { Sidebar, SidebarContent } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { FilterBar } from '@/components/layout/FilterBar';
import { SavedViewsMenu } from '@/components/layout/SavedViewsMenu';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { FilterUrlSync } from '@/components/layout/FilterUrlSync';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ImpersonationBanner } from '@/components/layout/ImpersonationBanner';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthGuard>
    <div className="flex h-screen bg-surface-muted">
      <a href="#main-content" className="skip-to-content">
        Pular para o conteúdo
      </a>
      <Suspense fallback={null}>
        <FilterUrlSync />
      </Suspense>
      <CommandPalette />
      <Sidebar />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </MobileSidebar>

      <div className="flex flex-1 flex-col overflow-hidden">
        <ImpersonationBanner />
        <TopBar onOpenMobileNav={() => setMobileOpen(true)} />

        {/* Filter strip dedicado — FilterBar scrolla se precisar; SavedViewsMenu fica ancorado na direita */}
        <div className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-4 py-2 md:px-6">
          <div className="min-w-0 flex-1 overflow-x-auto">
            <FilterBar />
          </div>
          <div className="shrink-0">
            <SavedViewsMenu />
          </div>
        </div>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-auto"
          aria-label="Conteúdo principal"
        >
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
    </AuthGuard>
  );
}
