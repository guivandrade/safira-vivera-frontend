'use client';

import { ReactNode } from 'react';
import { useCan } from '@/providers/auth-provider';
import type { Permission } from '@/types/auth-me';

/**
 * Renderiza `children` só quando o user tem a permissão indicada no
 * `currentAccount`. Staff Safira (flag safira_staff) passa em todas.
 *
 * ```tsx
 * <Can permission="view:metrics:spend">
 *   <KpiCard label="Gasto" value={spend} />
 * </Can>
 * ```
 *
 * Para mostrar um fallback (ex: "Conteúdo indisponível") em vez de
 * omitir, passe via `fallback`.
 */
export function Can({
  permission,
  fallback = null,
  children,
}: {
  permission: Permission;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const can = useCan();
  return <>{can(permission) ? children : fallback}</>;
}
