'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types/database';
import { Avatar } from '@/components/ui';
import { Menu, UserCircle, Settings, LogOut, ChevronDown } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface HeaderProps {
  user: User;
  onMenuToggle: () => void;
}

export function Header({ user, onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-brand-dark hidden sm:block">
            Bienvenue, {user.full_name?.split(' ')[0] || 'Utilisateur'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell userId={user.id} />

          {/* Avatar + Dropdown Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Avatar
                src={user.avatar_url}
                fallback={user.full_name || user.email}
                size="sm"
              />
              <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform hidden sm:block ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                {/* User info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.full_name || 'Utilisateur'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <a
                    href="/dashboard/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <UserCircle className="h-4 w-4 text-gray-400" />
                    Mon profil
                  </a>
                  <a
                    href="/dashboard/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    Paramètres
                  </a>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
