import { requireUser, getImpersonationInfo } from '@/lib/auth';
import { DashboardLayoutClient } from './layout-client';
import { ImpersonationBanner } from '@/components/layout/ImpersonationBanner';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const impersonation = await getImpersonationInfo();

  return (
    <div className="flex flex-col h-screen">
      {impersonation.isImpersonating && impersonation.targetUser && (
        <ImpersonationBanner
          targetName={impersonation.targetUser.full_name || ''}
          targetEmail={impersonation.targetUser.email}
          targetRole={impersonation.targetUser.role_type || impersonation.targetUser.role}
        />
      )}
      <DashboardLayoutClient user={user}>{children}</DashboardLayoutClient>
    </div>
  );
}
