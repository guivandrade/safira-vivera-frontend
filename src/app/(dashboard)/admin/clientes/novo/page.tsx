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
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const createAccount = useCreateAccount();
  const toast = useToast();

  const slugValid = form.slug === '' || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug);

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
          Cadastra o cliente e o usuário responsável em uma operação. O email informado é o acesso inicial.
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
              label="Identificador (URL)"
              required
              hint="Aparece em URLs e links. Use letras minúsculas, números e hífens. Não pode ser alterado depois."
              error={!slugValid ? 'Use só letras minúsculas, números e hífens' : undefined}
            >
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setField('slug', e.target.value.toLowerCase());
                }}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                className={inputClass}
                placeholder="clinica-vivera"
                aria-invalid={!slugValid}
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
          <CardHeader
            title="Acesso do responsável"
            description="Quem vai acessar o dashboard do cliente."
          />
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
              hint="Mínimo 8 caracteres. O responsável pode trocar depois no primeiro acesso."
            >
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={form.ownerPassword}
                  onChange={(e) => setField('ownerPassword', e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-muted hover:text-ink"
                >
                  {showPassword ? (
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
            </Field>
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Link href="/admin/clientes">
            <Button variant="secondary" type="button">
              Cancelar
            </Button>
          </Link>
          <Button
            variant="primary"
            type="submit"
            disabled={createAccount.isPending || !slugValid}
          >
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
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </span>
      {children}
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-subtle">{hint}</span>
      ) : null}
    </label>
  );
}
