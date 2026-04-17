import type { Metadata } from 'next';
import { CreativesPage } from '@/components/features/creatives/CreativesPage';

export const metadata: Metadata = {
  title: 'Criativos | Vivera',
};

export default function Page() {
  return <CreativesPage />;
}
