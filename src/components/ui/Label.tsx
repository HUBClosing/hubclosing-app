'use client';

import { forwardRef, LabelHTMLAttributes } from 'react';
import clsx from 'clsx';

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={clsx(
        'block text-sm font-medium text-gray-700 leading-none',
        className,
      )}
      {...props}
    />
  )
);

Label.displayName = 'Label';
