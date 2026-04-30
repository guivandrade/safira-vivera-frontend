export interface MonthlyData {
  month: string; // YYYY-MM
  totalSpend: number;
  totalConversions: number;
  google: {
    spend: number;
    conversions: number;
  };
  meta: {
    spend: number;
    conversions: number;
  };
}

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'REMOVED';

export interface CampaignSummary {
  id: string;
  name: string;
  provider: 'google' | 'meta';
  /**
   * Status real da campanha no provider. Backend converte:
   * - Google: campaign.status (ENABLED→ACTIVE, PAUSED, REMOVED)
   * - Meta: campaign.status + effective_status
   * Opcional pra backward-compat com respostas antigas.
   */
  status?: CampaignStatus;
  /**
   * Objetivo da campanha. Somente Meta diferencia:
   * - `standard`: Meta Ads Manager (conversão trackada)
   * - `boost`: Meta Business Suite "Post do Instagram: ..." (engajamento, sem conversão)
   * Google Ads sempre retorna `standard` (ou undefined em backends antigos).
   */
  objective?: 'standard' | 'boost';
  /** ISO YYYY-MM-DD — início da campanha no provider. */
  startDate?: string | null;
  /** ISO YYYY-MM-DD — fim da campanha, null se continua rodando. */
  endDate?: string | null;
  spend: number;
  conversions: number;
  clicks: number;
  impressions: number;
  /** CTR em fração (0..1). Backend sempre preenche; opcional pra retro-compat. */
  ctr?: number | null;
  /** Taxa de conversão em fração (0..1). */
  conversionRate?: number | null;
  cpa?: number | null;
  /**
   * Meta-only: indica que a campanha tem violações de policy ativas (status
   * real `WITH_ISSUES` no provider). Backend mantém `status: 'ACTIVE'` por
   * compat e seta esse flag em paralelo. UI mostra badge "Issues" quando true.
   * Ausente em backends que ainda não expuseram o campo.
   */
  hasIssues?: boolean;
}

export interface PreviousPeriodTotals {
  totalSpend: number;
  totalConversions: number;
  totalClicks: number;
  totalImpressions: number;
}

export interface CampaignInsightsResponse {
  monthlyData: MonthlyData[];
  campaigns: CampaignSummary[];
  /** Totals do período imediatamente anterior (mesmo comprimento). Backend exclui boosts por default. */
  previousPeriod?: PreviousPeriodTotals;
  errors?: string[];
}
