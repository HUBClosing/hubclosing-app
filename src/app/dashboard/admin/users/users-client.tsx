'use client';

import { useState } from 'react';
import type { User } from '@/types/database';
import { Card, Badge, Avatar } from '@/components/ui';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { Search, MoreVertical, Ban, CheckCircle, Shield, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

interface UsersClientProps {
  users: User[];
}

export function UsersClient({ users }: UsersClientProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      (u.full_name?.toLowerCase().includes(search.toLowerCase())) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const toggleActive = async (userId: string, currentActive: boolean) => {
    setLoading(userId);
    setActionError(null);
    const { error } = await supabase
      .from('users')
      .update({ is_active: !currentActive, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) {
      setActionError(`Erreur : ${error.message}`);
    } else {
      router.refresh();
    }
    setLoading(null);
    setMenuOpen(null);
  };

  const changeRole = async (userId: string, newRole: string) => {
    setLoading(userId);
    setActionError(null);
    const { error } = await supabase
      .from('users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) {
      setActionError(`Erreur : ${error.message}`);
    } else {
      router.refresh();
    }
    setLoading(null);
    setMenuOpen(null);
  };

  return (
    <Card>
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'closer', 'manager', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${roleFilter === r ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {r === 'all' ? 'Tous' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{actionError}</p>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>R&ocirc;le</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Inscrit</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar src={user.avatar_url} fallback={user.full_name || user.email} size="sm" />
                  <div>
                    <p className="font-medium">{user.full_name || 'Sans nom'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' ? 'warning' : user.role === 'closer' ? 'success' : 'info'} className="capitalize">{user.role}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.is_active !== false ? 'success' : 'error'}>{user.is_active !== false ? 'Actif' : 'Inactif'}</Badge>
              </TableCell>
              <TableCell className="capitalize">{user.subscription_plan || 'free'}</TableCell>
              <TableCell className="text-gray-500">{formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: fr })}</TableCell>
              <TableCell className="text-right">
                <div className="relative inline-block">
                  {loading === user.id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  ) : (
                    <button onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                  {menuOpen === user.id && (
                    <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-48">
                      <button
                        onClick={() => toggleActive(user.id, user.is_active !== false)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                      >
                        {user.is_active !== false ? (
                          <><Ban className="w-4 h-4 text-red-500" /> D&eacute;sactiver</>
                        ) : (
                          <><CheckCircle className="w-4 h-4 text-green-500" /> R&eacute;activer</>
                        )}
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => changeRole(user.id, 'admin')}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-amber-500" /> Promouvoir Admin
                        </button>
                      )}
                      {user.role === 'admin' && (
                        <button
                          onClick={() => changeRole(user.id, 'closer')}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-gray-400" /> Retirer Admin
                        </button>
                      )}
                      <div className="border-t border-gray-100 my-1" />
                      <button onClick={() => setMenuOpen(null)} className="w-full px-4 py-2 text-sm text-gray-400 hover:bg-gray-50">Fermer</button>
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">Aucun utilisateur trouv&eacute;</div>
      )}
    </Card>
  );
}
