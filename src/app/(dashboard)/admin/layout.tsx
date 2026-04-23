'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';

/**
 * Gate de staff: só renderiza children se `user.isSafiraStaff`. Senão
 * redireciona pra /dashboard. Defesa frontend; a real está no
 * `StaffOnlyGuard` do backend (toda rota /admin/* retorna 403 pra não-staff).
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent"
          role="status"
          aria-label="Verificando acesso"
        />
      </div>
    );
  }

  if (!user?.isSafiraStaff) {
    router.replace('/dashboard');
    return null;
  }

  return <>{children}</>;
}
