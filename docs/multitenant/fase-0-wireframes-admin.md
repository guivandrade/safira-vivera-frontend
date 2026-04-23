# Fase 0 — Wireframes das telas admin

**Referência:** [plano-multitenant-2026-04-23.md](../plano-multitenant-2026-04-23.md)

Wireframes em ASCII art pra validar estrutura antes de codar. Visual final segue design system atual (tokens `bg-surface`, `text-ink`, `accent`, etc.).

---

## 1. `/admin/clientes` — Lista de clientes

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Safira logo]  Clientes                            [Guilherme ▼]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Clientes ativos                                 [ + Novo cliente ] │
│  ─────────────                                                      │
│                                                                     │
│  [ 🔍 Buscar por nome ou slug ]      Filtro: [Todos ▼] [Status ▼]  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Nome              Nicho          Provedores  Últ atividade     │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ Clínica Vívera    Local          Meta,Google  agora             │ │
│  │ Loja Marina       Ecommerce      Meta         2h atrás          │ │
│  │ Curso Fabio       Infoproduto    Meta,Google  ontem             │ │
│  │ ...                                                             │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Mostrando 3 de 3         < Anterior  [1]  Próxima >               │
└─────────────────────────────────────────────────────────────────────┘
```

**Acesso:** só `AGENCY_STAFF`. Se qualquer outro user tentar abrir `/admin/*`, redireciona pra `/dashboard`.

---

## 2. `/admin/clientes/novo` — Criar cliente

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Voltar                                                            │
│                                                                     │
│  Novo cliente                                                       │
│                                                                     │
│  Nome do negócio                                                    │
│  [ Clínica Vívera____________________________ ]                    │
│                                                                     │
│  Slug (URL interna)            auto-gerado, editável                │
│  [ vivera______________________ ]   → safira-vivera.app/vivera     │
│                                                                     │
│  Tipo de negócio                                                    │
│  ( ● ) Negócio local (clínica, loja física, consultório)           │
│  ( ○ ) Infoproduto (curso, mentoria, assinatura digital)           │
│  ( ○ ) Ecommerce (loja online, vendas diretas)                     │
│                                                                     │
│  Provedores de mídia habilitados                                   │
│  [ ✓ ] Meta Ads (Facebook + Instagram)                             │
│  [   ] Google Ads                                                  │
│                                                                     │
│  Primeiro usuário (dono do negócio)                                │
│  Nome                                                               │
│  [ Maria Silva__________________________ ]                          │
│  Email (onde vai receber o invite)                                  │
│  [ maria@vivera.com.br__________________ ]                          │
│                                                                     │
│                              [ Cancelar ]  [ Criar e enviar invite ]│
└─────────────────────────────────────────────────────────────────────┘
```

**Ao submeter:**
1. Valida slug único
2. Cria Account + primeira Membership OWNER pro email informado
3. Cria user placeholder (se email não existe ainda) com `password_hash = null`
4. Envia email com token de invite válido por 7 dias
5. Email: "Maria, Guilherme criou um acesso pra você no Relatórios Safira. [Definir senha e entrar]"
6. Redireciona pra `/admin/clientes/[slug]`

---

## 3. `/admin/clientes/[slug]` — Detalhes

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Clientes   /   Clínica Vívera                       [ Entrar como]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────┐  Clínica Vívera                       [ Editar ]          │
│  │ logo │  Negócio local · Slug: vivera                             │
│  └──────┘  Ativo · Criado em 15/03/2026                             │
│                                                                     │
│  [ Geral ] [ Membros ] [ Integrações ] [ Permissões ] [ Atividade ] │
│  ───────                                                            │
│                                                                     │
│  Status do negócio                                                  │
│  ◉ Ativo     ○ Suspenso     ○ Arquivado                             │
│                                                                     │
│  Tipo de negócio                                                    │
│  Local [ Trocar ]                                                   │
│                                                                     │
│  Provedores                                                         │
│  [ ✓ ] Meta Ads         [ ] Google Ads                              │
│                                                                     │
│  [ Salvar alterações ]                                              │
└─────────────────────────────────────────────────────────────────────┘
```

**Botão "Entrar como"** no canto: dispara impersonate (POST /auth/impersonate/:accountId). JWT novo é emitido com `role: AGENCY_STAFF` e `account.id` do cliente. Banner amarelo no topo do dashboard: *"Você está visualizando como Clínica Vívera. [Sair]"*. Toda ação nesse modo vai pro audit log.

---

## 4. `/admin/clientes/[slug]` aba Membros

```
┌─────────────────────────────────────────────────────────────────────┐
│  [ Geral ] [ Membros ] [ Integrações ] [ Permissões ] [ Atividade ] │
│            ────────                                                 │
│                                                                     │
│  Membros da conta                              [ + Convidar membro ]│
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Nome           Email              Role        Últ login        │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ Maria Silva    maria@...          OWNER       agora       [⋮] │ │
│  │ João Func      joao@...           MEMBER      3d atrás    [⋮] │ │
│  │ Pedro (convite pendente)  pedro@... — expira em 5d       [⋮] │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  [⋮] abre: Editar role, Editar permissões, Remover, Reenviar invite │
└─────────────────────────────────────────────────────────────────────┘
```

Modal "Convidar membro":

```
┌─────────────────────────────────────┐
│  Convidar novo membro               │
│                                     │
│  Email                              │
│  [ ____________________ ]           │
│                                     │
│  Role                               │
│  ( ○ ) OWNER                        │
│  ( ● ) ADMIN                        │
│  ( ○ ) MEMBER                       │
│                                     │
│  Permissões especiais (se MEMBER)   │
│  [ ] Pode ver gasto (spend)         │
│  [ ] Pode ver CPA                   │
│  [ ] Pode ver ROAS                  │
│  [ ] Pode ver CPM                   │
│                                     │
│       [ Cancelar ]  [ Enviar ]      │
└─────────────────────────────────────┘
```

---

## 5. `/admin/clientes/[slug]` aba Integrações

```
┌─────────────────────────────────────────────────────────────────────┐
│  [ Geral ] [ Membros ] [ Integrações ] [ Permissões ] [ Atividade ] │
│                        ──────────────                               │
│                                                                     │
│  Meta Ads                                                           │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  ● Conectado · Token do sistema · válido                       │ │
│  │  Conta: ID 123456789 · Nome "Clínica Vívera Ads"               │ │
│  │  Campanhas ativas: 4                                           │ │
│  │                                                   [ Desconectar]│ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Google Ads                                                         │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  ○ Não conectado                                               │ │
│  │  Pra conectar, clique em "Conectar" e faça login como cliente  │ │
│  │                                                    [ Conectar ]│ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Conectar** dispara OAuth com o fluxo já existente, mas associa o token ao `accountId` atual (não ao `userId` do staff Safira).

---

## 6. `/admin/clientes/[slug]` aba Permissões

```
┌─────────────────────────────────────────────────────────────────────┐
│  [ Geral ] [ Membros ] [ Integrações ] [ Permissões ] [ Atividade ] │
│                                        ──────────────               │
│                                                                     │
│  Permissões por membro                                              │
│                                                                     │
│  Maria Silva (OWNER) — tudo liberado por padrão                     │
│                                                                     │
│  João Func (MEMBER)  [ Editar ]                                     │
│    ✓ view:dashboard  ✓ view:campaigns  ✓ view:creatives             │
│    ✗ view:metrics:spend  ✗ view:metrics:cpa  ✗ view:metrics:roas    │
│    ✗ view:metrics:cpm  ✗ view:settings                              │
│                                                                     │
│  Pedro (ADMIN)       [ Editar ]                                     │
│    (defaults do ADMIN)                                              │
└─────────────────────────────────────────────────────────────────────┘
```

Modal "Editar permissões": toggle por permissão. Só mostra as que fazem sentido pro role do usuário.

---

## 7. `/admin/clientes/[slug]` aba Atividade

```
┌─────────────────────────────────────────────────────────────────────┐
│  Atividade recente                                                  │
│                                                                     │
│  • 2 min atrás · Maria Silva · Login                                │
│  • 15 min atrás · Guilherme (staff) · Entrou como Vívera            │
│  • 2h atrás · João Func · Visualizou /campanhas                     │
│  • Ontem · Maria Silva · Conectou Google Ads                        │
│  • Ontem · Guilherme (staff) · Convidou pedro@vivera.com.br         │
│                                                                     │
│  [ Ver todos ]                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Seletor de Account no TopBar (quando user tem múltiplos)

```
┌──────────────────────────────────────────────────────┐
│  [ ≡ ]   Clínica Vívera ▼   [ Filter bar ]    [🔔][👤]│
│           ↓ (clique abre)                             │
│           ┌─────────────────────────────┐            │
│           │ Clínica Vívera  ✓           │            │
│           │ Loja Marina                 │            │
│           │ Curso Fabio                 │            │
│           │ ─────────────────           │            │
│           │ + Todos os clientes (admin) │            │
│           └─────────────────────────────┘            │
└──────────────────────────────────────────────────────┘
```

Pra user comum que tem 1 account só, não mostra seletor (só o nome). Pra `AGENCY_STAFF`, sempre mostra — + opção "Todos os clientes" que leva pra `/admin/clientes`.

---

## 9. Banner de impersonation

```
┌─────────────────────────────────────────────────────────────────────┐
│ ⚠  Você está visualizando como Clínica Vívera (Maria Silva)         │
│    Todas as suas ações estão sendo registradas em audit log.        │
│                                            [ Voltar ao admin ]      │
└─────────────────────────────────────────────────────────────────────┘
```

Fixed no topo durante impersonation. Some quando staff sai do modo.

---

## 10. Dashboard por nicho — LOCAL_BUSINESS

Layout atual da Vera se mantém. Muda só a copy contextual:

- "Conversões" → "Contatos no WhatsApp" (default) / "Agendamentos"
- Mapa de bairros visível por padrão
- `/geografia` visível no sidebar
- Copy de insights fala em "pacientes/clientes" conforme config

---

## 11. Dashboard por nicho — INFOPRODUCT

```
┌─────────────────────────────────────────────────────────────────────┐
│  KPIs                                                               │
│  [ Vendas ] [ CAC ] [ Ticket médio ] [ Taxa checkout ] [ ROAS ]    │
│                                                                     │
│  Funil do produto                                                   │
│  Impressões → Cliques → Landing → Checkout → Compra                 │
│  100k        →  3k    →  900   →  180     →  45                    │
│                 3%        30%      20%      25%                     │
│                                                                     │
│  Carrinho abandonado                                                │
│  32 carrinhos nas últimas 24h — R$ 4.200 em potencial               │
│                                                                     │
│  Produtos/ofertas                                                   │
│  [ tabela por produto ]                                             │
└─────────────────────────────────────────────────────────────────────┘
```

**Widgets removidos do preset:** mapa de bairros, `/geografia`.
**Widgets novos:** funil do checkout (reaproveita FunnelChart), carrinho abandonado (novo).

---

## 12. Dashboard por nicho — ECOMMERCE

```
┌─────────────────────────────────────────────────────────────────────┐
│  KPIs                                                               │
│  [ Receita ] [ ROAS ] [ Pedidos ] [ Ticket médio ] [ CAC ]         │
│                                                                     │
│  Top produtos vendidos                                              │
│  1. Produto X — 145 vendas — R$ 12.300                              │
│  2. Produto Y — 89 vendas — R$ 8.900                                │
│  ...                                                                │
│                                                                     │
│  Vendas por canal                                                   │
│  [ chart Meta vs Google vs orgânico ]                               │
│                                                                     │
│  Clientes recorrentes vs novos                                      │
│  [ donut: 35% recorrente, 65% novo ]                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Componentes a criar

Novos componentes que essas telas exigem:

- `AdminClientsTable` — listagem de accounts
- `CreateClientForm` — com validação de slug único
- `ClientTabs` — tabs de detalhes
- `MemberRow` + `InviteMemberModal`
- `PermissionToggle` — check list de permissões
- `ActivityFeed` — timeline de eventos
- `AccountSwitcher` — dropdown no TopBar
- `ImpersonationBanner` — banner amarelo fixo
- `CheckoutFunnel` — funil de infoproduto (extensão do FunnelChart)
- `AbandonedCartCard` — novo widget
- `TopProductsTable` — extensão de DataTable
- `ChannelBreakdownChart` — extensão de chart

Reutilizar 80% do que já existe. O "visual Safira" do CEO fica mantido.
