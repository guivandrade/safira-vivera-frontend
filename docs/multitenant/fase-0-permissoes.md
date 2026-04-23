# Fase 0 — Catálogo de Permissões

**Referência:** [plano-multitenant-2026-04-23.md](../plano-multitenant-2026-04-23.md)

---

## Roles fixos

| Role | Quem é | Default access |
|---|---|---|
| `AGENCY_STAFF` | Staff Safira (Guilherme, gestores de tráfego, CS) | Todas as permissões em **todos** os accounts |
| `OWNER` | Dono do negócio cliente | Todas as permissões do próprio account |
| `ADMIN` | Funcionário do cliente com gestão (ex: sócio, gerente) | Tudo exceto `manage:integrations` e `manage:users` |
| `MEMBER` | Funcionário do cliente com acesso limitado | `view:*` básicos. Métricas sensíveis escondidas por default — admin pode liberar explicitamente |

---

## Catálogo completo de permissões

### `view:*` — leitura
| Permissão | Descrição | Default OWNER | Default ADMIN | Default MEMBER | Default AGENCY_STAFF |
|---|---|---|---|---|---|
| `view:dashboard` | Home do dashboard | ✓ | ✓ | ✓ | ✓ |
| `view:campaigns` | Lista + detalhe de campanhas | ✓ | ✓ | ✓ | ✓ |
| `view:creatives` | Galeria de criativos | ✓ | ✓ | ✓ | ✓ |
| `view:keywords` | Palavras-chave (Google Ads) | ✓ | ✓ | ✓ | ✓ |
| `view:geography` | Mapa de bairros (local) | ✓ | ✓ | ✓ | ✓ |
| `view:funnel` | Funil de conversão | ✓ | ✓ | ✓ | ✓ |
| `view:compare` | Comparação de períodos | ✓ | ✓ | ✓ | ✓ |
| `view:insights` | Feed de insights automáticos | ✓ | ✓ | ✓ | ✓ |
| `view:settings` | Configurações do negócio | ✓ | ✓ | ✗ | ✓ |

### `view:metrics:*` — métricas sensíveis (configuráveis por user)
| Permissão | Descrição | OWNER | ADMIN | MEMBER | AGENCY_STAFF |
|---|---|---|---|---|---|
| `view:metrics:spend` | Gasto em mídia (R$ investido) | ✓ | ✓ | **config** | ✓ |
| `view:metrics:cpa` | Custo por conversão | ✓ | ✓ | **config** | ✓ |
| `view:metrics:roas` | Retorno sobre investimento | ✓ | ✓ | **config** | ✓ |
| `view:metrics:cpm` | Custo por mil impressões | ✓ | ✓ | **config** | ✓ |

**"config"** = admin decide por user quando convida. Default pra MEMBER é **falso** (esconde). Override persiste em `AccountMembership.permissions`.

### `manage:*` — escrita/mutação
| Permissão | Descrição | OWNER | ADMIN | MEMBER | AGENCY_STAFF |
|---|---|---|---|---|---|
| `manage:integrations` | Conectar/desconectar Meta/Google | ✓ | ✗ | ✗ | ✓ |
| `manage:users` | Convidar/remover usuários do account | ✓ | ✗ | ✗ | ✓ |
| `manage:billing` | (v2) Assinatura, método de pagamento | ✓ | ✗ | ✗ | ✓ |
| `manage:account` | Editar nome, logo, slug do account | ✓ | ✓ | ✗ | ✓ |

### `agency:*` — exclusivo Safira
| Permissão | Descrição | OWNER | ADMIN | MEMBER | AGENCY_STAFF |
|---|---|---|---|---|---|
| `agency:list_accounts` | Ver todos os accounts do sistema | ✗ | ✗ | ✗ | ✓ |
| `agency:create_account` | Criar novo account (cliente novo) | ✗ | ✗ | ✗ | ✓ |
| `agency:impersonate` | Entrar como um account cliente | ✗ | ✗ | ✗ | ✓ |
| `agency:view_audit` | Ver log de ações admin | ✗ | ✗ | ✗ | ✓ |

---

## Computação efetiva

```ts
function computePermissions(membership: AccountMembership): PermissionSet {
  const defaults = ROLE_DEFAULTS[membership.role];   // matriz acima
  const overrides = membership.permissions ?? {};     // JSON persistido
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
