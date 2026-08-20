'use client';

import clsx from 'clsx';

interface AvatarProps {
  src?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export function Avatar({ src, fallback, size = 'md', className }: AvatarProps) {
  const initials = fallback
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={clsx(
        'relative inline-flex items-center justify-center rounded-full',
        'ring-2 ring-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
        'overflow-hidden flex-shrink-0',
        sizeMap[size],
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={fallback}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-brand-green/15 to-brand-green/5 text-brand-green font-semibold">
          {initials}
        </div>
      )}
    </div>
  );
}
