import type { Metadata } from 'next';
import { KeywordsPage } from '@/components/features/keywords/KeywordsPage';

export const metadata: Metadata = {
  title: 'Palavras-chave | Vivera',
};

export default function Page() {
  return <KeywordsPage />;
}
