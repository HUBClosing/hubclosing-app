import { requireAdmin } from '@/lib/auth';
import { NotificationsClient } from './notifications-client';

export default async function AdminNotificationsPage() {
  await requireAdmin();
  return <NotificationsClient />;
}
