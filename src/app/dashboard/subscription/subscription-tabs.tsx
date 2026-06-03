'use client';

import { Tabs } from '@/components/ui';

interface SubscriptionTabsProps {
  candidateContent: React.ReactNode;
  recruiterContent: React.ReactNode;
  defaultTab: 'candidate' | 'recruiter';
}

export function SubscriptionTabs({ candidateContent, recruiterContent, defaultTab }: SubscriptionTabsProps) {
  return (
    <Tabs
      defaultTab={defaultTab}
      tabs={[
        {
          id: 'candidate',
          label: 'Plans Candidat',
          content: candidateContent,
        },
        {
          id: 'recruiter',
          label: 'Plans Recruteur',
          content: recruiterContent,
        },
      ]}
    />
  );
}
