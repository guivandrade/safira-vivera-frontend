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
  spend: number;
  conversions: number;
  clicks: number;
  impressions: number;
  cpa?: number;
}

export interface CampaignInsightsResponse {
  monthlyData: MonthlyData[];
  campaigns: CampaignSummary[];
  errors?: string[];
}
