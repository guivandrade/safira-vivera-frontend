# Fase 0 — Catálogo de Permissões

**Referência:** [plano-multitenant-2026-04-23.md](../plano-multitenant-2026-04-23.md)

> **Status pós-simplificação (2026-04-23 tarde):** o catálogo abaixo continua **válido no código** — toda a infraestrutura de `ROLE_DEFAULTS` + `computePermissions` + `PermissionsGuard` + `@RequirePermission` foi entregue (PRs #34 e #37). Na prática, porém, o MVP **só usa OWNER e `safira_staff` bypass**. ADMIN e MEMBER permanecem no enum e nas matrizes reservados pra v2 (quando clientes puderem ter funcionários). Zero rejeições de permissão esperadas pra users OWNER reais do MVP — OWNER tem tudo por default.

---

## Modelo: 3 roles + 1 flag global

**MembershipRole** (enum no Prisma, vincula user a account específico):

| Role | Quem é | Default access |
|---|---|---|
| `OWNER` | Dono do negócio cliente | Todas as permissões do próprio account |
| `ADMIN` | Funcionário do cliente com gestão (ex: sócio, gerente) | Tudo exceto `manage:integrations` e `manage:users` |
| `MEMBER` | Funcionário do cliente com acesso limitado | `view:*` básicos. Métricas sensíveis escondidas por default — admin pode liberar explicitamente |

**Flag global no `User.roles: string[]`:**

| Flag | Quem é | Efeito |
|---|---|---|
| `safira_staff` | Staff Safira (Guilherme, gestores de tráfego, CS) | **Bypass total.** Pode acessar qualquer account, tem todas as permissões `view:*` e `manage:*` automaticamente, + permissões `agency:*` |

**Por que staff é flag, não role de membership?** Evita criar `AccountMembership` pra todo staff Safira em todo cliente novo (combinatória cresce N×M). Bypass via flag é 1 check no Guard, zero escrita.

---

## Catálogo completo de permissões

> **Nota:** as matrizes abaixo mostram defaults **para membros de account**. User com flag `safira_staff` passa em todas as checks via bypass no guard — as colunas nas matrizes não se aplicam a ele.

### `view:*` — leitura
| Permissão | Descrição | OWNER | ADMIN | MEMBER |
|---|---|---|---|---|
| `view:dashboard` | Home do dashboard | ✓ | ✓ | ✓ |
| `view:campaigns` | Lista + detalhe de campanhas | ✓ | ✓ | ✓ |
| `view:creatives` | Galeria de criativos | ✓ | ✓ | ✓ |
| `view:keywords` | Palavras-chave (Google Ads) | ✓ | ✓ | ✓ |
| `view:geography` | Mapa de bairros (local) | ✓ | ✓ | ✓ |
| `view:funnel` | Funil de conversão | ✓ | ✓ | ✓ |
| `view:compare` | Comparação de períodos | ✓ | ✓ | ✓ |
| `view:insights` | Feed de insights automáticos | ✓ | ✓ | ✓ |
| `view:settings` | Configurações do negócio | ✓ | ✓ | ✗ |

### `view:metrics:*` — métricas sensíveis (configuráveis por user)
| Permissão | Descrição | OWNER | ADMIN | MEMBER |
|---|---|---|---|---|
| `view:metrics:spend` | Gasto em mídia (R$ investido) | ✓ | ✓ | **config** |
| `view:metrics:cpa` | Custo por conversão | ✓ | ✓ | **config** |
| `view:metrics:roas` | Retorno sobre investimento | ✓ | ✓ | **config** |
| `view:metrics:cpm` | Custo por mil impressões | ✓ | ✓ | **config** |

**"config"** = admin decide por user quando convida. Default pra MEMBER é **falso** (esconde). Override persiste em `AccountMembership.permissions`.

### `manage:*` — escrita/mutação
| Permissão | Descrição | OWNER | ADMIN | MEMBER |
|---|---|---|---|---|
| `manage:integrations` | Conectar/desconectar Meta/Google | ✓ | ✗ | ✗ |
| `manage:users` | Convidar/remover usuários do account | ✓ | ✗ | ✗ |
| `manage:account` | Editar nome, logo, slug do account | ✓ | ✓ | ✗ |

> **`manage:billing` fica reservado pra v2** — billing não está no MVP.

### `agency:*` — exclusivo Safira (só `safira_staff`)
| Permissão | Descrição |
|---|---|
| `agency:list_accounts` | Ver todos os accounts do sistema |
| `agency:create_account` | Criar novo account (cliente novo) |
| `agency:impersonate` | Entrar como um account cliente |
| `agency:view_audit` | Ver log de ações admin |

User sem flag `safira_staff` **nunca** tem essas, independente de role no membership.

---

## Computação efetiva

```ts
function computePermissions(user: User, membership: AccountMembership | null): PermissionSet {
  // 1. Staff bypass — flag global vence qualquer membership
  if (user.roles.includes('safira_staff')) return ALL_PERMISSIONS;

  // 2. Sem membership → sem permissão (user "órfão")
  if (!membership) return {};

  // 3. Default do role + override específico do user
  const defaults = ROLE_DEFAULTS[membership.role];
  const overrides = membership.permissions ?? {};
  return { ...defaults, ...overrides };
}
```

Override explícito **sempre vence** default do role. Ex: MEMBER com `view:metrics:spend: true` vê gasto.

---

## Enforcement

### Backend
```ts
@UseGuards(JwtAuthGuard, AccountScopedGuard, PermissionsGuard)
@RequirePermission('view:metrics:spend')
@Get('campaigns/summary')
async getSummary() { ... }
```

### Frontend
```tsx
// Hook
const { can } = usePermissions();
if (!can('view:metrics:spend')) return null;

// Componente
<Can permission="view:metrics:spend">
  <KpiCard label="Gasto" value={spend} />
</Can>

// Página inteira: redireciona se não pode
<RequirePermission permission="view:settings" fallback="/dashboard">
  <SettingsPage />
</RequirePermission>
```

### Sidebar
Itens do sidebar ficam escondidos quando user não tem a permissão `view:*` correspondente. Ex: `view:settings: false` → `/configuracoes` some do menu.

---

## Decisões de design

- **Permissões são strings namespaced** (`view:metrics:spend`), não objetos aninhados. Facilita grep, evita bugs de merge de objetos.
- **Override granular só quando necessário.** Maioria dos users vai cair no default do role — o JSON `permissions` fica `{}` pra eles.
- **Nunca dar permissão por feature sem role que faça sentido.** Ex: `view:metrics:spend` + role MEMBER é override válido; dar `agency:list_accounts` a um OWNER é bug.
- **Não existe "negação explícita".** Se precisar tirar permissão de alguém num role que tem default, override com `false`. Mais simples que allow/deny separados.

---

## Testes obrigatórios

- [ ] Cada permissão tem pelo menos 1 teste: `role X sem override → esperado Y`
- [ ] Cada override testado: `MEMBER com view:metrics:spend: true → vê spend`
- [ ] Isolation: `user de account A tenta query de account B → 403 mesmo com permission`
- [ ] Impersonate audit: staff Safira acessando account → registra em audit log
