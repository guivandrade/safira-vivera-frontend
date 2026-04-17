# Frontend Template — Agencia Safira

## O que é isto?

Este é o **template base** para novos repositórios frontend da Agencia Safira. Ele segue rigorosamente o **handbook tecnico** definido em `~/Documents/www/agenciasafira/docs/`.

Quando você fizer um fork deste template para um novo cliente, renomeie o repo para:
```
safira-<cliente>-frontend
```

## Quick Start

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` para validar que o app está rodando.

## Estrutura (ver handbook)

- **Handbook de referência**: `~/Documents/www/agenciasafira/docs/`
  - [04-frontend-nextjs.md](../../agenciasafira/docs/04-frontend-nextjs.md) — padrões Next.js + App Router
  - [07-padroes-git.md](../../agenciasafira/docs/07-padroes-git.md) — git, commits, nomenclatura
  - [08-seguranca.md](../../agenciasafira/docs/08-seguranca.md) — auth, XSS, CORS
  - [09-testes.md](../../agenciasafira/docs/09-testes.md) — Vitest + Playwright

- **Src/app/** — Next.js 14 App Router
  - `(marketing)/` — route group para páginas públicas
  - `(dashboard)/` — route group para páginas autenticadas
  - `layout.tsx` — root layout com metadata
  - Route handlers em `api/` quando necessário

- **Src/components/** — React componentes reutilizáveis
  - `ui/` — componentes baixo nível (button, input, etc)
  - `features/` — componentes de domínio (login-form, user-card, etc)

- **Src/lib/** — utilidades não-React
  - `api-client.ts` — axios + interceptadores para auth
  - queries, transformers, etc

- **Src/hooks/** — custom React hooks
  - `useAuth()` — exemplo de hook para login/logout

- **Src/styles/** — Tailwind CSS globals

- **Test/** — testes (Vitest para unit, Playwright para E2E)

- **Docker/** — multi-stage Dockerfile otimizado

## Decisões da arquitetura

Este template implementa as decisões documentadas em [docs/ADRs/](../../agenciasafira/docs/ADRs/):

- **ADR 0002**: Next.js App Router (não Pages Router)
- **ADR 0004**: Repositório separado do backend

## Modificações por cliente

Após fazer fork:

1. Renomeie `safira-frontend-template` → `safira-<cliente>-frontend`
2. Atualize `package.json` com nome do cliente
3. Crie `.env.local` baseado em `.env.example`
4. Atualize `NEXT_PUBLIC_API_URL` para apontar pro backend do cliente
5. Crie componentes em `src/components/features/` por página

**Não se desvie dos padrões** — se algo não faz sentido, abra issue no handbook repo.

## Server vs Client Components

Por padrão, components são **Server Components** (render no servidor).
Use `'use client'` APENAS quando precisar de hooks de browser (useState, useEffect, onClick, etc).

```tsx
// ✅ Server Component (padrão)
export default async function Page() {
  const data = await fetch('...').then(r => r.json());
  return <div>{data.name}</div>;
}

// ✅ Client Component (quando precisa onClick, useState, etc)
'use client';
import { useState } from 'react';
export default function Button() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

Ver [04-frontend-nextjs.md](../../agenciasafira/docs/04-frontend-nextjs.md) para detalhes.

## Deployment

Local:
```bash
npm run dev
```

Produção:
- Webhook do GitHub em `main` dispara rebuild automático no Coolify
- `.env` é injetado por Coolify, não commitado
- `npm run build && npm start`

Ver [06-docker-deploy.md](../../agenciasafira/docs/06-docker-deploy.md) para detalhes.

## Links rápidos

- **Handbook**: `~/Documents/www/agenciasafira/docs/INDEX.md`
- **Stack global**: `~/.claude/ref/stack.md`
- **Identidade visual**: `~/.claude/ref/identidade-visual.md`
