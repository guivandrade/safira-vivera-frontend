'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { OrphanAccessScreen } from './OrphanAccessScreen';

/**
 * Guard client-side: antes de renderizar children, verifica se há
 * `access_token` em localStorage. Se ausente, redireciona pra `/login`
 * preservando a URL original em `?returnUrl=`.
 *
 * Limitação consciente: isso NÃO é middleware server-side. Um atacante
 * determinado pode ler o shape do HTML do layout enquanto o guard monta.
 * A proteção real vai acontecer quando os tokens migrarem pra cookie
 * httpOnly + `middleware.ts` no edge — planejado para a Onda 3 do audit.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [hasToken, setHasToken] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      const target = pathname && pathname !== '/login' ? pathname : '/campanhas';
      router.replace(`/login?returnUrl=${encodeURIComponent(target)}`);
      return;
    }
    setHasToken(true);
    setChecked(true);
  }, [pathname, router]);

  if (!checked || !hasToken) {
    return <Spinner />;
  }

  // Com token, montamos o AuthProvider (faz GET /auth/me) e delegamos a
  // decisão de render pro AuthGate — que lida com loading, orphan e ready.
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}

/**
 * Consome o `/auth/me` já em andamento e decide o render final:
 * - Loading → spinner
 * - Orphan (user sem account, não-staff) → tela dedicada
 * - Erro de rede → spinner (React Query retry)
 * - Ready → children do layout
 */
function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading, isOrphan, isReady } = useAuth();

  if (isLoading) return <Spinner />;
  if (isOrphan) return <OrphanAccessScreen />;
  if (!isReady) return <Spinner />;

  return <>{children}</>;
}

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent"
        role="status"
        aria-label="Verificando sessão"
      />
    </div>
  );
}
