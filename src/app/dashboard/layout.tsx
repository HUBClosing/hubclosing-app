import { requireUser } from '@/lib/auth';
import { DashboardLayoutClient } from './layout-client';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return <DashboardLayoutClient user={user}>{children}</DashboardLayoutClient>;
}
