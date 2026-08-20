'use client';

import { forwardRef, HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import clsx from 'clsx';

export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <table
        ref={ref}
        className={clsx('w-full text-sm', className)}
        {...props}
      />
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={clsx('bg-gray-50/80 border-b border-gray-100', className)}
      {...props}
    />
  )
);
TableHeader.displayName = 'TableHeader';

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={clsx('divide-y divide-gray-50', className)}
      {...props}
    />
  )
);
TableBody.displayName = 'TableBody';

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={clsx(
        'transition-colors duration-100 hover:bg-gray-50/60',
        className,
      )}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={clsx(
        'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider',
        className,
      )}
      {...props}
    />
  )
);
TableHead.displayName = 'TableHead';

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={clsx('px-4 py-3.5 text-gray-700', className)}
      {...props}
    />
  )
);
TableCell.displayName = 'TableCell';
