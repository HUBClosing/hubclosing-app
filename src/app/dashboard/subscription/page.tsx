import { requireUser } from '@/lib/auth';
import { SubscriptionContent } from './subscription-content';

export default async function SubscriptionPage() {
  const user = await requireUser();

  return <SubscriptionContent user={user} />;
}
