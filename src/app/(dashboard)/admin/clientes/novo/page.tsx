'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCreateAccount } from '@/hooks/use-admin-accounts';
import { useToast } from '@/providers/toast-provider';
import { getErrorMessage } from '@/lib/errors';

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const newAccountSchema = z.object({
  name: z.string().min(1, 'Informe o nome do cliente'),
  slug: z
    .string()
    .min(1, 'Informe o identificador')
    .regex(SLUG_REGEX, 'Use só letras minúsculas, números e hífens'),
  nicheType: z.enum(['LOCAL_BUSINESS', 'INFOPRODUCT', 'ECOMMERCE']),
  ownerName: z.string().min(1, 'Informe o nome do responsável'),
  ownerEmail: z.string().min(1, 'Informe o email').email('Email inválido'),
  ownerPassword: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres'),
  hasMeta: z.boolean(),
  hasGoogle: z.boolean(),
});

type NewAccountInput = z.infer<typeof newAccountSchema>;

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
  const [showPassword, setShowPassword] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const router = useRouter();
  const createAccount = useCreateAccount();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NewAccountInput>({
    resolver: zodResolver(newAccountSchema),
    defaultValues: {
      name: '',
      slug: '',
      nicheType: 'LOCAL_BUSINESS',
      ownerEmail: '',
      ownerName: '',
      ownerPassword: '',
      hasMeta: false,
      hasGoogle: false,
    },
  });

  const hasMeta = watch('hasMeta');

  const handleNameChange = (value: string) => {
    setValue('name', value, { shouldValidate: false });
    if (!slugEdited) {
      setValue('slug', toSlug(value), { shouldValidate: false });
    }
  };

  const onSubmit = async (values: NewAccountInput) => {
    try {
      await createAccount.mutateAsync(values);
      toast.success(`${values.name} foi cadastrado. Email: ${values.ownerEmail}`, {
        title: 'Cliente criado',
      });
      router.push('/admin/clientes');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Erro desconhecido'), { title: 'Falha ao criar' });
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

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Card>
          <CardHeader title="Dados do cliente" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Nome da empresa" required error={errors.name?.message}>
              <input
                id="name"
                type="text"
                {...register('name', { onChange: (e) => handleNameChange(e.target.value) })}
                aria-invalid={!!errors.name}
                className={inputClass}
                placeholder="Clínica Vívera"
              />
            </Field>
            <Field
              id="slug"
              label="Identificador (URL)"
              required
              hint="Aparece em URLs e links. Use letras minúsculas, números e hífens. Não pode ser alterado depois."
              error={errors.slug?.message}
            >
              <input
                id="slug"
                type="text"
                {...register('slug', {
                  onChange: (e) => {
                    setSlugEdited(true);
                    setValue('slug', e.target.value.toLowerCase(), { shouldValidate: true });
                  },
                })}
                aria-invalid={!!errors.slug}
                className={inputClass}
                placeholder="clinica-vivera"
              />
            </Field>
            <Field id="nicheType" label="Tipo de negócio" required>
              <select id="nicheType" {...register('nicheType')} className={inputClass}>
                <option value="LOCAL_BUSINESS">Negócio local</option>
                <option value="INFOPRODUCT">Infoproduto</option>
                <option value="ECOMMERCE">E-commerce</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium text-ink">Integrações disponíveis</p>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <Controller
                  name="hasGoogle"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                      Google Ads
                    </label>
                  )}
                />
                <Controller
                  name="hasMeta"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                      Meta Ads
                    </label>
                  )}
                />
              </div>
              {hasMeta && (
                <p className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                  <strong>Atenção:</strong> Meta Ads ainda usa credencial global. Ao marcar,
                  este cliente vê os dados da conta de anúncios configurada no ambiente —
                  não a dele. Use só em dev/teste até lançarmos a integração Meta por cliente.
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Acesso do responsável"
            description="Quem vai acessar o dashboard do cliente."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="ownerName" label="Nome completo" required error={errors.ownerName?.message}>
              <input
                id="ownerName"
                type="text"
                {...register('ownerName')}
                aria-invalid={!!errors.ownerName}
                className={inputClass}
                placeholder="Vera Silva"
              />
            </Field>
            <Field id="ownerEmail" label="Email" required error={errors.ownerEmail?.message}>
              <input
                id="ownerEmail"
                type="email"
                {...register('ownerEmail')}
                aria-invalid={!!errors.ownerEmail}
                className={inputClass}
                placeholder="vera@clinica.com.br"
              />
            </Field>
            <Field
              id="ownerPassword"
              label="Senha inicial"
              required
              hint="Mínimo 8 caracteres. O responsável pode trocar depois no primeiro acesso."
              error={errors.ownerPassword?.message}
            >
              <div className="relative">
                <input
                  id="ownerPassword"
                  type={showPassword ? 'text' : 'password'}
                  {...register('ownerPassword')}
                  aria-invalid={!!errors.ownerPassword}
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
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Criando...' : 'Criar cliente'}
          </Button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 aria-[invalid=true]:border-danger';

function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={id} className="font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-subtle">{hint}</span>
      ) : null}
    </div>
  );
}
