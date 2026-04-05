import { clsx } from 'clsx';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  fallback?: string;
  className?: string;
}

export function Avatar({ src, alt, size = 'md', fallback, className }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt || ''}
        className={clsx('rounded-full object-cover', sizeClasses[size], className)}
      />
    );
  }

  const initials = fallback
    ? fallback.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div
      className={clsx(
        'rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-medium',
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
