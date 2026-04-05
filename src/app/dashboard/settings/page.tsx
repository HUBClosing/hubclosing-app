import { requireUser } from '@/lib/auth';
import { SettingsContent } from './settings-content';

export default async function SettingsPage() {
  const user = await requireUser();
  return <SettingsContent user={user} />;
}
