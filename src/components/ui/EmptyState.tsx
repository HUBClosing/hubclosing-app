'use client';

import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className,
      )}
    >
      {Icon && (
        <div className="p-4 rounded-2xl bg-gray-50 mb-5">
          <Icon className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-gray-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
