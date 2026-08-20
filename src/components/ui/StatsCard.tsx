'use client';

import clsx from 'clsx';
import { Card } from './Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
}

export function StatsCard({ title, value, icon, trend, className }: StatsCardProps) {
  return (
    <Card className={clsx('overflow-hidden', className)}>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-brand-dark tracking-tight">{value}</p>
          </div>
          {icon && (
            <div className="p-2.5 rounded-xl bg-brand-green/8 text-brand-green">
              {icon}
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1.5">
            <span
              className={clsx(
                'inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md',
                trend.value > 0
                  ? 'text-emerald-700 bg-emerald-50'
                  : trend.value < 0
                  ? 'text-red-700 bg-red-50'
                  : 'text-gray-600 bg-gray-50',
              )}
            >
              {trend.value > 0 ? (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
              ) : trend.value < 0 ? (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              ) : null}
              {Math.abs(trend.value)}%
            </span>
            {trend.label && (
              <span className="text-xs text-gray-400">{trend.label}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
