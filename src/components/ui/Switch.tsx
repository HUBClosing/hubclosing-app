'use client';

import clsx from 'clsx';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <label
      className={clsx(
        'inline-flex items-center gap-3 select-none',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      )}
    >
      <button
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={clsx(
          'relative inline-flex h-6 w-11 items-center rounded-full',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-green/50',
          checked
            ? 'bg-brand-green shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]'
            : 'bg-gray-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]',
        )}
      >
        <span
          className={clsx(
            'inline-block h-5 w-5 rounded-full bg-white transition-transform duration-200 ease-out',
            'shadow-[0_1px_3px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.06)]',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </button>
      {label && (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      )}
    </label>
  );
}
