import type { Metadata } from 'next';
import { GeographyPage } from '@/components/features/geography/GeographyPage';

export const metadata: Metadata = {
  title: 'Geografia | Vivera',
};

export default function Page() {
  return <GeographyPage />;
}
