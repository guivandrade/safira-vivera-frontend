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
  const [confirmArchive, setConfirmArchive] = useState(false);

  if (isLoading) return <div className="text-sm text-ink-muted">Carregando…</div>;
  if (error || !data) {
    return (
      <Card>
        <p className="text-sm text-danger">
          Erro ao carregar: {error instanceof Error ? error.message : 'cliente não encontrado'}
        </p>
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
      toast.success('Atualizado');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Erro', {
        title: 'Falha ao atualizar',
      });
    }
  };

  const handleResetPassword = async () => {
    if (newPwd.length < 8) {
      toast.error('Senha deve ter 8+ caracteres');
      return;
    }
    try {
      await resetPwd.mutateAsync(newPwd);
      toast.success('OWNER foi deslogado de todas as sessões.', {
        title: 'Senha resetada',
      });
      setNewPwd('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Erro', {
        title: 'Falha ao resetar',
      });
    }
  };

  const handleArchive = async () => {
    try {
      await archive.mutateAsync(id);
      toast.success('Cliente arquivado');
      router.push('/admin/clientes');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Erro', {
        title: 'Falha ao arquivar',
      });
    }
  };

  const handleImpersonate = async () => {
    try {
      await impersonate.mutateAsync(id);
      toast.success(`Visualizando como ${data.name}`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Erro', {
        title: 'Falha ao impersonar',
      });
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
          <Field label="Tipo">
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
              <option value="ACTIVE">Ativo</option>
              <option value="SUSPENDED">Suspenso</option>
              <option value="ARCHIVED">Arquivado</option>
            </select>
          </Field>
          <div className="flex items-end gap-4 text-sm">
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
        </div>
      </Card>

      <Card>
        <CardHeader title="OWNER" description="Único usuário do cliente." />
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
          <h4 className="text-sm font-semibold text-ink">Resetar senha</h4>
          <p className="mt-1 text-xs text-ink-muted">
            Gera um hash novo e invalida todas as sessões do OWNER.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Nova senha (mín. 8 chars)"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className={inputClass}
            />
            <Button
              variant="secondary"
              type="button"
              onClick={handleResetPassword}
              disabled={resetPwd.isPending || newPwd.length < 8}
            >
              Resetar
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Zona perigosa" />
        <p className="text-sm text-ink-muted">
          Arquivar o cliente faz soft-delete: ele some da lista e o OWNER perde acesso. Pode ser
          revertido via banco de dados em até 30 dias.
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
        description={`O OWNER (${data.owner.email}) perderá o acesso imediatamente.`}
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
