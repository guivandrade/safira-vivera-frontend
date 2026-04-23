# Fase 0 — Plano de Migration Vera → primeiro Account

**Referência:** [plano-multitenant-2026-04-23.md](../plano-multitenant-2026-04-23.md)

---

## Contexto

Hoje a Vera tem 1 `User` no banco de produção. Esse user tem:
- N `Clinic` via `owner_id`
- N `IntegrationCredential` via `user_id`
- N `IntegrationCache` via `user_id`
- 1 `UserPreferences` via `user_id`
- N `RevokedToken` via `user_id`

Depois da migration multi-tenant, **toda essa cadeia** precisa passar a ser scoped por `account_id`, com o account da Vera sendo o primeiro registro de `Account`.

## ⚠️ TBD antes da migration

**Email do user da Vera no banco.** Nos SQLs abaixo usei placeholder `vera@vivera.com.br` — precisa ser substituído pelo email real. Pra descobrir:

```sql
SELECT id, email, name, created_at
FROM users
WHERE deleted_at IS NULL
ORDER BY created_at ASC
LIMIT 10;
```

O registro mais antigo que não seja staff Safira é a Vera. Confirmar com o CEO antes de rodar qualquer passo em produção.

---

## Janela de execução

**Fora do horário comercial.** Idealmente domingo de manhã ou madrugada. Aviso à Vera 48h antes:

> "Oi Vera, vamos fazer uma manutenção no dashboard neste domingo (DD/MM) das 6h às 8h. Durante esse período você pode notar que o sistema fica indisponível. Depois volta normal com todos os seus dados intactos."

Estimativa real de downtime: **5-10 minutos** (migration é rápida). Janela de 2h é gordura.

---

## Passo-a-passo (executado em transaction)

### 0. Backup pré-migration

```bash
# No Coolify / servidor produção
pg_dump -Fc safira_vivera_prod > /backups/pre-multitenant-$(date +%Y%m%d-%H%M).dump
```

Guardar por 30 dias. Testar restore em staging antes da janela.

### 1. Criar tabelas novas (schema-only, sem dados)

```sql
BEGIN;

CREATE TYPE "NicheType" AS ENUM ('LOCAL_BUSINESS', 'INFOPRODUCT', 'ECOMMERCE');
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');
-- MembershipRole: apenas 3 roles. Staff Safira é flag global em User.roles
-- (ver plano mestre §Arquitetura), não MembershipRole.
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  niche_type "NicheType" NOT NULL,
  has_meta BOOLEAN DEFAULT false,
  has_google BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  logo_url TEXT,
  status "AccountStatus" DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
CREATE INDEX accounts_slug_idx ON accounts(slug);
CREATE INDEX accounts_deleted_at_idx ON accounts(deleted_at);

CREATE TABLE account_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role "MembershipRole" NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(account_id, user_id)
);
CREATE INDEX account_memberships_user_id_idx ON account_memberships(user_id);
```

### 2. Criar Account da Vera + Membership OWNER

```sql
-- Cria o Account
INSERT INTO accounts (name, slug, niche_type, has_meta, has_google, created_by)
SELECT
  'Clínica Vívera',
  'vivera',
  'LOCAL_BUSINESS',
  true,  -- confirmar: ela tem Meta conectado
  (SELECT EXISTS(SELECT 1 FROM integration_credentials WHERE provider = 'GOOGLE_ADS' AND user_id = (SELECT id FROM users WHERE email = 'vera@vivera.com.br'))),
  id
FROM users WHERE email = 'vera@vivera.com.br'
RETURNING id;
-- salvar o id retornado como :vera_account_id

-- Cria Membership OWNER
INSERT INTO account_memberships (account_id, user_id, role, permissions)
SELECT
  :vera_account_id,
  (SELECT id FROM users WHERE email = 'vera@vivera.com.br'),
  'OWNER',
  '{}'::jsonb;
```

### 3. Adicionar coluna `account_id` nas tabelas scoped

```sql
-- Nullable no início pra permitir backfill
ALTER TABLE clinics ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE integration_credentials ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE integration_cache ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE user_preferences ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;
```

### 4. Backfill — todos os dados da Vera apontam pro account dela

```sql
UPDATE clinics SET account_id = :vera_account_id
WHERE owner_id = (SELECT id FROM users WHERE email = 'vera@vivera.com.br');

UPDATE integration_credentials SET account_id = :vera_account_id
WHERE user_id = (SELECT id FROM users WHERE email = 'vera@vivera.com.br');

UPDATE integration_cache SET account_id = :vera_account_id
WHERE user_id = (SELECT id FROM users WHERE email = 'vera@vivera.com.br');

UPDATE user_preferences SET account_id = :vera_account_id
WHERE user_id = (SELECT id FROM users WHERE email = 'vera@vivera.com.br');
```

### 5. Validação imediata (ainda dentro da transaction)

```sql
-- Todos os registros de tabelas scoped têm account_id?
DO $$
DECLARE
  orphan_clinics INT;
  orphan_integrations INT;
  orphan_caches INT;
  orphan_prefs INT;
BEGIN
  SELECT COUNT(*) INTO orphan_clinics FROM clinics WHERE account_id IS NULL;
  SELECT COUNT(*) INTO orphan_integrations FROM integration_credentials WHERE account_id IS NULL;
  SELECT COUNT(*) INTO orphan_caches FROM integration_cache WHERE account_id IS NULL;
  SELECT COUNT(*) INTO orphan_prefs FROM user_preferences WHERE account_id IS NULL;

  IF orphan_clinics + orphan_integrations + orphan_caches + orphan_prefs > 0 THEN
    RAISE EXCEPTION 'Backfill incompleto: % clinics, % integrations, % caches, % prefs órfãos',
      orphan_clinics, orphan_integrations, orphan_caches, orphan_prefs;
  END IF;
END $$;
```

### 6. Adicionar NOT NULL + índices

```sql
ALTER TABLE clinics ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE integration_credentials ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE integration_cache ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE user_preferences ALTER COLUMN account_id SET NOT NULL;

-- Índices compostos pra performance em queries tenant-scoped
CREATE INDEX clinics_account_id_idx ON clinics(account_id);
CREATE INDEX integration_credentials_account_id_provider_idx ON integration_credentials(account_id, provider);
CREATE INDEX integration_cache_account_id_endpoint_idx ON integration_cache(account_id, endpoint);
CREATE UNIQUE INDEX user_preferences_account_user_idx ON user_preferences(account_id, user_id);
```

### 7. Commit

```sql
COMMIT;
```

### 8. Smoke test pós-migration

- Login da Vera funciona
- Dashboard renderiza KPIs com dados dela
- `/integracoes` mostra o que ela conectou
- Preferências (tema, layout, colunas) preservadas
- Nenhum erro 500 nos logs

---

## Rollback

Se qualquer passo 1-7 falhar, o `BEGIN`/`COMMIT` atômico garante que nada foi alterado. Se o smoke test (8) falhar, rollback via restore do dump:

```bash
# Em emergência
dropdb safira_vivera_prod
createdb safira_vivera_prod
pg_restore -d safira_vivera_prod /backups/pre-multitenant-YYYYMMDD-HHMM.dump
# redeploy backend versão anterior
```

Tempo de rollback: ~5 minutos. Avisar Vera de outro horário.

---

## Pós-migration: garantir staff Safira

Staff Safira **NÃO precisa** de AccountMembership — o `AccountScopedGuard` faz bypass com base em `User.roles.includes('safira_staff')`. Basta garantir que a flag exista pros users de staff:

```sql
-- User Guilherme (se não existe, criar; se existe, adicionar flag)
INSERT INTO users (email, name, password_hash, roles)
VALUES ('guilherme@agenciasafira.com.br', 'Guilherme Andrade', '<bcrypt>', '{user,safira_staff}')
ON CONFLICT (email) DO UPDATE
  SET roles = ARRAY(SELECT DISTINCT unnest(users.roles || ARRAY['safira_staff']));
```

Repetir pra cada staff adicional. **Zero memberships criados** — o bypass no guard resolve.

Após subir o admin UI, gerenciamento de staff (adicionar/remover flag) acontece via tela `/admin/staff` (ticket futuro).

---

## Checklist de execução

- [ ] Staging: rodar migration do zero em banco clonado da prod, validar
- [ ] Staging: smoke test completo (login Vera + todas as páginas)
- [ ] Staging: medir tempo real (deve ser <2min)
- [ ] Prod: avisar Vera 48h antes
- [ ] Prod: backup dump guardado em 2 locais
- [ ] Prod: rodar migration na janela
- [ ] Prod: smoke test pós-migration
- [ ] Prod: confirmar com Vera que está funcionando normal
- [ ] Prod: limpeza (user_id pode virar só informativo, colunas user_id podem ser dropadas em PR posterior depois que confirmarmos que tudo usa account_id)
