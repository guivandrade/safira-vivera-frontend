'use client';

import { ReactNode, useEffect } from 'react';

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function MobileSidebar({ open, onClose, children }: MobileSidebarProps) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <aside
        className="absolute left-0 top-0 h-full w-64 border-r border-line bg-surface shadow-xl"
        style={{ animation: 'drawer-in 180ms ease-out' }}
      >
        {children}
      </aside>
    </div>
  );
}
