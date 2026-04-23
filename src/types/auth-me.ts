/**
 * Shape de resposta do `GET /auth/me` do backend multi-tenant.
 * Alinha com `src/modules/auth/auth.service.ts#getMe` no backend.
 */

export type MembershipRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type NicheType = 'LOCAL_BUSINESS' | 'INFOPRODUCT' | 'ECOMMERCE';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

export interface MeUser {
  id: string;
  email: string;
  name: string;
  isSafiraStaff: boolean;
}

export interface MeAccount {
  id: string;
  slug: string;
  name: string;
  nicheType: NicheType;
  hasMeta: boolean;
  hasGoogle: boolean;
  status: AccountStatus;
  role: MembershipRole;
}

export interface MeCurrentAccount {
  id: string;
  slug: string;
  name: string;
  nicheType: NicheType;
  hasMeta: boolean;
  hasGoogle: boolean;
  role: MembershipRole | null;
  permissions: Record<string, boolean>;
}

export interface MeResponse {
  user: MeUser;
  accounts: MeAccount[];
  currentAccount: MeCurrentAccount | null;
}

/**
 * Union de todas as permissões conhecidas. Mantém o tipo forte pra IDE
 * autocomplete e pra o `can()` não aceitar string qualquer.
 */
export type Permission =
  | 'view:dashboard'
  | 'view:campaigns'
  | 'view:creatives'
  | 'view:keywords'
  | 'view:geography'
  | 'view:funnel'
  | 'view:compare'
  | 'view:insights'
  | 'view:settings'
  | 'view:metrics:spend'
  | 'view:metrics:cpa'
  | 'view:metrics:roas'
  | 'view:metrics:cpm'
  | 'manage:integrations'
  | 'manage:users'
  | 'manage:account'
  | 'agency:list_accounts'
  | 'agency:create_account'
  | 'agency:impersonate'
  | 'agency:view_audit';
