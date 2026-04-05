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
} from 'lucide-react';

interface SidebarProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

const closerLinks = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { href: '/dashboard/candidatures', label: 'Mes candidatures', icon: FileText },
  { href: '/dashboard/events', label: 'Coaching & Events', icon: Calendar },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/profile', label: 'Mon profil', icon: UserCircle },
  { href: '/dashboard/settings', label: 'Param\u00e8tres', icon: Settings },
];

const managerLinks = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/offers', label: 'Mes offres', icon: Briefcase },
  { href: '/dashboard/events', label: 'Coaching & Events', icon: Calendar },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/profile', label: 'Mon profil', icon: UserCircle },
  { href: '/dashboard/settings', label: 'Param\u00e8tres', icon: Settings },
];

const adminLinks = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/dashboard/admin/offers', label: 'Offres', icon: Briefcase },
  { href: '/dashboard/admin/stats', label: 'Statistiques', icon: BarChart3 },
  { href: '/dashboard/events', label: '\u00c9v\u00e9nements', icon: Calendar },
  { href: '/dashboard/admin/settings', label: 'Configuration', icon: Shield },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/settings', label: 'Param\u00e8tres', icon: Settings },
];

export function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const links =
    user.role === 'admin' ? adminLinks : user.role === 'manager' ? managerLinks : closerLinks;

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
            <span className="inline-block mt-1 px-2 py-0.5 bg-brand-amber/20 text-brand-amber rounded text-xs capitalize">
              {user.role}
            </span>
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
