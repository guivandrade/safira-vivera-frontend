'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCreateAccount } from '@/hooks/use-admin-accounts';
import { useToast } from '@/providers/toast-provider';
import type { CreateAccountInput } from '@/types/admin';
import type { NicheType } from '@/types/auth-me';

const initialState: CreateAccountInput = {
  name: '',
  slug: '',
  nicheType: 'LOCAL_BUSINESS',
  ownerEmail: '',
  ownerName: '',
  ownerPassword: '',
  hasMeta: false,
  hasGoogle: false,
};

/**
 * Converte nome → slug kebab-case básico. Não é perfeito (não remove acentos
 * nem trata caracteres especiais), mas cobre 80% dos casos — staff revisa
 * o slug antes de submeter.
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export default function NovoClientePage() {
  const [form, setForm] = useState<CreateAccountInput>(initialState);
  const [slugEdited, setSlugEdited] = useState(false);
  const router = useRouter();
  const createAccount = useCreateAccount();
  const toast = useToast();

  const setField = <K extends keyof CreateAccountInput>(key: K, value: CreateAccountInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNameChange = (value: string) => {
    setField('name', value);
    if (!slugEdited) {
      setField('slug', toSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAccount.mutateAsync(form);
      toast.success(`${form.name} foi cadastrado. Email: ${form.ownerEmail}`, {
        title: 'Cliente criado',
      });
      router.push('/admin/clientes');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Erro desconhecido';
      toast.error(String(msg), { title: 'Falha ao criar' });
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <Link
          href="/admin/clientes"
          className="text-sm text-ink-muted hover:text-ink"
        >
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Novo cliente</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Cria o account + OWNER em uma operação. O email vira o único acesso desse cliente.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader title="Dados do cliente" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome da empresa" required>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={inputClass}
                placeholder="Clínica Vívera"
              />
            </Field>
            <Field
              label="Slug (URL)"
              required
              hint="kebab-case. Usado em URLs e tokens. Não muda depois."
            >
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setField('slug', e.target.value);
                }}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                className={inputClass}
                placeholder="clinica-vivera"
              />
            </Field>
            <Field label="Tipo de negócio" required>
              <select
                required
                value={form.nicheType}
                onChange={(e) => setField('nicheType', e.target.value as NicheType)}
                className={inputClass}
              >
                <option value="LOCAL_BUSINESS">Negócio local</option>
                <option value="INFOPRODUCT">Infoproduto</option>
                <option value="ECOMMERCE">E-commerce</option>
              </select>
            </Field>
            <div className="flex items-end gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.hasGoogle ?? false}
                  onChange={(e) => setField('hasGoogle', e.target.checked)}
                />
                Google Ads
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.hasMeta ?? false}
                  onChange={(e) => setField('hasMeta', e.target.checked)}
                />
                Meta Ads
              </label>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Acesso do OWNER" description="Único login do cliente (MVP)." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" required>
              <input
                type="text"
                required
                value={form.ownerName}
                onChange={(e) => setField('ownerName', e.target.value)}
                className={inputClass}
                placeholder="Vera Silva"
              />
            </Field>
            <Field label="Email" required>
              <input
                type="email"
                required
                value={form.ownerEmail}
                onChange={(e) => setField('ownerEmail', e.target.value)}
                className={inputClass}
                placeholder="vera@clinica.com.br"
              />
            </Field>
            <Field
              label="Senha inicial"
              required
              hint="Mínimo 8 caracteres. Cliente pode trocar depois."
            >
              <input
                type="text"
                required
                minLength={8}
                value={form.ownerPassword}
                onChange={(e) => setField('ownerPassword', e.target.value)}
                className={inputClass}
                placeholder="Senha temporária"
              />
            </Field>
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Link href="/admin/clientes">
            <Button variant="secondary" type="button">
              Cancelar
            </Button>
          </Link>
          <Button variant="primary" type="submit" disabled={createAccount.isPending}>
            {createAccount.isPending ? 'Criando...' : 'Criar cliente'}
          </Button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-ink-subtle">{hint}</span>}
    </label>
  );
}
