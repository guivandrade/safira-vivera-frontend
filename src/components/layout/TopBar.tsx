'use client';

import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

interface TopBarProps {
  onOpenMobileNav: () => void;
  showMobileNav?: boolean;
}

export function TopBar({ onOpenMobileNav, showMobileNav = true }: TopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 md:px-6">
      <div className="flex items-center gap-2">
        {showMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Abrir menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface text-ink-muted hover:bg-surface-subtle hover:text-ink md:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <KbdHint />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

function KbdHint() {
  return (
    <span
      className="hidden items-center gap-1 rounded border border-line bg-surface-muted px-1.5 py-0.5 text-[10px] text-ink-muted lg:inline-flex"
      title="Paleta de comandos"
    >
      <kbd>⌘</kbd>
      <kbd>K</kbd>
    </span>
  );
}
