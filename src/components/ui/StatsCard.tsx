import { Card } from './Card';
import { clsx } from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatsCard({ title, value, icon, trend, className }: StatsCardProps) {
  return (
    <Card className={clsx('p-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-brand-dark mt-1">{value}</p>
          {trend && (
            <p className={clsx('text-xs mt-1', trend.value >= 0 ? 'text-green-600' : 'text-red-600')}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-brand-light rounded-lg text-brand-green">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
