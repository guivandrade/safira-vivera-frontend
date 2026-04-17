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

export interface CampaignSummary {
  id: string;
  name: string;
  provider: 'google' | 'meta';
  /**
   * Objetivo da campanha. Somente Meta diferencia:
   * - `standard`: Meta Ads Manager (conversão trackada)
   * - `boost`: Meta Business Suite "Post do Instagram: ..." (engajamento, sem conversão)
   * Google Ads sempre retorna `standard` (ou undefined em backends antigos).
   */
  objective?: 'standard' | 'boost';
  spend: number;
  conversions: number;
  clicks: number;
  impressions: number;
  cpa?: number;
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
