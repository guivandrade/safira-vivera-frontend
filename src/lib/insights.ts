import { CampaignInsightsResponse, CampaignSummary, MonthlyData } from '@/types/campaigns';
import { formatCurrency, formatNumber, formatPercent, percentDelta, safeDiv } from './formatters';

export type InsightSeverity = 'positive' | 'info' | 'warning' | 'critical';

export interface Insight {
  id: string;
  severity: InsightSeverity;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

interface GenerateInsightsOptions {
  /** Se true, considera posts turbinados (Meta Business Suite) nas agregações.
   *  Default false — boosts inflam o CPA e geram falsos-positivos em
   *  "Meta vs Google", "campanha zerada", etc. */
  includeBoosts?: boolean;
  /** Se true, inclui campanhas pausadas/removidas nos agregados. Default
   *  false — ver o que está rodando hoje, não histórico. */
  includeInactive?: boolean;
}

/**
 * Detecta padrões acionáveis nos dados de campanhas e gera um feed de
 * observações pra Vera. Totalmente client-side — roda sobre o payload
 * já carregado em cache pelo TanStack Query.
 *
 * Cada regra é curta e auto-contida; adicionar regra nova = adicionar função.
 */
export function generateInsights(
  data: CampaignInsightsResponse,
  options: GenerateInsightsOptions = {},
): Insight[] {
  const insights: Insight[] = [];

  if (!data || data.monthlyData.length === 0) return insights;

  // Campanhas filtradas pelo mesmo critério usado nos KPIs — garante que
  // insights e cards mostrem o mesmo "universo" de dados.
  const campaigns = data.campaigns.filter((c) => {
    if (!options.includeBoosts && c.objective === 'boost') return false;
    if (!options.includeInactive && c.status && c.status !== 'ACTIVE') return false;
    return true;
  });

  insights.push(...detectMonthOverMonthSwing(data.monthlyData));
  insights.push(...detectCpaOutliers(campaigns));
  insights.push(...detectPlatformImbalance(campaigns));
  insights.push(...detectLowPerformers(campaigns));
  insights.push(...detectStandoutWinner(campaigns));
  insights.push(...detectRecentZeroConversions(data.monthlyData));

  // Ordena: critical → warning → info → positive
  const order: Record<InsightSeverity, number> = { critical: 0, warning: 1, info: 2, positive: 3 };
  return insights.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 6);
}

// Helpers

function detectMonthOverMonthSwing(monthly: MonthlyData[]): Insight[] {
  if (monthly.length < 2) return [];
  const last = monthly[monthly.length - 1];
  const prev = monthly[monthly.length - 2];

  const spendDelta = percentDelta(last.totalSpend, prev.totalSpend);
  const convDelta = percentDelta(last.totalConversions, prev.totalConversions);

  const results: Insight[] = [];

  // Investimento subiu mas conversões caíram
  if (spendDelta !== null && convDelta !== null && spendDelta > 15 && convDelta < -10) {
    results.push({
      id: 'swing-spend-up-conv-down',
      severity: 'critical',
      title: 'Investimento subiu, conversões caíram',
      description: `Você investiu ${formatPercent(spendDelta, 0)} a mais no último mês, mas as conversões caíram ${formatPercent(Math.abs(convDelta), 0)}. Vale revisar as campanhas.`,
      action: { label: 'Ver campanhas', href: '/campanhas' },
    });
  } else if (convDelta !== null && convDelta > 25) {
    results.push({
      id: 'swing-conv-up',
      severity: 'positive',
      title: `Conversões cresceram ${formatPercent(convDelta, 0)} vs mês anterior`,
      description: `${formatNumber(last.totalConversions)} conversões no último mês. Mantendo a estratégia, tende a continuar.`,
    });
  } else if (convDelta !== null && convDelta < -25) {
    results.push({
      id: 'swing-conv-down',
      severity: 'warning',
      title: `Conversões caíram ${formatPercent(Math.abs(convDelta), 0)} vs mês anterior`,
      description: `De ${formatNumber(prev.totalConversions)} pra ${formatNumber(last.totalConversions)}. Pode indicar criativo saturado ou sazonalidade.`,
      action: { label: 'Ver criativos', href: '/criativos' },
    });
  }

  return results;
}

function detectCpaOutliers(campaigns: CampaignSummary[]): Insight[] {
  if (campaigns.length < 3) return [];

  const withCpa = campaigns.filter((c) => c.cpa && isFinite(c.cpa) && c.conversions > 0);
  if (withCpa.length < 3) return [];

  const avgCpa = withCpa.reduce((s, c) => s + (c.cpa ?? 0), 0) / withCpa.length;
  const worst = [...withCpa].sort((a, b) => (b.cpa ?? 0) - (a.cpa ?? 0))[0];

  if (worst && (worst.cpa ?? 0) > avgCpa * 2.5) {
    return [
      {
        id: `cpa-outlier-${worst.provider}-${worst.id}`,
        severity: 'warning',
        title: `CPA de "${truncate(worst.name)}" é ${((worst.cpa ?? 0) / avgCpa).toFixed(1)}× a média`,
        description: `${formatCurrency(worst.cpa ?? 0)} vs média de ${formatCurrency(avgCpa)}. Considere pausar ou ajustar o criativo.`,
        action: { label: 'Ver detalhes', href: '/campanhas' },
      },
    ];
  }
  return [];
}

/**
 * Calcula a partir de `campaigns[]` (não `monthlyData`) pra respeitar
 * o filtro de objective/boost. MonthlyData é account-level e sempre
 * inclui boosts, o que inflaria o CPA Meta.
 */
function detectPlatformImbalance(campaigns: CampaignSummary[]): Insight[] {
  const totals = campaigns.reduce(
    (acc, c) => {
      if (c.provider === 'meta') {
        acc.metaSpend += c.spend;
        acc.metaConv += c.conversions;
      } else {
        acc.googleSpend += c.spend;
        acc.googleConv += c.conversions;
      }
      return acc;
    },
    { metaSpend: 0, metaConv: 0, googleSpend: 0, googleConv: 0 },
  );

  const totalSpend = totals.metaSpend + totals.googleSpend;
  if (totalSpend === 0) return [];

  const metaCpa = safeDiv(totals.metaSpend, totals.metaConv);
  const googleCpa = safeDiv(totals.googleSpend, totals.googleConv);

  if (totals.metaConv > 0 && totals.googleConv > 0) {
    if (metaCpa < googleCpa * 0.6) {
      return [
        {
          id: 'platform-meta-cheaper',
          severity: 'info',
          title: 'Meta está convertendo mais barato que Google',
          description: `CPA Meta ${formatCurrency(metaCpa)} vs Google ${formatCurrency(googleCpa)}. Vale realocar verba pra Meta?`,
          action: { label: 'Ver funil', href: '/funil' },
        },
      ];
    }
    if (googleCpa < metaCpa * 0.6) {
      return [
        {
          id: 'platform-google-cheaper',
          severity: 'info',
          title: 'Google está convertendo mais barato que Meta',
          description: `CPA Google ${formatCurrency(googleCpa)} vs Meta ${formatCurrency(metaCpa)}. Vale realocar verba pra Google?`,
          action: { label: 'Ver funil', href: '/funil' },
        },
      ];
    }
  }
  return [];
}

function detectLowPerformers(campaigns: CampaignSummary[]): Insight[] {
  const lowConv = campaigns.filter((c) => c.spend > 500 && c.conversions === 0);
  if (lowConv.length === 0) return [];

  const top = [...lowConv].sort((a, b) => b.spend - a.spend)[0];
  const count = lowConv.length;

  return [
    {
      id: 'low-performer-no-conv',
      severity: 'warning',
      title:
        count === 1
          ? `"${truncate(top.name)}" gastou ${formatCurrency(top.spend)} sem converter`
          : `${count} campanhas com spend alto e 0 conversões`,
      description:
        count === 1
          ? 'Considere pausar ou revisar criativo/público.'
          : `Maior ofensor: "${truncate(top.name)}" com ${formatCurrency(top.spend)}.`,
      action: { label: 'Ver todas', href: '/campanhas' },
    },
  ];
}

function detectStandoutWinner(campaigns: CampaignSummary[]): Insight[] {
  const withConv = campaigns.filter((c) => c.conversions > 0 && c.cpa && isFinite(c.cpa));
  if (withConv.length < 3) return [];

  const avgCpa = withConv.reduce((s, c) => s + (c.cpa ?? 0), 0) / withConv.length;
  const best = [...withConv].sort((a, b) => (a.cpa ?? Infinity) - (b.cpa ?? Infinity))[0];

  if (best && (best.cpa ?? Infinity) < avgCpa * 0.5 && best.conversions >= 5) {
    return [
      {
        id: `standout-${best.provider}-${best.id}`,
        severity: 'positive',
        title: `"${truncate(best.name)}" tem CPA ${((avgCpa / (best.cpa ?? 1))).toFixed(1)}× melhor que a média`,
        description: `${formatCurrency(best.cpa ?? 0)} vs ${formatCurrency(avgCpa)} médio. Vale aumentar orçamento nessa campanha.`,
      },
    ];
  }
  return [];
}

function detectRecentZeroConversions(monthly: MonthlyData[]): Insight[] {
  if (monthly.length === 0) return [];
  const last = monthly[monthly.length - 1];

  if (last.totalSpend > 100 && last.totalConversions === 0) {
    return [
      {
        id: 'recent-zero-conv',
        severity: 'critical',
        title: 'Nenhuma conversão no período mais recente',
        description: `Foram investidos ${formatCurrency(last.totalSpend)} sem conversão registrada. Verifique o tracking (pixel/tag) e se as campanhas estão rodando.`,
        action: { label: 'Ver integrações', href: '/integracoes' },
      },
    ];
  }
  return [];
}

function truncate(s: string, max = 40): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}
