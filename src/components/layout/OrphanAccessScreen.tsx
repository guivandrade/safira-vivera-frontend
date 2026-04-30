'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { clearAuthAndTenantState } from '@/lib/clear-tenant-state';

/**
 * Tela mostrada quando o user autenticado não tem nenhum account ativo
 * (memberships removidos, accounts arquivados, etc) E não é staff Safira.
 *
 * Não é um 404 nem 401 — o user existe e tem sessão válida; o que falta é
 * autorização. Fluxo proposto: logar direto aqui, orientar a entrar em
 * contato com quem convidou, dar saída explícita.
 */
export function OrphanAccessScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    clearAuthAndTenantState(queryClient);
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-muted p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-line bg-surface p-8 text-center shadow-card">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-subtle">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            className="h-6 w-6 text-ink-muted"
            aria-hidden
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-ink">Você ainda não tem acesso</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Seu login está funcionando, mas ele ainda não foi liberado pra nenhum
            negócio. Isso normalmente acontece quando a liberação foi removida ou
            o cliente arquivou o acesso.
          </p>
          <p className="mt-3 text-sm text-ink-muted">
            Peça a liberação de novo pra quem te enviou o convite, ou fale com o
            time da Safira.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
