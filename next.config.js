const { withSentryConfig } = require('@sentry/nextjs');

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * CSP com lista controlada de origens. `'unsafe-inline'` em `script-src`
 * existe por causa do theme init script (evita FOUC de dark mode) e pode
 * ser substituído por nonce no futuro.
 */
function buildCSP() {
  const apiOrigin = (() => {
    try {
      return new URL(apiUrl).origin;
    } catch {
      return '';
    }
  })();

  const directives = [
    "default-src 'self'",
    // `'unsafe-inline'`: theme init script. `'unsafe-eval'`: Sentry/webpack em dev.
    `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${apiOrigin} https://*.sentry.io wss: https:`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  return directives.join('; ');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use build-specific tsconfig to exclude test files
  typescript: {
    tsconfigPath: './tsconfig.build.json',
  },

  // Server Components by default (App Router)
  reactStrictMode: true,

  // Images optimization. Restringimos hostnames para não aceitar imagem de
  // qualquer host via <Image>: se um dia um criativo trouxer URL fora dessa
  // lista, prefira <img> com loading="lazy" + alt descritivo.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: 'scontent.cdninstagram.com' },
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: 'lookaside.fbsbx.com' },
      { protocol: 'https', hostname: 'tpc.googlesyndication.com' },
      { protocol: 'https', hostname: 'googleads.g.doubleclick.net' },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: buildCSP() },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        ],
      },
    ];
  },

  async redirects() {
    return [];
  },

  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
  },
};

// Wrap com Sentry. Opções ficam mínimas — o upload de source maps acontece
// em CI quando SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT estiverem
// setados. Sem eles, o wrap é transparente.
module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  hideSourceMaps: true,
});
