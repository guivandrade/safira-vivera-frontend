# Plano de Transição — Single-Tenant → Multi-Tenant Safira

**Data:** 2026-04-23 · **Autor:** Diego Engenharia (Tech Lead) · **Estado:** Aprovado — pronto pra execução (Fase 0)

---

## Objetivo

Transformar o `safira-vivera-*` de um dashboard single-tenant (Vera/Clínica Vívera) numa plataforma multi-tenant onde a **Agência Safira** cadastra e gerencia múltiplos clientes, cada um com acessos e permissões próprias, e cada cliente vê **apenas os próprios dados** em tempo real.

---

## Estado atual (fatos levantados no pre-flight)

### Backend
- Schema Prisma é **user-centric**: `User` é a unidade, `Clinic/Integrations/Cache/Preferences` são scoped por `userId`. Não há `Account`/`Tenant`.
- `User.roles: String[]` default `["user"]`. Já tem **`RolesGuard` + `@Roles`** em uso em endpoints admin (metrics, users, campaigns/admin). **Não começa do zero.**
- Módulos Meta/Google já são **separados** em `src/modules/integrations/{meta-ads,google-ads}/`. Desacoplamento é polimento, não refactor.
- `IntegrationCache` já suporta cacheamento por `userId` — adaptável a `accountId`.

### Frontend
- Zero conceito de permissão. `AuthGuard` só checa "logado" vs "não-logado".
- 10 arquivos têm branches direto em `provider === 'meta' | 'google'` — acoplamento moderado.
- Já existe `dashboard-layout-store` com presets de layout — bom ponto de partida pra templates por ICP.
- Core visual (KPI cards, charts, tables, command palette) é agnóstico a nicho — reusável sem mudança.

### Conclusão
- Backend vai mudar **mais do que parece à primeira vista** — tenant-scope precisa ser auditado em **100%** dos queries.
- Frontend vai mudar **mais do que o CEO estima** — novas telas admin + gating de permissão são ~30-40% de código novo, mesmo mantendo o visual.

---

## Decisões confirmadas pelo CEO (2026-04-23)

1. ✅ **Granularidade de permissões:** página + 4 métricas sensíveis configuráveis.
   As 4 métricas sensíveis são: **`spend`** (gasto em mídia), **`cpa`** (custo por conversão), **`roas`** (retorno sobre investimento), **`cpm`** (custo por mil impressões). Essas são as 4 que o admin Safira pode esconder por usuário quando dá acesso a um `MEMBER` do cliente.

2. ✅ **Whitelabel:** v2 (fora do MVP). Brand Safira visível no MVP.

3. ✅ **Billing:** incluído no serviço da agência. Sem Stripe/Asaas no MVP.

4. ✅ **Onboarding:** invite link por email + reset de senha no primeiro login.

5. ✅ **Isolation absoluta:** cliente A nunca vê B. Sem exceção. Tenant-scope obrigatório em 100% dos queries.

---

## Arquitetura proposta

### Schema Prisma (novo)

```prisma
model Account {
  id          String   @id @default(uuid()) @db.Uuid
  name        String                                // "Clínica Vívera", "Loja X", etc.
  slug        String   @unique                      // "vivera", "loja-x" — usado em URLs
  nicheType   NicheType                             // LOCAL_BUSINESS | INFOPRODUCT | ECOMMERCE
  hasMeta     Boolean  @default(false)              // feature flag Meta
  hasGoogle   Boolean  @default(false)              // feature flag Google
  createdBy   String   @db.Uuid @map("created_by")  // staff Safira que criou
  logoUrl     String?                               // futuro whitelabel
  status      AccountStatus @default(ACTIVE)        // ACTIVE | SUSPENDED | ARCHIVED

  memberships AccountMembership[]
  clinics     Clinic[]
  integrations IntegrationCredential[]
  caches      IntegrationCache[]

  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  @@map("accounts")
}

enum NicheType { LOCAL_BUSINESS INFOPRODUCT ECOMMERCE }
enum AccountStatus { ACTIVE SUSPENDED ARCHIVED }

model AccountMembership {
  id          String   @id @default(uuid()) @db.Uuid
  accountId   String   @db.Uuid @map("account_id")
  account     Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  userId      String   @db.Uuid @map("user_id")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role        MembershipRole                              // OWNER | ADMIN | MEMBER | AGENCY_STAFF
  permissions Json     @default("{}")                     // overrides granulares por usuário

  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@unique([accountId, userId])
  @@index([userId])
  @@map("account_memberships")
}

enum MembershipRole {
  OWNER          // dono do negócio — acesso total ao próprio account
  ADMIN          // funcionário do cliente com permissão de gestão
  MEMBER         // funcionário do cliente com permissão limitada
  AGENCY_STAFF   // staff Safira — lê todos, gerencia via admin UI
}
```

**User** continua existindo mas **perde a ligação direta com Clinic/Integrations/Cache** — esses passam a ser `accountId`-scoped. `User` vira só "identidade de login" + `roles` globais (só usados pra marcar `safira_staff` / `system`).

### Tenant-scope no backend

Toda query passa a filtrar por `accountId`. Implementado via:
- `@CurrentAccount()` decorator (como já existe `@CurrentUser()`) — extrai `accountId` do JWT
- `AccountScopedGuard` — valida que o user tem `AccountMembership` com esse account
- Prisma middleware opcional pra enforce automático (defesa em profundidade)

### JWT payload estendido

```ts
{
  sub: userId,                    // já existe
  roles: string[],                // já existe — global roles
  account: {                      // NOVO
    id: accountId,
    slug: "vivera",
    role: "OWNER" | "ADMIN" | ...,
    permissions: { ... },
  }
}
```

**Trocar de account:** quando user pertence a múltiplos (ex: staff Safira), UI mostra seletor no topo. Trocar dispara `POST /auth/switch-account` que re-emite JWT com o novo account embutido.

### Permissões (RBAC + ABAC mínimo)

**Matriz de permissões padrão por role:**

| Permissão | OWNER | ADMIN | MEMBER | AGENCY_STAFF |
|---|---|---|---|---|
| `view:dashboard` | ✓ | ✓ | ✓ | ✓ |
| `view:campaigns` | ✓ | ✓ | ✓ | ✓ |
| `view:spend` | ✓ | ✓ | (configurável) | ✓ |
| `view:cpa_roas` | ✓ | ✓ | (configurável) | ✓ |
| `view:creatives` | ✓ | ✓ | ✓ | ✓ |
| `view:settings` | ✓ | ✓ | ✗ | ✓ |
| `manage:integrations` | ✓ | ✗ | ✗ | ✓ |
| `manage:users` | ✓ | ✗ | ✗ | ✓ |
| `manage:billing` | ✓ | ✗ | ✗ | ✓ |

`AccountMembership.permissions` (JSON) permite **override por usuário**: admin vira `MEMBER` e dá `view:spend: false` pra alguém específico.

Hook frontend: `const can = useCan(); can('view:spend') // true/false`. Componente: `<Can permission="view:spend">...</Can>`.

---

## Fases de entrega

### Fase 0 — Planejamento + alinhamento (2-3 dias)
- [ ] Este documento aprovado por você
- [ ] 5 decisões resolvidas (ver acima)
- [ ] Design das 10-15 telas admin novas (wireframe ou baixa-fi)
- [ ] Catálogo completo de permissões definido
- [ ] Plano de migration da Vera (ela vira Account #1 com slug `vivera`)

**Saída:** documento final de arquitetura + lista de tickets detalhados.

### Fase 1 — Backend multi-tenant foundation (1 a 1,5 semana)
- [ ] Schema migration: `Account`, `AccountMembership`, enums, field `accountId` em `Clinic`, `IntegrationCredential`, `IntegrationCache`, `UserPreferences`
- [ ] Migration de dados da Vera: cria Account `vivera`, cria `AccountMembership` OWNER pra user dela, re-associa todos os dados
- [ ] `@CurrentAccount()` decorator + `AccountScopedGuard`
- [ ] Refactor de **todos** os services pra filtrar por `accountId` (auditoria com grep sistemático)
- [ ] `POST /auth/switch-account` + JWT com account embutido
- [ ] Testes de isolation: cliente A não vê dados de cliente B (suite E2E dedicada)

**Risco:** uma única query esquecida sem `accountId` é vazamento de dados. **Mitigação:** Prisma middleware de enforcement + E2E suite de isolation rodando em CI.

**Dono:** Bruno (backend) + Andre (migration) + Sofia (review de segurança).

### Fase 2 — Desacoplamento Meta/Google (2-3 dias, pode rodar em paralelo à Fase 1)
- [ ] `account.hasMeta` / `account.hasGoogle` propagados até o frontend via `/auth/me`
- [ ] 10 arquivos frontend que acoplam `provider === 'meta' | 'google'` passam a consultar feature flag
- [ ] PlatformTabs e filtros escondem a aba quando provider está off
- [ ] Empty states dedicados quando provider não está conectado
- [ ] `/integracoes` mostra só os providers habilitados pro account

**Dono:** Leticia (frontend) + Nina (integrações, revisar).

### Fase 3 — Admin UI (3-4 dias)
Novas telas em `src/app/(admin)/`:
- [ ] `/admin/clientes` — lista paginada de accounts, busca, status, última atividade
- [ ] `/admin/clientes/novo` — formulário de criação (nome, slug, tipo de nicho, features Meta/Google)
- [ ] `/admin/clientes/[slug]` — detalhes, tabs: Geral, Membros, Integrações, Permissões, Atividade
- [ ] `/admin/clientes/[slug]/membros` — listar users, convidar novo (gera invite link), editar role/permissões por user
- [ ] `/admin/clientes/[slug]/integracoes` — conectar Meta/Google em nome do cliente (OAuth fluxo delegado)

**Gate:** toda rota em `(admin)` exige `role = AGENCY_STAFF` OU `roles.includes('safira_staff')` no JWT. `AgencyStaffGuard` no layout.

**Dono:** Leticia (frontend) + Rafa (fullstack pra endpoints novos).

### Fase 4 — Permission enforcement ponta-a-ponta (3-4 dias)
- [ ] Backend: `PermissionsGuard` com decorator `@RequirePermission('view:spend')`
- [ ] Backend: cada controller sensível anotado
- [ ] Frontend: hook `useCan(permission)` lê JWT claims
- [ ] Frontend: componente `<Can permission="...">` wrapping elementos sensíveis
- [ ] Esconde métricas sensíveis do KPI card quando user sem `view:spend`
- [ ] Esconde itens do sidebar por permissão (`view:campaigns` → esconde /campanhas)
- [ ] Redireciona pra `/dashboard` se user tenta URL sem permissão

**Dono:** Rafa (fullstack) + Sofia (review).

### Fase 5 — Templates por ICP (3-4 dias)
- [ ] Preset **LOCAL_BUSINESS**: conversões = "mensagens WhatsApp" / "agendamentos"; mapa de bairros em destaque; termos "paciente/cliente" (já existe, refinar)
- [ ] Preset **INFOPRODUCT**: funil de checkout (impression → click → landing → checkout → purchase), CAC projetado, carrinho abandonado, landing conversion rate; esconder mapa
- [ ] Preset **ECOMMERCE**: ROAS em destaque, produto mais vendido, ticket médio, CAC por canal, vendas recorrentes; widget de estoque futuro
- [ ] `dashboard-layout-store` ganha preset `nicheType`; ao criar Account, layout default vem do nicho
- [ ] Copy contextual (ex: "seus pacientes" vs "seus clientes" vs "suas vendas")

**Dono:** Leticia + você (decisão de produto sobre quais widgets).

### Fase 6 — QA + testes de isolation (3-4 dias)
- [ ] Suite E2E: criar 2 accounts, user de A tenta acessar dado de B por URL direta → bloqueado
- [ ] Suite E2E: trocar de account recarrega dados corretos
- [ ] Suite E2E: onboarding completo (invite → email → reset senha → primeiro login)
- [ ] Testes unit de cada `PermissionsGuard`
- [ ] Smoke test manual de cada template ICP com dados reais

**Dono:** Carla (QA).

### Fase 7 — Deploy + onboarding primeiros clientes (2-3 dias)
- [ ] Migration produção (janela fora do horário da Vera)
- [ ] Smoke test produção com conta Vera (nenhuma regressão)
- [ ] Criar 1-2 clientes piloto
- [ ] Acompanhar primeira semana de uso

**Dono:** Pedro (DevOps) + Diego (eu) + você (onboarding).

---

## Timeline realista

| Semana | Entregas |
|---|---|
| 1 | Fase 0 (alinhamento + decisões) + começo Fase 1 (schema) |
| 2 | Fase 1 (backend tenant-scope + migration Vera) + Fase 2 (desacoplamento) em paralelo |
| 3 | Fase 3 (admin UI) |
| 4 | Fase 4 (permissions ponta-a-ponta) |
| 5 | Fase 5 (templates ICP) + Fase 6 (QA) |
| 6 | Fase 6 fim + Fase 7 (deploy + piloto) |

**Cenário otimista:** 4-5 semanas (trabalho focado, decisões rápidas).
**Cenário realista:** 6-8 semanas (ajustes de escopo, bugs inesperados no tenant-scope, feedback de cliente piloto).
**Cenário com whitelabel + billing:** +3-4 semanas.

---

## O que NÃO entra no MVP

Ficam pra v2 explicitamente:
- **Whitelabel** (cor, logo, domínio custom por cliente)
- **Billing/Assinatura** (Stripe/Asaas, controle de mensalidade)
- **Audit log** (quem fez o quê quando — só log básico)
- **Export automático** (relatório mensal PDF enviado por email)
- **Alertas proativos** (continua no backlog do audit 18/04)
- **SSO / Google Login** (só email/senha no MVP)
- **Custom roles** (só os 4 fixos: OWNER, ADMIN, MEMBER, AGENCY_STAFF)
- **Multi-account por user** além de staff Safira (ex: um sócio em 2 negócios diferentes)

Cada um desses adiciona 3 dias a 2 semanas. Por isso fora do MVP.

---

## Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Query sem `accountId` vazando dados de outro cliente | Média | **Crítico** | Prisma middleware + E2E isolation suite em CI + review de 100% dos services |
| Migration da Vera quebra dados dela | Baixa | Alto | Migration em transaction + backup pré-migration + dry-run em staging |
| Admin UI fica confusa (muitas telas novas) | Média | Médio | Wireframe + validação com você antes de implementar |
| Cliente reclama que permissões são simples demais | Baixa | Baixo | MVP explícito; iteramos depois |
| Templates ICP não refletem bem cada nicho | Média | Médio | Começar com LOCAL_BUSINESS (já validado com Vera), iterar outros dois com cliente piloto |
| Performance degrada com tenant-scope | Baixa | Médio | Index composto (`accountId, ...`) em todas as tabelas scoped |

---

## Próximo passo

1. Você responde as **5 decisões** acima
2. Eu atualizo este documento com suas respostas
3. Você aprova
4. Abro os tickets da Fase 0 (wireframes + plano de migration)

Depois que Fase 0 estiver pronta, começo a execução.
