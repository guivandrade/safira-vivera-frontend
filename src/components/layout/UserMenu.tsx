'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { apiClient } from '@/lib/api-client';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { getErrorMessage } from '@/lib/errors';
import { useToast } from '@/providers/toast-provider';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface StoredUser {
  id?: string;
  email?: string;
  name?: string;
}

function getInitials(user: StoredUser | null): string {
  if (!user) return '?';
  const source = user.name || user.email || '';
  const trimmed = source.trim();
  if (!trimmed) return '?';
  if (user.name) {
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

function clearAuthStorage() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

export function UserMenu() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleLogout = () => {
    clearAuthStorage();
    router.push('/login');
  };

  const handleLogoutAllClick = () => {
    setOpen(false);
    setConfirmLogoutAll(true);
  };

  const performLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      // Endpoint invalida todos os tokens emitidos até este momento (incluindo
      // o que usamos aqui). Não precisamos esperar erro posterior — já
      // limpamos storage e redirecionamos imediatamente após o 200.
      await apiClient.post('/auth/logout-all');
      clearAuthStorage();
      toast.success('Você foi desconectado de todos os dispositivos.');
      router.push('/login');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Não foi possível desconectar os dispositivos.'));
      setLoggingOutAll(false);
      setConfirmLogoutAll(false);
    }
  };

  const displayName = user?.name || user?.email || 'Usuário';
  const displayEmail = user?.email || '';

  return (
    <>
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-md border border-line bg-surface px-1.5 py-1 text-sm text-ink hover:bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded bg-accent text-[11px] font-semibold text-accent-fg">
            {getInitials(user)}
          </span>
          <span className="hidden max-w-[140px] truncate pr-1 text-xs md:inline">{displayName}</span>
        </button>

        {open && (
          <div
            role="menu"
            className={cn(
              'absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-lg border border-line bg-surface shadow-lg',
            )}
          >
            <div className="border-b border-line px-4 py-3">
              <p className="truncate text-sm font-medium text-ink">{displayName}</p>
              {displayEmail && <p className="truncate text-xs text-ink-muted">{displayEmail}</p>}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ink-muted hover:bg-surface-subtle hover:text-ink"
              role="menuitem"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                className="h-4 w-4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              Sair
            </button>
            <div className="border-t border-line-subtle" />
            <button
              type="button"
              onClick={handleLogoutAllClick}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger/80 hover:bg-danger/5 hover:text-danger"
              role="menuitem"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                className="h-4 w-4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8a6 6 0 0 0-9.33-5" />
                <path d="M20.12 9.88a6 6 0 0 1-.12 8.24" />
                <path d="M3 12a9 9 0 0 0 9 9" />
                <circle cx="12" cy="12" r="1" />
                <path d="m4 4 16 16" />
              </svg>
              Sair de todos os dispositivos
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmLogoutAll}
        title="Sair de todos os dispositivos?"
        description="Isso vai desconectar você em todos os navegadores e apps onde está logado. Será necessário entrar de novo em cada um."
        confirmLabel={loggingOutAll ? 'Saindo...' : 'Desconectar tudo'}
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={performLogoutAll}
        onCancel={() => setConfirmLogoutAll(false)}
      />
    </>
  );
}
