'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/errors';
import {
  useDisconnectGoogleAds,
  useGoogleAdsStatus,
  useMetaAdsStatus,
} from '@/hooks/use-integration-status';
import { useToast } from '@/providers/toast-provider';
import { Card } from '@/components/ui/Card';
import { StatusDot } from '@/components/ui/StatusDot';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

type ExpirySeverity = 'critical' | 'warning' | 'normal' | 'unknown';

interface ExpiryInfo {
  label: string;
  severity: ExpirySeverity;
}

/**
 * Calcula label humano + severidade pra TTL de token de integração.
 * - critical: expirado ou < 24h pra expirar (precisa ação imediata)
 * - warning: < 7d (Meta long-lived = 60d, então 7d é zona de "alertar Safira")
 * - normal: >= 7d
 * - unknown: backend não retorna expiresAt
 */
function getExpiryInfo(expiresAt: string | null): ExpiryInfo {
  if (!expiresAt) return { label: 'sem expiração conhecida', severity: 'unknown' };
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return { label: 'desconhecido', severity: 'unknown' };
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return { label: 'expirado', severity: 'critical' };
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) return { label: `expira em ${diffMinutes}min`, severity: 'critical' };
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return { label: `expira em ${diffHours}h`, severity: 'critical' };
  if (diffHours < 48) return { label: `expira em ${diffHours}h`, severity: 'warning' };
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return { label: `expira em ${diffDays}d`, severity: 'warning' };
  return { label: `expira em ${diffDays}d`, severity: 'normal' };
}

function expiryClassName(severity: ExpirySeverity): string {
  if (severity === 'critical') return 'text-danger font-medium';
  if (severity === 'warning') return 'text-warning font-medium';
  return 'text-ink-muted';
}

export function ConnectionStatusCards() {
  const { data: googleStatus, isLoading, refetch } = useGoogleAdsStatus();
  const { data: metaStatus, isLoading: metaLoading } = useMetaAdsStatus();
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
      if (!response.data?.authUrl) {
        throw new Error('Resposta inválida do servidor: authUrl ausente.');
      }
      window.location.href = response.data.authUrl;
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Erro ao conectar Google Ads'));
      setConnecting(false);
    }
  };

  const performDisconnect = async () => {
    setConfirmDisconnect(false);
    try {
      await disconnectMutation.mutateAsync();
      await refetch();
      toast.success('Google Ads desconectado');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Erro ao desconectar Google Ads'));
    }
  };

  const googleConnected = !!googleStatus?.connected;
  const metaConnected = !!metaStatus?.connected;
  const googleExpiry = getExpiryInfo(googleStatus?.expiresAt ?? null);
  const metaExpiry = getExpiryInfo(metaStatus?.expiresAt ?? null);

  return (
    <section aria-label="Status das integrações" className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        {/* Meta — provisão via admin Safira (sem botão "Conectar" como Google).
            Empty state quando connected=false direciona o cliente a falar
            com a Safira; staff faz o provision via /integrations/meta-ads/admin/provision. */}
        <Card padding="md">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-meta text-base font-bold text-white"
            >
              f
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                Meta Ads
                {metaStatus?.adAccountName && (
                  <span className="ml-1.5 font-normal text-ink-muted">
                    · {metaStatus.adAccountName}
                  </span>
                )}
              </p>
              <p className="truncate text-xs">
                <span className={metaConnected ? expiryClassName(metaExpiry.severity) : 'text-ink-muted'}>
                  {metaLoading
                    ? 'Verificando...'
                    : metaConnected
                      ? metaExpiry.label
                      : 'Não conectado · fale com a Safira pra provisionar'}
                </span>
                {metaStatus?.adAccountId && (
                  <span className="ml-2 font-mono text-[11px] text-ink-subtle">
                    {metaStatus.adAccountId}
                  </span>
                )}
              </p>
              {metaConnected && metaExpiry.severity === 'warning' && (
                <p className="mt-0.5 truncate text-[11px] text-warning">
                  ⚠ Token Meta vence em breve — Safira vai renovar antes do prazo.
                </p>
              )}
              {metaConnected && metaExpiry.severity === 'critical' && (
                <p className="mt-0.5 truncate text-[11px] text-danger">
                  ⚠ Token Meta {metaExpiry.label === 'expirado' ? 'expirou' : 'expira em horas'} — fale com a Safira pra renovar.
                </p>
              )}
              {metaStatus?.lastError && (
                <p className="mt-0.5 truncate text-[11px] text-warning">
                  ⚠ {metaStatus.lastError}
                </p>
              )}
            </div>
            <StatusDot status={metaConnected ? 'active' : 'paused'} />
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
              <p className="text-sm font-semibold text-ink">
                Google Ads
                {googleStatus?.customerName && (
                  <span className="ml-1.5 font-normal text-ink-muted">
                    · {googleStatus.customerName}
                  </span>
                )}
              </p>
              <p className="truncate text-xs">
                <span className={googleConnected ? expiryClassName(googleExpiry.severity) : 'text-ink-muted'}>
                  {isLoading
                    ? 'Verificando...'
                    : googleConnected
                      ? googleExpiry.label
                      : 'Não conectado'}
                </span>
                {googleStatus?.customerId && (
                  <span className="ml-2 font-mono text-[11px] text-ink-subtle">
                    {googleStatus.customerId}
                  </span>
                )}
              </p>
              {googleConnected && googleStatus?.hasRefreshToken === false && (
                <p className="mt-0.5 truncate text-[11px] text-warning">
                  ⚠ Conexão incompleta — reconecte pra garantir renovação automática.
                </p>
              )}
              {googleStatus?.lastError && (
                <p className="mt-0.5 truncate text-[11px] text-warning">
                  ⚠ {googleStatus.lastError}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StatusDot
                status={
                  googleConnected
                    ? googleStatus?.hasRefreshToken === false
                      ? 'error'
                      : 'active'
                    : 'paused'
                }
              />
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
