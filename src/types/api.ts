// Shapes do backend. Mantidos manualmente em sincronia com os DTOs em
// safira-vivera-backend/src/modules/**/dto. Quando o backend mudar, esse
// arquivo precisa mudar junto.

// Cursor pagination — endpoints que retornam listas grandes enviam nextCursor
// opaco. Omitir o campo equivale a fim da lista. `total` é o total de itens
// respeitando os filtros atuais (não o número da página atual).
export interface PageInfo {
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

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
  pageInfo?: PageInfo;
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
  pageInfo?: PageInfo;
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
  pageInfo?: PageInfo;
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
  pageInfo?: PageInfo;
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

/**
 * Status da integração Meta Ads. Espelha o shape do `/integrations/meta-ads/status`.
 *
 * Histórico do shape:
 * - **Backend antigo** (token Meta global no env): retornava `{ connected: true,
 *   tokenType: 'system' }` sempre. `tokenType` foi removido na auditoria
 *   (PRs backend #48-#51) — TS aceita o campo extra como ruído ignorável.
 * - **Backend novo** (credenciais por account): retorna `connected: false` quando
 *   o account não tem credential provisionada. O endpoint pode também responder
 *   401 nesse caso — `useMetaAdsStatus` normaliza pra `connected: false`.
 *
 * Provisão é exclusiva da Safira (POST `/integrations/meta-ads/admin/provision/:id`),
 * por isso a UI de cliente não tem botão "Conectar" como no Google.
 */
export interface MetaAdsStatus {
  connected: boolean;
  /** ISO timestamp do TTL do long-lived token Meta (60 dias). null se ausente. */
  expiresAt: string | null;
  adAccountId?: string;
  adAccountName?: string;
  lastError?: string | null;
}
