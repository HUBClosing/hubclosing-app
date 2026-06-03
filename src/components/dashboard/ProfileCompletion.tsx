'use client';

import Link from 'next/link';
import type { User } from '@/types/database';
import {
  User as UserIcon,
  Phone,
  Mail,
  Camera,
  Wrench,
  Target,
  Clock,
  FileText,
  Linkedin,
  ArrowRight,
} from 'lucide-react';

interface ProfileData {
  bio?: string | null;
  linkedin_url?: string | null;
}

interface ProfileCompletionProps {
  user: User;
  profile?: ProfileData;
}

interface FieldCheck {
  key: string;
  label: string;
  weight: number;
  filled: boolean;
  icon: React.ReactNode;
}

function getCompletionFields(user: User, profile?: ProfileData): FieldCheck[] {
  return [
    {
      key: 'full_name',
      label: 'Nom complet',
      weight: 10,
      filled: !!user.full_name && user.full_name.trim().length > 0,
      icon: <UserIcon className="h-4 w-4" />,
    },
    {
      key: 'phone',
      label: 'Téléphone',
      weight: 10,
      filled: !!user.phone && user.phone.trim().length > 0,
      icon: <Phone className="h-4 w-4" />,
    },
    {
      key: 'personal_email',
      label: 'Email personnel',
      weight: 10,
      filled: !!user.personal_email && user.personal_email.trim().length > 0,
      icon: <Mail className="h-4 w-4" />,
    },
    {
      key: 'avatar_url',
      label: 'Photo de profil',
      weight: 15,
      filled: !!user.avatar_url && user.avatar_url.trim().length > 0,
      icon: <Camera className="h-4 w-4" />,
    },
    {
      key: 'skills',
      label: 'Compétences',
      weight: 10,
      filled: Array.isArray(user.skills) && user.skills.length > 0,
      icon: <Wrench className="h-4 w-4" />,
    },
    {
      key: 'niches',
      label: 'Niches',
      weight: 10,
      filled: Array.isArray(user.niches) && user.niches.length > 0,
      icon: <Target className="h-4 w-4" />,
    },
    {
      key: 'years_experience',
      label: "Années d'expérience",
      weight: 10,
      filled: user.years_experience != null && user.years_experience > 0,
      icon: <Clock className="h-4 w-4" />,
    },
    {
      key: 'bio',
      label: 'Bio',
      weight: 15,
      filled: !!profile?.bio && profile.bio.trim().length > 0,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      key: 'linkedin_url',
      label: 'Profil LinkedIn',
      weight: 10,
      filled: !!profile?.linkedin_url && profile.linkedin_url.trim().length > 0,
      icon: <Linkedin className="h-4 w-4" />,
    },
  ];
}

function getColorClasses(percentage: number) {
  if (percentage < 40) {
    return {
      ring: 'text-red-500',
      bg: 'text-red-100',
      badge: 'bg-red-100 text-red-700',
      bar: 'bg-red-500',
    };
  }
  if (percentage <= 80) {
    return {
      ring: 'text-amber-500',
      bg: 'text-amber-100',
      badge: 'bg-amber-100 text-amber-700',
      bar: 'bg-amber-500',
    };
  }
  return {
    ring: 'text-green-500',
    bg: 'text-green-100',
    badge: 'bg-green-100 text-green-700',
    bar: 'bg-green-500',
  };
}

function getStatusLabel(percentage: number): string {
  if (percentage < 40) return 'Profil incomplet';
  if (percentage <= 80) return 'Bon profil';
  return 'Profil complet';
}

export function ProfileCompletion({ user, profile }: ProfileCompletionProps) {
  const fields = getCompletionFields(user, profile);
  const percentage = fields.reduce(
    (acc, field) => acc + (field.filled ? field.weight : 0),
    0
  );
  const missingFields = fields.filter((f) => !f.filled);
  const colors = getColorClasses(percentage);
  const statusLabel = getStatusLabel(percentage);

  // SVG circular progress values
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-start gap-6">
        {/* Circular progress ring */}
        <div className="flex-shrink-0 relative">
          <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className={colors.bg}
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`${colors.ring} transition-all duration-700 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-brand-dark">{percentage}%</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-brand-dark">
              Complétion du profil
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
              {statusLabel}
            </span>
          </div>

          {/* Horizontal bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
            <div
              className={`h-2 rounded-full transition-all duration-700 ease-out ${colors.bar}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Missing fields */}
          {missingFields.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                Champs manquants :
              </p>
              <div className="flex flex-wrap gap-2">
                {missingFields.map((field) => (
                  <Link
                    key={field.key}
                    href="/dashboard/profile/edit"
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-brand-amber/10 hover:text-brand-dark transition-colors border border-gray-200"
                  >
                    {field.icon}
                    {field.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA button */}
          <Link
            href="/dashboard/profile/edit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-amber text-white hover:bg-amber-600 transition-colors"
          >
            Compléter mon profil
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
