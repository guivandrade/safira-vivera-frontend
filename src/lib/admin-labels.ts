import type { AccountStatus, NicheType } from '@/types/auth-me';

/**
 * Labels traduzidos pra UI do admin. Mantemos enums do backend em inglês
 * (ACTIVE, OWNER, etc), mas NUNCA expomos na tela — é ruído técnico pra
 * quem opera agência (ver safira-standards seção 18).
 */

export const NICHE_LABELS: Record<NicheType, string> = {
  LOCAL_BUSINESS: 'Negócio local',
  INFOPRODUCT: 'Infoproduto',
  ECOMMERCE: 'E-commerce',
};

export const STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: 'Ativo',
  SUSPENDED: 'Suspenso',
  ARCHIVED: 'Arquivado',
};

export const STATUS_BADGE_STYLES: Record<AccountStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  SUSPENDED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ARCHIVED: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};
