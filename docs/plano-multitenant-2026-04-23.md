# Plano de Transição — Single-Tenant → Multi-Tenant Safira

**Data:** 2026-04-23 · **Autor:** Diego Engenharia (Tech Lead) · **Estado:** Em execução — escopo simplificado 2026-04-23 tarde (ver §Escopo reduzido)

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

## Decisões iniciais do CEO (2026-04-23 manhã)

1. ✅ **Granularidade de permissões:** página + 4 métricas sensíveis configuráveis.
2. ✅ **Whitelabel:** v2 (fora do MVP).
3. ✅ **Billing:** incluído no serviço da agência.
4. ✅ **Onboarding:** invite link por email + reset de senha no primeiro login.
5. ✅ **Isolation absoluta:** cliente A nunca vê B.

## Escopo reduzido (CEO, 2026-04-23 tarde)

Depois de executar boa parte do plano, o CEO pediu simplificação do modelo:

> *"Meu cliente pode ter um acesso único, sem adicionar funcionários. Preciso que staff veja todos os clientes e que os clientes não vejam os de outros."*

O que isso muda:

| Item original | Novo status |
|---|---|
| Roles `MEMBER` e `ADMIN` (com permissions configuráveis por user) | **Mantidos no schema, reservados pra v2.** Zero uso no MVP. |
| 4 métricas sensíveis configuráveis (`view:metrics:*`) | **Infraestrutura mantida** (já entregue nos PRs #34 e #52), zero uso prático no MVP. OWNER sempre vê tudo. Staff bypass sempre vê tudo. |
| Invite link por email + reset no primeiro login | **Removido.** Staff cria user OWNER com senha inicial e manda por WhatsApp/email manual. |
| Admin UI "Membros" (listar, convidar, editar role) | **Removido.** |
| Admin UI "Permissões por user" | **Removido.** |
| Sistema de email transacional | **Removido.** |

Permanece exatamente igual:
- Schema `Account` + `AccountMembership` (cada account terá 1 membership OWNER)
- `AccountScopedGuard` + staff bypass (crítico pra staff ver todos)
- `PermissionsGuard` (infraestrutura, não gera rejeições no MVP)
- Isolation absoluta (cliente A nunca vê B)
- Impersonate pra staff ("entrar como X")

**Timeline atualizada: 3-5 semanas** (antes 4-8). Ganho vem da Fase 3 enxuta.

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
}
```

**Staff Safira NÃO é MembershipRole.** Em vez disso, é uma flag global em
`User.roles: string[]` contendo `'safira_staff'`. Isso evita ter que criar
memberships pra cada staff toda vez que nasce um cliente novo. O
`AccountScopedGuard` tem lógica de **bypass**: se o user tem
`'safira_staff'` em `roles`, pode acessar qualquer `accountId` sem
precisar de `AccountMembership`. Mesmo bypass no `PermissionsGuard`
(staff tem todas as `view:*` e `manage:*`).

**User** continua existindo mas **perde a ligação direta com Clinic/Integrations/Cache** — esses passam a ser `accountId`-scoped. `User` vira "identidade de login" + `roles` globais (`user`, `safira_staff`, `system`).

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

**Matriz resumida** (detalhe completo em [fase-0-permissoes.md](multitenant/fase-0-permissoes.md)):

| Permissão | OWNER | ADMIN | MEMBER | safira_staff (flag) |
|---|---|---|---|---|
| `view:dashboard`, `view:campaigns`, `view:creatives` | ✓ | ✓ | ✓ | ✓ (bypass) |
| `view:metrics:{spend,cpa,roas,cpm}` | ✓ | ✓ | **config por user** | ✓ (bypass) |
| `view:settings` | ✓ | ✓ | ✗ | ✓ (bypass) |
| `manage:integrations`, `manage:users` | ✓ | ✗ | ✗ | ✓ (bypass) |
| `agency:*` (listar clientes, criar, impersonate) | ✗ | ✗ | ✗ | ✓ |

`AccountMembership.permissions` (JSON) permite **override por usuário**: admin dá `view:metrics:spend: true` pra um MEMBER específico que precisa ver gasto.

Hook frontend: `const { can } = usePermissions(); can('view:metrics:spend') // true/false`.
Componente: `<Can permission="view:metrics:spend">...</Can>`.

### Como permissões atualizam ao vivo

Se admin tira `view:metrics:spend` de um user logado agora, o que acontece?

**Decisão:** JWT carrega apenas `accountId` + `membershipRole` (dados estáveis). **Permissões efetivas vêm do endpoint `/auth/me`** que o frontend chama a cada load e cacheia com `staleTime: 30s` via React Query. Guard backend também re-consulta no banco em cada request (barato com índice em `account_memberships`).

Trade-off: delay de até 30s pro cliente "perder" uma permissão revogada. Aceitável — a alternativa (forçar re-login) é UX ruim pro caso comum (admin só mudando visibilidade de 1 métrica).

Pra mudança crítica (role OWNER→MEMBER, remover do account), backend invoca `user.tokensInvalidatedAt = now()` já existente — força re-login.

### User sem AccountMembership

User pode ficar "órfão" (último membership removido, todos os accounts dele arquivados). No login:
1. `/auth/me` retorna `accounts: []`
2. Frontend mostra tela "Seu acesso foi revogado. Entre em contato com quem te convidou."
3. Não redireciona pro dashboard (ia quebrar por falta de accountId)

---

## Fases de entrega

### Fase 0 — Planejamento + alinhamento (2-3 dias) ✅ PRONTO
- [x] Plano mestre escrito
- [x] 5 decisões de produto resolvidas (ver acima)
- [x] Wireframe ASCII das 12+ telas admin — [fase-0-wireframes-admin.md](multitenant/fase-0-wireframes-admin.md)
- [x] Catálogo completo de permissões — [fase-0-permissoes.md](multitenant/fase-0-permissoes.md)
- [x] Plano de migration da Vera (descoberta dinâmica do user, sem hardcoded) — [fase-0-migration-vera.md](multitenant/fase-0-migration-vera.md)
- [x] Ticket detalhado da Fase 1 + decisões técnicas travadas — [fase-1-ticket-backend.md](multitenant/fase-1-ticket-backend.md)
- [ ] Aprovação final no PR #50 (único pendente)

**Saída:** 4 docs aprovados + ticket da Fase 1 pronto pro Bruno disparar.

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

### Fase 3 — Admin UI enxuta (2-3 dias)
Novas telas em `src/app/(admin)/`. Escopo reduzido pós-simplificação do CEO — sem gestão de membros/permissões, já que cada account tem 1 OWNER só:

- [ ] `/admin/clientes` — lista paginada de accounts, busca, status, última atividade
- [ ] `/admin/clientes/novo` — formulário de criação em **uma tela só**:
  - Nome, slug, tipo de nicho, features Meta/Google
  - **+ Email e senha inicial do OWNER** (criado junto no mesmo POST)
  - Staff copia a senha e manda pro cliente por WhatsApp
- [ ] `/admin/clientes/[slug]` — detalhes (aba única):
  - Status + toggle ACTIVE/SUSPENDED/ARCHIVED
  - Tipo de nicho, features Meta/Google
  - Botão "Entrar como" (dispara impersonate)
  - Botão "Resetar senha do OWNER" (gera nova senha, staff copia e manda)
  - Info da integração Meta/Google (se conectadas) + botões delegados
  - Atividade recente (últimos logins, ações do OWNER — MVP simples)

**Gate:** toda rota em `(admin)` exige flag `safira_staff` em `User.roles`. `AgencyStaffGuard` no layout.

**Dono:** Leticia (frontend) + Rafa (endpoints novos: `POST /admin/accounts`, `POST /admin/accounts/:id/reset-owner-password`, `POST /auth/impersonate/:accountId`).

### Fase 4 — Permission enforcement ponta-a-ponta ✅ ENTREGUE (PRs #34, #37, #51, #52)
- [x] Backend: `PermissionsGuard` com decorator `@RequirePermission(...)` — [PR #34](https://github.com/guivandrade/safira-vivera-backend/pull/34)
- [x] Backend: controllers de dados anotados — [PR #37](https://github.com/guivandrade/safira-vivera-backend/pull/37)
- [x] Frontend: hook `useCan(permission)` — [PR #51](https://github.com/guivandrade/safira-vivera-frontend/pull/51)
- [x] Frontend: `<Can permission="...">` — idem
- [x] KpiCards escondem métricas sensíveis — [PR #52](https://github.com/guivandrade/safira-vivera-frontend/pull/52)
- [x] Sidebar esconde itens sem permissão — [PR #51](https://github.com/guivandrade/safira-vivera-frontend/pull/51)

**Observação pós-simplificação:** essa camada está completa, mas zero rejeições acontecem na prática — OWNER sempre vê tudo por default, staff sempre vê via bypass, não existe MEMBER. Infraestrutura fica pronta se um dia o escopo voltar a incluir members.

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

## Timeline atualizada (pós-simplificação)

| Dia | Entregas |
|---|---|
| **1 (23/04)** | ✅ Fase 0 docs · ✅ Fase 1 PRs #31-#37 + #51 + #52 (schema, guards, permissions, OAuth accountId, controllers gated, frontend AuthProvider+Can) |
| 2 | PR 1.3.c.2 — services propagam accountId (staff vê dados reais) |
| 3 | PR 1.5 — E2E isolation suite + STRICT_TENANT_SCOPE em dev/CI |
| 4-5 | Fase 3 admin UI enxuta (lista + criar + detalhes + impersonate) |
| 6 | Fase 5 templates por nicho (LOCAL/INFOPRODUCT/ECOMMERCE) |
| 7 | Fase 6 QA + deploy produção + piloto |

**Cenário otimista:** **1 semana** (trabalho focado, decisões rápidas).
**Cenário realista:** **2 semanas** (bugs inesperados, ajuste de UX, primeiros clientes reais).
**Cenário com whitelabel + billing:** +2-3 semanas (v2).

**Redução vs plano original: ~50%**, principalmente por remoção de invite flow, member management UI, email transacional e permission-editing UI.

---

## O que NÃO entra no MVP

Ficam pra v2 explicitamente:
- **Múltiplos users por account** — cliente tem só 1 acesso (OWNER) no MVP
- **Convite de funcionários** — sem invite flow, sem email transacional
- **Editar permissões por user** — não precisa porque não existem MEMBERs
- **Whitelabel** (cor, logo, domínio custom por cliente)
- **Billing/Assinatura** (Stripe/Asaas, controle de mensalidade)
- **Audit log detalhado** (quem fez o quê quando — só log básico no MVP)
- **Export automático** (relatório mensal PDF enviado por email)
- **Alertas proativos** (continua no backlog do audit 18/04)
- **SSO / Google Login** (só email/senha no MVP)
- **Custom roles** além de OWNER (ADMIN/MEMBER existem no enum mas sem uso)

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

## Próximo passo (pós-simplificação)

**Crítico pra staff ver dados do cliente:**

1. **PR 1.3.c.2** — migrar services (Campaigns/Creatives/Keywords/Geography/Instagram + providers) pra propagar `accountId`. Services chamam `GoogleAdsClient.searchStreamForAccount(gaql, accountId)` em vez de `searchStream(gaql, userId)`. Cache passa `{ userId, accountId }`. Sem isso, staff autentica mas não vê dados do cliente (busca credential do próprio staff que não existe). ~10 arquivos.

2. **PR 1.5** — suite E2E de isolation (cliente A ≠ cliente B) + subir Prisma middleware pra `strict` em dev/CI.

**Depois, Fase 3 admin UI enxuta:**

3. `/admin/clientes` listar + criar (cliente novo com senha inicial) + detalhes + impersonate.

**Email da Vera** é descoberto dinamicamente no primeiro passo da migration (query + `\gset`). Zero hardcoded.

**Ordem de execução da Fase 1** (paralelizável parcial):
- PR 1.1: schema Prisma + migration (Andre + Bruno)
- PR 1.2: `@CurrentAccount()` + `AccountScopedGuard` com staff bypass (Bruno + Sofia review)
- PR 1.3: refactor services — auditoria de 100% dos queries adicionando `accountId` filter (Bruno)
- PR 1.4: `PermissionsGuard` + `@RequirePermission` + `/auth/me` expandido (Bruno)
- PR 1.5: E2E suite de isolation (Carla)

**Paralelo no frontend:** Fase 2 (desacoplamento Meta/Google) — Leticia pode começar assim que 1.1 estiver mergeado.
