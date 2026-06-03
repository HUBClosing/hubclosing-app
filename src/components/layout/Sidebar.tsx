'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types/database';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Briefcase,
  ShoppingBag,
  MessageSquare,
  FileText,
  UserCircle,
  Settings,
  LogOut,
  X,
  Users,
  BarChart3,
  Shield,
  Calendar,
  Bell,
  TrendingUp,
  Award,
  Share2,
} from 'lucide-react';

interface SidebarProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

const candidateLinks = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { href: '/dashboard/candidatures', label: 'Mes candidatures', icon: FileText },
  { href: '/dashboard/performance', label: 'Mes performances', icon: TrendingUp },
  { href: '/dashboard/events', label: 'Coaching & Events', icon: Calendar },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/reputation', label: 'Réputation', icon: Award },
  { href: '/dashboard/referral', label: 'Parrainage', icon: Share2 },
  { href: '/dashboard/profile', label: 'Mon profil', icon: UserCircle },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
];

const recruiterLinks = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/offers', label: 'Mes offres', icon: Briefcase },
  { href: '/dashboard/cvtheque', label: 'CVthèque', icon: Users },
  { href: '/dashboard/events', label: 'Coaching & Events', icon: Calendar },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/referral', label: 'Parrainage', icon: Share2 },
  { href: '/dashboard/profile', label: 'Mon profil', icon: UserCircle },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
];

const adminLinks = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/admin', label: 'Vue d\'ensemble', icon: BarChart3 },
  { href: '/dashboard/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/dashboard/admin/offers', label: 'Offres', icon: Briefcase },
  { href: '/dashboard/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/events', label: 'Événements', icon: Calendar },
  { href: '/dashboard/admin/settings', label: 'Configuration', icon: Shield },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
];

function getRoleLabel(user: User): string {
  const rt = user.role_type as string || user.role as string;
  if (rt === 'admin') return 'Admin';
  if (rt === 'recruiter' || rt === 'manager') return 'Recruteur';
  if (rt === 'candidate' || rt === 'closer') return 'Candidat';
  return 'Membre';
}

function getLinksForUser(user: User) {
  const rt = user.role_type as string || user.role as string;
  if (rt === 'admin') return adminLinks;
  if (rt === 'recruiter' || rt === 'manager') return recruiterLinks;
  return candidateLinks;
}

export function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const links = getLinksForUser(user);
  const roleLabel = getRoleLabel(user);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 z-50 h-full w-64 bg-brand-dark text-white transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-brand-amber flex items-center justify-center font-bold text-brand-dark">
                H
              </div>
              <span className="font-bold text-lg">HUBClosing</span>
            </div>
            <button onClick={onClose} className="lg:hidden text-white/70 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 border-b border-white/10">
            <p className="text-sm text-white/70">Connecté en tant que</p>
            <p className="font-medium truncate">{user.full_name || user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block px-2 py-0.5 bg-brand-amber/20 text-brand-amber rounded text-xs">
                {roleLabel}
              </span>
              {user.tier && user.tier !== 'free' && (
                <span className="inline-block px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs capitalize">
                  {user.tier}
                </span>
              )}
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {link.label}
                </a>
              );
            })}
          </nav>

          <div className="p-3 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
