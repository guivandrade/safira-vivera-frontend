import type { Metadata } from 'next';
import { FunnelPage } from '@/components/features/funnel/FunnelPage';

export const metadata: Metadata = {
  title: 'Funil | Vivera',
};

export default function Page() {
  return <FunnelPage />;
}
