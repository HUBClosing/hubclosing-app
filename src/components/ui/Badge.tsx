'use client';

import clsx from 'clsx';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: 'bg-gray-50 text-gray-600 border-gray-200/60',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/60',
  error: 'bg-red-50 text-red-700 border-red-200/60',
  info: 'bg-blue-50 text-blue-700 border-blue-200/60',
};

const dotColors = {
  default: 'bg-gray-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
        'text-xs font-medium leading-5',
        'transition-colors duration-150',
        variantStyles[variant],
        className,
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', dotColors[variant])} />
      {children}
    </span>
  );
}
