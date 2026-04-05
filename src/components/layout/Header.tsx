'use client';

import type { User } from '@/types/database';
import { Avatar } from '@/components/ui';
import { Menu, Bell } from 'lucide-react';

interface HeaderProps {
  user: User;
  onMenuToggle: () => void;
}

export function Header({ user, onMenuToggle }: HeaderProps) {
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
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Bell className="h-5 w-5" />
          </button>
          <Avatar
            src={user.avatar_url}
            fallback={user.full_name || user.email}
            size="sm"
          />
        </div>
      </div>
    </header>
  );
}
