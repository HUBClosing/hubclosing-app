'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          // Base
          'relative inline-flex items-center justify-center font-semibold transition-all duration-200 ease-out',
          'rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
          // Variants
          variant === 'primary' && [
            'bg-gradient-to-b from-brand-green to-brand-green/90 text-white',
            'shadow-[0_1px_2px_rgba(240,90,40,0.3),0_4px_12px_rgba(240,90,40,0.15)]',
            'hover:shadow-[0_1px_2px_rgba(240,90,40,0.4),0_8px_24px_rgba(240,90,40,0.25)]',
            'hover:brightness-110 focus-visible:ring-brand-green/50',
          ],
          variant === 'secondary' && [
            'bg-white text-brand-dark border border-gray-200',
            'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_6px_rgba(0,0,0,0.02)]',
            'hover:bg-gray-50 hover:border-gray-300 hover:shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]',
            'focus-visible:ring-gray-300',
          ],
          variant === 'ghost' && [
            'bg-transparent text-gray-600',
            'hover:bg-gray-100/80 hover:text-brand-dark',
            'focus-visible:ring-gray-300',
          ],
          variant === 'danger' && [
            'bg-gradient-to-b from-red-500 to-red-600 text-white',
            'shadow-[0_1px_2px_rgba(239,68,68,0.3),0_4px_12px_rgba(239,68,68,0.15)]',
            'hover:shadow-[0_1px_2px_rgba(239,68,68,0.4),0_8px_24px_rgba(239,68,68,0.25)]',
            'hover:brightness-110 focus-visible:ring-red-400/50',
          ],
          // Sizes
          size === 'sm' && 'text-sm px-3.5 py-1.5 gap-1.5',
          size === 'md' && 'text-sm px-5 py-2.5 gap-2',
          size === 'lg' && 'text-base px-7 py-3 gap-2.5',
          className,
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
