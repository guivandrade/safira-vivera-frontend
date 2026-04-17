// Shapes do backend. Mantidos manualmente em sincronia com os DTOs em
// safira-vivera-backend/src/modules/**/dto. Quando o backend mudar, esse
// arquivo precisa mudar junto.

// Keywords
export interface KeywordRow {
  id: string;
  keyword: string;
  campaignId: string;
  campaignName: string;
  matchType: 'EXACT' | 'PHRASE' | 'BROAD';
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  cpa: number | null;
}

export interface KeywordTotals {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export interface KeywordsResponse {
  keywords: KeywordRow[];
  totals: KeywordTotals;
  errors?: string[];
}

// Creatives
export interface CreativeRow {
  id: string;
  name: string;
  campaignId: string;
  campaignName: string;
  provider: 'meta' | 'google';
  type: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  thumbnailUrl: string | null;
  previewUrl: string | null;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export interface CreativeTotals {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export interface CreativesResponse {
  creatives: CreativeRow[];
  totals: CreativeTotals;
  errors?: string[];
}

// Geography
export interface ClinicCenter {
  name: string;
  address: string;
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
  radiusKm: number;
}

export interface NeighborhoodMetrics {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  distanceKm: number;
  angleDeg: number;
  searches: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export interface GeographyTotals {
  searches: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export interface LocalGeographyResponse {
  clinic: ClinicCenter;
  neighborhoods: NeighborhoodMetrics[];
  totals: GeographyTotals;
  errors?: string[];
}

export interface QueryByRow {
  query: string;
  searches: number;
  clicks: number;
  conversions: number;
}

export interface QueriesByCityResponse {
  cityId: string;
  queries: QueryByRow[];
  errors?: string[];
}

// Clinic settings
export interface ClinicSettings {
  name: string;
  address: string;
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
  radiusKm: number;
}

export type ClinicGetResponse = ClinicSettings | { configured: false };

export function isClinicConfigured(
  response: ClinicGetResponse | undefined,
): response is ClinicSettings {
  return !!response && 'name' in response;
}

// Google Ads integration status (extended with v2 fields; opcional pra retro-compat)
export interface GoogleAdsStatus {
  connected: boolean;
  expiresAt: string | null;
  lastRefreshedAt: string | null;
  lastError: string | null;
  nextRefreshAt?: string | null;
  connectedAt?: string | null;
  lastUpdatedAt?: string | null;
  /** Adicionado em spec v2 — pode estar ausente em backends antigos. */
  hasRefreshToken?: boolean;
  customerId?: string;
  customerName?: string;
}
