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
 * ao usuário no login (rede caindo ≠ servidor quebrado ≠ credencial errada).
 */
export type ErrorKind = 'network' | 'unauthorized' | 'server' | 'client' | 'unknown';

export function classifyError(err: unknown): ErrorKind {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'network';
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
    case 'network':
      return 'Sem conexão com o servidor. Verifique sua internet.';
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
 * Mensagens que vazam detalhe técnico e não devem aparecer na UI.
 * Se o backend devolver algo assim, preferimos a classificação por status.
 */
function isTechnicalNoise(msg: string): boolean {
  const noisy = [/Request failed/i, /timeout/i, /axios/i, /socket/i, /ECONN/i];
  return noisy.some((re) => re.test(msg));
}
