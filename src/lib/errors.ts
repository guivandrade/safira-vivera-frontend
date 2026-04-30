import axios from 'axios';

/**
 * Extrai uma mensagem humana de qualquer erro (axios, Error, unknown).
 *
 * Centraliza o padrão `err?.response?.data?.message ?? fallback` que vivia
 * em vários `catch (err: any)`. Com tipagem explícita `unknown`, o TS força
 * o narrowing e evita regressões quando o shape do erro muda.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

/**
 * Classifica erro em categorias acionáveis. Usado para dar mensagem certa
 * ao usuário (rede caindo ≠ servidor quebrado ≠ credencial errada).
 *
 * `timeout` e `dns` são casos especiais de `network` (sem `err.response`)
 * detectados pelo `error.code` do axios — diferenciam UI do usuário porque
 * a ação corretiva é diferente:
 * - timeout → tentar de novo (provavelmente vai funcionar)
 * - dns → URL configurada errado (problema de setup, não de rede)
 * - network genérico → conexão / firewall / CORS (browser não distingue)
 */
export type ErrorKind =
  | 'timeout'
  | 'dns'
  | 'network'
  | 'unauthorized'
  | 'server'
  | 'client'
  | 'unknown';

export function classifyError(err: unknown): ErrorKind {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      // Sem response = falha antes de receber qualquer coisa do servidor.
      // axios usa códigos do Node (lib http) E códigos próprios (`ERR_*`).
      // Lista cobre os casos observados em browsers e Node SSR.
      if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') return 'timeout';
      if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') return 'dns';
      return 'network';
    }
    const status = err.response.status;
    if (status === 401 || status === 403) return 'unauthorized';
    if (status >= 500) return 'server';
    if (status >= 400) return 'client';
  }
  return 'unknown';
}

/**
 * Mensagem amigável pronta pra mostrar na tela. Nunca deixa o usuário ver
 * "Request failed with status code 401" ou stack trace.
 *
 * Ordem de preferência:
 * 1. Mensagem vinda do backend (err.response.data.message) — já em PT, útil
 * 2. Classificação da rede (sem response, 5xx, etc) — mensagem mapeada
 * 3. Fallback contextualizado passado pelo caller
 */
export function getUserFacingMessage(err: unknown, fallback: string): string {
  const backendMessage = axios.isAxiosError(err)
    ? (err.response?.data as { message?: string } | undefined)?.message
    : undefined;

  // Se o backend mandou mensagem e ela não é ruído técnico, usamos
  if (backendMessage && !isTechnicalNoise(backendMessage)) {
    return backendMessage;
  }

  switch (classifyError(err)) {
    case 'timeout':
      return 'A requisição demorou demais. Tente novamente em alguns instantes.';
    case 'dns':
      return 'Não conseguimos localizar o servidor. Verifique a configuração ou contate o suporte.';
    case 'network':
      return 'Sem conexão com o servidor. Verifique sua internet ou tente novamente em instantes.';
    case 'unauthorized':
      return 'Sua sessão expirou. Faça login novamente.';
    case 'server':
      return 'O sistema está temporariamente indisponível. Tente em alguns minutos.';
    case 'client':
      return backendMessage ?? fallback;
    default:
      return fallback;
  }
}

/**
 * Extrai o `error.code` do axios, se existir. Útil pra logar contexto em
 * Sentry sem vazar stack/message pra UI.
 */
export function getErrorCode(err: unknown): string | undefined {
  if (axios.isAxiosError(err)) return err.code;
  return undefined;
}

/**
 * Mensagens que vazam detalhe técnico e não devem aparecer na UI.
 * Se o backend devolver algo assim, preferimos a classificação por status.
 */
function isTechnicalNoise(msg: string): boolean {
  const noisy = [/Request failed/i, /timeout/i, /axios/i, /socket/i, /ECONN/i];
  return noisy.some((re) => re.test(msg));
}
