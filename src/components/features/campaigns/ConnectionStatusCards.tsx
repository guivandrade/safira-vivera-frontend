'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  useDisconnectGoogleAds,
  useGoogleAdsStatus,
} from '@/hooks/use-integration-status';
import { useToast } from '@/providers/toast-provider';
import { Card } from '@/components/ui/Card';
import { StatusDot } from '@/components/ui/StatusDot';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return 'sem expiração conhecida';
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return 'desconhecido';
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return 'expirado';
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) return `expira em ${diffMinutes}min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 48) return `expira em ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `expira em ${diffDays}d`;
}

export function ConnectionStatusCards() {
  const { data: googleStatus, isLoading, refetch } = useGoogleAdsStatus();
  const disconnectMutation = useDisconnectGoogleAds();
  const toast = useToast();
  const [connecting, setConnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const handleConnectGoogle = async () => {
    setConnecting(true);
    try {
      const response = await apiClient.get<{ authUrl: string }>(
        '/integrations/google-ads/oauth/authorize',
      );
      window.location.href = response.data.authUrl;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao conectar Google Ads');
      setConnecting(false);
    }
  };

  const performDisconnect = async () => {
    setConfirmDisconnect(false);
    try {
      await disconnectMutation.mutateAsync();
      await refetch();
      toast.success('Google Ads desconectado');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao desconectar Google Ads');
    }
  };

  const googleConnected = !!googleStatus?.connected;

  return (
    <section aria-label="Status das integrações" className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        {/* Meta */}
        <Card padding="md">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-meta text-base font-bold text-white"
            >
              f
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">Meta Ads</p>
              <p className="text-xs text-ink-muted">Token do sistema · sempre ativo</p>
            </div>
            <StatusDot status="active" label="Configurado" />
          </div>
        </Card>

        {/* Google */}
        <Card padding="md">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-google text-base font-bold text-white"
            >
              G
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">Google Ads</p>
              <p className="truncate text-xs text-ink-muted">
                {isLoading
                  ? 'Verificando...'
                  : googleConnected
                    ? formatExpiry(googleStatus?.expiresAt ?? null)
                    : 'Não conectado'}
              </p>
              {googleStatus?.lastError && (
                <p className="mt-0.5 truncate text-[11px] text-warning">
                  ⚠ {googleStatus.lastError}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StatusDot status={googleConnected ? 'active' : 'paused'} />
              {googleConnected ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setConfirmDisconnect(true)}
                  disabled={disconnectMutation.isPending}
                >
                  {disconnectMutation.isPending ? 'Desconectando...' : 'Desconectar'}
                </Button>
              ) : (
                <Button size="sm" variant="primary" onClick={handleConnectGoogle} disabled={connecting}>
                  {connecting ? 'Conectando...' : 'Conectar'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDisconnect}
        title="Desconectar Google Ads?"
        description="Você precisará autorizar novamente na próxima vez que quiser ver dados do Google. Nenhuma campanha será afetada."
        confirmLabel="Desconectar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={performDisconnect}
        onCancel={() => setConfirmDisconnect(false)}
      />
    </section>
  );
}
