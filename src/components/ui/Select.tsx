'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';
import clsx from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={clsx(
              'w-full appearance-none rounded-xl border bg-white px-4 py-2.5 pr-10 text-sm text-brand-dark',
              'transition-all duration-200 ease-out',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
              error
                ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                : [
                    'border-gray-200 hover:border-gray-300',
                    'focus:border-brand-green/60 focus:ring-brand-green/10',
                    'focus:shadow-[0_0_0_3px_rgba(240,90,40,0.06)]',
                  ],
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p className="text-xs font-medium text-red-500 flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
