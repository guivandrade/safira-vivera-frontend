# Safira Frontend Template

Next.js 14 + TypeScript + Tailwind CSS — Frontend template for Agencia Safira projects.

## Features

- ✅ Next.js 14+ with App Router (Server Components by default)
- ✅ TypeScript with strict mode
- ✅ Tailwind CSS for styling
- ✅ Form handling with react-hook-form + zod
- ✅ State management with Zustand
- ✅ API client with axios + interceptors
- ✅ Authentication flow (JWT + httpOnly cookies)
- ✅ Route groups for marketing & dashboard
- ✅ Vitest for unit tests + Playwright for E2E
- ✅ GitHub Actions CI/CD
- ✅ Docker multi-stage build

## Prerequisites

- Node 20+
- npm/yarn/pnpm

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

```bash
npm run dev          # Start dev server (hot reload)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # ESLint + fix
npm run type-check   # TypeScript check
npm run test         # Unit tests (Vitest)
npm run test:ui      # Test UI dashboard
npm run test:coverage # Coverage report
npm run test:e2e     # E2E tests (Playwright)
```

## Project Structure

```
src/
├── app/
│   ├── (marketing)/            # Public pages route group
│   │   ├── layout.tsx          # Marketing layout
│   │   ├── page.tsx            # Home page
│   │   └── [slug]/page.tsx     # Dynamic public pages
│   ├── (dashboard)/            # Authenticated pages route group
│   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   ├── dashboard/page.tsx  # Dashboard page
│   │   └── settings/page.tsx   # User settings
│   ├── api/                    # Route handlers (optional)
│   └── layout.tsx              # Root layout
├── components/
│   ├── ui/                     # Atomic components (Button, Input, etc)
│   └── features/               # Feature components (LoginForm, etc)
├── lib/
│   ├── api-client.ts           # Axios instance + interceptors
│   └── utils.ts                # Helper functions
├── hooks/
│   └── useAuth.ts              # Auth hook example
└── styles/
    └── globals.css             # Tailwind + global CSS

test/
├── setup.ts                    # Test setup & mocks
└── e2e/                        # Playwright tests

.github/
└── workflows/
    └── ci.yml                  # GitHub Actions CI/CD
```

## Authentication

The template includes a basic auth flow:

1. User submits email + password to `POST /auth/login`
2. Backend returns `access_token` + `user` object
3. `useAuth()` hook stores token in localStorage
4. `api-client` interceptor adds `Authorization: Bearer <token>` header
5. Protected pages in `(dashboard)/` group check auth in layout
6. On 401 response, interceptor calls `POST /auth/refresh` to get new token

See [03-auth-jwt-passport.md](../../agenciasafira/docs/03-auth-jwt-passport.md) for backend JWT spec.

## Server vs Client Components

**By default, use Server Components** (React Server Components - RSC).

```tsx
// ✅ Server Component (default, render on server)
export default async function Page() {
  const data = await fetch('https://api.example.com/data').then(r => r.json());
  return <div>{data.name}</div>;
}

// ❌ WRONG: using hooks in Server Component
export default async function Page() {
  const [count, setCount] = useState(0);  // ❌ Error!
  return <div>{count}</div>;
}

// ✅ Client Component (when you need hooks, events, etc)
'use client';
import { useState } from 'react';
export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

See [04-frontend-nextjs.md](../../agenciasafira/docs/04-frontend-nextjs.md) for detailed explanation.

## Forms

Use `react-hook-form` + `zod` for validation:

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      <button type="submit">Login</button>
    </form>
  );
}
```

## Testing

### Unit Tests

```bash
npm run test
```

Use Vitest + React Testing Library:

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

test('button renders with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### E2E Tests

```bash
npm run test:e2e
```

Use Playwright for critical user flows:

```ts
import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

## Styling

This template uses **Tailwind CSS** for all styling.

- Global styles in `src/styles/globals.css`
- Tailwind config in `tailwind.config.ts`
- No CSS modules or styled-components (prefer utility classes)

```tsx
export default function Card() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Title</h2>
      <p className="text-gray-600">Content</p>
    </div>
  );
}
```

## Environment Variables

- `NEXT_PUBLIC_API_URL` — Backend API URL (default: `http://localhost:3000`)
- Prefix with `NEXT_PUBLIC_` to expose to browser
- Never commit `.env.local`

## Deployment

### Local Docker Build

```bash
docker build -f docker/Dockerfile -t safira-frontend:latest .
docker run -p 3000:3000 safira-frontend:latest
```

### Coolify (Production)

1. Connect GitHub repo to Coolify project
2. Set `NEXT_PUBLIC_API_URL` in Coolify dashboard (env vars)
3. Coolify auto-deploys on `main` merge
4. Build command: `npm run build`
5. Start command: `npm start`

See [06-docker-deploy.md](../../agenciasafira/docs/06-docker-deploy.md).

## Common Issues

### "Module not found: Can't resolve '@/...'"

Make sure `tsconfig.json` has correct path mapping:
```json
"paths": {
  "@/*": ["./src/*"]
}
```

### "Hydration mismatch" error

Likely using `useState` or browser API in Server Component. Add `'use client'` at top of file.

### NextImage error on external domains

Configure `next.config.js`:
```js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'example.com' },
  ],
}
```

## Further Reading

- **Handbook**: [agenciasafira/docs/](../../agenciasafira/docs/)
- **Next.js**: https://nextjs.org/docs
- **Tailwind**: https://tailwindcss.com/docs
- **react-hook-form**: https://react-hook-form.com/
- **Zod**: https://zod.dev/

## License

Proprietary — Agencia Safira
