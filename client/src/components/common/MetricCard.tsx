import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: LucideIcon;
  highlight?: boolean;
  className?: string;
  light?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  highlight = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[4px] border bg-white p-4 sm:p-5 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-blade-hover cursor-pointer blade-shimmer-sweep',
        highlight
          ? 'border-[#0D94FB]/40 shadow-xs hover:border-[#0D94FB]'
          : 'border-slate-200 hover:border-blue-300',
        className
      )}
    >
      {/* Top accent glow line on hover */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-[2px] transition-all duration-300 opacity-0 group-hover:opacity-100',
          highlight ? 'bg-[#0D94FB] opacity-100' : 'bg-gradient-to-r from-[#0D94FB]/20 via-[#0D94FB] to-[#0D94FB]/20'
        )}
      />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 tracking-tight group-hover:text-slate-700 transition-colors">
            {title}
          </p>
          <div className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-[#0C2651] tabular-nums group-hover:text-[#081C3D] transition-colors">
            {value}
          </div>
        </div>

        {Icon && (
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-[4px] border transition-all duration-200 group-hover:scale-110 group-hover:rotate-2 shadow-2xs',
              highlight
                ? 'border-[#0D94FB]/30 bg-[#E6F4FE] text-[#0D94FB] group-hover:bg-[#0D94FB] group-hover:text-white group-hover:border-[#0D94FB]'
                : 'border-slate-200 bg-slate-50 text-slate-600 group-hover:border-blue-200 group-hover:bg-[#E6F4FE] group-hover:text-[#0D94FB]'
            )}
          >
            <Icon className="h-4 w-4 transition-transform duration-200" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
          {subtitle && (
            <span className="text-slate-500 truncate text-[11px] group-hover:text-slate-600 transition-colors">
              {subtitle}
            </span>
          )}
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold font-mono transition-transform duration-150 group-hover:scale-105',
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              )}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};
