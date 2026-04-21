import { describe, it, expect } from 'vitest';
import { generateInsights } from '@/lib/insights';
import type {
  CampaignInsightsResponse,
  CampaignSummary,
  MonthlyData,
} from '@/types/campaigns';

function makeCampaign(overrides: Partial<CampaignSummary> = {}): CampaignSummary {
  return {
    id: overrides.id ?? 'c1',
    name: overrides.name ?? 'Campanha Teste',
    provider: overrides.provider ?? 'meta',
    status: overrides.status ?? 'ACTIVE',
    objective: overrides.objective ?? 'standard',
    spend: overrides.spend ?? 1000,
    conversions: overrides.conversions ?? 10,
    clicks: overrides.clicks ?? 100,
    impressions: overrides.impressions ?? 1000,
    cpa: overrides.cpa ?? 100,
    ...overrides,
  };
}

function makeMonth(
  month: string,
  totalSpend: number,
  totalConversions: number,
): MonthlyData {
  return {
    month,
    totalSpend,
    totalConversions,
    meta: { spend: totalSpend / 2, conversions: totalConversions / 2 },
    google: { spend: totalSpend / 2, conversions: totalConversions / 2 },
  };
}

function makeResponse(
  campaigns: CampaignSummary[],
  monthlyData: MonthlyData[] = [makeMonth('2026-03', 1000, 10)],
): CampaignInsightsResponse {
  return { campaigns, monthlyData };
}

describe('generateInsights', () => {
  it('retorna array vazio quando monthlyData está vazio', () => {
    const result = generateInsights(makeResponse([], []));
    expect(result).toEqual([]);
  });

  it('retorna array vazio para payload null/undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(generateInsights(null as any)).toEqual([]);
  });

  it('limita resultado a 6 insights no máximo', () => {
    const campaigns = Array.from({ length: 20 }, (_, i) =>
      makeCampaign({
        id: `c${i}`,
        name: `Campanha ${i}`,
        spend: 1000,
        conversions: 0,
      }),
    );
    const result = generateInsights(makeResponse(campaigns));
    expect(result.length).toBeLessThanOrEqual(6);
  });
});

describe('generateInsights — filtros includeBoosts/includeInactive', () => {
  it('exclui campanhas boost por padrão', () => {
    const campaigns = [
      makeCampaign({ id: 'boost1', objective: 'boost', conversions: 0, spend: 5000 }),
      // Uma campanha normal pra atingir floor de 3 em detectLowPerformers
      makeCampaign({ id: 'ok', conversions: 20, spend: 500 }),
    ];
    const result = generateInsights(makeResponse(campaigns));
    // Sem boost, só 1 campanha ativa com conversão — sem low-performer
    const ids = result.map((r) => r.id);
    expect(ids.some((id) => id.includes('boost1'))).toBe(false);
  });

  it('inclui campanhas boost quando includeBoosts=true', () => {
    const campaigns = Array.from({ length: 4 }, (_, i) =>
      makeCampaign({
        id: `c${i}`,
        name: `Normal ${i}`,
        spend: 100,
        conversions: 5,
        cpa: 20,
      }),
    );
    // adiciona boost com CPA absurdo → vira outlier
    campaigns.push(
      makeCampaign({
        id: 'big-boost',
        name: 'Boost caro',
        objective: 'boost',
        spend: 10000,
        conversions: 1,
        cpa: 10000,
      }),
    );

    const withBoosts = generateInsights(makeResponse(campaigns), { includeBoosts: true });
    const withoutBoosts = generateInsights(makeResponse(campaigns));

    // Com boost, aparece outlier mencionando "Boost caro"
    expect(withBoosts.some((i) => i.title.includes('Boost caro'))).toBe(true);
    expect(withoutBoosts.some((i) => i.title.includes('Boost caro'))).toBe(false);
  });

  it('exclui campanhas PAUSED/REMOVED por padrão', () => {
    const campaigns = [
      makeCampaign({ id: 'paused', status: 'PAUSED', spend: 5000, conversions: 0 }),
      makeCampaign({ id: 'removed', status: 'REMOVED', spend: 3000, conversions: 0 }),
      makeCampaign({ id: 'ok', status: 'ACTIVE', spend: 100, conversions: 10 }),
    ];
    const result = generateInsights(makeResponse(campaigns));
    // Low-performer só olha pra ACTIVE: spend=100 < 500 → não dispara
    const hasLowPerformer = result.some((r) => r.id === 'low-performer-no-conv');
    expect(hasLowPerformer).toBe(false);
  });

  it('inclui PAUSED/REMOVED quando includeInactive=true', () => {
    const campaigns = [
      makeCampaign({
        id: 'paused',
        status: 'PAUSED',
        name: 'Pausada cara',
        spend: 5000,
        conversions: 0,
      }),
    ];
    const result = generateInsights(makeResponse(campaigns), { includeInactive: true });
    expect(result.some((r) => r.id === 'low-performer-no-conv')).toBe(true);
  });
});

describe('detectMonthOverMonthSwing (via generateInsights)', () => {
  it('detecta gasto subindo + conversões caindo como critical', () => {
    const monthly = [
      makeMonth('2026-02', 1000, 100),
      makeMonth('2026-03', 1500, 50), // +50% spend, -50% conv
    ];
    const result = generateInsights(makeResponse([], monthly));
    const critical = result.find((r) => r.id === 'swing-spend-up-conv-down');
    expect(critical).toBeDefined();
    expect(critical?.severity).toBe('critical');
  });

  it('detecta crescimento >25% conv como positive', () => {
    const monthly = [
      makeMonth('2026-02', 1000, 100),
      makeMonth('2026-03', 1000, 140),
    ];
    const result = generateInsights(makeResponse([], monthly));
    expect(result.some((r) => r.id === 'swing-conv-up' && r.severity === 'positive')).toBe(true);
  });

  it('detecta queda >25% conv como warning', () => {
    const monthly = [
      makeMonth('2026-02', 1000, 100),
      makeMonth('2026-03', 1000, 60),
    ];
    const result = generateInsights(makeResponse([], monthly));
    expect(result.some((r) => r.id === 'swing-conv-down' && r.severity === 'warning')).toBe(true);
  });

  it('não gera swing com apenas 1 mês', () => {
    const monthly = [makeMonth('2026-03', 1000, 100)];
    const result = generateInsights(makeResponse([], monthly));
    expect(result.some((r) => r.id.startsWith('swing-'))).toBe(false);
  });
});

describe('detectCpaOutliers (via generateInsights)', () => {
  it('detecta campanha com CPA > 2.5× da média', () => {
    const campaigns = [
      makeCampaign({ id: 'a', cpa: 50, conversions: 10 }),
      makeCampaign({ id: 'b', cpa: 60, conversions: 10 }),
      makeCampaign({ id: 'c', cpa: 55, conversions: 10 }),
      makeCampaign({ id: 'outlier', name: 'Caríssima', cpa: 500, conversions: 5 }),
    ];
    const result = generateInsights(makeResponse(campaigns));
    expect(result.some((r) => r.id.startsWith('cpa-outlier-') && r.title.includes('Caríssima'))).toBe(true);
  });

  it('não gera outlier com menos de 3 campanhas com conversão', () => {
    const campaigns = [
      makeCampaign({ id: 'a', cpa: 50, conversions: 10 }),
      makeCampaign({ id: 'b', cpa: 500, conversions: 5 }),
    ];
    const result = generateInsights(makeResponse(campaigns));
    expect(result.some((r) => r.id.startsWith('cpa-outlier-'))).toBe(false);
  });

  it('ignora campanhas com CPA Infinity ou 0 conversões', () => {
    const campaigns = [
      makeCampaign({ id: 'a', cpa: 50, conversions: 10 }),
      makeCampaign({ id: 'b', cpa: 60, conversions: 10 }),
      makeCampaign({ id: 'c', cpa: 55, conversions: 10 }),
      makeCampaign({ id: 'noconv', cpa: Infinity, conversions: 0, spend: 100 }),
    ];
    const result = generateInsights(makeResponse(campaigns));
    expect(result.some((r) => r.id.includes('noconv'))).toBe(false);
  });
});

describe('detectPlatformImbalance (via generateInsights)', () => {
  it('detecta Meta significativamente mais barato que Google', () => {
    const campaigns = [
      makeCampaign({ id: 'm1', provider: 'meta', spend: 1000, conversions: 50, cpa: 20 }),
      makeCampaign({ id: 'g1', provider: 'google', spend: 1000, conversions: 10, cpa: 100 }),
    ];
    const result = generateInsights(makeResponse(campaigns));
    expect(result.some((r) => r.id === 'platform-meta-cheaper')).toBe(true);
  });

  it('detecta Google significativamente mais barato que Meta', () => {
    const campaigns = [
      makeCampaign({ id: 'm1', provider: 'meta', spend: 1000, conversions: 10, cpa: 100 }),
      makeCampaign({ id: 'g1', provider: 'google', spend: 1000, conversions: 50, cpa: 20 }),
    ];
    const result = generateInsights(makeResponse(campaigns));
    expect(result.some((r) => r.id === 'platform-google-cheaper')).toBe(true);
  });

  it('não gera imbalance quando uma plataforma tem 0 conversões', () => {
    const campaigns = [
      makeCampaign({ id: 'm1', provider: 'meta', spend: 1000, conversions: 50, cpa: 20 }),
      makeCampaign({ id: 'g1', provider: 'google', spend: 1000, conversions: 0, cpa: null }),
    ];
    const result = generateInsights(makeResponse(campaigns));
    expect(result.some((r) => r.id.startsWith('platform-'))).toBe(false);
  });

  it('não gera imbalance quando diferença < 40%', () => {
    const campaigns = [
      makeCampaign({ id: 'm1', provider: 'meta', spend: 1000, conversions: 20, cpa: 50 }),
      makeCampaign({ id: 'g1', provider: 'google', spend: 1000, conversions: 15, cpa: 66 }),
    ];
    const result = generateInsights(makeResponse(campaigns));
    expect(result.some((r) => r.id.startsWith('platform-'))).toBe(false);
  });
});

describe('detectLowPerformers (via generateInsights)', () => {
  it('detecta single campaign gastando >500 sem converter', () => {
    const campaigns = [
      makeCampaign({ id: 'low1', name: 'Sem converter', spend: 1000, conversions: 0 }),
    ];
    const result = generateInsights(makeResponse(campaigns));
    const low = result.find((r) => r.id === 'low-performer-no-conv');
    expect(low).toBeDefined();
    expect(low?.title).toContain('Sem converter');
  });

  it('agrega múltiplos low performers numa só mensagem', () => {
    const campaigns = [
      makeCampaign({ id: 'low1', name: 'A', spend: 600, conversions: 0 }),
      makeCampaign({ id: 'low2', name: 'B', spend: 700, conversions: 0 }),
      makeCampaign({ id: 'low3', name: 'Maior', spend: 2000, conversions: 0 }),
    ];
    const result = generateInsights(makeResponse(campaigns));
    const low = result.find((r) => r.id === 'low-performer-no-conv');
    expect(low?.title).toContain('3 campanhas');
    expect(low?.description).toContain('Maior');
  });

  it('ignora campanhas com spend ≤500', () => {
    const campaigns = [
      makeCampaign({ id: 'ok', spend: 400, conversions: 0 }),
    ];
    const result = generateInsights(makeResponse(campaigns));
    expect(result.some((r) => r.id === 'low-performer-no-conv')).toBe(false);
  });

  it('ignora campanhas com conversões >0 mesmo com spend alto', () => {
    const campaigns = [
      makeCampaign({ id: 'ok', spend: 5000, conversions: 1 }),
    ];
    const result = generateInsights(makeResponse(campaigns));
    expect(result.some((r) => r.id === 'low-performer-no-conv')).toBe(false);
  });
});

describe('detectStandoutWinner (via generateInsights)', () => {
  it('detecta campanha com CPA <50% da média e >=5 conversões', () => {
    const campaigns = [
      makeCampaign({ id: 'a', cpa: 100, conversions: 10 }),
      makeCampaign({ id: 'b', cpa: 120, conversions: 10 }),
      makeCampaign({ id: 'c', cpa: 110, conversions: 10 }),
      makeCampaign({ id: 'star', name: 'Vencedora', cpa: 20, conversions: 15 }),
    ];
    const result = generateInsights(makeResponse(campaigns));
    expect(result.some((r) => r.id.startsWith('standout-') && r.title.includes('Vencedora'))).toBe(true);
  });

  it('não marca vencedora com <5 conversões', () => {
    const campaigns = [
      makeCampaign({ id: 'a', cpa: 100, conversions: 10 }),
      makeCampaign({ id: 'b', cpa: 120, conversions: 10 }),
      makeCampaign({ id: 'c', cpa: 110, conversions: 10 }),
      makeCampaign({ id: 'star', name: 'Pouco vol', cpa: 10, conversions: 2 }),
    ];
    const result = generateInsights(makeResponse(campaigns));
    expect(result.some((r) => r.id.startsWith('standout-'))).toBe(false);
  });
});

describe('detectRecentZeroConversions (via generateInsights)', () => {
  it('detecta período com spend >100 e 0 conversões', () => {
    const monthly = [makeMonth('2026-03', 500, 0)];
    const result = generateInsights(makeResponse([], monthly));
    const critical = result.find((r) => r.id === 'recent-zero-conv');
    expect(critical).toBeDefined();
    expect(critical?.severity).toBe('critical');
  });

  it('não dispara com spend ≤100', () => {
    const monthly = [makeMonth('2026-03', 50, 0)];
    const result = generateInsights(makeResponse([], monthly));
    expect(result.some((r) => r.id === 'recent-zero-conv')).toBe(false);
  });

  it('não dispara quando há pelo menos 1 conversão', () => {
    const monthly = [makeMonth('2026-03', 500, 1)];
    const result = generateInsights(makeResponse([], monthly));
    expect(result.some((r) => r.id === 'recent-zero-conv')).toBe(false);
  });
});

describe('ordenação por severidade', () => {
  it('retorna insights em ordem critical → warning → info → positive', () => {
    const monthly = [
      makeMonth('2026-02', 1000, 100),
      makeMonth('2026-03', 1500, 50), // critical: spend-up-conv-down
    ];
    const campaigns = [
      makeCampaign({ id: 'a', provider: 'meta', spend: 1000, conversions: 50, cpa: 20 }),
      makeCampaign({ id: 'b', provider: 'google', spend: 1000, conversions: 10, cpa: 100 }),
      // info: platform-meta-cheaper
    ];
    const result = generateInsights(makeResponse(campaigns, monthly));
    const severityOrder = { critical: 0, warning: 1, info: 2, positive: 3 };
    for (let i = 1; i < result.length; i++) {
      expect(severityOrder[result[i].severity]).toBeGreaterThanOrEqual(
        severityOrder[result[i - 1].severity],
      );
    }
  });
});
