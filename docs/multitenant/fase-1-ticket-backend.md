# Fase 1 — Ticket Backend: Multi-tenant Foundation

**Destinatário:** Bruno (Backend) + Andre (migrations) + Sofia (review segurança)
**Pré-requisito:** PR #50 (docs) aprovado e mergeado
**Duração estimada:** 1 a 1,5 semana (5 PRs pequenos encadeados)

---

## Status de execução (2026-04-23)

| PR | Escopo original | Status |
|---|---|---|
| 1.1 | Schema + migration + seed | ✅ [backend #31](https://github.com/guivandrade/safira-vivera-backend/pull/31) |
| 1.2 | `@CurrentAccount` + `AccountScopedGuard` + staff bypass | ✅ [backend #32](https://github.com/guivandrade/safira-vivera-backend/pull/32) |
| 1.3 (quebrado) | Refactor services tenant-scope | 🟡 Em andamento: **1.3.a** ([#33](https://github.com/guivandrade/safira-vivera-backend/pull/33) Clinic+Preferences+middleware) + **1.3.b.1** ([#35](https://github.com/guivandrade/safira-vivera-backend/pull/35) Cache) + **1.3.b.2** ([#36](https://github.com/guivandrade/safira-vivera-backend/pull/36) Google Ads OAuth) + **1.3.c.1** ([#37](https://github.com/guivandrade/safira-vivera-backend/pull/37) Controllers com guards). **Falta 1.3.c.2** (services propagam accountId). |
| 1.4 | `PermissionsGuard` + `/auth/me` + `/auth/switch-account` | ✅ [backend #34](https://github.com/guivandrade/safira-vivera-backend/pull/34) |
| 1.5 | E2E isolation + STRICT | ⬜ Pendente |

**Frontend complementar:** [#51 AuthProvider+Can+Sidebar](https://github.com/guivandrade/safira-vivera-frontend/pull/51) + [#52 KpiCards gated](https://github.com/guivandrade/safira-vivera-frontend/pull/52) — ambos mergeados.

**Pendências críticas:**
1. **PR 1.3.c.2** — services migram `userId` → `accountId` pra staff ver dados reais
2. **PR 1.5** — suite E2E de isolation + upar Prisma middleware pra `strict`

---

## Contexto

Leia primeiro (nessa ordem):
1. [plano-multitenant-2026-04-23.md](../plano-multitenant-2026-04-23.md) — decisões arquiteturais
2. [fase-0-permissoes.md](./fase-0-permissoes.md) — catálogo + modelo de bypass staff
3. [fase-0-migration-vera.md](./fase-0-migration-vera.md) — SQL passo-a-passo da Vera

Resumo das decisões:
- 3 roles de membership: `OWNER`, `ADMIN`, `MEMBER`
- Staff Safira NÃO é membership — é flag `safira_staff` em `User.roles`
- Guard faz bypass pra staff em `AccountScopedGuard` e `PermissionsGuard`
- Isolation absoluta: cliente A nunca vê B (100% dos queries filtrados por `accountId`)
- 4 métricas sensíveis configuráveis por user: `spend`, `cpa`, `roas`, `cpm`

---

## Estado atual do backend (pre-flight já feito pelo Diego)

- **Já existe:** `RolesGuard` em `src/common/guards/roles.guard.ts`, `@Roles()` em `src/common/decorators/roles.decorator.ts`, uso em endpoints admin (metrics, users, campaigns).
- **Já existe:** `JwtStrategy` em `src/modules/auth/strategies/jwt.strategy.ts` com keyring + blacklist.
- **Já existe:** módulos Meta/Google separados em `src/modules/integrations/{meta-ads,google-ads}/`.
- **Não existe:** conceito de Account/Tenant. Tudo é `userId`-scoped.
- **Não existe:** `@CurrentUser()` decorator (procurar em `src/common/decorators/` antes de criar — se já existe, reusar).

---

## Plano de PRs

### PR 1.1 · `feat(db): schema multi-tenant + migration Vera`

**Dono:** Andre (migration) + Bruno (Prisma schema)
**Duração:** 2 dias

**Escopo:**

1. Adicionar no `prisma/schema.prisma`:
   ```prisma
   enum NicheType { LOCAL_BUSINESS INFOPRODUCT ECOMMERCE }
   enum AccountStatus { ACTIVE SUSPENDED ARCHIVED }
   enum MembershipRole { OWNER ADMIN MEMBER }

   model Account {
     id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
     name         String
     slug         String   @unique
     nicheType    NicheType @map("niche_type")
     hasMeta      Boolean  @default(false) @map("has_meta")
     hasGoogle    Boolean  @default(false) @map("has_google")
     createdBy    String   @db.Uuid @map("created_by")
     logoUrl      String?  @map("logo_url")
     status       AccountStatus @default(ACTIVE)

     memberships  AccountMembership[]
     clinics      Clinic[]
     integrations IntegrationCredential[]
     caches       IntegrationCache[]
     preferences  UserPreferences[]

     created_at   DateTime @default(now()) @map("created_at")
     updated_at   DateTime @updatedAt @map("updated_at")
     deleted_at   DateTime? @map("deleted_at")

     @@index([slug])
     @@index([deleted_at])
     @@map("accounts")
   }

   model AccountMembership {
     id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
     accountId   String   @db.Uuid @map("account_id")
     account     Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
     userId      String   @db.Uuid @map("user_id")
     user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
     role        MembershipRole
     permissions Json     @default("{}")

     created_at  DateTime @default(now()) @map("created_at")
     updated_at  DateTime @updatedAt @map("updated_at")

     @@unique([accountId, userId])
     @@index([userId])
     @@map("account_memberships")
   }
   ```

2. Adicionar `accountId` em `Clinic`, `IntegrationCredential`, `IntegrationCache`, `UserPreferences`. **Nullable na migration inicial**, NOT NULL depois do backfill.

3. `User` ganha relação `memberships AccountMembership[]`.

4. Prisma migration (`npx prisma migrate dev --name multi_tenant_foundation`). Revisar o SQL gerado — deve bater em espírito com [fase-0-migration-vera.md](./fase-0-migration-vera.md).

5. **Dev seed** (`prisma/seed.ts`): criar account `vivera-dev` + user admin seed com `roles: ['user', 'safira_staff']` + membership OWNER do admin.

6. **Migration de produção não roda automático no deploy** — roda manual na janela conforme [fase-0-migration-vera.md](./fase-0-migration-vera.md). `prisma migrate deploy` fica gated por flag de env em produção (`SAFE_MIGRATE_ALLOWED=true`).

**Critério de done:**
- [ ] Migration roda verde em dev
- [ ] Seed cria account + user admin
- [ ] `npx prisma studio` mostra tabelas novas
- [ ] Código compila (sem ajuste nos services ainda — isso vai no 1.3)

---

### PR 1.2 · `feat(auth): @CurrentAccount + AccountScopedGuard + staff bypass`

**Dono:** Bruno + Sofia (review)
**Duração:** 1 dia

**Escopo:**

1. `src/common/decorators/current-account.decorator.ts` — extrai `account` do request:
   ```ts
   export const CurrentAccount = createParamDecorator(
     (_data: unknown, ctx: ExecutionContext): AccountContext => {
       const request = ctx.switchToHttp().getRequest();
       if (!request.account) throw new UnauthorizedException('No account in context');
       return request.account;
     },
   );
   ```

2. `src/common/guards/account-scoped.guard.ts`:
   ```ts
   @Injectable()
   export class AccountScopedGuard implements CanActivate {
     constructor(private prisma: PrismaService) {}

     async canActivate(ctx: ExecutionContext): Promise<boolean> {
       const req = ctx.switchToHttp().getRequest();
       const user = req.user;
       if (!user) throw new UnauthorizedException();

       // Staff bypass: flag global vence membership
       if (user.roles?.includes('safira_staff')) {
         // Staff ainda precisa de accountId explícito pra saber contexto de query
         const accountId = req.headers['x-account-id'] as string
           ?? user.currentAccountId;
         if (!accountId) throw new UnauthorizedException('Staff precisa selecionar account');
         const account = await this.prisma.account.findUnique({
           where: { id: accountId, deleted_at: null },
         });
         if (!account) throw new NotFoundException('Account não encontrado');
         req.account = { id: account.id, role: null, isStaff: true, account };
         return true;
       }

       // User comum: precisa de membership ativo
       const accountId = user.currentAccountId;
       if (!accountId) throw new UnauthorizedException('User sem account ativo');

       const membership = await this.prisma.accountMembership.findUnique({
         where: { accountId_userId: { accountId, userId: user.sub } },
         include: { account: true },
       });
       if (!membership) throw new ForbiddenException('Sem acesso a este account');
       if (membership.account.status !== 'ACTIVE') throw new ForbiddenException('Account inativo');

       req.account = {
         id: accountId,
         role: membership.role,
         permissions: membership.permissions,
         isStaff: false,
         account: membership.account,
       };
       return true;
     }
   }
   ```

3. Extender JWT payload. Em `JwtStrategy.validate` adicionar `currentAccountId` ao objeto retornado (vem do claim `account.id`). Login emite JWT com o account do primeiro membership do user (ou nenhum se for staff sem account selecionado).

4. Testes unitários do guard cobrindo:
   - User normal com membership válido → `req.account` populado
   - User normal sem membership → 403
   - User staff sem header/claim → 401
   - User staff com accountId válido → bypass, `req.account.isStaff = true`
   - Account SUSPENDED → 403

**Critério de done:**
- [ ] Guard testado unitariamente (coverage >90%)
- [ ] Sofia aprovou a lógica de bypass
- [ ] Compila sem ajustes em controllers (ainda)

---

### PR 1.3 · `refactor: tenant-scope em todos os services`

**Dono:** Bruno
**Duração:** 2-3 dias (é o PR grande)

**Escopo:**

Auditar **todos** os services e repositories. Em cada query que envolve `Clinic`, `IntegrationCredential`, `IntegrationCache`, `UserPreferences`, adicionar filtro por `accountId`.

**Método sistemático:**

```bash
# Lista candidatos
grep -rn "prisma\.\(clinic\|integrationCredential\|integrationCache\|userPreferences\)" src/ --include="*.ts"
```

Pra cada hit, transformar:
```ts
// Antes
this.prisma.clinic.findMany({ where: { ownerId: userId } })

// Depois
this.prisma.clinic.findMany({ where: { accountId } })
```

`accountId` vem do `@CurrentAccount()` injetado no controller e passado pro service.

**Defesa em profundidade:** adicionar Prisma middleware (`src/common/prisma/tenant-scope.middleware.ts`) que **rejeita** queries nas tabelas scoped sem `accountId` no where:

```ts
prisma.$use(async (params, next) => {
  const SCOPED = ['Clinic', 'IntegrationCredential', 'IntegrationCache', 'UserPreferences'];
  if (SCOPED.includes(params.model ?? '')) {
    const where = (params.args as any)?.where;
    if (!where?.accountId && !where?.AND?.some((c: any) => c.accountId)) {
      throw new Error(`Query em ${params.model} sem accountId filter — tenant-scope violado`);
    }
  }
  return next(params);
});
```

Hab(i)litado via env `STRICT_TENANT_SCOPE=true` em dev/staging. Em prod, só **loga warning** (pra não derrubar produção se algum edge case passar). Sofia decide quando ligar strict em prod.

**Crítico:** Services que hoje usam `userId` (vindo do JWT) **perdem essa semântica**. Antes da refatoração, o flow era:
```
req.user.sub → userId → filter clinic por ownerId = userId
```

Depois:
```
req.account.id → accountId → filter clinic por accountId
```

Isso muda relacionamento: clinic agora pertence a Account, não a User. `owner_id` vira **legacy**, só pra preservar compatibilidade. Deixa a coluna por enquanto, droppa em PR futuro depois de confirmar que ninguém usa.

**Critério de done:**
- [ ] `grep "ownerId" src/ --include="*.ts"` — cada hit tem `accountId` equivalente ou é justificado (ex: audit log)
- [ ] Middleware ativo em dev
- [ ] Testes unitários existentes continuam verdes
- [ ] Novos testes: isolation simples (user A queria dado de B → não retorna)

---

### PR 1.4 · `feat(auth): PermissionsGuard + @RequirePermission + /auth/me expandido`

**Dono:** Bruno + Sofia (review)
**Duração:** 1-1,5 dia

**Escopo:**

1. `src/common/guards/permissions.guard.ts`:
   ```ts
   @Injectable()
   export class PermissionsGuard implements CanActivate {
     constructor(private reflector: Reflector) {}

     canActivate(ctx: ExecutionContext): boolean {
       const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
         ctx.getHandler(), ctx.getClass(),
       ]);
       if (!required?.length) return true;

       const req = ctx.switchToHttp().getRequest();
       const account = req.account;  // populado pelo AccountScopedGuard
       if (!account) throw new UnauthorizedException();

       // Staff bypass
       if (account.isStaff) return true;

       // Computa permissões efetivas
       const effective = computePermissions(account.role, account.permissions);
       for (const perm of required) {
         if (!effective[perm]) throw new ForbiddenException(`Missing permission: ${perm}`);
       }
       return true;
     }
   }
   ```

2. `src/common/decorators/require-permission.decorator.ts`:
   ```ts
   export const PERMISSIONS_KEY = 'permissions';
   export const RequirePermission = (...perms: string[]) => SetMetadata(PERMISSIONS_KEY, perms);
   ```

3. `src/modules/auth/permissions.ts` — função `computePermissions` + constantes `ROLE_DEFAULTS` + `ALL_PERMISSIONS`. Bater 1:1 com [fase-0-permissoes.md](./fase-0-permissoes.md).

4. Aplicar em controllers sensíveis. Exemplo:
   ```ts
   @UseGuards(JwtAuthGuard, AccountScopedGuard, PermissionsGuard)
   @RequirePermission('view:campaigns')
   @Get('summary')
   getSummary(@CurrentAccount() account: AccountContext) { ... }
   ```

   Mínimo que precisa ser anotado neste PR (o resto vai no 1.5 ou em PRs da Fase 3):
   - `/campaigns/*` → `view:campaigns` (+ `view:metrics:spend` nos endpoints que devolvem spend)
   - `/creatives/*` → `view:creatives`
   - `/keywords/*` → `view:keywords`
   - `/geography/*` → `view:geography`
   - `/settings/clinic` → `view:settings` (GET) + `manage:account` (PUT)
   - `/integrations/google-ads/*` → `manage:integrations` (mutations)

5. Expandir `GET /auth/me`:
   ```json
   {
     "user": { "id", "email", "name", "isSafiraStaff": bool },
     "accounts": [
       { "id", "slug", "name", "role", "permissions": {...effective...}, "hasMeta", "hasGoogle", "nicheType" }
     ],
     "currentAccount": { ... same shape ... }
   }
   ```
   Frontend usa `accounts` pra listar no seletor e `currentAccount.permissions` pra checks `can(...)`.

6. Endpoint `POST /auth/switch-account`:
   - Valida que user tem membership no `accountId` (ou é staff)
   - Re-emite JWT com `account.id = newAccountId` no claim
   - Retorna `{ access_token, refresh_token, currentAccount }`

**Critério de done:**
- [ ] `computePermissions` testada com matriz do catálogo (1 teste por linha da matriz)
- [ ] Testes de PermissionsGuard cobrindo staff bypass, MEMBER com override, ADMIN sem `manage:integrations`
- [ ] `/auth/me` retorna shape novo
- [ ] `/auth/switch-account` testado (incluindo 403 quando user tenta account alheio)

---

### PR 1.5 · `test(e2e): suite de isolation multi-tenant`

**Dono:** Carla (QA)
**Duração:** 1 dia

**Escopo:**

Suite dedicada em `test/e2e/tenant-isolation.e2e-spec.ts`. Cenários:

1. **Setup:** cria `accountA` e `accountB`. User `alice` é OWNER de A. User `bob` é OWNER de B. User `diego` tem flag `safira_staff`.

2. **Teste 1:** Alice chama `GET /campaigns/summary` → retorna dados de A
3. **Teste 2:** Alice chama `GET /campaigns/summary` com header `x-account-id: <accountB.id>` → 403 (não é dela, não é staff)
4. **Teste 3:** Bob chama `GET /clinics` → retorna só clinics de B, zero vazamento de A
5. **Teste 4:** Diego chama `GET /campaigns/summary` com `x-account-id: <accountA.id>` → 200 com dados de A
6. **Teste 5:** Diego chama `POST /auth/switch-account` com accountB → JWT novo retorna, próximo request acessa B
7. **Teste 6:** User removido do account (membership deletado) com JWT ainda válido → próximo request retorna 403
8. **Teste 7:** Permissão revogada via override (`view:metrics:spend: false` pra um MEMBER) → endpoint retorna 403 sem esperar novo login (guard re-consulta banco)
9. **Teste 8:** Account SUSPENDED → todos os endpoints scoped retornam 403 pra users não-staff
10. **Teste 9:** Orphan user (sem memberships) → `/auth/me` retorna `accounts: []`, todos os outros endpoints retornam 403

**Critério de done:**
- [ ] 9/9 testes passando
- [ ] Roda em CI como job `e2e-isolation` (separado do `e2e` geral pra destaque)
- [ ] Falha ruidosamente se algum isolation quebrar

---

## Ordem de merge e paralelização

```
1.1 (schema + migration)  ──┬── 1.2 (AccountScopedGuard)  ──┐
                            │                               │
                            │   1.3 (tenant-scope services)─┤── 1.4 (PermissionsGuard)  ── 1.5 (E2E isolation)
                            │                               │
Frontend Fase 2 começa ─────┘                               │
(desacoplar Meta/Google)                                    │
                                                            │
                              Frontend Fase 4 começa ──────┘
                              (hook useCan + componente Can)
```

**1.1** bloqueia tudo. **1.2 e 1.3** podem sobrepor parcialmente (1.3 usa o decorator do 1.2). **1.4** depende de 1.2 estar mergeado. **1.5** depende de 1.3 e 1.4.

---

## Checklist geral da Fase 1

- [ ] PR 1.1 mergeado (schema + migration dev/staging rodando)
- [ ] PR 1.2 mergeado (guards + decorators)
- [ ] PR 1.3 mergeado (services refatorados, middleware strict em dev)
- [ ] PR 1.4 mergeado (permissions funcional ponta-a-ponta)
- [ ] PR 1.5 mergeado (suite E2E isolation no CI)
- [ ] Sofia deu OK final na implementação de segurança
- [ ] Staging rodando com multi-tenant por 2-3 dias sem regressão
- [ ] Janela de migration prod agendada com Vera

---

## O que fica pra Fase 2+

- Endpoints admin (`POST /admin/accounts`, `GET /admin/accounts`, etc.) — Fase 3
- Invite flow (`POST /accounts/:id/invites`, tabela `invites`, email) — Fase 3
- Impersonate (`POST /auth/impersonate/:accountId`) — Fase 3
- Audit log básico — Fase 3 ou 4
- Frontend admin UI — Fase 3
- Templates ICP — Fase 5

---

## Decisões do CEO (2026-04-23) — trava pra execução

1. **Email da Vera:** não é hardcoded. O operador descobre dinamicamente via query + `\gset` na hora da migration — ver [fase-0-migration-vera.md § Passo pré-migration](./fase-0-migration-vera.md#passo-pré-migration-descobrir-user_id-da-vera). Zero TBD restante.

2. **`STRICT_TENANT_SCOPE` em produção:**
   - Dev/staging: **strict** (middleware derruba a request se faltar `accountId`)
   - Produção: **warning** no deploy inicial. Middleware loga via `monitoring.captureMessage(level: 'warning')` mas deixa passar. Revisamos os warnings do primeiro mês antes de virar strict em prod.

3. **Contexto de account na request:**
   - **User comum** (1 account só): `accountId` vem do **JWT claim** `account.id`. Emitido no login.
   - **Staff** (`safira_staff`): pode passar header `x-account-id` pra indicar qual cliente está acessando. Trade-off documentado: headers em todas as abas = zero re-emissão de JWT ao trocar de cliente. JWT-based switch faria staff perder múltiplas abas, back button e teria overhead por troca.
   - Guard faz fallback: prioriza header se presente + user for staff; senão, cai no claim do JWT.
