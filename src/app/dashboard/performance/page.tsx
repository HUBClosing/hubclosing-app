import { requireUser } from '@/lib/auth';
import { PerformanceContent } from './performance-content';

export default async function PerformancePage() {
  const user = await requireUser();

  return <PerformanceContent user={user} />;
}
