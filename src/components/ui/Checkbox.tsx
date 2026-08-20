'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <label className="inline-flex items-center gap-2.5 cursor-pointer select-none group">
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            className={clsx(
              'peer h-[18px] w-[18px] rounded-md border border-gray-300 bg-white',
              'appearance-none cursor-pointer',
              'transition-all duration-150 ease-out',
              'checked:bg-brand-green checked:border-brand-green',
              'hover:border-gray-400 checked:hover:brightness-110',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 focus-visible:ring-offset-1',
              'shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
              className,
            )}
            {...props}
          />
          <svg
            className="absolute top-0.5 left-0.5 h-3.5 w-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-150"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        {label && (
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
