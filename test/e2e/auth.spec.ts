import { test, expect, Page } from '@playwright/test';

/**
 * Stub de backend: intercepta qualquer request de API que não seja
 * /auth/login e retorna payload vazio. Mantém E2E determinístico
 * (sem dependência de backend rodando).
 *
 * IMPORTANTE: registrar ANTES do mockLogin — Playwright chama a última
 * rota registrada primeiro, então deixamos mockLogin em cima para
 * tomar precedência sobre qualquer glob genérico.
 */
async function stubBackend(page: Page) {
  await page.route(
    (url) => {
      const href = url.href;
      if (href.includes('/auth/login')) return false;
      return /\/(auth|campaigns|settings|integrations)/.test(new URL(href).pathname);
    },
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ campaigns: [], monthlyData: [] }),
      }),
  );
}

async function mockLogin(page: Page, response: { status: number; body: unknown }) {
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: response.status,
      contentType: 'application/json',
      body: JSON.stringify(response.body),
    });
  });
}

/**
 * Next injeta um `<div role="alert" id="__next-route-announcer__">` no
 * body para anunciar mudanças de rota a leitores de tela. Filtramos
 * pelo alert **da nossa UI** que tem classe de erro.
 */
function errorAlert(page: Page) {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}

test.describe('Auth flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {
        // origem sem acesso antes da primeira navegação — ignorar
      }
    });
  });

  test('acessar /dashboard sem token redireciona para /login', async ({ page }) => {
    await stubBackend(page);

    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login\?returnUrl=/, { timeout: 10000 });
    await expect(page.getByText('Acesse sua conta')).toBeVisible();
  });

  test('login com credencial válida salva tokens e redireciona', async ({ page }) => {
    await stubBackend(page);
    await mockLogin(page, {
      status: 200,
      body: {
        access_token: 'fake-access',
        refresh_token: 'fake-refresh',
        user: { id: 'u1', email: 'admin@example.com', name: 'Admin' },
      },
    });

    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Senha', { exact: true }).fill('admin123');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL(/\/campanhas/, { timeout: 10000 });

    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBe('fake-access');
  });

  test('login inválido mostra erro e mantém na /login', async ({ page }) => {
    await stubBackend(page);
    await mockLogin(page, {
      status: 401,
      body: { message: 'Email ou senha incorretos' },
    });

    await page.goto('/login');
    await page.getByLabel('Email').fill('errado@example.com');
    await page.getByLabel('Senha', { exact: true }).fill('senha-errada');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(errorAlert(page)).toContainText(/incorret/i, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('returnUrl externo (open redirect) é sanitizado para /campanhas', async ({ page }) => {
    await stubBackend(page);
    await mockLogin(page, {
      status: 200,
      body: {
        access_token: 'fake-access',
        refresh_token: 'fake-refresh',
        user: { id: 'u1', email: 'a@b.com', name: 'A' },
      },
    });

    await page.goto('/login?returnUrl=//evil.com/steal');
    await page.getByLabel('Email').fill('a@b.com');
    await page.getByLabel('Senha', { exact: true }).fill('senha');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL(/\/campanhas/, { timeout: 10000 });
    expect(page.url()).not.toContain('evil.com');
  });
});
