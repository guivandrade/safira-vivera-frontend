'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { STORAGE_KEYS } from '@/lib/storage-keys';

/**
 * Guard client-side: antes de renderizar children, verifica se há
 * `access_token` em localStorage. Se ausente, redireciona pra `/login`
 * preservando a URL original em `?returnUrl=`.
 *
 * Limitação consciente: isso NÃO é middleware server-side. Um atacante
 * determinado pode ler o shape do HTML do layout enquanto o guard monta.
 * A proteção real vai acontecer quando os tokens migrarem pra cookie
 * httpOnly + `middleware.ts` no edge — planejado para a Onda 3 do audit.
 *
 * Comparado a não ter guard nenhum: o usuário legítimo que esqueceu de
 * logar vai ser redirecionado antes de disparar qualquer query pro
 * backend (evita N requests 401), e o HTML renderizado não expõe dados.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      const target = pathname && pathname !== '/login' ? pathname : '/campanhas';
      router.replace(`/login?returnUrl=${encodeURIComponent(target)}`);
      return;
    }
    setChecked(true);
  }, [pathname, router]);

  if (!checked) {
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

  return <>{children}</>;
}
