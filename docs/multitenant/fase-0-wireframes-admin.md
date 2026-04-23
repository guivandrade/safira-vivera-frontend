# Fase 0 — Wireframes das telas admin (escopo simplificado)

**Referência:** [plano-multitenant-2026-04-23.md](../plano-multitenant-2026-04-23.md)

> **Atualizado 2026-04-23 tarde** — CEO simplificou o modelo: cada cliente tem **1 único OWNER**, sem funcionários/membros. As seções de "Membros" e "Permissões" do plano original **foram removidas**. Esta versão reflete o MVP real.

Wireframes em ASCII pra validar estrutura. Visual final segue design system atual (`bg-surface`, `text-ink`, `accent`, etc).

---

## Fluxo geral do admin

```
/admin/clientes (lista)
    │
    ├── [+ Novo cliente] ───► /admin/clientes/novo (criar account + OWNER em 1 tela)
    │                              │
    │                              └── Sucesso ───► volta pra lista com banner de sucesso
    │
    └── [linha clica] ───► /admin/clientes/[slug] (detalhes)
                               │
                               ├── [Entrar como] ───► impersonate + redireciona pra /dashboard
                               ├── [Resetar senha] ───► gera nova senha, staff copia
                               ├── [Suspender] ───► PUT status=SUSPENDED
                               └── [Arquivar] ───► soft delete
```

Sem tela de Membros. Sem tela de Permissões. Sem invite flow.

---

## 1. `/admin/clientes` — Lista

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Safira]  Clientes                                  [Guilherme ▼]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Clientes                                       [ + Novo cliente ]  │
│                                                                     │
│  [ 🔍 Buscar por nome ou slug ]   Status: [Todos ▼]  Nicho: [Todos ▼] │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Nome             Nicho       Provedores   Status   Últ login    │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ Clínica Vívera   Local       Meta,Google  Ativo    agora       │ │
│  │ Loja Marina      Ecommerce   Meta         Ativo    2h atrás    │ │
│  │ Curso Fabio      Infoproduto Meta,Google  Pausado  3d atrás    │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Mostrando 3 de 3         < Anterior  [1]  Próxima >               │
└─────────────────────────────────────────────────────────────────────┘
```

Clique na linha → detalhes.

**Acesso:** apenas users com flag `safira_staff` em `User.roles`. Qualquer outro user redireciona pra `/dashboard`.

---

## 2. `/admin/clientes/novo` — Criar cliente (tela única)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Voltar                                                            │
│                                                                     │
│  Novo cliente                                                       │
│                                                                     │
│  ── Dados do negócio ────────────────────────────────────────────   │
│                                                                     │
│  Nome do negócio                                                    │
│  [ Clínica Maria_____________________________________ ]             │
│                                                                     │
│  Slug (URL interna)            auto-gerado, editável                │
│  [ clinica-maria_______________ ]                                   │
│                                                                     │
│  Tipo de negócio                                                    │
│  ( ● ) Negócio local (clínica, loja física, consultório)           │
│  ( ○ ) Infoproduto (curso, mentoria, assinatura digital)           │
│  ( ○ ) Ecommerce (loja online, vendas diretas)                     │
│                                                                     │
│  Provedores habilitados                                             │
│  [ ✓ ] Meta Ads       [   ] Google Ads                              │
│                                                                     │
│  ── Acesso do cliente (OWNER) ───────────────────────────────────   │
│                                                                     │
│  Nome                                                               │
│  [ Maria Silva_________________________ ]                           │
│                                                                     │
│  Email (login)                                                      │
│  [ maria@clinicamaria.com.br____________ ]                          │
│                                                                     │
│  Senha inicial                    [ Gerar automática ]              │
│  [ K9x#7mQ2pLr4wZn1_________________ ] [ copiar 📋 ]                │
│                                                                     │
│  ℹ  Mande a senha pro cliente por WhatsApp depois. Peça pra ele     │
│    trocar no primeiro login (telinha de "alterar senha" ainda       │
│    fica pra próxima iteração).                                      │
│                                                                     │
│                                [ Cancelar ]  [ Criar cliente ]      │
└─────────────────────────────────────────────────────────────────────┘
```

**Ao submeter:**

1. Valida slug único + email não existe ainda
2. `POST /admin/accounts` cria:
   - Row em `accounts` com status ACTIVE
   - Row em `users` com email + `password_hash = bcrypt(senha)` + `roles: ['user']`
   - Row em `account_memberships` com `role = OWNER`
3. Redireciona pra `/admin/clientes/[slug]` com toast "Cliente criado. Envie a senha ao OWNER."

Nada de token de invite. Nada de email transacional.

---

## 3. `/admin/clientes/[slug]` — Detalhes (aba única)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Clientes   /   Clínica Vívera                      [ Entrar como ]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────┐  Clínica Vívera                                           │
│  │ logo │  Negócio local · Slug: vivera                             │
│  └──────┘  Criado em 15/03/2026 · Último login: agora               │
│                                                                     │
│  ── Status ─────────────────────────────────────────────────────    │
│                                                                     │
│  Situação do cliente                                                │
│  ( ● ) Ativo                                                        │
│  ( ○ ) Suspenso  — bloqueia login, mantém dados                     │
│  ( ○ ) Arquivado — soft delete, não aparece mais na lista           │
│                                                                     │
│  ── Negócio ────────────────────────────────────────────────────    │
│                                                                     │
│  Nome              [ Clínica Vívera__________________ ]             │
│  Tipo              Negócio local                                    │
│  Provedores        [ ✓ ] Meta  [ ✓ ] Google                         │
│                                         [ Salvar alterações ]       │
│                                                                     │
│  ── OWNER ──────────────────────────────────────────────────────    │
│                                                                     │
│  Maria Silva · maria@clinicamaria.com.br · último login há 2h       │
│  [ Resetar senha ] ← gera nova senha, você copia e manda            │
│                                                                     │
│  ── Integrações ────────────────────────────────────────────────    │
│                                                                     │
│  Meta Ads       ● Conectado · Token sistema · sempre ativo          │
│  Google Ads     ○ Não conectado                                     │
│                                                                     │
│  [ Entrar como ] pra conectar Google Ads em nome do cliente (OAuth) │
│                                                                     │
│  ── Atividade recente ──────────────────────────────────────────    │
│                                                                     │
│  • agora · Maria Silva · Login                                      │
│  • 2h atrás · Maria Silva · Visualizou /campanhas                   │
│  • ontem · Guilherme (staff) · Entrou como Clínica Vívera           │
│  • ontem · Maria Silva · Desconectou Google Ads                     │
│                                                                     │
│                                                            [ Ver +] │
└─────────────────────────────────────────────────────────────────────┘
```

**Botão "Entrar como"** dispara `POST /auth/impersonate/:accountId`. JWT novo é emitido com `currentAccountId` = account alvo e claim `impersonatedBy = staff.id`. Banner amarelo fixo no topo do dashboard: *"Você está visualizando como Clínica Vívera. [Sair]"*. Toda ação cai no audit log com o staff real.

**Botão "Resetar senha"** gera senha aleatória de 16 chars, atualiza `password_hash` do OWNER, mostra modal com a senha pra staff copiar. Sem email automático.

---

## 4. Modal "Resetar senha"

```
┌─────────────────────────────────────────────────┐
│  Nova senha gerada                              │
│                                                 │
│  Senha:                                         │
│  [ Xh9$rK2!pLn8WqZ3___________ ] [ copiar 📋 ] │
│                                                 │
│  ⚠ Essa senha só aparece uma vez. Copie e      │
│    mande pro cliente por WhatsApp agora.        │
│                                                 │
│  A senha antiga foi invalidada. Qualquer        │
│  sessão ativa do OWNER foi derrubada.           │
│                                                 │
│                              [ Fechar ]         │
└─────────────────────────────────────────────────┘
```

Backend por trás: `POST /admin/accounts/:id/reset-owner-password`:
1. Gera senha aleatória (16 chars, alfanumérico + especial)
2. `bcrypt.hash` + `users.update({ password_hash })`
3. `authService.logoutAllSessions(ownerId)` — invalida todos os tokens existentes
4. Retorna a senha em texto claro (**única vez que ela existe em memória**)

---

## 5. Seletor no TopBar (só staff)

```
┌──────────────────────────────────────────────────────┐
│  [ ≡ ]    ▼ Vendo: Clínica Vívera      [🔔][👤]    │
│           ↓ (clique abre)                             │
│           ┌─────────────────────────────┐            │
│           │ ⚠ Modo staff                │            │
│           │ Vendo como: Clínica Vívera  │            │
│           │ ─────────────────────────   │            │
│           │ Sair desse cliente          │            │
│           │ Trocar pra outro cliente ▶  │            │
│           │ Ir pra /admin/clientes      │            │
│           └─────────────────────────────┘            │
└──────────────────────────────────────────────────────┘
```

User comum OWNER (tem 1 account só) **NÃO vê seletor** — aparece só o nome do negócio dele como info.

---

## 6. Banner de impersonação

```
┌─────────────────────────────────────────────────────────────────────┐
│ ⚠  Você está visualizando como Clínica Vívera (Maria Silva)         │
│    Todas as suas ações estão registradas em audit log.              │
│                                            [ Sair desse cliente ]   │
└─────────────────────────────────────────────────────────────────────┘
```

Fixed no topo enquanto staff está impersonando. "Sair desse cliente" volta pro `/admin/clientes`.

---

## 7. Templates de dashboard por nicho (Fase 5)

Layout igual ao dashboard atual, copy/widgets variam conforme `account.nicheType`.

### LOCAL_BUSINESS (já validado — Vívera)
- "Conversões" = mensagens WhatsApp / agendamentos
- Mapa de bairros em destaque, `/geografia` visível no sidebar
- Copy "paciente/cliente" conforme config do negócio

### INFOPRODUCT
```
KPIs: [ Vendas ] [ CAC ] [ Ticket médio ] [ Taxa checkout ] [ ROAS ]

Funil do produto
  Impressões → Cliques → Landing → Checkout → Compra
  100k       → 3k     → 900     → 180      → 45

Carrinho abandonado — 32 nas últimas 24h = R$ 4.200 potencial

Produtos / ofertas [ tabela ]
```
Widgets escondidos: mapa de bairros, `/geografia`.

### ECOMMERCE
```
KPIs: [ Receita ] [ ROAS ] [ Pedidos ] [ Ticket médio ] [ CAC ]

Top produtos vendidos
  1. Produto X — 145 vendas — R$ 12.300
  2. Produto Y — 89 vendas — R$ 8.900

Vendas por canal [ chart Meta vs Google ]

Recorrentes vs novos [ donut: 35% / 65% ]
```

---

## Componentes novos a criar

Versão enxuta (vs plano original):

- `AdminClientsTable` — lista
- `CreateClientForm` — tudo em 1 tela, com gerador de senha
- `ClientDetailsPage` — sem tabs, tudo numa coluna
- `ResetPasswordModal`
- `AccountSwitcher` (só staff) — dropdown TopBar
- `ImpersonationBanner`
- (nicho) `CheckoutFunnel`, `AbandonedCartCard`, `TopProductsTable`, `ChannelBreakdownChart`

**Não entram:** `MemberRow`, `InviteMemberModal`, `PermissionToggle`, `ClientTabs`.

Reutilização continua alta — ~80% da UI do dashboard comum serve pros 3 nichos.
