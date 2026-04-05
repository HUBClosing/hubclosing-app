'use client';

import type { User } from '@/types/database';
import { Card, CardContent, Avatar, Badge, Button } from '@/components/ui';
import { Edit, Mail, Phone, Globe, Linkedin } from 'lucide-react';

interface ProfileContentProps {
  user: User;
  profile: any;
}

export function ProfileContent({ user, profile }: ProfileContentProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-dark">Mon profil</h1>
        <a href="/dashboard/profile/edit">
          <Button variant="secondary" size="sm"><Edit className="h-4 w-4 mr-2" /> Modifier</Button>
        </a>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar src={user.avatar_url} fallback={user.full_name || user.email} size="lg" />
            <div>
              <h2 className="text-xl font-bold text-brand-dark">{user.full_name || 'Sans nom'}</h2>
              <Badge variant={user.role === 'closer' ? 'success' : user.role === 'manager' ? 'info' : 'warning'} className="mt-1 capitalize">{user.role}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-gray-400" />
              {user.email}
            </div>
            {user.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />
                {user.phone}
              </div>
            )}
          </div>

          {profile && user.role === 'closer' && (
            <div className="mt-6 pt-6 border-t space-y-4">
              <h3 className="font-semibold text-brand-dark">Profil Closer</h3>
              {profile.bio && <p className="text-sm text-gray-600">{profile.bio}</p>}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Niveau :</span> <span className="capitalize">{profile.experience_level}</span></div>
                <div><span className="text-gray-500">Disponible :</span> {profile.availability ? 'Oui' : 'Non'}</div>
                {profile.hourly_rate && <div><span className="text-gray-500">Taux horaire :</span> {profile.hourly_rate}€/h</div>}
                {profile.commission_rate && <div><span className="text-gray-500">Commission :</span> {profile.commission_rate}%</div>}
              </div>
              <div className="flex gap-3">
                {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline text-sm flex items-center gap-1"><Linkedin className="h-4 w-4" /> LinkedIn</a>}
                {profile.portfolio_url && <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline text-sm flex items-center gap-1"><Globe className="h-4 w-4" /> Portfolio</a>}
              </div>
            </div>
          )}

          {profile && user.role === 'manager' && (
            <div className="mt-6 pt-6 border-t space-y-4">
              <h3 className="font-semibold text-brand-dark">Profil Manager</h3>
              {profile.company_name && <p className="font-medium">{profile.company_name}</p>}
              {profile.bio && <p className="text-sm text-gray-600">{profile.bio}</p>}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {profile.industry && <div><span className="text-gray-500">Secteur :</span> {profile.industry}</div>}
                {profile.team_size && <div><span className="text-gray-500">Taille équipe :</span> {profile.team_size}</div>}
              </div>
              <div className="flex gap-3">
                {profile.website_url && <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline text-sm flex items-center gap-1"><Globe className="h-4 w-4" /> Site web</a>}
                {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline text-sm flex items-center gap-1"><Linkedin className="h-4 w-4" /> LinkedIn</a>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
