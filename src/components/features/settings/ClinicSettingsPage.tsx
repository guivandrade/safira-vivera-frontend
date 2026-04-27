'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useClinic, useUpdateClinic } from '@/hooks/use-clinic';
import { useToast } from '@/providers/toast-provider';
import { getErrorMessage } from '@/lib/errors';
import { isClinicConfigured } from '@/types/api';

const clinicSchema = z.object({
  name: z.string().min(1, 'Informe o nome da clínica'),
  address: z.string().min(1, 'Informe o endereço'),
  city: z.string().min(1, 'Informe a cidade'),
  state: z
    .string()
    .min(2, 'UF precisa ter 2 letras')
    .max(2, 'UF precisa ter 2 letras')
    .regex(/^[A-Za-z]{2}$/, 'Use só letras na UF'),
  radiusKm: z.number().min(1).max(20),
});

type ClinicFormInput = z.infer<typeof clinicSchema>;

const DEFAULT: ClinicFormInput = {
  name: '',
  address: '',
  city: '',
  state: '',
  radiusKm: 4,
};

export function ClinicSettingsPage() {
  const { data, isLoading } = useClinic();
  const updateMutation = useUpdateClinic();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ClinicFormInput>({
    resolver: zodResolver(clinicSchema),
    defaultValues: DEFAULT,
  });

  useEffect(() => {
    if (isClinicConfigured(data)) {
      reset({
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        radiusKm: data.radiusKm,
      });
    }
  }, [data, reset]);

  const onSubmit = async (values: ClinicFormInput) => {
    try {
      await updateMutation.mutateAsync({
        ...values,
        state: values.state.toUpperCase(),
      });
      toast.success('Configurações da clínica salvas');
      reset({ ...values, state: values.state.toUpperCase() });
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(err, 'Erro ao salvar — verifique o endereço e tente novamente'),
      );
    }
  };

  const geocoded = isClinicConfigured(data) && data.lat !== null && data.lng !== null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Clínica</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          Endereço e raio de análise. O backend geocodifica o endereço automaticamente pra calcular
          distância dos bairros até aqui.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card padding="lg">
          <CardHeader
            title="Endereço"
            description={
              geocoded
                ? `Geocodificado (${isClinicConfigured(data) ? `${data.lat?.toFixed(4)}, ${data.lng?.toFixed(4)}` : ''})`
                : isLoading
                  ? 'Carregando...'
                  : 'Nenhum endereço configurado ainda'
            }
          />

          <div className="grid gap-4">
            <Field id="name" label="Nome da clínica" required error={errors.name?.message}>
              <input
                id="name"
                type="text"
                {...register('name')}
                aria-invalid={!!errors.name}
                placeholder="Ex: Clínica Vivera"
                className={inputClass}
              />
            </Field>

            <Field id="address" label="Endereço completo" required error={errors.address?.message}>
              <input
                id="address"
                type="text"
                {...register('address')}
                aria-invalid={!!errors.address}
                placeholder="Ex: Rua dos Pinheiros, 500"
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_100px]">
              <Field id="city" label="Cidade" required error={errors.city?.message}>
                <input
                  id="city"
                  type="text"
                  {...register('city')}
                  aria-invalid={!!errors.city}
                  placeholder="São Paulo"
                  className={inputClass}
                />
              </Field>

              <Field id="state" label="UF" required error={errors.state?.message}>
                <input
                  id="state"
                  type="text"
                  {...register('state', {
                    setValueAs: (v: string) => (v ?? '').toUpperCase(),
                  })}
                  aria-invalid={!!errors.state}
                  maxLength={2}
                  placeholder="SP"
                  className={`${inputClass} uppercase`}
                />
              </Field>
            </div>

            <Field
              id="radiusKm"
              label="Raio de análise (km)"
              hint="Campanhas e bairros fora desse raio não entram na página Geografia"
            >
              <Controller
                name="radiusKm"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-3">
                    <input
                      id="radiusKm"
                      type="range"
                      min={1}
                      max={20}
                      step={0.5}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="flex-1 accent-accent"
                    />
                    <span className="min-w-[60px] text-right text-sm font-semibold tabular-nums text-ink">
                      {field.value} km
                    </span>
                  </div>
                )}
              />
            </Field>
          </div>
        </Card>

        <div className="mt-4 flex items-center justify-end gap-2">
          {isDirty && <span className="text-xs text-ink-muted">Alterações não salvas</span>}
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  'w-full rounded-md border border-line bg-surface-muted px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent/40 aria-[invalid=true]:border-danger';

function Field({
  id,
  label,
  hint,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <label htmlFor={id} className="text-xs font-medium text-ink-muted">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {error ? (
        <span className="mt-1 block text-[11px] text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] text-ink-subtle">{hint}</span>
      ) : null}
    </div>
  );
}
