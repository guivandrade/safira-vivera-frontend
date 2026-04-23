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

  if (isLoading) return null;

  if (!user?.isSafiraStaff) {
    router.replace('/dashboard');
    return null;
  }

  return <>{children}</>;
}
