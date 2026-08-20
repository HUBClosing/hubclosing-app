'use client';

import { HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'bg-white rounded-2xl border border-gray-100',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]',
        'transition-all duration-200 ease-out',
        hover && [
          'hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_32px_rgba(0,0,0,0.06)]',
          'hover:-translate-y-0.5 hover:border-gray-200',
        ],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('px-6 pt-6 pb-2', className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('px-6 py-4', className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'px-6 py-4 border-t border-gray-50 bg-gray-50/30 rounded-b-2xl',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';
