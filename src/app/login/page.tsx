'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import { classifyError, getErrorMessage } from '@/lib/errors';
import type { MeResponse } from '@/types/auth-me';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Aceita só paths internos relativos. Rejeita URLs absolutas,
 * protocol-relative (`//evil.com`) e backslash (`/\\evil.com`)
 * para evitar open redirect via ?returnUrl=.
 */
function sanitizeReturnUrl(value: string | null): string {
  const fallback = '/campanhas';
  if (!value) return fallback;
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback;
  return value;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = sanitizeReturnUrl(searchParams.get('returnUrl'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.data.access_token);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.data.refresh_token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));

      // Staff Safira não tem `currentAccountId` no JWT por design (escolhe via
      // header x-account-id ou impersonate). Cair no returnUrl padrão `/campanhas`
      // geraria 401 do AccountScopedGuard. Mandamos pra /admin/clientes pra
      // escolher um cliente antes de qualquer rota que pede tenant-scope.
      try {
        const me = await apiClient.get<MeResponse>('/auth/me');
        if (me.data.user.isSafiraStaff && !me.data.currentAccount) {
          router.push('/admin/clientes');
          return;
        }
      } catch {
        // Se /auth/me falhar, cai no fluxo default — raramente acontece.
      }

      router.push(returnUrl);
    } catch (err: unknown) {
      const kind = classifyError(err);
      const backendMsg = getErrorMessage(err, '');
      let message: string;
      if (backendMsg) {
        message = backendMsg;
      } else if (kind === 'network') {
        message = 'Não conseguimos contato com o servidor. Verifique sua conexão.';
      } else if (kind === 'server') {
        message = 'O sistema está temporariamente indisponível. Tente em alguns minutos.';
      } else if (kind === 'unauthorized') {
        message = 'Email ou senha incorretos.';
      } else {
        message = 'Erro ao fazer login.';
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-muted p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link
            href="/"
            className="text-3xl font-bold text-ink transition-colors hover:text-accent"
          >
            Vívera
          </Link>
          <p className="mt-2 text-sm text-ink-muted">Acesse sua conta</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg border border-line bg-surface p-8 shadow-card"
        >
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
              className="w-full rounded-lg border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-transparent focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:bg-surface-subtle"
              placeholder="voce@exemplo.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-ink">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading}
                className="w-full rounded-lg border border-line bg-surface px-4 py-3 pr-12 text-ink outline-none transition focus:border-transparent focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:bg-surface-subtle"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isLoading}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-muted transition hover:text-ink"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full rounded-lg bg-accent py-3 font-semibold text-accent-fg transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-subtle">
          Dashboard de Campanhas — Meta Ads e Google Ads
        </p>
      </div>
    </main>
  );
}
