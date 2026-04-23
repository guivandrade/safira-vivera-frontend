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
