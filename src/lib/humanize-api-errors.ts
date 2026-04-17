/**
 * Traduz mensagens de erro brutas do backend (geralmente vindas do axios ou
 * de falhas de integração Meta/Google) em textos claros pra Vera. Erros
 * desconhecidos caem num fallback genérico em vez de exibir stack técnico.
 */

interface HumanizedError {
  message: string;
  /** Alguma dica/ação sugerida ao usuário, opcional. */
  hint?: string;
}

const PATTERNS: Array<{ match: RegExp; humanize: (raw: string) => HumanizedError }> = [
  {
    match: /status code 400/i,
    humanize: () => ({
      message: 'Meta rejeitou parte da consulta',
      hint: 'Alguns criativos/campanhas podem estar indisponíveis temporariamente na API do Meta. Dados parciais foram carregados.',
    }),
  },
  {
    match: /status code 401|unauthorized|token/i,
    humanize: () => ({
      message: 'Autenticação com a plataforma expirou',
      hint: 'Vá em Integrações e reconecte a conta.',
    }),
  },
  {
    match: /status code 429|rate limit/i,
    humanize: () => ({
      message: 'Limite de requisições atingido',
      hint: 'O Meta/Google limitou temporariamente nossas consultas. Tente novamente em alguns minutos.',
    }),
  },
  {
    match: /status code 5\d\d|server error|ECONN|timeout/i,
    humanize: () => ({
      message: 'Plataforma indisponível no momento',
      hint: 'A API do Meta/Google está instável. Os dados que aparecem podem estar desatualizados.',
    }),
  },
  {
    match: /geographic_view|keyword_view/i,
    humanize: () => ({
      message: 'Google ainda está processando os dados deste período',
      hint: 'Alguns relatórios geográficos e de palavras-chave levam até 24h pra ficarem disponíveis após o fim do dia.',
    }),
  },
];

export function humanizeApiError(raw: string): HumanizedError {
  for (const { match, humanize } of PATTERNS) {
    if (match.test(raw)) return humanize(raw);
  }
  // Remove prefixo "Provider name: " (ex: "Meta creatives: ...")
  const clean = raw.replace(/^[\w\s]+:\s*/, '');
  return {
    message: clean.length > 120 ? 'Alguns dados podem estar incompletos' : clean,
  };
}

/**
 * Dedup + humaniza array inteiro de erros vindos de `data.errors`.
 */
export function humanizeApiErrors(errors: string[] | undefined): HumanizedError[] {
  if (!errors || errors.length === 0) return [];
  const seen = new Set<string>();
  const result: HumanizedError[] = [];
  for (const err of errors) {
    const h = humanizeApiError(err);
    const key = h.message;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(h);
    }
  }
  return result;
}
