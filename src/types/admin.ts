import type { AccountStatus, NicheType } from './auth-me';

export interface AdminAccount {
  id: string;
  name: string;
  slug: string;
  nicheType: NicheType;
  status: AccountStatus;
  hasMeta: boolean;
  hasGoogle: boolean;
  logoUrl: string | null;
  owner: { id: string; email: string; name: string };
  createdAt: string;
}

export interface CreateAccountInput {
  name: string;
  slug: string;
  nicheType: NicheType;
  ownerEmail: string;
  ownerName: string;
  ownerPassword: string;
  hasMeta?: boolean;
  hasGoogle?: boolean;
}

export interface UpdateAccountInput {
  name?: string;
  nicheType?: NicheType;
  status?: AccountStatus;
  hasMeta?: boolean;
  hasGoogle?: boolean;
}

export interface ImpersonateResponse {
  access_token: string;
  refresh_token: string;
  currentAccount: { id: string; slug: string; name: string };
}
