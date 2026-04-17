'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useClinic, useUpdateClinic } from '@/hooks/use-clinic';
import { useToast } from '@/providers/toast-provider';
import { isClinicConfigured } from '@/types/api';

interface FormState {
  name: string;
  address: string;
  city: string;
  state: string;
  radiusKm: number;
}

const DEFAULT: FormState = {
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
  const [form, setForm] = useState<FormState>(DEFAULT);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (isClinicConfigured(data)) {
      setForm({
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        radiusKm: data.radiusKm,
      });
      setDirty(false);
    }
  }, [data]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.address || !form.city || !form.state) return;
    try {
      await updateMutation.mutateAsync({
        name: form.name,
        address: form.address,
        city: form.city,
        state: form.state.toUpperCase(),
        radiusKm: form.radiusKm,
      });
      toast.success('Configurações da clínica salvas');
      setDirty(false);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || 'Erro ao salvar — verifique o endereço e tente novamente',
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

      <form onSubmit={submit}>
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
            <Field label="Nome da clínica" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Ex: Clínica Vivera"
                className="w-full rounded-md border border-line bg-surface-muted px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent/40"
                required
              />
            </Field>

            <Field label="Endereço completo" required>
              <input
                type="text"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Ex: Rua dos Pinheiros, 500"
                className="w-full rounded-md border border-line bg-surface-muted px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent/40"
                required
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_100px]">
              <Field label="Cidade" required>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  placeholder="São Paulo"
                  className="w-full rounded-md border border-line bg-surface-muted px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent/40"
                  required
                />
              </Field>

              <Field label="UF" required>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => update('state', e.target.value.toUpperCase())}
                  maxLength={2}
                  placeholder="SP"
                  className="w-full rounded-md border border-line bg-surface-muted px-3 py-2 text-sm uppercase text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent/40"
                  required
                />
              </Field>
            </div>

            <Field
              label="Raio de análise (km)"
              hint="Campanhas e bairros fora desse raio não entram na página Geografia"
            >
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={0.5}
                  value={form.radiusKm}
                  onChange={(e) => update('radiusKm', Number(e.target.value))}
                  className="flex-1 accent-accent"
                />
                <span className="min-w-[60px] text-right text-sm font-semibold tabular-nums text-ink">
                  {form.radiusKm} km
                </span>
              </div>
            </Field>
          </div>
        </Card>

        <div className="mt-4 flex items-center justify-end gap-2">
          {dirty && <span className="text-xs text-ink-muted">Alterações não salvas</span>}
          <Button
            type="submit"
            variant="primary"
            disabled={updateMutation.isPending || !dirty || !form.name || !form.address}
          >
            {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-muted">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-[11px] text-ink-subtle">{hint}</span>}
    </label>
  );
}
