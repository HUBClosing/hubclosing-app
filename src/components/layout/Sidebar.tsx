'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User, ActiveRole } from '@/types/database';
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
  ArrowLeftRight,
  Target,
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

function getActiveRole(user: User): ActiveRole {
  return (user.active_role as ActiveRole) || 'candidate';
}

function isDualRole(user: User): boolean {
  return user.role_type === 'both';
}

function isAdmin(user: User): boolean {
  return user.role_type === 'admin' || user.role === 'admin';
}

function getRoleLabel(activeRole: ActiveRole): string {
  return activeRole === 'candidate' ? 'Candidat' : 'Recruteur';
}

function getLinksForRole(user: User, activeRole: ActiveRole) {
  if (isAdmin(user)) return adminLinks;
  return activeRole === 'recruiter' ? recruiterLinks : candidateLinks;
}

export function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [activeRole, setActiveRole] = useState<ActiveRole>(getActiveRole(user));

  const links = getLinksForRole(user, activeRole);
  const dual = isDualRole(user);
  const admin = isAdmin(user);

  const handleSwitchRole = async () => {
    const newRole: ActiveRole = activeRole === 'candidate' ? 'recruiter' : 'candidate';
    setActiveRole(newRole);

    // Persister le changement en BDD
    await supabase
      .from('users')
      .update({ active_role: newRole })
      .eq('id', user.id);

    // Rafraîchir la page pour charger le bon dashboard
    router.push('/dashboard');
    router.refresh();
  };

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
          {/* Logo */}
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

          {/* User info */}
          <div className="p-4 border-b border-white/10">
            <p className="text-sm text-white/70">Connecté en tant que</p>
            <p className="font-medium truncate">{user.full_name || user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block px-2 py-0.5 bg-brand-amber/20 text-brand-amber rounded text-xs">
                {admin ? 'Admin' : getRoleLabel(activeRole)}
              </span>
              {user.tier && user.tier !== 'free' && (
                <span className="inline-block px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs capitalize">
                  {user.tier}
                </span>
              )}
            </div>
          </div>

          {/* Switch de rôle pour les double-rôle */}
          {dual && !admin && (
            <div className="px-3 py-2 border-b border-white/10">
              <button
                onClick={handleSwitchRole}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm"
              >
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-brand-amber" />
                  <span className="text-white/80">
                    Vue {activeRole === 'candidate' ? 'candidat' : 'recruteur'}
                  </span>
                </div>
                <span className="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded">
                  {activeRole === 'candidate' ? (
                    <span className="flex items-center gap-1"><Target className="h-3 w-3" /> Candidat</span>
                  ) : (
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> Recruteur</span>
                  )}
                </span>
              </button>
            </div>
          )}

          {/* Navigation */}
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

          {/* Logout */}
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
