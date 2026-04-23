'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  useAdminAccount,
  useArchiveAccount,
  useImpersonateAccount,
  useResetOwnerPassword,
  useUpdateAccount,
} from '@/hooks/use-admin-accounts';
import { useToast } from '@/providers/toast-provider';
import { STATUS_LABELS } from '@/lib/admin-labels';
import type { AccountStatus, NicheType } from '@/types/auth-me';

export default function ClienteDetalhePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();
  const { data, isLoading, error } = useAdminAccount(id);
  const update = useUpdateAccount(id);
  const archive = useArchiveAccount();
  const resetPwd = useResetOwnerPassword(id);
  const impersonate = useImpersonateAccount();
  const toast = useToast();

  const [newPwd, setNewPwd] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent"
          role="status"
          aria-label="Carregando dados do cliente"
        />
      </div>
    );
  }
  if (error || !data) {
    return (
      <Card>
        <p className="text-sm text-danger">
          Não conseguimos carregar este cliente:{' '}
          {error instanceof Error ? error.message : 'não encontrado'}
        </p>
        <div className="mt-3">
          <Link href="/admin/clientes">
            <Button variant="secondary">Voltar para a lista</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const handleUpdate = async (patch: {
    name?: string;
    status?: AccountStatus;
    nicheType?: NicheType;
    hasMeta?: boolean;
    hasGoogle?: boolean;
  }) => {
    try {
      await update.mutateAsync(patch);
      toast.success('Alterações salvas');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Erro desconhecido', {
        title: 'Não foi possível salvar',
      });
    }
  };

  const handleResetPassword = async () => {
    if (newPwd.length < 8) {
      toast.error('A senha precisa ter pelo menos 8 caracteres');
      return;
    }
    try {
      await resetPwd.mutateAsync(newPwd);
      toast.success(
        'Nova senha definida. O responsável foi desconectado de todos os dispositivos.',
        { title: 'Senha alterada' },
      );
      setNewPwd('');
      setShowNewPwd(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Erro desconhecido', {
        title: 'Não foi possível trocar a senha',
      });
    }
  };

  const handleArchive = async () => {
    try {
      await archive.mutateAsync(id);
      toast.success('Cliente arquivado');
      router.push('/admin/clientes');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Erro desconhecido', {
        title: 'Não foi possível arquivar',
      });
    }
  };

  const handleImpersonate = async () => {
    try {
      await impersonate.mutateAsync(id);
      toast.success(`Visualizando como ${data.name}`);
      router.push('/dashboard');
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        status === 403
          ? 'Sem permissão para visualizar este cliente'
          : err?.response?.data?.message ?? err?.message ?? 'Erro desconhecido';
      toast.error(msg, { title: 'Falha ao visualizar' });
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/clientes" className="text-sm text-ink-muted hover:text-ink">
            ← Voltar
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{data.name}</h1>
          <p className="text-sm text-ink-subtle">
            {data.slug} · Criado em {new Date(data.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleImpersonate}
          disabled={impersonate.isPending || data.status !== 'ACTIVE'}
          aria-label={`Visualizar o dashboard como ${data.name}`}
        >
          Visualizar como cliente
        </Button>
      </header>

      <Card>
        <CardHeader title="Dados do cliente" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome">
            <input
              type="text"
              defaultValue={data.name}
              onBlur={(e) => e.target.value !== data.name && handleUpdate({ name: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Tipo de negócio">
            <select
              value={data.nicheType}
              onChange={(e) => handleUpdate({ nicheType: e.target.value as NicheType })}
              className={inputClass}
            >
              <option value="LOCAL_BUSINESS">Negócio local</option>
              <option value="INFOPRODUCT">Infoproduto</option>
              <option value="ECOMMERCE">E-commerce</option>
            </select>
          </Field>
          <Field label="Status">
            <select
              value={data.status}
              onChange={(e) => handleUpdate({ status: e.target.value as AccountStatus })}
              className={inputClass}
            >
              <option value="ACTIVE">{STATUS_LABELS.ACTIVE}</option>
              <option value="SUSPENDED">{STATUS_LABELS.SUSPENDED}</option>
              <option value="ARCHIVED">{STATUS_LABELS.ARCHIVED}</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium text-ink">Integrações disponíveis</p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data.hasGoogle}
                  onChange={(e) => handleUpdate({ hasGoogle: e.target.checked })}
                />
                Google Ads
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data.hasMeta}
                  onChange={(e) => handleUpdate({ hasMeta: e.target.checked })}
                />
                Meta Ads
              </label>
            </div>
            {data.hasMeta && (
              <p className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                <strong>Atenção:</strong> Meta Ads usa credencial global. Este cliente vê os
                dados da conta de anúncios configurada no ambiente até lançarmos Meta OAuth
                por cliente.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Responsável"
          description="Pessoa que acessa o dashboard do cliente."
        />
        <div className="space-y-1 text-sm">
          <div>
            <span className="text-ink-subtle">Nome: </span>
            <span className="text-ink">{data.owner.name}</span>
          </div>
          <div>
            <span className="text-ink-subtle">Email: </span>
            <span className="text-ink">{data.owner.email}</span>
          </div>
        </div>

        <div className="mt-5 border-t border-line pt-5">
          <h4 className="text-sm font-semibold text-ink">Trocar senha</h4>
          <p className="mt-1 text-xs text-ink-muted">
            Define uma nova senha e desconecta o responsável de todos os dispositivos.
          </p>
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <input
                type={showNewPwd ? 'text' : 'password'}
                placeholder="Nova senha (mínimo 8 caracteres)"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className={`${inputClass} pr-10`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPwd((v) => !v)}
                aria-label={showNewPwd ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={showNewPwd}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-muted hover:text-ink"
              >
                {showNewPwd ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <Button
              variant="secondary"
              type="button"
              onClick={handleResetPassword}
              disabled={resetPwd.isPending || newPwd.length < 8}
            >
              Trocar senha
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Zona perigosa" />
        <p className="text-sm text-ink-muted">
          Arquivar faz o cliente sumir da lista e remove o acesso do responsável. A ação pode
          ser revertida em até 30 dias diretamente pelo suporte.
        </p>
        <div className="mt-3">
          <Button variant="danger" type="button" onClick={() => setConfirmArchive(true)}>
            Arquivar cliente
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmArchive}
        onCancel={() => setConfirmArchive(false)}
        onConfirm={() => {
          setConfirmArchive(false);
          void handleArchive();
        }}
        title="Arquivar cliente?"
        description={`O responsável (${data.owner.email}) perde o acesso imediatamente. Você pode reverter isso em até 30 dias pelo suporte.`}
        confirmLabel="Arquivar"
        variant="danger"
      />
    </div>
  );
}

const inputClass =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
