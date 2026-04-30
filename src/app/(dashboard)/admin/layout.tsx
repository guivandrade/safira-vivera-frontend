'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';

/**
 * Gate de staff: só renderiza children se `user.isSafiraStaff`. Senão
 * redireciona pra /dashboard. Defesa frontend; a real está no
 * `StaffOnlyGuard` do backend (toda rota /admin/* retorna 403 pra não-staff).
 *
 * Redirect roda em useEffect (não em render direto) por dois motivos:
 * 1. side effect em render é anti-pattern do React, dispara warning em
 *    StrictMode e pode rodar duas vezes.
 * 2. children NUNCA são renderizados pra non-staff — evita que a página
 *    filho dispare requests admin (ex: GET /admin/accounts) que estouram
 *    403 espúrios em logs/Sentry antes do redirect concluir.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const denied = !isLoading && !user?.isSafiraStaff;

  useEffect(() => {
    if (denied) {
      router.replace('/dashboard');
    }
  }, [denied, router]);

  if (isLoading || denied) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent"
          role="status"
          aria-label={isLoading ? 'Verificando acesso' : 'Redirecionando'}
        />
      </div>
    );
  }

  return <>{children}</>;
}
