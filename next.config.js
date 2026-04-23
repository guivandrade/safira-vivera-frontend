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
      // Meta CDNs (thumbnails de anúncios / imagens de post)
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: 'scontent.cdninstagram.com' },
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: 'lookaside.fbsbx.com' },
      // Google Ads (assets de criativo)
      { protocol: 'https', hostname: 'tpc.googlesyndication.com' },
      { protocol: 'https', hostname: 'googleads.g.doubleclick.net' },
    ],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [];
  },

  // Environment validation
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
};

module.exports = nextConfig;
