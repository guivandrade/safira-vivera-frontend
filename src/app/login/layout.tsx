import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Entrar — Vívera',
  description: 'Acesse o dashboard Vívera de campanhas Meta Ads e Google Ads.',
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
