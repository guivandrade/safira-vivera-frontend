import { Metadata } from 'next';
import { Suspense } from 'react';
import { CampaignsDashboard } from '@/components/features/campaigns/CampaignsDashboard';
import { CampaignsSkeleton } from '@/components/features/campaigns/CampaignsSkeleton';

export const metadata: Metadata = {
  title: 'Campanhas | Vivera',
  description: 'Análise de campanhas do Meta Ads e Google Ads',
};

export default function CampanhasPage() {
  return (
    <Suspense fallback={<CampaignsSkeleton />}>
      <CampaignsDashboard />
    </Suspense>
  );
}
