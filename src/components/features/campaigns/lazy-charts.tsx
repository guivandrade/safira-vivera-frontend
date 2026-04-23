'use client';

import dynamic from 'next/dynamic';
import { SingleChartSkeleton } from './CampaignsSkeleton';

/**
 * Dynamic import dos charts — evita que `recharts` (~100kB) entre no bundle
 * inicial de rotas que nem sempre renderizam chart (dashboard mostra
 * empty state na primeira carga de conta nova; /campanhas depende de
 * dados pra decidir).
 *
 * `ssr: false` porque charts dependem de medidas do DOM e não trazem
 * benefício de SEO. Fallback é o SingleChartSkeleton — mesmo formato
 * visual do chart já montado, sem layout shift.
 */
export const SpendChart = dynamic(
  () => import('./SpendChart').then((m) => ({ default: m.SpendChart })),
  { ssr: false, loading: () => <SingleChartSkeleton /> },
);

export const ConversionsChart = dynamic(
  () => import('./ConversionsChart').then((m) => ({ default: m.ConversionsChart })),
  { ssr: false, loading: () => <SingleChartSkeleton /> },
);

export const FunnelChart = dynamic(
  () => import('./FunnelChart').then((m) => ({ default: m.FunnelChart })),
  { ssr: false, loading: () => <SingleChartSkeleton /> },
);
